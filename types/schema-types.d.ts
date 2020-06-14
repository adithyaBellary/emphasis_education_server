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
  classes?: Maybe<Array<Maybe<Chat>>>;
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
  classes: Array<Maybe<Chat>>;
  groupID: Scalars['String'];
};

export type Chat = {
  __typename?: 'Chat';
  displayName: Scalars['String'];
  className?: Maybe<Scalars['String']>;
  userEmails?: Maybe<Array<Maybe<Scalars['String']>>>;
  tutorEmail?: Maybe<Scalars['String']>;
  chatID?: Maybe<Scalars['String']>;
};

export type ClassName = {
  __typename?: 'ClassName';
  name: Scalars['String'];
};

export type CreateUserPayload = {
  __typename?: 'CreateUserPayload';
  success?: Maybe<Scalars['Boolean']>;
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

export type CreateChatPayload = {
  __typename?: 'createChatPayload';
  res: Scalars['Boolean'];
};

export type Query = {
  __typename?: 'Query';
  getMessages?: Maybe<Array<Maybe<MessageType>>>;
  getFamily?: Maybe<Array<Maybe<UserInfoType>>>;
  searchUsers: Array<Maybe<UserInfoType>>;
  searchClasses: SearchClassesPayload;
};


export type QueryGetMessagesArgs = {
  chatID?: Maybe<Scalars['String']>;
  init: Scalars['Int'];
};


export type QueryGetFamilyArgs = {
  groupID: Scalars['String'];
};


export type QuerySearchUsersArgs = {
  searchTerm: Scalars['String'];
};


export type QuerySearchClassesArgs = {
  searchTerm: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  login?: Maybe<LoginPayload>;
  sendMessage: MessagePayload;
  createUser?: Maybe<CreateUserPayload>;
  addClass: AddClassPayload;
  deleteClass: DeleteClassPayload;
  createChat: CreateChatPayload;
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
  tutorEmail: Scalars['String'];
  userEmails: Array<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  messageReceived: MessagePayload;
};

export enum CacheControlScope {
  Public = 'PUBLIC',
  Private = 'PRIVATE'
}

