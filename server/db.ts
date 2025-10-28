import admin from 'firebase-admin';
import { initFirebaseAdminFromEnv } from './firebaseAdmin.js';

let _db: any = null;

function ensureDb() {
	if (_db) return _db;
	// Try to initialize the admin SDK from environment and create firestore
	try {
		initFirebaseAdminFromEnv();
		_db = admin.firestore();
		return _db;
	} catch (err) {
		// Leave _db null; accessing code will get a clear error when they try to use it
		return null;
	}
}

// Export a proxy so existing code can use `db.collection(...)` without changing callers.
export const db: any = new Proxy({}, {
	get(_target, prop: string | symbol) {
		const real = ensureDb();
		if (!real) {
			throw new Error('Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS.');
		}
		const val = (real as any)[prop as any];
		if (typeof val === 'function') return val.bind(real);
		return val;
	}
});
