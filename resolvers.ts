// fieldName: (parent, args, context, info) => data;
import pubsub from './pubsub';
import { MESSAGE_RECEIVED_EVENT } from './constants';
import { UserInputType, CreateUserPayload } from './types/schema-types';
import { genID, asyncForEach } from './helper';

const resolvers = {
  Query: {
    getMessages: async (_, { chatID, init }, { dataSources }) => {
      const resp = await dataSources.f.getMessages(chatID, init);
      return resp;
    },
    getFamily: async (_, { groupID }, { dataSources }) => {
      return await dataSources.f.getFamily(groupID)
    },
    searchUsers: async (_, { searchTerm }, { dataSources}) => {
      return await dataSources.f.searchUsers(searchTerm)
    },
    searchClasses: async (_, { searchTerm }, { dataSources }) => {
      return await dataSources.f.searchClasses(searchTerm)
    },
    getUser: async (_, { userEmail }, { dataSources }) => {
      const res =  await dataSources.f.getUser(userEmail);
      return res;
    },
    checkCode: async (_, { email, code }, { dataSources }) => {
      return await dataSources.f.checkCode(email, code);
    }
  },

  Mutation: {
    login: async (_, { email, password }, { dataSources }) => {
      const response = await dataSources.f.login(
        {
          email,
          password
        },
      )
      return response
    },
    sendMessage: async (_, { messages }, { dataSources }) => {
      const res = await dataSources.f.sendMessages(messages);
      return res;
    },
    createUser: async (_, {users}, { dataSources }) => {
      // set the groupID. should be the same for each user in the family
      const groupID: string = genID();
      let response = true;
      const _create = async () => {
        await asyncForEach(users, async ({email, password, name, userType, phoneNumber, gender}: UserInputType) => {
          const resp = await dataSources.f.createUser(email, password, name);
          const result = await dataSources.f.pushUser(
            name,
            email,
            userType,
            phoneNumber,
            groupID,
            gender
          )
          response = resp && result;
        })
      }
      await _create();
      const result: CreateUserPayload = { success: response };
      return result;
    },
    addClass: async (_, { className }, { dataSources }) => {
      return await dataSources.f.addClass(className);
    },
    deleteClass: async (_, { className }, { dataSources }) => {
      return await dataSources.f.deleteClass(className);
    },
    createChat: async (_, { displayName, className, tutorEmail, userEmails }, { dataSources }) => {
      return await dataSources.f.createChat(displayName, className, tutorEmail, userEmails)
    },
    createCode: async (_, { email }, { dataSources }) => {
      return await dataSources.f.createCode(email);
    },
    updateUser: async(_, { user }, { dataSources }) => {
      return await dataSources.f.updateUser(user)
    }
  },

  Subscription: {
    messageReceived: {
      subscribe: () => {
        return pubsub.asyncIterator(MESSAGE_RECEIVED_EVENT)
      },
    }
  }
}

export default resolvers;