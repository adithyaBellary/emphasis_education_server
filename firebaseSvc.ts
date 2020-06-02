// import firebase from 'firebase';
import * as firebase from 'firebase';
import * as moment from 'moment';
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
} from './types/schema-types';
import { EventEmitter } from 'events';

const MESSAGE_REF_BASE: string = 'Messages';
const User_REF_BASE: string = 'Users';
const NUM_MESSAGES_BASE: string = 'NumberOfMessages';
const FAMILY_REF_BASE: string = 'Family';

class FireBaseSVC {
  constructor() {
    firebase.initializeApp(firebaseConfig);
    console.log('we are initializing');
    this.test_listen();
  }

  login = async (user: MutationLoginArgs) => {
    let res: boolean;
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

  createUser = async (email: string, password: string, name: string) => {
    firebase.auth()
      .createUserWithEmailAndPassword(email, password)
      .then(() => {
        console.log('successfully created the user');
        const newUser = firebase.auth().currentUser
        newUser.updateProfile({ displayName: name})
          .then(() => {
            console.log('all done creating the user');
          }), e => console.log('an error updating the display name');
      }), e => {
        console.log('there was an error creating the user', e);
      }
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

  async pushUser(name, email, userType, phoneNumber, hash, groupID) {
    const testChatIds: Array<string> = ['test', 'test2'];
    const user_and_id: UserInfoType = {
      name,
      email,
      phoneNumber,
      _id: hash,
      userType: userType,
      chatIDs: testChatIds,
      groupID
    }
    await this._refUserID(hash).push(user_and_id);
    await this._refFamily(groupID).push(user_and_id)
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
    const hashedEmail = MD5(email).toString();
    const user: UserInfoType = await firebase.database().ref(`Users/${hashedEmail}`).once('value')
      .then(snap => {
        const val = snap.val()
        const key = Object.keys(val)[0];
        return val[key]
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
        const keys = Object.keys(val);
        const Users = keys.map((k, index) => {
          const u = val[k];
          const _user = u[Object.keys(u)[0]]
          let flag = false;
          relevantFields.forEach((_field) => {
            let field = _user[_field];
            if (_field === 'email') { field = field.split('@')[0] }
            if (field.toLowerCase().includes(searchTerm.toLocaleLowerCase())) {
              flag = true;
              return;
            }
          })
          if (flag) { return _user }
        }).filter(user => !!user)

        return Users;
      })
  }
}

const firebaseSvc = new FireBaseSVC();
export default firebaseSvc;
