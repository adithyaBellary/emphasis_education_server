export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `Upload` scalar type represents a file upload. */
  Upload: any;
};

export type MessageInput = {
  id: Scalars['String'];
  text: Scalars['String'];
  user: MessageUserInput;
  chatID: Scalars['String'];
  image?: Maybe<Scalars['String']>;
};

export type MessageUserInput = {
  name: Scalars['String'];
  email: Scalars['String'];
  _id: Scalars['String'];
};

export type MessagePayload = {
  __typename?: 'MessagePayload';
  text: Scalars['String'];
  MessageId: Scalars['Int'];
  createdAt: Scalars['String'];
  user: MessageUser;
  image?: Maybe<Scalars['String']>;
};

export type MessageUser = {
  __typename?: 'MessageUser';
  _id: Scalars['String'];
  name: Scalars['String'];
  email: Scalars['String'];
};

export type MessageType = {
  __typename?: 'MessageType';
  _id: Scalars['String'];
  text: Scalars['String'];
  createdAt: Scalars['String'];
  user: MessageUser;
  image: Scalars['String'];
  chatID: Scalars['String'];
};

export enum Permission {
  Student = 'Student',
  Guardian = 'Guardian',
  Tutor = 'Tutor',
  Admin = 'Admin'
}

export enum Classes {
  Math = 'Math',
  Science = 'Science',
  History = 'History'
}

export type LoginPayload = {
  __typename?: 'LoginPayload';
  res: Scalars['Boolean'];
  user?: Maybe<UserInfoType>;
};

export type UserInputType = {
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
  userType: Permission;
  phoneNumber: Scalars['String'];
  dob: Scalars['String'];
};

export type ChatInput = {
  displayName: Scalars['String'];
  className?: Maybe<Scalars['String']>;
  userEmails?: Maybe<Array<Maybe<Scalars['String']>>>;
  tutorEmail?: Maybe<Scalars['String']>;
  chatID?: Maybe<Scalars['String']>;
};

export type UserInfoTypeInput = {
  name: Scalars['String'];
  email: Scalars['String'];
  phoneNumber: Scalars['String'];
  userType: Permission;
  _id: Scalars['String'];
  chatIDs?: Maybe<Array<Maybe<Scalars['String']>>>;
  classes?: Maybe<Array<Maybe<ChatInput>>>;
  groupID: Scalars['String'];
};

export type UserAdditionalInfo = {
  __typename?: 'UserAdditionalInfo';
  dob?: Maybe<Scalars['String']>;
  year?: Maybe<Scalars['Int']>;
  schoolName?: Maybe<Scalars['String']>;
};

export type UserInfoType = {
  __typename?: 'UserInfoType';
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  email: Scalars['String'];
  phoneNumber: Scalars['String'];
  userType: Permission;
  _id: Scalars['String'];
  chatIDs: Array<Maybe<Scalars['String']>>;
  classes?: Maybe<Array<Chat>>;
  groupID: Scalars['String'];
  adminChat?: Maybe<Array<AdminChat>>;
  dob: Scalars['String'];
};

export type ChatUserInfo = {
  __typename?: 'ChatUserInfo';
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  email: Scalars['String'];
};

export type ChatUserInfoInput = {
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  email: Scalars['String'];
};

export type Chat = {
  __typename?: 'Chat';
  displayName: Scalars['String'];
  className: Scalars['String'];
  userInfo: Array<ChatUserInfo>;
  tutorInfo: ChatUserInfo;
  chatID: Scalars['String'];
};

export type AdminChatUser = {
  __typename?: 'AdminChatUser';
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  email: Scalars['String'];
};

export type AdminChat = {
  __typename?: 'AdminChat';
  chatID: Scalars['String'];
  user: AdminChatUser;
};

export type ClassName = {
  __typename?: 'ClassName';
  name: Scalars['String'];
};

export type AddClassPayload = {
  __typename?: 'addClassPayload';
  res: Scalars['Boolean'];
  message: Scalars['String'];
};

