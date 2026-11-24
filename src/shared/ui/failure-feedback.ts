import { f7 } from 'framework7-react'
import { classifyFailure, type Failure } from '@/shared/lib/api-error.ts'
import { reloadForLogin } from '@/shared/lib/http.ts'

export const NO_ACCESS_TEXT = 'Du har ikke tilgang til appen.'
export const NETWORK_TEXT = 'Kunne ikke nå tjenesten. Sjekk nettforbindelsen og prøv igjen.'

interface CommonFailureOptions {
  /** Runs when the user has dismissed the no-access alert (for example to close a popup). */
  onForbiddenDismissed?: () => void
  /**
   * Show a toast for a network failure. Set it for an action the user started (a submit); leave it
   * off for loading, where the caller shows an `ErrorState` instead.
   */
  networkToast?: boolean
}

// One no-access alert at a time, however many requests fail at once; every caller is told when it
// is dismissed.
let pendingAlert: (() => void)[] | undefined

function showNoAccessAlert(onDismissed?: () => void) {
  if (pendingAlert) {
    if (onDismissed) pendingAlert.push(onDismissed)
    return
  }
  const callbacks: (() => void)[] = onDismissed ? [onDismissed] : []
  pendingAlert = callbacks
  const dismissed = () => {
    // Runs once, whether the button or something else closed the alert.
    if (pendingAlert !== callbacks) return
    pendingAlert = undefined
    callbacks.forEach((callback) => {
      callback()
    })
  }
  f7.dialog.alert(NO_ACCESS_TEXT, dismissed).on('closed', dismissed)
}

/** For tests: forget an alert that is still open. */
export function resetFailureFeedback(): void {
  pendingAlert = undefined
}

/**
 * Handles the failures that look the same everywhere: an expired session reloads the page for the
 * login (no message), no access shows a single-button alert, and, when asked, no network shows a
 * top toast. Returns true when the failure was handled; a feature handles the rest itself.
 *
 * @example
 * if (handleCommonFailure(classifyFailure(error), { networkToast: true })) return
 */
export function handleCommonFailure(
  failure: Failure,
  { onForbiddenDismissed, networkToast = false }: CommonFailureOptions = {},
): boolean {
  switch (failure.kind) {
    case 'session':
      reloadForLogin()
      return true
    case 'forbidden':
      showNoAccessAlert(onForbiddenDismissed)
      return true
    case 'network':
      if (!networkToast) return false
      f7.toast
        .create({ text: NETWORK_TEXT, position: 'top', closeTimeout: 5000, closeButton: true })
        .open()
      return true
    case 'api':
      return false
  }
}

/**
 * For a request that loads what a page or section shows. Handles what is the same everywhere (see
 * `handleCommonFailure`) and says what to show: `'loading'` while the page reloads for the login,
 * otherwise `'error'`, so the user gets an `ErrorState` with a retry, also after the no-access
 * alert.
 *
 * @example
 * .catch((error: unknown) => setState({ status: handleLoadFailure(error) }))
 */
export function handleLoadFailure(
  error: unknown,
  options: { onForbiddenDismissed?: () => void } = {},
): 'loading' | 'error' {
  const failure = classifyFailure(error)
  handleCommonFailure(failure, options)
  return failure.kind === 'session' ? 'loading' : 'error'
}
