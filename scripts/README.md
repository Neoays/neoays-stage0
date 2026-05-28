# Profile Sync Setup

This script auto-generates static JSON files for instant profile loading.

## One-Time Setup

1. **Get Firebase Service Account Key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `scripts/serviceAccountKey.json`

2. **Add to .gitignore:**
   ```
   scripts/serviceAccountKey.json
   ```

## Usage

Profiles auto-sync when you deploy:
```bash
npm run deploy
```

This runs:
1. `npm run sync-profiles` - Fetches all users from Firebase, generates JSON files
2. `npm run build` - Creates production build with JSON files
3. `firebase deploy` - Deploys to Firebase Hosting

## Manual Sync (Optional)

```bash
npm run sync-profiles
```

## Output

Generated files: `public/profiles/{username}.json`

Each file contains:
```json
{
  "displayName": "User Name",
  "mobileNumber": "+971...",
  "photoURL": "...",
  "themeId": "modern-gradient",
  "themeSettings": {
    "layoutStyle": "default",
    "primaryColor": "#4f46e5"
  }
}
```

These files are served from Firebase CDN with ~50ms load time!
