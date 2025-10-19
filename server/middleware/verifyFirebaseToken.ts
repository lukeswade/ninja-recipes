import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../firebaseAdmin';

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next();
  const token = auth.split(' ')[1];
  try {
    const decoded = await verifyIdToken(token);
    // attach firebase user info to request
    (req as any).firebaseUser = decoded;
    // optionally set session userId if you want session compatibility
    if (!req.session.userId && decoded.uid) {
      req.session.userId = decoded.uid;
    }
    return next();
  } catch (err) {
    console.warn('Failed to verify firebase token (ignoring and continuing):', err);
    // Do not block the request; allow session-based auth to proceed.
    return next();
  }
}
