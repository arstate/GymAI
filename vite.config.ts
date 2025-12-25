import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'FitGenius Indo',
        short_name: 'FitGenius',
        description: 'Asisten Kebugaran AI Pribadi Anda',
        theme_color: '#10b981',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png', // Placeholder icon
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png', // Placeholder icon
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  define: {
    // Menyimpan daftar API Key untuk rotasi otomatis
    'process.env.API_KEYS': JSON.stringify([
      "AIzaSyDIH0xyZyFqlqJ5WBUkFwQQxO8zdKDcxyg",
      "AIzaSyDixFiE3KbwMdqC6V3qvMzO9gkoUDdQDrI",
      "AIzaSyAdJzHJ5hOptBYTRyv-PRv1xnvvHJuQN-Q",
      "AIzaSyAPAbp5MuljFR1eyAcXx-zQqF4YE9XRTCs"
    ])
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  }
});