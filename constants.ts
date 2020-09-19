export const MESSAGE_RECEIVED_EVENT: string = 'messageReceived';
export const NUM_FETCH_MESSAGES: number = 15;
export const CODE_LENGTH: number = 6;

export const MESSAGE_REF_BASE: string = 'Messages';
export const User_REF_BASE: string = 'Users';
export const NUM_MESSAGES_BASE: string = 'NumberOfMessages';
export const FAMILY_REF_BASE: string = 'Family';
export const CLASS_REF_BASE: string = 'Classes';
export const CHAT_REF_BASE: string = 'Chats';
export const CODES_REF_BASE: string = 'Codes';

const SHWETA_EMAIL: string = process.env.SHWETA_EMAIL;
const SAKTHI_EMAIL: string = process.env.SAKTHI_EMAIL;

export const ADMIN_EMAILS: string[] = [
  SHWETA_EMAIL,
  SAKTHI_EMAIL
];

export const ADMIN_EMAIL = process.env.EMPHASIS_EDUCATION_EMAIL;
export const SERVICE_EMAIL = process.env.SERVICE_EMAIL;
