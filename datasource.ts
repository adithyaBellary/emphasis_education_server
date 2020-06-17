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

  async createUser(email: string, password: string, name: string) {
    console.log('user in datasource being created', email, password, name)
    const res = await firebaseSvc.createUser(email, password, name);
    console.log('response from user creation firebase', res)
    return res;
  }

  async pushUser(name: string, email: string, userType: Permission, phoneNumber: string, groupID: string, gender: string) {
    const hash: string = MD5(email).toString();
    return await firebaseSvc.pushUser(name, email, userType, phoneNumber, hash, groupID, gender);
  }

  async getFamily(groupID: string) {
    return await firebaseSvc.getFamily(groupID);
  }

  async searchUsers(searchTerm: string) {
    return await firebaseSvc.searchUsers(searchTerm);
  }

  async searchClasses(searchTerm: string) {
    return await firebaseSvc.searchClasses(searchTerm)
  }

  async addClass(className: string) {
    return await firebaseSvc.addClass(className)
  }

  async deleteClass(className: string) {
    return await firebaseSvc.deleteClass(className)
  }

  async createChat(displayName, className: string, tutorEmail: string, userEmails: string[]) {
    return await firebaseSvc.createChat(displayName, className, tutorEmail, userEmails);
  }

  logout() {
    return firebaseSvc.logout();
  }
}

export default dataSource;
