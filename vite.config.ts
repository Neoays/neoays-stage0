import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'service-worker.js',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png', 'robots.txt'],
      manifest: {
        name: 'Neoays',
        short_name: 'Neoays',
        description: 'Smart NFC Tools, Websites & Branding Solutions',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'logo192.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Cache-first for profile JSON files (instant repeat visits)
        runtimeCaching: [
          {
            urlPattern: /\/profiles\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'profile-cdn-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],

  build: {
    outDir: 'build',
    target: 'es2015',
    // Raise warning threshold (we know some chunks are large)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ── Firebase SDK (large, shared everywhere) ────────────────
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }

          // ── Heavy 3D / Globe (only on Home page) ──────────────────
          if (
            id.includes('three') ||
            id.includes('react-globe.gl') ||
            id.includes('globe.gl')
          ) {
            return 'three-globe';
          }

          // ── Spreadsheet (only in admin/nSales) ────────────────────
          if (id.includes('xlsx') || id.includes('sheetjs')) {
            return 'xlsx';
          }

          // ── QR scanner (only in VoucherScanner) ───────────────────
          if (id.includes('html5-qrcode') || id.includes('jsqr')) {
            return 'qr-scanner';
          }

          // ── Canvas/image tools (only in ShareCards) ───────────────
          if (id.includes('html2canvas') || id.includes('browser-image-compression')) {
            return 'image-tools';
          }

          // ── Cropping tool (only in photo editors) ─────────────────
          if (id.includes('react-easy-crop')) {
            return 'image-tools';
          }

          // ── QR code renderer (everywhere but tiny) ────────────────
          if (id.includes('qrcode.react')) {
            return 'qr-render';
          }

          // ── React core (split from app logic) ─────────────────────
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }

          // ── Profile layout chunks (lazy loaded) ───────────────────
          if (id.includes('layouts/BusinessLayout')) return 'layout-business';
          if (id.includes('layouts/ModernGradient')) return 'layout-modern';
          if (id.includes('layouts/DarkElegance'))   return 'layout-dark';
          if (id.includes('layouts/SoftPastel'))     return 'layout-pastel';
          if (id.includes('layouts/BentoGrid'))      return 'layout-bento';
          if (id.includes('layouts/GlassFloating'))  return 'layout-glass';
          if (id.includes('layouts/LumiaTiles'))     return 'layout-lumia';
          if (id.includes('layouts/SplitPro'))       return 'layout-split';
          if (id.includes('layouts/StoryVertical'))  return 'layout-story';
          if (id.includes('layouts/NgoLayout'))      return 'layout-ngo';

          // ── Admin tools (only for admin users) ────────────────────
          if (id.includes('features/admin')) return 'admin';
          if (id.includes('features/nsales')) return 'nsales';
        },
      },
    },
  },

  // Dev server
  server: {
    port: 3000,
    open: true,
  },

  // Resolve aliases (matches CRA behaviour)
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
