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
  Chat,
  UserInfoTypeInput,
  ChatUserInfo,
  Permission,
  AdminChat,
  GenericResponse
} from './types/schema-types';
import { genID, getHash, asyncForEach } from './helper';

import {
  MESSAGE_REF_BASE,
  User_REF_BASE,
  NUM_MESSAGES_BASE,
  FAMILY_REF_BASE,
  CODES_REF_BASE,
  CHAT_REF_BASE,
  CLASS_REF_BASE,
  CODE_LENGTH,
  ADMIN_EMAILS
} from './constants';

class FireBaseSVC {
  constructor() {
    firebase.initializeApp(firebaseConfig);
    console.log('we are initializing');
    this.test_listen();
  }

  async login (user: MutationLoginArgs) {
    let res: boolean;
    let payload: LoginPayload;
    try {
      await firebase.auth().signInWithEmailAndPassword(user.email, user.password)
      const loggedInUser: UserInfoType = await this.getUser(user.email);
      const {__typename, ...rest} = loggedInUser;
      res = true;
      payload = { res, user: rest };
    } catch (e) {
      res = false;
      payload = { res }
    }
    return payload;
  }

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

  async createUser (email: string, password: string, firstName: string, lastName: string) {
    try {
      await firebase.auth().createUserWithEmailAndPassword(email, password)
      const newUser = firebase.auth().currentUser
      await newUser.updateProfile( { displayName: `${firstName} ${lastName}`})
      return true;
    } catch(e) {
      console.log('error creating user', e)
      return false;
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

  _refFamilySpecific(groupID: string, ind: string) {
    return firebase.database().ref(`${FAMILY_REF_BASE}/${groupID}/user/${ind}`)
  }

  _refFamilClassCpecific(groupID: string, userInd: string, classInd: string) {
    return firebase.database().ref(`${FAMILY_REF_BASE}/${groupID}/user/${userInd}/classes/${classInd}`)
  }

  _refClasses() {
    return firebase.database().ref(`${CLASS_REF_BASE}`);
  }

  _refUserClassSpecific(userID: string, classIndex: number) {
    return firebase.database().ref(`${User_REF_BASE}/${userID}/classes/${classIndex}`)
  }

  _refChats(chatID: string) {
    return firebase.database().ref(`${CHAT_REF_BASE}/${chatID}`);
  }

  _refCodes(hashedEmail: string) {
    return firebase.database().ref(`${CODES_REF_BASE}/${hashedEmail}`);
  }

  async pushUser(firstName, lastName, email, userType, phoneNumber, hash, groupID, gender, dob) {
    let adminChat: AdminChat[] = []
    // we dont need to make a new admin chat for admins
    if (userType !== 'Admin') {
      adminChat = [{
        chatID: genID(),
        user: {
         firstName,
         lastName,
         email
        }
      }]

      ADMIN_EMAILS.forEach(async _email => {
        const hashedEmail = getHash(_email)
        const adminChats = await this._refUserID(hashedEmail).once('value').then(snap => {
          const val: UserInfoType = snap.val();
          const adminChats: AdminChat[] = val.adminChat;
          return adminChats
        })
        if (!adminChats) {
          await this._refUserID(hashedEmail).update({ adminChat: adminChat})
        } else {
          await this._refUserID(hashedEmail).update({ adminChat: [...adminChats, ...adminChat]})
        }
      })
    }

    const user_and_id: UserInfoType = {
      firstName,
      lastName,
      email,
      phoneNumber,
      _id: hash,
      userType: userType,
      // we do not know what classes this user will be a part of so let us just let them be empty
      chatIDs: [],
      classes: [],
      groupID,
      gender,
      adminChat,
      dob
    }
    await this._refUserID(hash).update(user_and_id);
    const curFam = await this._refFamily(groupID).once('value').then(snap => {
      const val = snap.val();
      return val;
    })
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
            user: val[key].user,
            image: val[key].image
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
            user: snapVal[key].user,
            image: snapVal[key].image
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
    let myMesID;
    let res: Boolean = true;
    const oldMess: number = await this.getRecentId(messages[0].chatID);
    this.updateNumMessages(messages[0].chatID);

    messages.forEach(async (element: MessageInput) => {
      const { text, user, chatID, image } = element;
      myMesID = oldMess;
      const message = {
        text,
        user,
        createdAt: moment().format(),
        messageID: myMesID,
        image
      };
      const hashChatID: string = MD5(chatID).toString();
      try {
        await this._refMessage(hashChatID).push(message);
      } catch (e) {
        console.log('sending message or image failed:', e)
        res = false
      }
    });
    return { res }
  }

  refOff () {
    this._refMessage('').off();
  }

  // lets pass in the email and then hash it here
  async getUser(email: string) {
    const hashedEmail = getHash(email);
    const user: UserInfoType = await this._refUserID(hashedEmail).once('value')
      .then(snap => {
        const val = snap.val()
        return val
      })
    return user;
  }

  async getFamily(groupID: string) {
    const res: UserInfoType[] = await this._refFamily(groupID).once('value')
      .then((snap) => {
        const val = snap.val();
        return val.user
      })
    return res;
  }

  async searchUsers(searchTerm: string) {

    const relevantFields = [ 'email', 'firstName', 'lastName', 'phoneNumber', 'userType' ];

    // this will be the ref for all the users
    return await this._refUsers().once('value')
      .then((snap) => {
        const val = snap.val();
        const keys = Object.keys(val);
        const Users = keys.map((k, index) => {
          const u = val[k];
          // const _user = u[Object.keys(u)[0]]
          let flag = false;
          relevantFields.forEach((_field) => {
            let field = u[_field];
            if (_field === 'email') { field = field.split('@')[0] }
            if (field.toLowerCase().includes(searchTerm.toLowerCase())) {
              flag = true;
              return;
            }
          })
          if (flag) { return u }
          // let us filter out the admins
          // only the admins will be searching users and they wont really need to add themselves
        }).filter(user => !!user).filter(user => user.userType !== 'Admin') //for some reason cannot user Permission.Admin here
        return Users;
      })
  }

  async searchClasses(searchTerm: string) {
    return await this._refClasses().once('value')
      .then(snap => {
        const val = snap.val();
        if (!val) { return { classes: []}}
        const keys = Object.keys(val);
        const classes = keys.map(k => {
          const c = val[k]
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
    if (allClasses.classes.includes(className)) {
      const returnVal: AddClassPayload = { res: false, message: 'This class already exists'}
      return returnVal;
    }
    await this._refClasses().push(className)
    const returnVal: AddClassPayload = { res: true, message: 'Sucess'};
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

  async createChat(displayName: string, className: string, tutorInfo: ChatUserInfo, userInfo: ChatUserInfo[]) {
    // generate chatID / class ID
    // let us make these two ^ the same
    const chatID: string = genID();
    const tutorID: string = getHash(tutorInfo.email);
    const adminUsers: UserInfoType[] = await Promise.all(ADMIN_EMAILS.map(async _email => {
      return await this.getUser(_email)
    }))
    // console.log('admin users', adminUsers)
    const users: UserInfoType[] = await Promise.all(userInfo.map(async _user => {
      const u = await this.getUser(_user.email)
      return u;
    }));

    const allUsers: UserInfoType[] = [
      ...adminUsers,
      ...users
    ]
    console.log('users', users)
    console.log('admin users', adminUsers)
    console.log('all users', allUsers)
    // add ID to the tutor
    const newChat: Chat = {
      displayName,
      className,
      userInfo,
      tutorInfo,
      chatID
    }

    let tutor: UserInfoType = await this._refUserID(tutorID).once('value').then(snap => {
      return snap.val()
    })
    let classes = tutor.classes;
    // tutors will not have any families
    let ind = null;
    await this._refFamily(tutor.groupID).once('value').then(snap => {
      const val = snap.val();
      val.user.forEach((_v, _ind) => {
        if (_v._id === tutorID) {
          ind = _ind
        }
      })
    })
    if (!classes) {
      await this._refUserID(tutorID).update({ classes: [{...newChat}]})
      await this._refFamilySpecific(tutor.groupID, ind).update({ classes: [{...newChat}]})
    } else {
      await this._refUserID(tutorID).update({ classes: [...classes, newChat]})
      await this._refFamilySpecific(tutor.groupID, ind).update({ classes: [...classes, newChat] })
    }

    const _runAsync = async () => {
      await asyncForEach(allUsers, async (_user) => {
        console.log('the _user', _user)
        classes = _user.classes;
        await this._refFamily(_user.groupID).once('value').then(snap => {
          const val = snap.val();
          val.user.forEach((_u, index) => {
            if (_u._id === _user._id) {
              ind = index
            }
          })
        })

        if (!classes) {
          await this._refUserID(_user._id).update({ classes: [{...newChat}]})
          await this._refFamilySpecific(_user.groupID, ind).update({ classes: [{...newChat}]})
        } else {
          await this._refUserID(_user._id).update({ classes: [...classes, newChat]})
          await this._refFamilySpecific(_user.groupID, ind).update({ classes: [...classes, newChat]})
        }
      })
    }
    await _runAsync();

    this._refChats(chatID).update(newChat)
    const returnVal: GenericResponse = { res: true }
    return returnVal
  }

  async createCode(email: string) {
    let res: boolean = true
    const code: string = getHash(email.toUpperCase());
    const codesRef = this._refCodes(code);
    const shortCode: string = code.toUpperCase().substring(0, CODE_LENGTH);
    try {
      await codesRef.set(shortCode);
    } catch (e) {
      res = false;
    }
    return { res, code: shortCode }
  }

  async checkCode(email: string, code: string) {
    const hashedEmail = getHash(email.toUpperCase())
    let res: boolean = true
    await this._refCodes(hashedEmail).once('value').then(snap => {
      const val: string = snap.val();
      if (!val) {
        res = false
        return ;
      }

      res = val.toUpperCase() === code.toUpperCase()
    })

    return { res }
  }

  // unclear on the status of this one
  // DESCOPED to V@ or later
  async updateUser(user: UserInfoTypeInput) {
    const userID = user._id;
    const userEmail = user.email
    const hashedEmail = getHash(userEmail);

    await this._refUserID(hashedEmail).update({
      ...user
    })
  }

  // userEmails are to be added to the familyID
  async addFamilyMember(familyID: string, userEmails: string[]) {
    // all we should need to do is change the groupID field of the users to the new familyID
    let hashedEmail: string;
    let res: boolean = true;
    userEmails.forEach(async _user => {
      try {
        hashedEmail = getHash(_user)
        let user = await this._refUserID(hashedEmail).once('value').then(snap => snap.val())
        const oldGroupID = user.groupID;
        const oldID = user._id;

        // update the user in the db
        user.groupID = familyID;
        await this._refUserID(hashedEmail).update({ groupID: familyID })

        // now this needs to go is the new family at /family
        const curFam = await this._refFamily(familyID).once('value').then(snap => {
          const val = snap.val();
          return val;
        })

        await this._refFamily(familyID).update({ user: [...curFam.user, user]})

        // and then delete the user from the old family location

        // get the index value needed for the _refFamilySpeciifc ref
        const ind = await this._refFamily(oldGroupID).once('value').then(snap => {
          const val = snap.val();
          const familyUsers = val.user;
          let _ind;
          familyUsers.forEach((_user, index) => {
            if (_user._id === oldID) {
              _ind = index
            }
          })
          return _ind;
        })

        let oldUser = await this._refFamilySpecific(oldGroupID, ind)
        await oldUser.remove();
      } catch (e) {
        res = false
        console.log('something went wrong with adding the family member', e, res)
      }
    })

    return { res }
  }

  async deleteChatFromUser(hashedEmail: string, userType: string, chatID: string) {
    const res = await this._refUserID(hashedEmail).once('value').then(async snap => {
      const val: UserInfoType = snap.val();
      let ind = -1;
      val.classes.forEach((_class: Chat, _ind) => {
        if (_class.chatID === chatID) {
          ind = _ind
        }
      })

      const famInd = await this._refFamily(val.groupID).once('value').then(snap => {
        const user = snap.val().user;
        let ind = -1;
        user.forEach((_user, _ind) => {
          if (_user._id === hashedEmail) {
            ind = _ind
          }
        })
        return ind
      })

      const classInd = await this._refFamilySpecific(val.groupID, famInd.toString()).once('value').then(async snap => {
        const val: UserInfoType = snap.val();
        let ind = -1;
        const classRef = val.classes.forEach((_class, _ind) => {
          if (_class.chatID === chatID) {
            ind = _ind
          }
        })

        return ind;
      })

      const classRef = await this._refFamilClassCpecific(val.groupID, famInd.toString(), classInd.toString());
      await classRef.remove();

      return ind
    }).then(async (val: number) => {
      const classRef = await this._refUserClassSpecific(hashedEmail, val);
      await classRef.remove();

      return true;
    })

    return res;
  }

  async deleteChatsFromUsers(hashedInfo: {email: string, userType: string}[], chatID: string) {
    let res = true;
    hashedInfo.forEach(async _info => {
      const _res: boolean = await this.deleteChatFromUser(_info.email, _info.userType, chatID)
      res = res && _res;
    })
  }

  async deleteChat(chatID) {
    const chat: Chat = await this._refChats(chatID).once('value').then(snap => {
      const val = snap.val();
      return val;
    })

    const hashedInfo = [
      {
        email: getHash(chat.tutorInfo.email),
        userType: 'Tutor'
      },
      ...(chat.userInfo.map(_user => (
        {
          email: getHash(_user.email),
          userType: 'User'
        }
      ))),
      ...(ADMIN_EMAILS.map(_email => (
        {
          email: getHash(_email),
          userType: 'Admin'
        }
      )))
    ]

    const res = await this.deleteChatsFromUsers(hashedInfo, chatID);

    // // delete the chat object itself
    const chatRef = await this._refChats(chatID);
    await chatRef.remove();

    return { res: true }

  }
}

const firebaseSvc = new FireBaseSVC();
export default firebaseSvc;
