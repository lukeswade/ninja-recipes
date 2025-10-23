import admin from 'firebase-admin';
import { initFirebaseAdminFromEnv } from './firebaseAdmin.js';

initFirebaseAdminFromEnv();

export const db = admin.firestore();