export type SearchClassesPayload = {
  __typename?: 'searchClassesPayload';
  classes: Array<Maybe<Scalars['String']>>;
};

export type DeleteClassPayload = {
  __typename?: 'deleteClassPayload';
  res: Scalars['Boolean'];
  message: Scalars['String'];
};

export type SendMessagePayload = {
  __typename?: 'SendMessagePayload';
  res: Scalars['Boolean'];
};

export type CreateCodePayload = {
  __typename?: 'createCodePayload';
  res: Scalars['Boolean'];
  code: Scalars['String'];
};

export type GenericResponse = {
  __typename?: 'genericResponse';
  res: Scalars['Boolean'];
  message?: Maybe<Scalars['String']>;
};

export type AddFamilyMemberPayload = {
  __typename?: 'AddFamilyMemberPayload';
  res: Scalars['Boolean'];
  family: Array<UserInfoType>;
};

export type Query = {
  __typename?: 'Query';
  getMessages?: Maybe<Array<Maybe<MessageType>>>;
  getFamily?: Maybe<Array<Maybe<UserInfoType>>>;
  searchUsers: Array<Maybe<UserInfoType>>;
  searchClasses: SearchClassesPayload;
  getUser: UserInfoType;
  checkCode: GenericResponse;
};


export type QueryGetMessagesArgs = {
  chatID: Scalars['String'];
  userID: Scalars['String'];
  refresh?: Maybe<Scalars['Boolean']>;
};


export type QueryGetFamilyArgs = {
  groupID: Scalars['String'];
};


export type QuerySearchUsersArgs = {
  searchTerm: Scalars['String'];
  includeAdmin?: Maybe<Scalars['Boolean']>;
};


export type QuerySearchClassesArgs = {
  searchTerm: Scalars['String'];
};


export type QueryGetUserArgs = {
  userEmail: Scalars['String'];
};


export type QueryCheckCodeArgs = {
  email: Scalars['String'];
  code: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  login?: Maybe<LoginPayload>;
  sendMessage: SendMessagePayload;
  createUser: GenericResponse;
  addClass: AddClassPayload;
  deleteClass: DeleteClassPayload;
  createChat: GenericResponse;
  createCode: CreateCodePayload;
  addFamilyMember: AddFamilyMemberPayload;
  deleteChat: GenericResponse;
  sendEmail: GenericResponse;
  sendBugEmail: GenericResponse;
  forgotPassword: GenericResponse;
  addChatMember: GenericResponse;
  updateUser: GenericResponse;
};


export type MutationLoginArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationSendMessageArgs = {
  messages?: Maybe<Array<Maybe<MessageInput>>>;
};


export type MutationCreateUserArgs = {
  users?: Maybe<Array<Maybe<UserInputType>>>;
};


export type MutationAddClassArgs = {
  className: Scalars['String'];
};


export type MutationDeleteClassArgs = {
  className: Scalars['String'];
};


export type MutationCreateChatArgs = {
  displayName: Scalars['String'];
  className: Scalars['String'];
  tutorInfo: ChatUserInfoInput;
  userInfo: Array<ChatUserInfoInput>;
};


export type MutationCreateCodeArgs = {
  email: Scalars['String'];
};


export type MutationAddFamilyMemberArgs = {
  familyID: Scalars['String'];
  userEmails: Array<Scalars['String']>;
};


export type MutationDeleteChatArgs = {
  chatID: Scalars['String'];
};


export type MutationSendEmailArgs = {
  subject: Scalars['String'];
  body: Scalars['String'];
};


export type MutationSendBugEmailArgs = {
  user: Scalars['String'];
  body: Scalars['String'];
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String'];
};


export type MutationAddChatMemberArgs = {
  email: Scalars['String'];
  chatID: Scalars['String'];
};


export type MutationUpdateUserArgs = {
  user: UserInfoTypeInput;
};

export type Subscription = {
  __typename?: 'Subscription';
  messageReceived: MessageType;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

