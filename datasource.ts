// import * as firebase from 'firebase';
import firebaseSvc from './firebaseSvc';
import { RESTDataSource } from 'apollo-datasource-rest';
import { SHA256, MD5 } from "crypto-js"

import { IMessage } from './types/IMessage';
import { Permission, MessageInput } from './types/schema-types';

class dataSource extends RESTDataSource {
  constructor() {
    super();
  }

  async getMessages(chatID, init) {
    return  await firebaseSvc.getMessages(chatID, init);
  }

  async login(user) {
    return await firebaseSvc.login(user)
  }

  async sendMessages(message: MessageInput[]) {
    return await firebaseSvc.send(message)
  }

  createUser(email: string, password: string, name: string) {
    console.log('user in datasource being created', email, password, name)
    firebaseSvc.createUser(email, password, name);
  }

  async pushUser(name: string, email: string, userType: Permission, phoneNumber: string, groupID: string) {
    const hash: string = MD5(email).toString();
    await firebaseSvc.pushUser(name, email, userType, phoneNumber, hash, groupID);
  }

  async getFamily(groupID: string) {
    return await firebaseSvc.getFamily(groupID);
  }

  async searchUsers(searchTerm: string) {
    return await firebaseSvc.searchUsers(searchTerm);
  }
}

export default dataSource;
