require('dotenv').config(); // Load if you have a .env file locally
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (Same logic as syncProfiles.js)
let app;
try {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        app = initializeApp({
            credential: cert(serviceAccount)
        });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        app = initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        console.error('❌ No Firebase credentials found!');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
}

const db = getFirestore(app);

const publicFields = [
    'displayName', 'bio', 'businessCategory', 'category', 'location', 'designation',
    'companyId', 'worksAt', 'worksAtDisplay', 'links', 'gallery', 'themeSettings', 'themeId', 'isPublic',
    'connectEnabled', 'saveContactEnabled', 'gameEnabled', 'profileType', "welcomeMessage", "vouchers",
    'username', 'photoURL', 'coverURL'
];

async function migrateToPublicProfiles() {
    console.log('🚀 Starting Data Migration: users -> public_profiles\n');
    let migratedCount = 0;

    try {
        const usersSnapshot = await db.collection('users').get();
        console.log(`📦 Found ${usersSnapshot.size} users to process.`);

        const batch = db.batch();
        let batchCount = 0;

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();

            // Extract only the public data
            const publicData = {};
            let hasPublicData = false;

            for (const field of publicFields) {
                if (userData[field] !== undefined) {
                    publicData[field] = userData[field];
                    hasPublicData = true;
                }
            }

            if (hasPublicData && userData.username) {
                const publicRef = db.collection('public_profiles').doc(doc.id);
                batch.set(publicRef, publicData, { merge: true });
                batchCount++;
                migratedCount++;

                if (batchCount === 500) {
                    await batch.commit();
                    console.log(`✅ Committed batch of 500 records...`);
                    batchCount = 0;
                }
            }
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`✅ Committed final batch of ${batchCount} records...`);
        }

        console.log(`\n🎉 Migration Complete! Successfully migrated ${migratedCount} profiles.`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrateToPublicProfiles().then(() => process.exit(0));
