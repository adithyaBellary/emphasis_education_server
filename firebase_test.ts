import * as firebase from 'firebase';
import { firebaseConfig } from './config/firebase';

const firebaseApp = firebase.initializeApp(firebaseConfig);
export const db = firebaseApp.datebase();
const auth = firebase.auth();
