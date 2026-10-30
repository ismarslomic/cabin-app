import { f7ready } from 'framework7-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect, useState } from 'react'
import { checkForUpdate, signInAgain, UPDATE_CHECK_INTERVAL_MS } from '@/app/update-check.ts'

// Tells the user, with Framework7 toasts, when a new version is ready or the login session has
// expired. While the app is open it also looks for new versions regularly.
export default function UpdatePrompt() {
  const [registration, setRegistration] = useState<{
    swUrl: string
    worker: ServiceWorkerRegistration
  }>()
  const [sessionExpired, setSessionExpired] = useState(false)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, worker) {
      if (worker) setRegistration({ swUrl, worker })
    },
  })

  useEffect(() => {
    if (!registration) return

    const check = () => {
      void checkForUpdate(registration.swUrl, registration.worker).then((result) => {
        if (result === 'session-expired') setSessionExpired(true)
      })
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') check()
    }

    const timer = window.setInterval(check, UPDATE_CHECK_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [registration])

  useEffect(() => {
    if (!needRefresh) return
    f7ready((f7) => {
      f7.toast
        .create({
          text: 'Ny versjon er tilgjengelig',
          closeButton: true,
          closeButtonText: 'Oppdater',
          on: {
            closeButtonClick: () => void updateServiceWorker(true),
            close: () => setNeedRefresh(false),
          },
        })
        .open()
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

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
