import { IUser } from './IUser';

export interface IMessage {
  _id: number;
  text: string;
  user: IUser;
  chatID: string;
}
