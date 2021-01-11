import firebase from 'firebase';
import moment from 'moment';
import { MD5 } from "crypto-js"
import nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';

import pubsub from './pubsub';
import { firebaseConfig } from './config/firebaseConfig';
import { REQUEST_EMAIL, REQUEST_EMAIL_PASSWORD} from './config/EmailInfo';
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
  GenericResponse,
  FcmDeviceToken
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
  ADMIN_EMAILS,
  ADMIN_EMAIL,
  SERVICE_EMAIL,
  VALUE,
  CHAT_POINTER_REF_BASE,
  FCM_TOKENS_PER_CHAT
} from './constants';
import { FIREBASE_ADMIN_CONFIG } from './config/firebaseAdminConfig';

class FireBaseSVC {

  public state: { transporter: any } = {
    transporter: null
  }
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(FIREBASE_ADMIN_CONFIG),
      databaseURL: process.env.DATABASE_URL
    });
    firebase.initializeApp(firebaseConfig);
    console.log('we are initializing');
    this.test_listen();
    // create the email transporter
    this.state.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: REQUEST_EMAIL,
        pass: REQUEST_EMAIL_PASSWORD
      }
    })
  }

  getLoginVal (email: string, password: string) {
    return firebase.auth().signInWithEmailAndPassword(email, password)
      .then(() => true)
      .catch(e => {
        console.log('sent the bad login to sentry')
        Sentry.captureException(new Error(e), {
          user: {
            email
          }
        })
        return false
      })
  }

  async login (user: MutationLoginArgs) {
    let payload: LoginPayload;
    const transaction = Sentry.startTransaction({
      op: "test",
      name: "My First Test Transaction",
    });

    const _loginVal: boolean = await this.getLoginVal(user.email, user.password)
    if (_loginVal) {
      const loggedInUser: UserInfoType = await this.getUser(user.email)
      const deviceToken: string = user.token
      if (loggedInUser.classes) {
        // if the user has any classes, we need to register their device token under each class at the FCM token ref
        // loggedInUser.classes.forEach(_class => {
        //   const chatREF = this._refFCMDeviceTokensPerChat(_class.chatID)
        //   await
        // })
        const fcmDeviceToken: FcmDeviceToken = {
          _id: loggedInUser._id,
          token: deviceToken
        }
        await asyncForEach(loggedInUser.classes, async (_class) => {
          const chatREF = this._refFCMDeviceTokensPerChat(_class.chatID)
          await chatREF.push(fcmDeviceToken)
        })
      }
      console.log('user token', user.token)
      const {__typename, ...rest} = loggedInUser
      payload = {
        res: true,
        user: rest
      }
    } else {
      payload = {
        res: false
      }
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

  _refChatPointer() {
    return firebase.database().ref(`${CHAT_POINTER_REF_BASE}`)
  }

  _refFCMDeviceTokensPerChat(chatID: string) {
    return firebase.database().ref(`${FCM_TOKENS_PER_CHAT}/${chatID}`)
  }

  async pushUser(firstName, lastName, email, userType, phoneNumber, hash, groupID, dob) {
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
        const adminChats = await this._refUserID(hashedEmail).once(VALUE).then(snap => {
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
      // gender: 'M',
      adminChat,
      dob
    }
    await this._refUserID(hash).update(user_and_id);
    const curFam = await this._refFamily(groupID).once(VALUE).then(snap => {
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

  getMessages = async (chatID: string, userID: string, refresh: boolean | undefined) => {
    const numMessages: number = await this.getNumMessages(chatID);
    const startIndex: number = -1 * (numMessages -1 )

    let start: number;
    let end: number;
    const chatPointerRefLocation = `${CHAT_POINTER_REF_BASE}/${chatID}/${userID}/pointer`

    const chatPointerRef = firebase.database().ref(chatPointerRefLocation)

    const chatPointer = await chatPointerRef.once(VALUE)
      .then(snap => snap.val())

    // we want ref structure to go like
    // chatPointers
    //   - chatID
    //     - userEmail
    //       - pointer: pointerVal

    if (!refresh) {
      // if we are just opening the chat and just getting the messages plainly
      // we will also need to reset the refetch pointer (if it has previously been set)

      if (numMessages < NUM_FETCH_MESSAGES) {
        start = startIndex
        end = 0;
      } else {
        // let us check to see if the user has already fetched any messages
        // if they have let us return what they have refetched for before

        // if not, then this is NOT the time to set that info in the db

        if(chatPointer) {
          // delete the pointer ref to reset the chat pointers
          // if we preserved them, then if the user were to refresh early on, then they would be getting their
          // messages returned each time
          await chatPointerRef.remove();
        }
        end = startIndex + NUM_FETCH_MESSAGES - 1
        start = startIndex
      }
    } else {
      // what if we only update the chat pointer when we actually refetch something. in other words,
      // when we call the refresh function and there doesnt end up being any new content to return,
      // we do not write to the db yet

      // if we are calling the refetch function with nothing more to refetch for,
      // return nothing and do nothing to the db
      if (numMessages <= NUM_FETCH_MESSAGES) { return [] }

      if (chatPointer > 0) { return [] }

      if (chatPointer !== null) {
        start = chatPointer;
      } else {
        start = startIndex + NUM_FETCH_MESSAGES
      }

      const potentialEnd = start + NUM_FETCH_MESSAGES - 1
      end = potentialEnd > 0 ? 0 : potentialEnd

      const nextStartPtr = end + 1;
      const pointerRef = firebase.database().ref(`${CHAT_POINTER_REF_BASE}/${chatID}/${userID}/pointer`)
      await pointerRef.set(nextStartPtr)
        .catch(e => {
          console.log('error setting chat pointer, ', e)
        })
    }

    return await this._refMessage(chatID)
      .orderByChild('_id')
      .startAt(start)
      .endAt(end)
      .once(VALUE)
      .then(snap => {
        const val = snap.val();
        // return empty list if there are no messages
        if (!val) { return []}
        const key = Object.keys(val)
        const mess: MessageType[] = key.map(k => {
          return val[k]
        })
        return mess
      })
  }

  getRecentId = async (chatID: string) => {
    return await this._refMessage(chatID)
      .limitToLast(1)
      .once(VALUE)
      .then(snap => {
        const val = snap.val();
        if (!val) { return 0 }
        const key = Object.keys(val);
        const oldMessageID = val[key[0]]._id;
        return oldMessageID - 1;
      })
  }

  test_listen() {
    console.log('listener is on')
    this._refMessage('')
      .on('child_changed', (snapshot) => {
        const val = snapshot.val();
        const key = Object.keys(val).slice(-1)[0]
        const messageReceived: MessageType = {
          _id: val[key]._id,
          chatID: val[key]._id,
          createdAt: val[key].createdAt,
          image: val[key].image,
          text: val[key].text,
          user: val[key].user,
        }
        // pubsub.publish(MESSAGE_RECEIVED_EVENT, {
        //   messageReceived
        // })
        // add sentry message
        // console.log('publishing new message: ', messageReceived)
      }),

    // this is the listener for a new child (chat) being added
    this._refMessage('')
      .on('child_added', (snap) => {
        const val = snap.val();
        const key = Object.keys(val)[0];
        const messageReceived: MessageType = {
          _id: val[key]._id,
          chatID: val[key]._id,
          createdAt: val[key].createdAt,
          image: val[key].image,
          text: val[key].text,
          user: val[key].user,
        }
        // pubsub.publish(MESSAGE_RECEIVED_EVENT, {
        //   messageReceived
        // })
        // add sentry message
      })
  }

  timeStamp() {
    return firebase.database.ServerValue.TIMESTAMP;
  }

  getNumMessages = async (chatID: string) => {
    return await this._refMessageNum(chatID).once(VALUE)
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

  sendMessages = async (messages: MessageInput[]) => {
    let myMesID;
    let res: Boolean = true;
    const oldMess: number = await this.getRecentId(messages[0].chatID);

    const _chatID = messages[0].chatID;
    // console.log('messages', messages)

    messages.forEach(async (element: MessageInput) => {
      const { text, user, chatID, image } = element;
      myMesID = oldMess;
      const message: MessageType = {
        text,
        user,
        createdAt: moment().format(),
        _id: myMesID,
        image,
        chatID
      };
      console.log('message', message)
      try {
        await this._refMessage(chatID).push(message);
        await this.updateNumMessages(messages[0].chatID);

        // publish from pubsub
        console.log('publishing new message: ', message)
        pubsub.publish(MESSAGE_RECEIVED_EVENT, {
          messageReceived: message
        })
      } catch (e) {
        console.log('sending message or image failed:', e)
        res = false
      }
    });

    // send push notification
    const message = {
      // store the chat details in the data object
      data: {
        chatID: _chatID,
        message: 'You received a new message',
        title: 'New Message',
        content_available: '1',
        // priority: 'high'
      },
      notification: {
        body: "You received a new message (notification)",
        title: "New Message"
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true
          }
        },
        headers: {
          'apns-push-type': 'background',
          'apns-priority': '5',
          'apns-topic': 'org.reactjs.native.example.emphasis-education-app', // your app bundle identifier
          'content-available': '1'
        },
      },
      // priority: "high",
      // the chatID seems to be a good choice to send the message to
      // with the topic, we no longer need to store the registration tokens
      // the user needs to manually refresh their chats first, though, in order to actually start getting push notified
      topic: messages[0].chatID
    };

    const deviceFCM = "dqQFO-mGSk9Yr2cEz6D7eO:APA91bEwOPWX0E5_2DbVRx7gO78LFfa1L3N2BJJ1MSg974wSWyjkbHquhw7D0D7vMQQutSgxrns8SQBeg84B2VkO_I-4_cxfZDbJdV4IiI_3OnDGjOhpAVMvgFnBL5rjGRTLoDn4_bmY"

    admin.messaging().sendToDevice(
      [deviceFCM], //the device fcms
      {
        data: {
          chatID: _chatID,
          message: 'You received a new message',
          title: 'New Message',
        },
        // notification: {
        //   body: "You received a new message (notification)",
        //   title: "New Message"
        // },
      },
      {
        // Required for background/quit data-only messages on iOS
        contentAvailable: true,
        // Required for background/quit data-only messages on Android
        priority: 'high',
      },
    )
    .then(res => {
      console.log(`success sending to the device ${JSON.stringify(res)}`)
    })
    .catch(e => {
      console.log(`could not send to the devices ${JSON.stringify(e)} `)
    })

    // admin.messaging().send(message).then(res => {
    //   console.log('it is a success sending the push notification', res)
    // }).catch(error => {
    //   console.log('there was an error sending the push notification', error)
    //   // add sentry message or exception
    // })

    return { res }
  }

  refOff () {
    this._refMessage('').off();
  }

  // lets pass in the email and then hash it here
  async getUser(email: string) {
    const hashedEmail = getHash(email);
    const user: UserInfoType = await this._refUserID(hashedEmail).once(VALUE)
      .then(snap => {
        const val = snap.val()
        return val
      })
    return user;
  }

  async getFamily(groupID: string) {
    const res: UserInfoType[] = await this._refFamily(groupID).once(VALUE)
      .then((snap) => {
        const val = snap.val();
        return val.user
      })
    return res;
  }

  async searchUsers(searchTerm: string, includeAdmin?: boolean) {

    const relevantFields = [ 'email', 'firstName', 'lastName', 'phoneNumber', 'userType' ];

    // this will be the ref for all the users
    return await this._refUsers().once(VALUE)
      .then((snap) => {
        const val = snap.val();
        const keys = Object.keys(val);
        const Users = keys.map((k, index) => {
          const u = val[k];
          let present = false;
          relevantFields.forEach((_field) => {
            let field = u[_field];
            if (_field === 'email') { field = field.split('@')[0] }
            if (field.toLowerCase().includes(searchTerm.toLowerCase())) {
              present = true;
              return;
            }
          })
          if (present) { return u }
          // let us filter out the admins
          // only the admins will be searching users and they wont really need to add themselves
        }).filter(user => !!user).filter(user => includeAdmin || user.userType !== 'Admin') //for some reason cannot user Permission.Admin here
        return Users;
      })
  }

  async searchClasses(searchTerm: string) {
    return await this._refClasses().once(VALUE)
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
    const chatID: string = genID();
    const tutorID: string = getHash(tutorInfo.email);
    const adminUsers: UserInfoType[] = await Promise.all(ADMIN_EMAILS.map(async _email => {
      return await this.getUser(_email)
    }))
    const users: UserInfoType[] = await Promise.all(userInfo.map(async _user => {
      const u = await this.getUser(_user.email)
      return u;
    }));

    const allUsers: UserInfoType[] = [
      ...adminUsers,
      ...users
    ]
    // console.log('users', users)
    // console.log('admin users', adminUsers)
    // console.log('all users', allUsers)
    const newChat: Chat = {
      displayName,
      className,
      userInfo,
      tutorInfo,
      chatID
    }

    let tutor: UserInfoType = await this._refUserID(tutorID).once(VALUE).then(snap => {
      return snap.val()
    })
    let classes = tutor.classes;
    // tutors will not have any families
    let ind = null;
    await this._refFamily(tutor.groupID).once(VALUE).then(snap => {
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
        // console.log('the _user', _user)
        classes = _user.classes;
        await this._refFamily(_user.groupID).once(VALUE).then(snap => {
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
    const lowerCaseEmail = email.toLowerCase();
    const code: string = getHash(lowerCaseEmail);
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
    const lowerCaseEmail = email.toLowerCase();
    const hashedEmail = getHash(lowerCaseEmail)
    let res: boolean = true
    await this._refCodes(hashedEmail).once(VALUE).then(snap => {
      const val: string = snap.val();
      if (!val) {
        res = false
        return ;
      }

      res = val.toLowerCase() === code.toLowerCase()
    })

    return { res }
  }

  // unclear on the status of this one
  // DESCOPED to V2 or later
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

    await asyncForEach(userEmails, async _user => {
      // console.log(_user)
      try {
        hashedEmail = getHash(_user)
        let user = await this._refUserID(hashedEmail).once(VALUE).then(snap => snap.val())
        const oldGroupID = user.groupID;
        const oldID = user._id;

        // update the user in the db
        user.groupID = familyID;
        await this._refUserID(hashedEmail).update({ groupID: familyID })

        // now this needs to go is the new family at /family
        const curFam = await this._refFamily(familyID).once(VALUE).then(snap => {
          const val = snap.val();
          return val;
        })

        await this._refFamily(familyID).update({ user: [...curFam.user, user]})
        // console.log('what we are adding: ', { user: [...curFam.user, user]})
        // and then delete the user from the old family location

        // get the index value needed for the _refFamilySpeciifc ref
        const ind = await this._refFamily(oldGroupID).once(VALUE).then(snap => {
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
        // console.log('something went wrong with adding the family member', e, res)
      }
    })

    // we will need to return the family defined by 'familyID'
    // as well as the old family of 'userEmails'?

    const newFam = await this._refFamily(familyID)
      .once(VALUE)
      .then(snap => {
        const val = snap.val();
        return val;
      })
    // console.log('new Fam', newFam)
    return {
      res,
      family: newFam.user
     }
  }

  async deleteChatFromUser(hashedEmail: string, userType: string, chatID: string) {
    const res = await this._refUserID(hashedEmail).once(VALUE).then(async snap => {
      const val: UserInfoType = snap.val();
      let ind = -1;
      val.classes.forEach((_class: Chat, _ind) => {
        if (_class.chatID === chatID) {
          ind = _ind
        }
      })

      const famInd = await this._refFamily(val.groupID).once(VALUE).then(snap => {
        const user = snap.val().user;
        let ind = -1;
        user.forEach((_user, _ind) => {
          if (_user._id === hashedEmail) {
            ind = _ind
          }
        })
        return ind
      })

      const classInd = await this._refFamilySpecific(val.groupID, famInd.toString()).once(VALUE).then(async snap => {
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
    const chat: Chat = await this._refChats(chatID).once(VALUE).then(snap => {
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

  async sendEmail(subject: string, body: string) {
    let res = true;

    const mailInfo = {
      from: REQUEST_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html: `<p>${body}</p>`
    }

    this.state.transporter.sendMail(mailInfo, (err, info) => {
      if (err) {
        console.log('there was an error,', err)
        res = false
      }
      if (info) { console.log('email sending was successful') }

    })

    return { res }
  }

  // this should be consolidated with the above
  async sendBugEmail(user: string, body: string) {
    let res = true;

    const mailInfo = {
      from: REQUEST_EMAIL,
      to: SERVICE_EMAIL,
      subject: `Bug / Feedback email from ${user}`,
      html: `<p>${body}</p>`
    }

    this.state.transporter.sendMail(mailInfo, (err, info) => {
      if (err) {
        console.log('there was an error, ', err)
        res = false
      }
      if (info) { console.log('email sending was successful') }
    })

    return { res }
  }

  async forgotPassword(email: string) {
    let res = true;
    // send the password email to the email send maybe
    firebase.auth().sendPasswordResetEmail(email).then(() => {
      console.log('we are successful sending the email')
    })
    .catch(e => {
      console.log('welp, ', e)
      res = false
    })

    return { res }
  }

  async addChatMember(email, chatID) {
    const chatObject: Chat = await firebase.database().ref(`${CHAT_REF_BASE}/${chatID}`).once(VALUE).then(snap => snap.val())
    const userInfo = chatObject.userInfo;
    // const userInfo = await firebase.database().ref(`${CHAT_REF_BASE}/${chatID}/userInfo`).once(VALUE).then(snap => {
    //   const val = snap.val()
    //   return val;
    // })

    const user = await this.getUser(email);

    const newUserInfo = [
      ...userInfo,
      {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    ]

    await firebase.database().ref(`${CHAT_REF_BASE}/${chatID}`).update({ userInfo: newUserInfo})

    // what will need to be uopdated in the
    // ADMINS
    // TUTORS
      // in their family locations as well. we we need this though??
    // OTHER MEMBERS IN THIS CHAT (in userInfo)
      // in their family locations as well
    const updatedCHat = await this._refChats(chatID).once(VALUE).then(snap => {
      const val = snap.val()
      return val
    })

    await asyncForEach(ADMIN_EMAILS, async (_email) => {
      // const adminUser = await this.getUser(_email);
      const classIndex = await this._refUserID(getHash(_email)).once(VALUE).then(snap => {
        const val = snap.val();
        let ind = 0;
        val.classes.forEach((_class, index) => {
          console.log(_class)
          if (_class.chatID === updatedCHat.chatID) {
            ind = index
          }
        })
        return ind;
      })

      console.log('index in async foreach', classIndex)
      const oldClasses = await firebase.database().ref(`${User_REF_BASE}/${getHash(_email)}/classes`).once(VALUE).then(snap => {
        const val = snap.val()
        return val
      })

      const updateClasses = []
      oldClasses.forEach((_oldClass, index) => {
        if (index === classIndex) {
          updateClasses.push(updatedCHat)
        } else {
          updateClasses.push(_oldClass)
        }
      })
      console.log('updated classes', updateClasses)
      await this._refUserID(getHash(_email)).update({ classes: updateClasses})
    })

    const tutorEmail = chatObject.tutorInfo.email;

    await asyncForEach([tutorEmail], async _tutorEmail => {
      const tutor = await this.getUser(_tutorEmail);
      const classIndex = await this._refUserID(getHash(_tutorEmail)).once(VALUE).then(snap => {
        const val = snap.val();
        let ind = 0;
        val.classes.forEach((_class, index) => {
          if (_class.chatID === updatedCHat.chatID) {
            ind = index
          }
        })
        return ind;
      })

      const oldClasses = await firebase.database().ref(`${User_REF_BASE}/${getHash(_tutorEmail)}/classes`).once(VALUE).then(snap => {
        const val = snap.val();
        return val;
      })

      const updatedClasses = []
      oldClasses.forEach((_oldClass, index) => {
        if (index === classIndex) {
          updatedClasses.push(updatedCHat)
        } else {
          updatedClasses.push(_oldClass)
        }
      })

      await this._refUserID(getHash(_tutorEmail)).update({ classes: updatedClasses})

      // add to the family ref because why not. tutors do not have families, so we know the index will just be 0

      await this._refFamilySpecific(tutor.groupID, '0').update({ classes: updatedClasses})
    })

    const userEmails = userInfo.map(_user => _user.email)

    // need to add to this user in the user ref, and at the family ref
    await asyncForEach(userEmails, async _userMail => {
      const user = await this.getUser(_userMail);
      const classIndex = await this._refUserID(getHash(_userMail)).once(VALUE).then(snap => {
        const val = snap.val();
        let ind = 0;
        val.classes.forEach((_class, index) => {
          if (_class.chatID === updatedCHat.chatID) {
            ind = index
          }
        })
        return ind;
      })

      const oldClasses = await firebase.database().ref(`${User_REF_BASE}/${getHash(_userMail)}/classes`).once(VALUE).then(snap => {
        const val = snap.val();
        return val;
      })

      const updatedClasses = []
      oldClasses.forEach((_oldClass, index) => {
        if (index === classIndex) {
          updatedClasses.push(updatedCHat)
        } else {
          updatedClasses.push(_oldClass)
        }
      })

      await this._refUserID(getHash(_userMail)).update({ classes: updatedClasses})

      // now update this user at the family ref

      const famIndex = await this._refFamily(user.groupID).once(VALUE).then(snap => {
        const val = snap.val();
        let ind = 0;
        val.user.forEach((_famMember, index) => {
          if (_famMember._id === user._id) {
            ind = index
          }
        })

        return ind
      })

      await this._refFamilySpecific(user.groupID, famIndex.toString()).update({ classes: updatedClasses})
    })

    // now add the class to the user object as well as the user object in the family ref
    const oldClasses = user.classes;
    const classBeingUpdated = await this._refChats(chatID).once(VALUE).then(snap => snap.val());
    const newClasses: Chat[] = []
    if (oldClasses) {
      newClasses.push(...oldClasses)
    }
    newClasses.push(classBeingUpdated);
    const hashedEmail = getHash(email)

    await this._refUserID(hashedEmail).update({ classes: newClasses})

    // now update the same user in the family ref
    const index = await this._refFamily(user.groupID).once(VALUE).then(snap => {
      const val = snap.val()
      const famUser = val.user;
      let ind = 1;
      famUser.forEach((_user, index) => {
        if (_user._id === user._id) {
          ind = index
        }
      })

      return ind;
    })

    await this._refFamilySpecific(user.groupID, index.toString()).update({ classes: newClasses})

    return { res: true }
  }

  async deleteChatMember(email, chatID) {

    firebase.database().ref(`${CHAT_REF_BASE}/${chatID}/userInfo`).once(VALUE)
    return { res: true }
  }
}

const firebaseSvc = new FireBaseSVC();
export default firebaseSvc;
