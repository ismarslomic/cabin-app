import { defaultAssetName, defineConfig } from '@vite-pwa/assets-generator/config'

// Every icon sits on the app's dark background (the manifest theme_color), so it is opaque: iOS fills
// transparency with black and a transparent tab icon disappears on one of the light/dark tab bars.
// The source (public/favicon.svg) draws a light symbol by default, which is what these tiles need.
const tile = { background: '#090f17' }

export default defineConfig({
  preset: {
    // Unused: transparent icons are not wanted (see above).
    transparent: { sizes: [] },
    // Android adaptive icon: the launcher crops to a circle/squircle, so the symbol stays inside the
    // 80% safe zone. The symbol is wide, hence the 30% padding.
    maskable: { sizes: [512], padding: 0.3, resizeOptions: tile },
    // "apple" is the opaque type with a little padding: apple-touch-icon, the "any" icons in the
    // manifest, and the 48px favicon.ico fallback.
    apple: {
      sizes: [64, 180, 192, 512],
      padding: 0.1,
      resizeOptions: tile,
      favicons: [[48, 'favicon.ico']],
    },
    assetName: (type, size) =>
      type === 'apple' && size.width !== 180
        ? `pwa-${size.width}x${size.height}.png`
        : defaultAssetName(type, size),
  },
  images: ['public/favicon.svg'],
})
