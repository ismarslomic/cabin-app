import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Vitest globals are off, so Testing Library cannot register its own cleanup.
afterEach(cleanup)

// jsdom has no matchMedia; Framework7 uses it for dark mode detection.
vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))
