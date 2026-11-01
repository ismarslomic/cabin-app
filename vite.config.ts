import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// Dev only: `server.proxy` is used by the Vite dev server (and `vite preview`), never by `vite build`,
// and the production image is nginx serving the built files. The API is on the same origin as the app
// in production (the tunnel routes /api). For `pnpm dev`, set in the git-ignored `.env.local`:
// API_PROXY_TARGET: the origin that serves /api;
// CF_ACCESS_JWT: the value of your `CF_Authorization` cookie, sent so Cloudflare Access sees you logged in.
const devEnv = loadEnv('development', process.cwd(), '')
const apiProxyTarget = devEnv.API_PROXY_TARGET
const accessJwt = devEnv.CF_ACCESS_JWT

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The user decides when to update, so open forms are never reloaded away.
      registerType: 'prompt',
      // Behind Cloudflare Access the manifest request needs the session cookie, or it is redirected to the login page.
      useCredentials: true,
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'apple-touch-icon-180x180.png',
        'images/hero-sunset.webp',
        'images/hero-waterfall.webp',
        'images/hero-forest.webp',
      ],
      manifest: {
        name: 'Slomic Smarthytte',
        short_name: 'Smarthytte',
        description: 'Smarthytte-appen for hytta til familien Slomic',
        lang: 'nb',
        theme_color: '#090f17',
        background_color: '#090f17',
        display: 'standalone',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: apiProxyTarget
      ? {
          '/api': {
            target: apiProxyTarget,
            changeOrigin: true,
            headers: accessJwt ? { Cookie: `CF_Authorization=${accessJwt}` } : undefined,
          },
        }
      : undefined,
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      // Vitest 5 only reports files imported by tests unless include is set.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx'],
      reporter: ['text', 'lcov'],
    },
  },
})
