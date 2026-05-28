/**
 * Profile Pre-Renderer for Social Media Sharing
 * 
 * Generates static HTML files with correct OG meta tags for each profile.
 * Social media crawlers (WhatsApp, Facebook, Twitter) read these tags
 * to show the correct company name, photo, and bio in link previews.
 * 
 * Run AFTER build: npm run postbuild
 * 
 * For each profile, creates: build/{username}/index.html
 * - Contains correct OG meta tags
 * - Includes a JS redirect to load the full SPA
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// ============================================================
// Firebase Init (reuses same pattern as syncProfiles.js)
// ============================================================
let app;
try {
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        app = initializeApp({
            credential: cert(serviceAccount)
        }, 'prerender'); // Use unique name to avoid conflict with syncProfiles
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        app = initializeApp({
            credential: cert(serviceAccount)
        }, 'prerender');
    } else {
        console.error('❌ No Firebase credentials found!');
        console.log('   Place serviceAccountKey.json in scripts/ folder');
        process.exit(1);
    }
} catch (error) {
    // If app already exists (e.g., running after syncProfiles), reuse it
    if (error.code === 'app/duplicate-app') {
        const { getApp } = require('firebase-admin/app');
        app = getApp('prerender');
    } else {
        console.error('❌ Failed to initialize Firebase:', error.message);
        process.exit(1);
    }
}

const db = getFirestore(app);

// Output directory (the build folder)
const BUILD_DIR = path.join(__dirname, '../build');
const SITE_URL = 'https://neoays.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/og-image.jpg`;

// ============================================================
// Generate HTML with OG tags for a single profile
// ============================================================
function generateProfileHTML(profile) {
    const title = profile.displayName || profile.username || 'Digital Profile';
    const description = profile.bio || profile.designation
        || `Connect with ${title} on Neoays`;
    const image = profile.photoURL || DEFAULT_OG_IMAGE;
    const url = `${SITE_URL}/${profile.username}`;
    const category = profile.category || profile.businessCategory || '';

    const isElite = profile.nEliteRedirectEnabled === true;
    const redirectTarget = isElite 
        ? `https://ncard.neoays.com/${profile.username}` 
        : `${SITE_URL}/#/${profile.username}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary Meta Tags -->
    <title>${escapeHtml(title)} | Neoays</title>
    <meta name="description" content="${escapeHtml(description)}" />

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:site_name" content="Neoays" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />

    <!-- Profile Meta -->
    ${category ? `<meta property="og:profile:username" content="${escapeHtml(profile.username)}" />` : ''}

    <!-- Redirect to SPA or Elite Target -->
    <meta http-equiv="refresh" content="0;url=${redirectTarget}" />
    <link rel="canonical" href="${url}" />
    
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #334155; }
        .card { text-align: center; padding: 2rem; }
        .card img { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; }
        .card h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
        .card p { font-size: 0.875rem; color: #64748b; margin: 0 0 1rem; }
        .card a { color: #4f46e5; text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
    <div class="card">
        ${image !== DEFAULT_OG_IMAGE ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" />` : ''}
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <a href="${redirectTarget}">${isElite ? 'Redirecting to Card...' : 'View Profile →'}</a>
    </div>
    <script>
        // Immediate redirect for JS-enabled browsers
        window.location.replace("${redirectTarget}");
    </script>
</body>
</html>`;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================
// Main
// ============================================================
async function prerenderProfiles() {
    console.log('🎨 Starting OG meta tag pre-rendering...\n');

    if (!fs.existsSync(BUILD_DIR)) {
        console.error('❌ Build directory not found! Run "npm run build" first.');
        process.exit(1);
    }

    let renderedCount = 0;
    let errorCount = 0;

    // Process users collection
    try {
        const usersSnapshot = await db.collection('users').get();
        console.log(`📦 Processing ${usersSnapshot.size} user profiles\n`);

        for (const doc of usersSnapshot.docs) {
            try {
                const data = doc.data();
                const username = data.username?.toLowerCase();
                if (!username) continue;

                const profileDir = path.join(BUILD_DIR, username);
                if (!fs.existsSync(profileDir)) {
                    fs.mkdirSync(profileDir, { recursive: true });
                }

                const html = generateProfileHTML({ ...data, username });
                fs.writeFileSync(path.join(profileDir, 'index.html'), html);
                console.log(`✅ ${username}/index.html`);
                renderedCount++;
            } catch (err) {
                console.error(`❌ Error: ${doc.id}:`, err.message);
                errorCount++;
            }
        }
    } catch (error) {
        console.error('❌ Failed to fetch users:', error.message);
    }

    // Process profiles collection
    try {
        const profilesSnapshot = await db.collection('profiles').get();
        if (profilesSnapshot.size > 0) {
            console.log(`\n📦 Processing ${profilesSnapshot.size} business profiles\n`);

            for (const doc of profilesSnapshot.docs) {
                try {
                    const data = doc.data();
                    const username = data.username?.toLowerCase();
                    if (!username) continue;

                    const profileDir = path.join(BUILD_DIR, username);
                    // Always overwrite with profiles collection (business data takes priority)
                    if (!fs.existsSync(profileDir)) {
                        fs.mkdirSync(profileDir, { recursive: true });
                    }

                    const html = generateProfileHTML({ ...data, username });
                    fs.writeFileSync(path.join(profileDir, 'index.html'), html);
                    console.log(`✅ ${username}/index.html (business)`);
                    renderedCount++;
                } catch (err) {
                    console.error(`❌ Error: ${doc.id}:`, err.message);
                    errorCount++;
                }
            }
        }
    } catch (error) {
        console.error('❌ Failed to fetch profiles:', error.message);
    }

    console.log('\n' + '='.repeat(40));
    console.log(`🎨 Pre-rendered: ${renderedCount} profile pages`);
    if (errorCount > 0) {
        console.log(`❌ Errors: ${errorCount}`);
    }
    console.log('='.repeat(40));
    console.log('\n📁 Output: build/{username}/index.html');
    console.log('🚀 Ready for deployment!\n');
}

prerenderProfiles().then(() => process.exit(0));
