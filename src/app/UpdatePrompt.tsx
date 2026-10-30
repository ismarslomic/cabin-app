import { f7ready } from 'framework7-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useCallback, useEffect, useState } from 'react'
import { registerAppRefresh } from '@/shared/lib/app-refresh.ts'
import {
  applyUpdate,
  checkForUpdate,
  signInAgain,
  UPDATE_CHECK_INTERVAL_MS,
} from '@/app/update-check.ts'

// Tells the user, with Framework7 toasts, when a new version is ready or the login session has
// expired. While the app is open it also looks for new versions regularly.
export default function UpdatePrompt() {
  const [registration, setRegistration] = useState<{
    swUrl: string
    worker: ServiceWorkerRegistration
  }>()
  const [sessionExpired, setSessionExpired] = useState(false)
  const [notice, setNotice] = useState<string>()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, worker) {
      if (worker) setRegistration({ swUrl, worker })
    },
  })

  // `manual` is a pull-to-refresh: the user asked, so say what came out of it.
  const check = useCallback(
    async (manual: boolean) => {
      if (!registration) return
      const result = await checkForUpdate(registration.swUrl, registration.worker)
      if (result === 'session-expired') setSessionExpired(true)
      if (!manual) return
      if (result === 'up-to-date') setNotice('Du har nyeste versjon')
      if (result === 'skipped') setNotice('Kunne ikke se etter oppdatering')
    },
    [registration],
  )

  useEffect(() => registerAppRefresh(() => check(true)), [check])

  useEffect(() => {
    if (!registration) return

    const checkInBackground = () => {
      void check(false)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkInBackground()
    }

    const timer = window.setInterval(checkInBackground, UPDATE_CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [registration, check])

  useEffect(() => {
    if (!needRefresh) return
    f7ready((f7) => {
      f7.toast
        .create({
          text: 'Ny versjon er tilgjengelig',
          closeButton: true,
          closeButtonText: 'Oppdater',
          on: {
            closeButtonClick: () => {
              if (registration) {
                void applyUpdate({ updateServiceWorker, registration: registration.worker })
              } else {
                void updateServiceWorker(true)
              }
            },
            close: () => setNeedRefresh(false),
          },
        })
        .open()
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker, registration])

  useEffect(() => {
    if (!notice) return
    f7ready((f7) => {
      f7.toast
        .create({
          text: notice,
          closeTimeout: 2500,
          on: { close: () => setNotice(undefined) },
        })
        .open()
    })
  }, [notice])

  useEffect(() => {
    if (!sessionExpired) return
    f7ready((f7) => {
      f7.toast
        .create({
          text: 'Økten din er utløpt',
          cssClass: 'toast-warning',
          closeButton: true,
          closeButtonText: 'Logg inn',
          on: {
            closeButtonClick: () => void signInAgain(),
            close: () => setSessionExpired(false),
          },
        })
        .open()
    })
  }, [sessionExpired])

  return null
}
