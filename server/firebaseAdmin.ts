import admin from 'firebase-admin';

let initialized = false;

export function initFirebaseAdminFromEnv() {
  if (initialized) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(svc),
        projectId: svc.project_id || process.env.FIREBASE_PROJECT_ID,
      });
      initialized = true;
      // eslint-disable-next-line no-console
      console.log('Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // If GOOGLE_APPLICATION_CREDENTIALS is set, firebase-admin will pick it up automatically
    try {
      admin.initializeApp();
      initialized = true;
      // eslint-disable-next-line no-console
      console.log('Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize firebase-admin:', e);
    }
  }
}

export async function verifyIdToken(idToken: string) {
  initFirebaseAdminFromEnv();
  if (!initialized) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.auth().verifyIdToken(idToken);
}

export default admin;
