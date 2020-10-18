import { gql } from 'apollo-server';

const typeDefs = gql`

  input MessageInput {
    id: String!
    text: String!
    user: MessageUserInput!
    chatID: String!
    image: String
  }
  # this is made to work with the gifted chat user type that it is expecting
  input MessageUserInput {
    name: String!
    email: String!
    _id: String!
  }

  type MessagePayload {
    text: String!
    MessageId: Int!
    createdAt: String!
    user: MessageUser!
    image: String
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
    image: String
  }

  enum Permission {
    Student
    Parent
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
    user: UserInfoType
  }

  input UserInputType {
    # name: String!
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    userType: Permission!
    phoneNumber: String!
    gender: String
    dob: String!
  }

  # descoped to v2
  input ChatInput {
    displayName: String!
    # class name
    className: String
    # who is taking this class
    userEmails: [String]
    # who is teaching this class (probs will only be on)
    tutorEmail: String
    # where are we keeping these messages
    chatID: String
  }

  # descoped to v2
  input UserInfoTypeInput {
    name: String!
    email: String!
    phoneNumber: String!
    userType: Permission!
    _id: String!
    chatIDs: [String]
    # making this a nullable field for now
    classes: [ChatInput]
    groupID: String!
    gender: String!
  }

  # only students will have this
  # dont really care about what the tutor and parent's birthdays are
  type UserAdditionalInfo {
    dob: String
    year: Int
    schoolName: String
  }
  # maybe we can add an optional info field too

  # this type will be for what we want to query for when we represent data on the frontend
  # these are fields that will be written to the db
  # Backend analog IUser
  type UserInfoType {
    firstName: String!
    lastName: String!
    email: String!
    phoneNumber: String!
    userType: Permission!
    _id: String!
    # TODO: take this field out. no longer needed
    chatIDs: [String]!
    # making this a nullable field for now
    classes: [Chat!]
    groupID: String!
    # TOOD remove Gender
    gender: String!
    adminChat: [AdminChat!]
    dob: String!
  }

  type ChatUserInfo {
    firstName: String!
    lastName: String!
    email: String!
  }

  # this will make it easier to add people
  input ChatUserInfoInput {
    firstName: String!
    lastName: String!
    email: String!
  }

  # need to look over which fields are required
  # letf a lot of them to be nullable because at creation we will not know these details
  type Chat {
    # seems like a good idea?
    # _id: String
    # display name
    displayName: String!
    # class name
    className: String!
    # who is taking this class
    # userEmails: [String]
    userInfo: [ChatUserInfo!]!
    # who is teaching this class (probs will only be on)
    # tutorEmail: String!
    tutorInfo: ChatUserInfo!
    # where are we keeping these messages
    chatID: String!
  }

  type AdminChatUser {
    firstName: String!
    lastName: String!
    email: String!
  }

  # this will serve as the chat with shweta and sakthi
  # only field we need is the chatID right?
  # mmembers are already decided: user, shweta, sakthi
  type AdminChat {
    chatID: String!
    user: AdminChatUser!
  }

  type ClassName {
    name: String!
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

  type SendMessagePayload {
    res: Boolean!
    # we should send info about the message to hopefully update the cache automatically instead of adding the -no-cache param
  }

  type createCodePayload {
    res: Boolean!
    code: String!
  }

  type genericResponse {
    res: Boolean!
    # not required
    message: String
  }

  # if we return the updated family member, then that 'should' update the UI for free
  type AddFamilyMemberPayload {
    res: Boolean!
    # user: UserInfoType!
    family: [UserInfoType!]!
  }

  type Query {
    # refresh needs to be optional because we need to differentiate between
    # just opening the chat and pulling down to refresh
    # we also want to know who is getting the messages
    getMessages(chatID: String!, userID: String!, refresh: Boolean): [MessageType]
    getFamily(groupID: String!): [UserInfoType]
    searchUsers(searchTerm: String!): [UserInfoType]!
    searchClasses(searchTerm: String!): searchClassesPayload!
    getUser(userEmail: String!): UserInfoType!
    checkCode(email: String!, code: String!): genericResponse!
  }

  type Mutation {
    login(email: String!, password: String!): LoginPayload
    sendMessage(messages: [MessageInput]): SendMessagePayload!
    createUser(users: [UserInputType]): genericResponse!
    addClass(className: String!): addClassPayload!
    deleteClass(className: String!): deleteClassPayload!
    createChat(displayName: String! className: String!, tutorInfo: ChatUserInfoInput!, userInfo: [ChatUserInfoInput!]!): genericResponse!
    createCode(email: String!): createCodePayload!
    addFamilyMember(familyID: String!, userEmails: [String!]!): AddFamilyMemberPayload!
    deleteChat(chatID: String!): genericResponse!
    sendEmail(subject: String!, body: String!): genericResponse!
    sendBugEmail(user: String!, body: String!): genericResponse!
    forgotPassword(email: String!): genericResponse!
    addChatMember(email: String!, chatID: String!): genericResponse!
    # deleteChatMember()

    # this is descoped to v2
    updateUser(user: UserInfoTypeInput!): genericResponse!

    # needs to be written
    # change classes
  }

  type Subscription {
    messageReceived: MessagePayload!
  }
`;

export default typeDefs;
