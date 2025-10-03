import * as admin from 'firebase-admin';

let adminApp: admin.app.App | undefined;

function getAdminApp() {
  if (adminApp) return adminApp;

  if (admin.apps.length === 0) {
    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for Firebase Admin');
    }

    // Handle service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: getFormattedPrivateKey(),
        };

    // Validate that we have the required credentials
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error(
        'Missing required Firebase Admin credentials. Please ensure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set in your environment variables.'
      );
    }

    // Determine database URL
    const databaseURL = process.env.FIREBASE_DATABASE_URL || 
      `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`;

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: databaseURL
    });
  } else {
    const app = admin.apps[0];
    if (app) {
      adminApp = app;
    }
  }

  return adminApp;
}

function getFormattedPrivateKey(): string {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY is missing. Please add it to your .env file.\n' +
      'Format: FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_CONTENT\\n-----END PRIVATE KEY-----\\n"'
    );
  }

  // Replace escaped newlines with actual newlines
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  
  // Validate that the key has the proper PEM format
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----') || !formattedKey.includes('-----END PRIVATE KEY-----')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY appears to be malformed. It should start with "-----BEGIN PRIVATE KEY-----" and end with "-----END PRIVATE KEY-----".\n' +
      'Make sure to escape newlines as \\n in your .env file.'
    );
  }

  return formattedKey;
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
