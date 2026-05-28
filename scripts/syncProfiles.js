/**
 * Profile CDN Sync Script
 * 
 * This script fetches all user profiles from Firebase and generates
 * static JSON files for instant CDN loading.
 * 
 * Run before build: npm run sync-profiles
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// For local development, use service account
// For CI/CD, use environment variables
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
        console.log('   Option 1: Place serviceAccountKey.json in scripts/ folder');
        console.log('   Option 2: Set FIREBASE_SERVICE_ACCOUNT environment variable');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
}

const db = getFirestore(app);

// Output directory for profile JSONs
const OUTPUT_DIR = path.join(__dirname, '../public/profiles');

async function syncProfiles() {
    console.log('🚀 Starting profile sync...\n');
    const redirectMap = new Map();

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    let syncedCount = 0;
    let errorCount = 0;

    try {
        // Fetch all users
        const usersSnapshot = await db.collection('users').get();
        console.log(`📦 Found ${usersSnapshot.size} user profiles\n`);

        for (const doc of usersSnapshot.docs) {
            try {
                const userData = doc.data();
                const username = userData.username?.toLowerCase();

                if (!username) {
                    console.log(`⏭️  Skipping ${doc.id} - no username`);
                    continue;
                }

                const isElite = userData.nEliteRedirectEnabled || false;
                redirectMap.set(username, isElite);

                // Extract critical data for instant loading
                const cdnProfile = {
                    username: username,
                    nEliteRedirectEnabled: isElite,
                    profileType: userData.profileType || 'personal',
                    displayName: userData.displayName || '',
                    mobileNumber: userData.mobileNumber || '',
                    photoURL: userData.photoURL || '',
                    themeId: userData.themeId || 'modern-gradient',
                    themeSettings: {
                        layoutStyle: userData.themeSettings?.layoutStyle || 'default',
                        primaryColor: userData.themeSettings?.primaryColor || '#4f46e5',
                    }
                };

                // Write JSON file
                const filePath = path.join(OUTPUT_DIR, `${username}.json`);
                fs.writeFileSync(filePath, JSON.stringify(cdnProfile, null, 2));

                console.log(`✅ ${username}.json`);
                syncedCount++;
            } catch (err) {
                console.error(`❌ Error processing ${doc.id}:`, err.message);
                errorCount++;
            }
        }

        // Also fetch from profiles collection if exists
        const profilesSnapshot = await db.collection('profiles').get();
        if (profilesSnapshot.size > 0) {
            console.log(`\n📦 Found ${profilesSnapshot.size} additional profiles\n`);

            for (const doc of profilesSnapshot.docs) {
                try {
                    const profileData = doc.data();
                    const username = profileData.username?.toLowerCase();

                    if (!username) continue;

                    const isElite = profileData.nEliteRedirectEnabled || false;
                    redirectMap.set(username, isElite);

                    // Skip if already synced from users collection (avoid redundant writes but keep redirect registration)
                    const filePath = path.join(OUTPUT_DIR, `${username}.json`);
                    if (fs.existsSync(filePath)) continue;

                    const cdnProfile = {
                        username: username,
                        nEliteRedirectEnabled: isElite,
                        profileType: profileData.profileType || 'personal',
                        displayName: profileData.displayName || '',
                        mobileNumber: profileData.mobileNumber || '',
                        photoURL: profileData.photoURL || '',
                        themeId: profileData.themeId || 'modern-gradient',
                        themeSettings: {
                            layoutStyle: profileData.themeSettings?.layoutStyle || 'default',
                            primaryColor: profileData.themeSettings?.primaryColor || '#4f46e5',
                        }
                    };

                    fs.writeFileSync(filePath, JSON.stringify(cdnProfile, null, 2));
                    console.log(`✅ ${username}.json`);
                    syncedCount++;
                } catch (err) {
                    errorCount++;
                }
            }
        }

        // Also fetch from the NEW isolated public_profiles collection
        const publicProfilesSnapshot = await db.collection('public_profiles').get();
        if (publicProfilesSnapshot.size > 0) {
            console.log(`\n📦 Found ${publicProfilesSnapshot.size} isolated public profiles\n`);

            for (const doc of publicProfilesSnapshot.docs) {
                try {
                    const profileData = doc.data();
                    const username = profileData.username?.toLowerCase();

                    if (!username) continue;

                    const isElite = profileData.nEliteRedirectEnabled || false;
                    redirectMap.set(username, isElite);

                    // OVERWRITE if it exists, as public_profiles is the source of truth
                    const filePath = path.join(OUTPUT_DIR, `${username}.json`);

                    const cdnProfile = {
                        username: username,
                        nEliteRedirectEnabled: isElite,
                        profileType: profileData.profileType || 'personal',
                        displayName: profileData.displayName || '',
                        mobileNumber: profileData.mobileNumber || '',
                        photoURL: profileData.photoURL || '',
                        themeId: profileData.themeId || 'modern-gradient',
                        themeSettings: {
                            layoutStyle: profileData.themeSettings?.layoutStyle || 'default',
                            primaryColor: profileData.themeSettings?.primaryColor || '#4f46e5',
                        }
                    };

                    fs.writeFileSync(filePath, JSON.stringify(cdnProfile, null, 2));
                    console.log(`✅ ${username}.json (from public_profiles)`);
                    syncedCount++;
                } catch (err) {
                    errorCount++;
                }
            }
        }

        // Write dynamic _redirects file
        const redirectsPath = path.join(__dirname, '../public/_redirects');
        let redirectsContent = '# nElite member instant redirects\n';
        let redirectRulesCount = 0;
        for (const [uname, isElite] of redirectMap.entries()) {
            if (isElite) {
                redirectsContent += `/${uname} https://ncard.neoays.com/${uname} 302\n`;
                redirectRulesCount++;
            }
        }
        redirectsContent += '\n# SPA Fallback Route\n/* /index.html 200\n';
        fs.writeFileSync(redirectsPath, redirectsContent);
        console.log(`\n📝 Generated public/_redirects with ${redirectRulesCount} elite redirect rules.`);

    } catch (error) {
        console.error('❌ Failed to fetch profiles:', error.message);
        process.exit(1);
    }

    console.log('\n' + '='.repeat(40));
    console.log(`✅ Synced: ${syncedCount} profiles`);
    if (errorCount > 0) {
        console.log(`❌ Errors: ${errorCount}`);
    }
    console.log('='.repeat(40));
    console.log('\n📁 Output: public/profiles/');
    console.log('🚀 Run "npm run build" to include in deployment\n');
}

syncProfiles().then(() => process.exit(0));
