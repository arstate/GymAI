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
    // Menyimpan daftar API Key untuk rotasi otomatis sesuai permintaan user
    'process.env.API_KEYS': JSON.stringify([
      "AIzaSyC8TAGHcxgKV7MxpevwitVzaJ3WjVp-RLI",
      "AIzaSyD2mp7DPiHU_zXZdnK3nLsl1bsJTE7VdyY",
      "AIzaSyCBpztyFBeolgyAM_ZXQcsO0NSpwsuh1xM",
      "AIzaSyDsJOd0dUNYwcIKOUdt1KBGdTwM7J7QQ1k",
      "AIzaSyDYJVMP0Pue7vodzWBeX0I06PgzYFoPJy8",
      "AIzaSyB-ZDRLEvwxly7WOdX11n_u5d34wdqpxIw",
      "AIzaSyCz_T7OrDsZzqzaO7uxZ8L4IZrp-usKMZk"
    ])
  },
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  }
});