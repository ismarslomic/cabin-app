import { render } from '@testing-library/react'
import { App as F7App } from 'framework7-react'
import { StrictMode, type ReactNode } from 'react'
import '@/app/f7-setup.ts'

/** Renders a Framework7 component (a popup, a page) inside an app, the way the real app does. */
export function renderWithF7(ui: ReactNode) {
  return render(
    <StrictMode>
      <F7App theme="ios">{ui}</F7App>
    </StrictMode>,
  )
}
