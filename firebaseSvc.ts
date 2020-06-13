import firebase from 'firebase';
import moment from 'moment';
import { MD5 } from "crypto-js"

import pubsub from './pubsub';
import { firebaseConfig } from './config/firebase';
import { MESSAGE_RECEIVED_EVENT, NUM_FETCH_MESSAGES } from './constants';
import {
  UserInfoType,
  MutationLoginArgs,
  MessageInput,
  LoginPayload,
  MessageType,
  SearchClassesPayload,
  AddClassPayload,
  DeleteClassPayload,
  CreateChatPayload,
  Chat,
} from './types/schema-types';
import { genID, getHash, asyncForEach } from './helper';

const MESSAGE_REF_BASE: string = 'Messages';
const User_REF_BASE: string = 'Users';
const NUM_MESSAGES_BASE: string = 'NumberOfMessages';
const FAMILY_REF_BASE: string = 'Family';
const CLASS_REF_BASE: string = 'Classes';
const CHAT_REF_BASE: string = 'Chats';

class FireBaseSVC {
  constructor() {
    firebase.initializeApp(firebaseConfig);
    console.log('we are initializing');
    this.test_listen();
  }

  login = async (user: MutationLoginArgs) => {
    let res: boolean;
    // here is where we would need to firebase.auth().setPersistence i think
    // https://firebase.google.com/docs/auth/web/auth-state-persistence
    const output = await firebase.auth().signInWithEmailAndPassword(
      user.email,
      user.password
    )
    .then(
      () => res = true,
      () => res = false
    );
    const loggedInUser: UserInfoType = await this.getUser(user.email);
    const {__typename, ...rest} = loggedInUser;
    console.log('logged inuser ', loggedInUser)
    const payload: LoginPayload = { res, ...rest };

    return payload;
  }

  // observeAuth = () => {
  //   firebase.auth().onAuthStateChanged(this.onAuthStateChanged);
  // }

  // TODO figure out typing for all this
  // might need to combine this firebase.User and my own userType
  // onAuthStateChanged = (user) => {
  //   if ( !user ) {
  //     try {
  //       this.login(
  //         user,
  //         () => console.log('success'),
  //         () => console.log('error')
  //       );
  //     } catch ({ message }) {
  //       console.log('failed: ' + message);
  //     }
  //   } else {
  //     console.log('reusing auth');
  //   }
  // }

  // upload user avatar functionality
  // uploadImage = async uri => {
  //   console.log('got image to upload. uri:' + uri);
  //   try {
  //     const response = await fetch(uri);
  //     const blob = await response.blob();
  //     const ref = firebase
  //       .storage()
  //       .ref('avatar')
  //       .child(uuid.v4());
  //     const task = ref.put(blob);

  //     return new Promise((resolve, reject) => {
  //       task.on(
  //         'state_changed',
  //         () => {
  //             /* noop but you can track the progress here */
  //         },
  //         reject /* this is where you would put an error callback! */,
  //         () => resolve(task.snapshot.downloadURL)
  //       );
  //     });
  //   } catch (err) {
  //     console.log('uploadImage try/catch error: ' + err.message); //Cannot load an empty url
  //   }
  // }

  // updateAvatar = (url) => {
  //   //await this.setState({ avatar: url });
  //   var userf = firebase.auth().currentUser;
  //   if (userf != null) {
  //     userf.updateProfile({ avatar: url})
  //     .then(function() {
  //       console.log("Updated avatar successfully. url:" + url);
  //       alert("Avatar image is saved successfully.");
  //     }, function(error) {
  //       console.warn("Error update avatar.");
  //       alert("Error update avatar. Error:" + error.message);
  //     });
  //   } else {
  //     console.log("can't update avatar, user is not login.");
  //     alert("Unable to update avatar. You must login first.");
  //   }
  // }

  onLogout = () => {
    firebase.auth().signOut().then(() => {
      console.log('sign out is successful')
    }).catch((e) => {
      console.log('an error happened when signing out')
    })
  }

  async createUser (email: string, password: string, name: string) {
    await firebase.auth().createUserWithEmailAndPassword(email, password)
    const newUser = firebase.auth().currentUser
    await newUser.updateProfile( { displayName: name})
    console.log('successfully did all the things w the user')

    return true;
  }

  async _createUser (email: string, password: string, name: string) {
    await firebase.auth().createUserWithEmailAndPassword(email, password)
    const newUser = firebase.auth().currentUser
    await newUser.updateProfile( { displayName: name})
    console.log('successfully did all the things w the user')

    return true;
  }

  // figure out this uuid business
  uid () {
    const curUser = firebase.auth().currentUser;
    if (!curUser) {
      console.log('the current user is null');
      return null;
    } else {
      return curUser.uid;
    }
  }

  _refMessage(chatPath: string) {
    return firebase.database().ref(`${MESSAGE_REF_BASE}/${chatPath}`);
  }

  // this will take in the userID (hashed email)
  _refUserID(ID: string) {
    return firebase.database().ref(`${User_REF_BASE}/${ID}`);
  }

  _refUsers() {
    return firebase.database().ref(`${User_REF_BASE}`);
  }

