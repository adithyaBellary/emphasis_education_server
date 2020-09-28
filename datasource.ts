import firebaseSvc from './firebaseSvc';
import { RESTDataSource } from 'apollo-datasource-rest';
import { MD5 } from "crypto-js"

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

  async pushUser(
    firstName: string,
    lastName: string,
    email: string,
    userType: Permission,
    phoneNumber: string,
    groupID: string,
    gender: string,
    dob: string
  ) {
    const hash: string = MD5(email).toString();
    return await firebaseSvc.pushUser(firstName, lastName, email, userType, phoneNumber, hash, groupID, gender, dob);
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

  async deleteChat(chatID: string) {
    return await firebaseSvc.deleteChat(chatID);
  }

  async sendEmail(subject: string, body: string) {
    return await firebaseSvc.sendEmail(subject, body)
  }

  async sendBugEmail(user: string, body: string) {
    return await firebaseSvc.sendBugEmail(user, body)
  }

  async forgotPassword(email: string) {
    return await firebaseSvc.forgotPassword(email);
  }

  async addChatMember(email: string, chatID: string) {
    return await firebaseSvc.addChatMember(email, chatID)
  }
}

export default dataSource;
