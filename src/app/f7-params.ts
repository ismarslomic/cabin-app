import type { Framework7Parameters } from 'framework7/types'
import { routes } from '@/app/routes.ts'

export const f7params: Framework7Parameters = {
  name: 'Slomic Smarthytte',
  theme: 'auto',
  darkMode: 'auto',
  routes,
  // Framework7 has no locale files: built-in texts are set per component.
  dialog: {
    buttonOk: 'OK',
    buttonCancel: 'Avbryt',
  },
}
