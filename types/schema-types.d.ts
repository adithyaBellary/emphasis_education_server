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
};

export type MessageUserInput = {
  name: Scalars['String'];
  email: Scalars['String'];
  _id?: Maybe<Scalars['String']>;
};

export type MessagePayload = {
  __typename?: 'MessagePayload';
  text: Scalars['String'];
  MessageId: Scalars['Int'];
  createdAt: Scalars['String'];
  user: MessageUser;
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
};

export type TestUser = {
  __typename?: 'TestUser';
  _id: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
  userType: Permission;
  chatIDs: Array<Maybe<Scalars['String']>>;
};

export enum Permission {
  Student = 'Student',
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
  name: Scalars['String'];
  email: Scalars['String'];
  phoneNumber: Scalars['String'];
  userType: Permission;
  groupID: Scalars['String'];
  _id: Scalars['String'];
  chatIDs: Array<Maybe<Scalars['String']>>;
};

export type UserInputType = {
  name: Scalars['String'];
  email: Scalars['String'];
  password: Scalars['String'];
  userType: Permission;
  phoneNumber: Scalars['String'];
};

export type UserInfoType = {
  __typename?: 'UserInfoType';
  name: Scalars['String'];
  email: Scalars['String'];
  phoneNumber: Scalars['String'];
  userType: Permission;
  _id: Scalars['String'];
  chatIDs: Array<Maybe<Scalars['String']>>;
  groupID: Scalars['String'];
};

export type CreateUserPayload = {
  __typename?: 'CreateUserPayload';
  success?: Maybe<Scalars['Boolean']>;
};

export type Query = {
  __typename?: 'Query';
  getMessages?: Maybe<Array<Maybe<MessageType>>>;
  getUserID?: Maybe<Scalars['String']>;
  getUser?: Maybe<TestUser>;
  getFamily?: Maybe<Array<Maybe<UserInfoType>>>;
  getClasses?: Maybe<Array<Maybe<Scalars['String']>>>;
  queryUserID?: Maybe<Scalars['Int']>;
  searchUsers: Array<Maybe<UserInfoType>>;
};


export type QueryGetMessagesArgs = {
  chatID?: Maybe<Scalars['String']>;
  init: Scalars['Int'];
};


export type QueryGetUserArgs = {
  id: Scalars['String'];
};


export type QueryGetFamilyArgs = {
  groupID: Scalars['String'];
};


export type QueryQueryUserIdArgs = {
  email?: Maybe<Scalars['String']>;
};


export type QuerySearchUsersArgs = {
  searchTerm: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  login?: Maybe<LoginPayload>;
  sendMessage: MessagePayload;
  createUser?: Maybe<CreateUserPayload>;
  addClass?: Maybe<Scalars['Boolean']>;
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
  subject: Scalars['String'];
};

export type Subscription = {
  __typename?: 'Subscription';
  messageReceived: MessagePayload;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

