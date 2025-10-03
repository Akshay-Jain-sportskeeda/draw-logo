import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getDatabase } from 'firebase-admin/database';

let adminApp: App;

function getAdminApp() {
  if (adminApp) return adminApp;

  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    adminApp = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: `https://leaderboards.firebaseio.com`
    });
  } else {
    adminApp = getApps()[0];
  }

  return adminApp;
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

export function getAdminDatabase() {
  return getDatabase(getAdminApp());
}
