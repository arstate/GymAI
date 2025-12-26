
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
        orientation: 'any',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  define: {
    // Memastikan process.env tidak undefined di browser
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    },
    // Kompatibilitas untuk pemanggilan langsung process.env.API_KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
  server: {
    port: 3000,
  }
});
