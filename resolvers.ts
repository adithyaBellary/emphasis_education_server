// fieldName: (parent, args, context, info) => data;
import pubsub from './pubsub';
import { MESSAGE_RECEIVED_EVENT } from './constants';
import { UserInputType } from './types/schema-types';
import { genID } from './helper';

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
    createUser: (_, {users}, { dataSources }) => {
      console.log('in resolver creating user', users);
      // set the groupID. should be the same for each user in the family
      const groupID: string = genID();
      users.forEach(async ({email, password, name, userType, phoneNumber}: UserInputType) => {
        // this adds the user to the firebase list of users
        await dataSources.f.createUser(email, password, name);
        // this adds user to the db
        await dataSources.f.pushUser(
          name,
          email,
          userType,
          phoneNumber,
          groupID
        );
      });
      return true;
    },
    addClass: async (_, { className }, { dataSources }) => {
      return await dataSources.f.addClass(className);
    },
    deleteClass: async (_, { className }, { dataSources }) => {
      return await dataSources.f.deleteClass(className);
    },
    createChat: async (_, { className, tutorEmail, userEmails }, { dataSources }) => {
      return await dataSources.f.createChat(className, tutorEmail, userEmails)
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