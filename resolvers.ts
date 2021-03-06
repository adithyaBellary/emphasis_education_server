// fieldName: (parent, args, context, info) => data;
import pubsub from './pubsub';
import { MESSAGE_RECEIVED_EVENT } from './constants';
import { UserInputType, GenericResponse } from './types/schema-types';
import { genID, asyncForEach } from './helper';

const resolvers = {
  Query: {
    getMessages: async (_, { chatID, userID, refresh }, { dataSources }) => {
      const resp = await dataSources.f.getMessages(chatID, userID, refresh);
      return resp;
    },
    getFamily: async (_, { groupID }, { dataSources }) => {
      return await dataSources.f.getFamily(groupID)
    },
    searchUsers: async (_, { searchTerm, includeAdmin }, { dataSources}) => {
      return await dataSources.f.searchUsers(searchTerm, includeAdmin)
    },
    searchClasses: async (_, { searchTerm }, { dataSources }) => {
      return await dataSources.f.searchClasses(searchTerm)
    },
    getUser: async (_, { userEmail, fcmToken }, { dataSources }) => {
      const lowerCaseEmail = userEmail.toLowerCase();
      const res =  await dataSources.f.getUser(lowerCaseEmail, fcmToken);
      return res;
    },
    checkCode: async (_, { email, code }, { dataSources }) => {
      return await dataSources.f.checkCode(email, code);
    }
  },

  Mutation: {
    login: async (_, { email, password, token }, { dataSources }) => {
      const lowerCaseEmail = email.toLowerCase();
      const response = await dataSources.f.login(
        {
          email: lowerCaseEmail,
          password,
          token
        },
      )
      return response
    },
    sendMessage: async (_, { messages, isAdminMessage }, { dataSources }) => {
      const res = await dataSources.f.sendMessage(messages, isAdminMessage);
      return res;
    },
    createUser: async (_, { users }, { dataSources }) => {
      // set the groupID. should be the same for each user in the family
      const groupID: string = genID();
      let response = true;
      let message: string;
      const badEmails = [];
      const _create = async () => {
        await asyncForEach(users, async ({ email, password, firstName, lastName, userType, phoneNumber, dob }: UserInputType) => {
          try {
            const lowerCaseEmail = email.toLowerCase();
            const resp = await dataSources.f.createUser(lowerCaseEmail, password, firstName, lastName);
            if (!resp) {
              badEmails.push(email)
              // throw new Error;
            } else {
              const result = await dataSources.f.pushUser(
                firstName,
                lastName,
                lowerCaseEmail,
                userType,
                phoneNumber,
                groupID,
                // gender,
                dob
              )
            }

          } catch (e) {
            response = false
            console.log('There was an error creating the user', e)
          }
        })
      }
      await _create();
      const badEmailsString = badEmails.join(', ')
      if (badEmails.length > 0) {
        message = `There was an issue with these emails: ${badEmailsString}. They might already be in use. If you have created other users, however, those have been successfully created.`;
      }
      const res = (badEmails.length === 0) && response
      const result: GenericResponse = { res, message };
      return result;
    },
    addClass: async (_, { className }, { dataSources }) => {
      return await dataSources.f.addClass(className);
    },
    deleteClass: async (_, { className }, { dataSources }) => {
      return await dataSources.f.deleteClass(className);
    },
    createChat: async (_, { displayName, className, tutorInfo, userInfo }, { dataSources }) => {
      return await dataSources.f.createChat(displayName, className, tutorInfo, userInfo)
    },
    createCode: async (_, { email }, { dataSources }) => {
      return await dataSources.f.createCode(email);
    },
    updateUser: async(_, { user }, { dataSources }) => {
      return await dataSources.f.updateUser(user)
    },
    addFamilyMember: async(_, { familyID, userEmails }, { dataSources }) => {
      return await dataSources.f.addFamilyMember(familyID, userEmails)
    },
    deleteChat: async(_, { chatID }, { dataSources }) => {
      return await dataSources.f.deleteChat(chatID);
    },
    sendEmail: async(_, { subject, body }, { dataSources }) => {
      return await dataSources.f.sendEmail(subject, body)
    },
    sendBugEmail: async(_, { user, body }, { dataSources }) => {
      return await dataSources.f.sendBugEmail(user, body)
    },
    forgotPassword: async(_, { email }, { dataSources }) => {
      return await dataSources.f.forgotPassword(email);
    },
    addChatMember: async(_, { email, chatID}, { dataSources }) => {
      return await dataSources.f.addChatMember(email, chatID);
    },
    updateFCMDeviceTokens: async (_, { email, token}, { dataSources }) => {
      return await dataSources.f.updateFCMDeviceTokens(email, token);
    },
    logout: async (_, {email}, {dataSources}) => {
      return await dataSources.f.logout(email);
    }
  },

  Subscription: {
    messageReceived: {
      subscribe: () => {
        // console.log('message received in the subscription')
        return pubsub.asyncIterator([MESSAGE_RECEIVED_EVENT])
      },
    }
  }
}

export default resolvers;