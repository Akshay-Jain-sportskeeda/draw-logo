/**
 * Migration Script: Reorganize Firebase Storage from user-based to date-based folders
 *
 * This script:
 * 1. Lists all files in creative-remix/{userId}/ folders
 * 2. Downloads each file
 * 3. Extracts timestamp from filename
 * 4. Calculates the submission date from timestamp
 * 5. Re-uploads file to creative-remix/{YYYY-MM-DD}/{userId}-{timestamp}-{random}.png
 * 6. Updates the drawingUrl in Firestore documents
 * 7. Keeps original files as backup (manual deletion after verification)
 *
 * Usage: node scripts/migrate-storage-structure.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();
const firestore = admin.firestore();

/**
 * Extract timestamp from filename
 * Format: {timestamp}-{randomString}.png
 */
function extractTimestampFromFilename(filename) {
  const match = filename.match(/(\d{13})-/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Convert timestamp to YYYY-MM-DD format (UTC)
 */
function getDateFromTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate new path for file
 */
function generateNewPath(oldPath) {
  // Extract userId and filename from old path
  // Format: creative-remix/{userId}/{timestamp}-{random}.png
  const parts = oldPath.split('/');
  if (parts.length !== 3 || parts[0] !== 'creative-remix') {
    console.warn(`Skipping file with unexpected path format: ${oldPath}`);
    return null;
  }

  const userId = parts[1];
  const filename = parts[2];

  // Extract timestamp from filename
  const timestamp = extractTimestampFromFilename(filename);
  if (!timestamp) {
    console.warn(`Could not extract timestamp from filename: ${filename}`);
    return null;
  }

  // Generate date-based path
  const dateString = getDateFromTimestamp(timestamp);
  const newPath = `creative-remix/${dateString}/${userId}-${filename}`;

  return { newPath, dateString, userId, filename, timestamp };
}

/**
 * Main migration function
 */
async function migrateStorage() {
  console.log('Starting storage migration...\n');

  try {
    // Step 1: List all files in creative-remix folder
    console.log('Step 1: Listing all files in creative-remix folder...');
    const [files] = await bucket.getFiles({ prefix: 'creative-remix/' });

    console.log(`Found ${files.length} files to process\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const results = [];

    // Step 2: Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const oldPath = file.name;

      console.log(`[${i + 1}/${files.length}] Processing: ${oldPath}`);

      // Skip if already in date-based format
      if (oldPath.match(/creative-remix\/\d{4}-\d{2}-\d{2}\//)) {
        console.log('  ✓ Already in date-based format, skipping');
        skipCount++;
        continue;
      }

      // Generate new path
      const pathInfo = generateNewPath(oldPath);
      if (!pathInfo) {
        console.log('  ✗ Could not generate new path, skipping');
        skipCount++;
        continue;
      }

      const { newPath, dateString } = pathInfo;

      try {
        // Check if new file already exists
        const [newFileExists] = await bucket.file(newPath).exists();
        if (newFileExists) {
          console.log(`  ✓ File already exists at new location: ${newPath}`);
          results.push({ oldPath, newPath, status: 'already_exists' });
          skipCount++;
          continue;
        }

        // Copy file to new location
        console.log(`  → Copying to: ${newPath}`);
        await file.copy(bucket.file(newPath));

        // Make the new file publicly accessible
        await bucket.file(newPath).makePublic();

        console.log(`  ✓ Successfully copied to date-based folder: ${dateString}`);

        results.push({
          oldPath,
          newPath,
          status: 'success',
          dateString
        });
        successCount++;

      } catch (error) {
        console.error(`  ✗ Error processing file: ${error.message}`);
        results.push({ oldPath, newPath, status: 'error', error: error.message });
        errorCount++;
      }
    }

    // Step 3: Update Firestore documents
    console.log('\n\nStep 3: Updating Firestore documents...');
    const updatedDocs = await updateFirestoreUrls(results.filter(r => r.status === 'success'));

    // Print summary
    console.log('\n\n=== Migration Summary ===');
    console.log(`Total files processed: ${files.length}`);
    console.log(`✓ Successfully migrated: ${successCount}`);
    console.log(`→ Skipped: ${skipCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`📝 Firestore documents updated: ${updatedDocs}`);
    console.log('\n⚠️  IMPORTANT: Original files have NOT been deleted.');
    console.log('   Please verify the migration before manually deleting old files.');
    console.log('   Old files are in: creative-remix/{userId}/ folders');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Update Firestore document URLs
 */
async function updateFirestoreUrls(successfulMigrations) {
  const submissionsRef = firestore.collection('nfl-draw-logo');
  let updateCount = 0;

  console.log(`Updating ${successfulMigrations.length} documents...`);

  for (const migration of successfulMigrations) {
    try {
      // Find documents with old URL
      const oldUrl = `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/${migration.oldPath}`;
      const newUrl = `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/${migration.newPath}`;

      const snapshot = await submissionsRef
        .where('drawingUrl', '==', oldUrl)
        .get();

      if (snapshot.empty) {
        // Try with encoded URL
        const encodedOldUrl = oldUrl.replace(/ /g, '%20');
        const encodedSnapshot = await submissionsRef
          .where('drawingUrl', '==', encodedOldUrl)
          .get();

        if (!encodedSnapshot.empty) {
          for (const doc of encodedSnapshot.docs) {
            await doc.ref.update({ drawingUrl: newUrl });
            console.log(`  ✓ Updated document ${doc.id}`);
            updateCount++;
          }
        }
      } else {
        for (const doc of snapshot.docs) {
          await doc.ref.update({ drawingUrl: newUrl });
          console.log(`  ✓ Updated document ${doc.id}`);
          updateCount++;
        }
      }
    } catch (error) {
      console.error(`  ✗ Error updating Firestore for ${migration.oldPath}: ${error.message}`);
    }
  }

  return updateCount;
}

// Run migration
migrateStorage()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
