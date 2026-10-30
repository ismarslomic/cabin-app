type RefreshHandler = () => Promise<void>

let handler: RefreshHandler | undefined

/**
 * The app shell (`app/UpdatePrompt`) registers what a pull-to-refresh does; pages in features call
 * `refreshApp` without importing from `app/`. Returns a function that unregisters the handler.
 */
export function registerAppRefresh(refresh: RefreshHandler): () => void {
  handler = refresh
  return () => {
    if (handler === refresh) handler = undefined
  }
}

/** Runs the registered refresh (looks for a new app version); does nothing before one is registered. */
export async function refreshApp(): Promise<void> {
  await handler?.()
}
