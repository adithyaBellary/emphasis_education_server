import { IUser } from './IUser';

export interface IMessagePayload {
  text: string;
  MessageId: number;
  createdAt: string;
  user: IUser;
}