import { f7ready } from 'framework7-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useEffect } from 'react'

// Tells the user, with Framework7 toasts, when the app works offline or a new version is ready.
export default function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady) return
    f7ready((f7) => {
      f7.toast
        .create({
          text: 'Appen fungerer nå uten nett',
          closeTimeout: 4000,
          on: { close: () => setOfflineReady(false) },
        })
        .open()
    })
  }, [offlineReady, setOfflineReady])

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

  return null
}