  _refMessageNum(chatID: string) {
    return firebase.database().ref(`${NUM_MESSAGES_BASE}/${chatID}`);
  }

  _refFamily(groupID: string) {
    return firebase.database().ref(`${FAMILY_REF_BASE}/${groupID}`);
  }

  _refClasses() {
    return firebase.database().ref(`${CLASS_REF_BASE}`);
  }

  _refChats(chatID: string) {
    return firebase.database().ref(`${CHAT_REF_BASE}/${chatID}`);
  }

  async pushUser(name, email, userType, phoneNumber, hash, groupID) {
    const testChatIds: Array<string> = ['test', 'test2'];
    const user_and_id: UserInfoType = {
      name,
      email,
      phoneNumber,
      _id: hash,
      userType: userType,
      chatIDs: testChatIds,
      // we do not know what classes this user will be a part of so let us just let them be empty
      classes: [],
      groupID
    }
    await this._refUserID(hash).update(user_and_id);
    const curFam = await this._refFamily(groupID).once('value').then(snap => {
      const val = snap.val();
      return val;
    })
    console.log('current fam', curFam);
    if (!curFam) {
      await this._refFamily(groupID).update({ user: [{...user_and_id}]})
    } else {
      await this._refFamily(groupID).update({ user: [...curFam.user, user_and_id]})
    }
    return true;
  }

  // start at 0
  getMessages = async (chatID: string, init: number) => {
    const chatHash: string = MD5(chatID).toString();
    const numMessages: number = await this.getNumMessages(chatID);
    if (numMessages === 0) { return [] }
    // return the entire list of messages
    if (numMessages > NUM_FETCH_MESSAGES) {}
    const start: number = -1 * (numMessages - 1) + init;
    if (start > 0) {return []}
    const potentialEnd: number = start + NUM_FETCH_MESSAGES - 1;
    const end: number = potentialEnd > 0 ? 0 : potentialEnd;

    return await this._refMessage(chatHash)
      .orderByChild('messageID')
      .startAt(start)
      .endAt(end)
      .once('value')
      .then(snap => {
        const val = snap.val();
        const key = Object.keys(val)
        const mess: MessageType[] = key.map(k => {
          const {messageID, ...rest} = val[k];
          return {
            ...rest,
            _id: val[k].messageID
          }
        })
        return mess
      })
  }

  getRecentId = async (chatID: string) => {
    const chatHash: string = MD5(chatID).toString();
    return await this._refMessage(chatHash)
      .limitToLast(1)
      .once('value')
      .then(snap => {
        const val = snap.val();
        if (!val) { return 0 }
        const key = Object.keys(val);
        const oldMessageID = val[key[0]].messageID;
        return oldMessageID - 1;
      })
  }

  test_listen() {
    console.log('listener is on')
    this._refMessage('')
    .on('child_changed', (snapshot) => {
      const val = snapshot.val();
      const key = Object.keys(val).slice(-1)[0]
      pubsub.publish(MESSAGE_RECEIVED_EVENT, {
        messageReceived: {
          MessageId: val[key].messageID,
          text: val[key].text,
          createdAt: val[key].createdAt,
          user: val[key].user
        }
      })
    })

    // this is the listener for a new child (chat) being added
    this._refMessage('')
      .on('child_added', (snap) => {
        const snapVal = snap.val();
        const key = Object.keys(snapVal)[0];
        pubsub.publish(MESSAGE_RECEIVED_EVENT, {
          messageReceived: {
            MessageId: snapVal[key].messageID,
            text: snapVal[key].text,
            createdAt: snapVal[key].createdAt,
            user: snapVal[key].user
          }
        })
      })
  }

