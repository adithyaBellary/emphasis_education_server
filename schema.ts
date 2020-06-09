import { gql } from 'apollo-server';

const typeDefs = gql`

  input MessageInput {
    id: String!
    text: String!
    user: MessageUserInput!
    chatID: String!
  }
  # this is made to work with the gifted chat user type that it is expecting
  input MessageUserInput {
    name: String!
    email: String!
    _id: String
  }

  type MessagePayload {
    text: String!
    MessageId: Int!
    createdAt: String!
    user: MessageUser!
  }

  type MessageUser {
    _id: String!
    name: String!
    email: String!
  }

  type MessageType {
    _id: String!
    text: String!
    createdAt: String!
    user: MessageUser!
  }

  # lets make this similar to UserInfoType
  type TestUser {
    _id: String!
    email: String!
    password: String!
    userType: Permission!
    chatIDs: [String]!
  }

  enum Permission {
    Student
    Tutor
    Admin
  }

  enum Classes {
    Math
    Science
    History
  }

  type LoginPayload {
    res: Boolean!
    # basically UserInfoType from here down
    name: String!
    email: String!
    phoneNumber: String!
    userType: Permission!
    groupID: String!
    _id: String!
    chatIDs: [String]!
  }

  input UserInputType {
    name: String!
    email: String!
    password: String!
    userType: Permission!
    phoneNumber: String!
  }

  # maybe we can add an optional info field too

  # this type will be for what we want to query for when we represent data on the frontend
  # these are fields that will be written to the db
  # Backend analog IUser
  type UserInfoType {
    name: String!
    email: String!
    phoneNumber: String!
    userType: Permission!
    _id: String!
    chatIDs: [String]!
    # making this a nullable field for now
    classes: [Chat]
    groupID: String!
  }

  # need to look over which fields are required
  # letf a lot of them to be nullable because at creation we will not know these details
  type Chat {
    # seems like a good idea?
    # _id: String
    # display name
    className: String
    # who is taking this class
    userIDs: [String]
    # who is teaching this class (probs will only be on)
    tutorID: String
    # where are we keeping these messages
    chatID: String
  }

  type ClassName {
    name: String!
  }

  type CreateUserPayload {
    success: Boolean
  }

  type addClassPayload {
    res: Boolean!
    message: String!
  }

  type searchClassesPayload {
    classes: [String]!
  }

  type deleteClassPayload {
    res: Boolean!
    message: String!
  }

  type createChatPayload {
    res: Boolean!
  }

  type Query {
    getMessages(chatID: String, init: Int!): [MessageType]
    getFamily(groupID: String!): [UserInfoType]
    searchUsers(searchTerm: String!): [UserInfoType]!
    searchClasses(searchTerm: String!): searchClassesPayload!
  }

  type Mutation {
    login(email: String!, password: String!): LoginPayload
    sendMessage(messages: [MessageInput]): MessagePayload!
    createUser(users: [UserInputType]): CreateUserPayload
    addClass(className: String!): addClassPayload!
    deleteClass(className: String!): deleteClassPayload!

    createChat(className: String!, tutorID: String!, userIDs: [String!]!): createChatPayload!

    # needs to be written
    # add chats to a student
    # change classes
    # change tutor
    # change the members of the family
  }

  type Subscription {
    messageReceived: MessagePayload!
  }
`;

export default typeDefs;
