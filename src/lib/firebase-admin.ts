import * as admin from 'firebase-admin';

let adminApp: admin.app.App | undefined;

function getAdminApp() {
  if (adminApp) return adminApp;

  console.log('=== FIREBASE ADMIN INITIALIZATION DEBUG ===');
  console.log('Existing admin apps count:', admin.apps.length);
  
  if (admin.apps.length === 0) {
    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      console.log('ERROR: NEXT_PUBLIC_FIREBASE_PROJECT_ID missing');
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for Firebase Admin');
    }

    console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log('Client Email exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log('Service Account JSON exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Handle service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: getFormattedPrivateKey(),
        };

    console.log('Service account structure:');
    console.log('- projectId:', serviceAccount.projectId);
    console.log('- clientEmail:', serviceAccount.clientEmail);
    console.log('- privateKey length:', serviceAccount.privateKey?.length || 0);
    console.log('- privateKey starts with BEGIN:', serviceAccount.privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'));
    
    // Validate that we have the required credentials
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      console.log('ERROR: Missing required service account credentials');
      console.log('Missing projectId:', !serviceAccount.projectId);
      console.log('Missing clientEmail:', !serviceAccount.clientEmail);
      console.log('Missing privateKey:', !serviceAccount.privateKey);
      throw new Error(
        'Missing required Firebase Admin credentials. Please ensure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set in your environment variables.'
      );
    }

    // Determine database URL
    const databaseURL = process.env.FIREBASE_DATABASE_URL || 
      `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`;

    console.log('Database URL:', databaseURL);
    console.log('Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    
    console.log('Attempting to initialize Firebase Admin...');
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: databaseURL
    });
    
    console.log('Firebase Admin initialized successfully');
  } else {
    console.log('Using existing Firebase Admin app');
    const app = admin.apps[0];
    if (app) {
      adminApp = app;
    }
  }

  console.log('=== END FIREBASE ADMIN INITIALIZATION DEBUG ===');
  return adminApp;
}

function getFormattedPrivateKey(): string {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  console.log('=== FIREBASE PRIVATE KEY DEBUG ===');
  console.log('Raw FIREBASE_PRIVATE_KEY exists:', !!privateKey);
  console.log('Raw FIREBASE_PRIVATE_KEY length:', privateKey?.length || 0);
  
  if (!privateKey) {
    console.log('ERROR: FIREBASE_PRIVATE_KEY is missing');
    throw new Error(
      'FIREBASE_PRIVATE_KEY is missing. Please add it to your .env file.\n' +
      'Format: FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_CONTENT\\n-----END PRIVATE KEY-----\\n"'
    );
  }

  console.log('Raw key first 50 chars:', privateKey.substring(0, 50));
  console.log('Raw key last 50 chars:', privateKey.substring(privateKey.length - 50));
  console.log('Raw key contains \\n sequences:', privateKey.includes('\\n'));
  
  // Replace escaped newlines with actual newlines
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  
  console.log('After \\n replacement:');
  console.log('Formatted key length:', formattedKey.length);
  console.log('Formatted key first 50 chars:', formattedKey.substring(0, 50));
  console.log('Formatted key last 50 chars:', formattedKey.substring(formattedKey.length - 50));
  console.log('Contains actual newlines:', formattedKey.includes('\n'));
  
  // Validate that the key has the proper PEM format
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----') || !formattedKey.includes('-----END PRIVATE KEY-----')) {
    console.log('ERROR: PEM format validation failed');
    console.log('Has BEGIN marker:', formattedKey.includes('-----BEGIN PRIVATE KEY-----'));
    console.log('Has END marker:', formattedKey.includes('-----END PRIVATE KEY-----'));
    throw new Error(
      'FIREBASE_PRIVATE_KEY appears to be malformed. It should start with "-----BEGIN PRIVATE KEY-----" and end with "-----END PRIVATE KEY-----".\n' +
      'Make sure to escape newlines as \\n in your .env file.'
    );
  }

  console.log('PEM format validation passed');
  console.log('=== END FIREBASE PRIVATE KEY DEBUG ===');
  
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
