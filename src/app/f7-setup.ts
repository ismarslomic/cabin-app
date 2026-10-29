import Framework7 from 'framework7/lite-bundle'
import Framework7React from 'framework7-react'

// Registers the React integration. Must run once, before <App> from framework7-react renders.
// Not a React hook, despite the name, so the rules-of-hooks check is disabled here.
// oxlint-disable-next-line react-hooks/rules-of-hooks
Framework7.use(Framework7React)