  timeStamp() {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  getNumMessages = async (chatID: string) => {
    return await this._refMessageNum(chatID).once('value')
      .then((snap): number => {
        const val = snap.val();
        // if this is a new chat wont have any values yet
        if (!val) { return 0 }
        return val;
      })
  }

  updateNumMessages = async (chatID: string) => {
    const numMessages: number = await this.getNumMessages(chatID);
    await this._refMessageNum(chatID).set(numMessages + 1)
  }

  send = async (messages: MessageInput[]) => {
    // TODO refactor all this rip
    let myText;
    let myMesID;
    let myCreatedAt;
    let myUser;
    const oldMess: number = await this.getRecentId(messages[0].chatID);
    this.updateNumMessages(messages[0].chatID);
    messages.forEach(async (element: MessageInput) => {
      const { text, user, chatID } = element;
      myMesID = oldMess;
      const message = {
        text,
        user,
        createdAt: moment().format(),
        messageID: myMesID
      };
      myText = text;
      myCreatedAt = message.createdAt
      myUser = user;
      const hashChatID: string = MD5(chatID).toString();
      await this._refMessage(hashChatID).push(message);
    });
    return {
      text: myText,
      MessageId: myMesID,
      createdAt: myCreatedAt,
      user: myUser
    }
  }

  refOff () {
    this._refMessage('').off();
  }

  async push_test(chatPath: string) {
    await this._refMessage(chatPath).push({
      name: 'name',
      email: 'email'
    })
  }

  // lets pass in the email and then hash it here
  async getUser(email: string) {
    const hashedEmail = getHash(email);
    const user: UserInfoType = await firebase.database().ref(`Users/${hashedEmail}`).once('value')
      .then(snap => {
        const val = snap.val()
        // console.log('val', val)
        return val
        // const key = Object.keys(val)[0];
        // return val[key]
      })
    return user;
  }

  async getFamily(groupID: string) {
    return await this._refFamily(groupID).once('value')
      .then((snap) => {
        const val = snap.val();
        const keys = Object.keys(val);
        return keys.map(key => val[key])
      })
  }

  async searchUsers(searchTerm: string) {

    const relevantFields = [ 'email', 'name', 'phoneNumber', 'userType' ];

    // this will be the ref for all the users
    return await this._refUsers().once('value')
      .then((snap) => {
        const val = snap.val();
        // console.log('val in search', val)
        const keys = Object.keys(val);
        const Users = keys.map((k, index) => {
          const u = val[k];
          // console.log('user', Object.keys(u))
          const _user = u[Object.keys(u)[0]]
          let flag = false;
          relevantFields.forEach((_field) => {
            let field = u[_field];
            // console.log('field', field)
            if (_field === 'email') { field = field.split('@')[0] }
            if (field.toLowerCase().includes(searchTerm.toLowerCase())) {
              flag = true;
              return;
            }
          })
          if (flag) { return u }
        }).filter(user => !!user)
        console.log('returned Users', Users)
        return Users;
      })
  }

  async searchClasses(searchTerm: string) {
    return await this._refClasses().once('value')
      .then(snap => {
        const val = snap.val();
        console.log('val in search classes', val)
        if (!val) { return { classes: []}}
        const keys = Object.keys(val);
        const classes = keys.map(k => {
          const c = val[k]
          console.log('c')
          if (c.toLocaleLowerCase().includes(searchTerm.toLowerCase())) {
            return c;
          }
        }).filter(c => !!c)
        const returnVal: SearchClassesPayload = { classes }
        return returnVal;
      })
  }

  async addClass(className: string) {
    // check to see if we have already added this class
    const allClasses = await this.searchClasses('');
    console.log('allclasses', allClasses);
    if (allClasses.classes.includes(className)) {
      const returnVal: AddClassPayload = { res: false, message: 'This class already exists'}
      return returnVal;
    }
    await this._refClasses().push(className)
    const returnVal: AddClassPayload = { res: true, message: 'N/A'};
    return returnVal;
  }

  async deleteClass(className: string) {
    const allClasses = await this.searchClasses(className);
    if (allClasses.classes.length) {
      // todo fix delete
      await this._refClasses().child(className).remove()
      const returnVal: DeleteClassPayload = { res: true, message: 'THIS DOES NOT WORK YET'}
      return returnVal;
    } else {
      const returnVal: DeleteClassPayload = {res: false, message: 'THIS DOES NOT WORK YET'}
      return returnVal;
    }
  }

  async createChat(displayName: string, className: string, tutorEmail: string, userEmails: string[]) {
    // generate chatID / class ID
    // let us make these two ^ the same
    const chatID: string = genID();
    const tutorID: string = getHash(tutorEmail);
    const users: UserInfoType[] = await Promise.all(userEmails.map(async email => {
      const u = await this.getUser(email)
      return u;
    }));
    // add ID to the tutor
    const newChat: Chat = {
      displayName,
      className,
      userEmails,
      tutorEmail,
      chatID
    }

    let tutor: UserInfoType = await this._refUserID(tutorID).once('value').then(snap => {
      const val = snap.val()
      return val
    })
    console.log('tutor', tutor)
    let classes = tutor.classes;
    // tutors will not have any families
    if (!classes) {
      await this._refUserID(tutorID).update({ classes: [{...newChat}]})
      const fam = await this.getFamily(tutor.groupID);
      // console.log('tutor fam', fam);
      console.log('tutor fam', fam)
      fam.forEach(async f => await this._refUserID(f._id).update({ classes: [{...newChat}]}));
    } else {
      await this._refUserID(tutorID).update({ classes: [...classes, newChat]})
      const fam = await this.getFamily(tutor.groupID);
      fam.forEach(async f => await this._refUserID(f._id).update({ classes: [...classes, newChat]}))
    }
    // we also need to add this class to t

    users.forEach(async _user => {
      classes = _user.classes;
      if (!classes) {
        await this._refUserID(_user._id).update({ classes: [{...newChat}]});
        // update the family user object
        const fam: UserInfoType[] = await this.getFamily(_user.groupID);
        // only add this class to this user in the family, not all the users in that family
        fam.forEach(async f => {
          if (f._id === _user._id) {
            // means that we have found this user in the family ref
            await this._refUserID(f._id).update({ classes: [{...newChat}] });
          }
        })
      }
      return true;
    })

    this._refChats(chatID).update(newChat)
    const returnVal: CreateChatPayload = { res: true }
    return returnVal
    // add ID to the users

  }
}

const firebaseSvc = new FireBaseSVC();
export default firebaseSvc;
