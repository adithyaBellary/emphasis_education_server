// import * as firebase from 'firebase';
import firebaseSvc from './firebaseSvc';
import { RESTDataSource } from 'apollo-datasource-rest';
import { SHA256, MD5 } from "crypto-js"

import { IMessage } from './types/IMessage';
import {
  Permission,
  MessageInput,
  ChatUserInfo
} from './types/schema-types';

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

  async createUser(email: string, password: string, firstName: string, lastName: string) {
    const res = await firebaseSvc.createUser(email, password, firstName, lastName);
    return res;
  }

  async pushUser(firstName: string,lastName: string, email: string, userType: Permission, phoneNumber: string, groupID: string, gender: string) {
    const hash: string = MD5(email).toString();
    return await firebaseSvc.pushUser(firstName, lastName, email, userType, phoneNumber, hash, groupID, gender);
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

  async createChat(displayName, className: string, tutorInfo: ChatUserInfo, userInfo: ChatUserInfo[]) {
    return await firebaseSvc.createChat(displayName, className, tutorInfo, userInfo);
  }

  async getUser(userEmail: string) {
    const res =  await firebaseSvc.getUser(userEmail);
    return res;
  }

  async createCode(email: string) {
    return await firebaseSvc.createCode(email);
  }

  async checkCode(email: string, code: string) {
    return await firebaseSvc.checkCode(email, code)
  }

  async updateUser(user) {
    return await firebaseSvc.updateUser(user);
  }

  async addFamilyMember(familyID, userEmails) {
    return await firebaseSvc.addFamilyMember(familyID, userEmails)
  }
}

export default dataSource;
