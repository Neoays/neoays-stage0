# Neoays - Digital Profile Platform

NFC-powered digital profiles and business cards with instant sharing.

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm start

# Production build & deploy
npm run deploy
```

## Features

### 🎯 Core Features
- **Digital Profiles** - Personal, Business, Professional profile types
- **NFC Integration** - Tap to share with NFC cards
- **QR Code Sharing** - Generate and share QR codes
- **Custom Themes** - Multiple layouts (Lumia, Bento, Glass, Dark Elegance, Modern Gradient)
- **Color Customization** - User-defined primary colors

### 📱 Profile Components
- **Display Name** - Editable name
- **Bio** - Short description (200 chars)
- **Designation/Title** - Professional title
- **Location** - Geographic location
- **Works At** - Link to company profiles
- **Photo & Cover** - Profile and cover images
- **Gallery** - Photo gallery support
- **Links** - Social media, website, contact links

### 🚀 Contact Features
- **WhatsApp Button** - Instant WhatsApp contact
- **Save Contact** - Download vCard
- **Connect Button** - Save to connections
- **Direct Call** - Click to call

### ⚡ Performance
- **CDN Static Profiles** - ~50ms instant loading
- **Theme-Aware Skeletons** - Matching placeholder during load
- **LocalStorage Cache** - 1-hour client cache
- **Lazy Loading** - Components load on demand

### 🎨 Layouts
1. **Modern Gradient** - Default gradient background
2. **Lumia Tiles** - Colorful tile grid
3. **Bento Grid** - Modern card layout
4. **Glass Floating** - Glassmorphism effect
5. **Dark Elegance** - Premium dark theme

### 🔧 Dashboard (nProducts)
- **nProfile** - Profile management
- **nWallet** - Digital wallet (coming soon)
- **nClaim** - Voucher claiming
- **nShop** - Product catalog
- **nMenu** - Restaurant menus
- **nReview** - Reviews (coming soon)

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── layouts/        # Theme layout components
│   ├── ProfileSkeleton.tsx
│   ├── WhatsAppButton.tsx
│   └── ...
├── features/           # Feature modules
│   ├── nProfile/       # Profile management
│   ├── nClaim/         # Voucher system
│   ├── nShop/          # Shop/catalog
│   └── dashboard/      # Dashboard components
├── page_views/         # Route pages
├── services/           # Firebase config
├── contexts/           # React contexts
├── hooks/              # Custom hooks
└── types/              # TypeScript types
```

## Deployment

### Prerequisites
1. Firebase project setup
2. Service account key for profile sync

### Setup

1. **Firebase credentials:**
   ```bash
   # Get service account from Firebase Console
   # Save as scripts/serviceAccountKey.json
   ```

2. **Environment:**
   Firebase config is in `src/services/firebaseConfig.ts`

3. **Deploy:**
   ```bash
   npm run deploy
   ```

   This automatically:
   - Syncs all profiles from Firebase → static JSON
   - Builds production bundle
   - Deploys to Firebase Hosting

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Development server |
| `npm run build` | Production build |
| `npm run deploy` | Full deploy (sync + build + deploy) |
| `npm run sync-profiles` | Sync profiles to static JSON |
| `npm test` | Run tests |

## Tech Stack

- **Frontend:** React 18, TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Firestore, Auth, Hosting, Storage)
- **Build:** Create React App

## Environment

- Node.js 18+
- npm 9+
- Firebase CLI

---

**Neoays Private Limited** | [neoays.com](https://neoays.com)
