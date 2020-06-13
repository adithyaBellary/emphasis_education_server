// fieldName: (parent, args, context, info) => data;
import pubsub from './pubsub';
import { MESSAGE_RECEIVED_EVENT } from './constants';
import { UserInputType } from './types/schema-types';
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
      console.log('in resolver creating user', users);
      // set the groupID. should be the same for each user in the family
      const groupID: string = genID();
      const _create = async () => {
        await asyncForEach(users, async ({email, password, name, userType, phoneNumber}: UserInputType) => {
          const resp = await dataSources.f.createUser(email, password, name);
          console.log('done w 1', email, resp)
          const result = await dataSources.f.pushUser(
            name,
            email,
            userType,
            phoneNumber,
            groupID
          )
          console.log('done w 2', email, result)
        })
      }
      await _create();
      return true;
    },
    addClass: async (_, { className }, { dataSources }) => {
      return await dataSources.f.addClass(className);
    },
    deleteClass: async (_, { className }, { dataSources }) => {
      return await dataSources.f.deleteClass(className);
    },
    createChat: async (_, { displayName, className, tutorEmail, userEmails }, { dataSources }) => {
      return await dataSources.f.createChat(displayName, className, tutorEmail, userEmails)
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