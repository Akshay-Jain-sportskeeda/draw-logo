import * as admin from 'firebase-admin';

let adminApp: admin.app.App | undefined;

function getAdminApp() {
  if (adminApp) return adminApp;

  if (admin.apps.length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: `https://leaderboards.firebaseio.com`
    });
  } else {
    const app = admin.apps[0];
    if (app) {
      adminApp = app;
    }
  }

  return adminApp;
}

export function getAdminStorage() {
  return admin.storage(getAdminApp());
}

export function getAdminDatabase() {
  return admin.database(getAdminApp());
}

export function getAdminAuth() {
  return admin.auth(getAdminApp());
}
