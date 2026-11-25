import { Link, Navbar, NavLeft, NavRight, NavTitle, Preloader } from 'framework7-react'
import { Check, X } from 'lucide-react'
import '@/shared/ui/modal-chrome.css'

/** The check (confirm) of a modal: its accessible name and when it can be used. */
export interface ModalConfirm {
  /** The accessible name of the check (it is an icon). */
  label: string
  disabled?: boolean
  /** Something is being sent: a preloader instead of the check, and no taps. */
  busy?: boolean
  /** The check closes the popup it is in (Framework7's `popupClose`), when it can be used. */
  closesPopup?: boolean
  onClick?: () => void
}

interface ModalNavbarProps {
  title?: string
  /**
   * What the left button is: a close X for something that slides up over the page (a popup), or,
   * for a page that was pushed, Framework7's own back link (the same chevron as every other pushed
   * page, going back by itself: `onClose` and `closeDisabled` are not used). Default: the X.
   */
  leading?: 'close' | 'back'
  /** The accessible name of the left button (it is an icon): "Avbryt", "Lukk" or "Tilbake". */
  closeLabel: string
  /**
   * Called when the X is tapped. Without it, the X closes the popup it is in (`popupClose`), unless
   * closing is disabled.
   */
  onClose?: () => void
  /** The X waits (for example while something is being sent). */
  closeDisabled?: boolean
  /** The check at the top right; none gives a navbar with only the X. */
  confirm?: ModalConfirm
}

/**
 * The navbar of a page where the user edits something and then saves or leaves, like the iOS
 * Calendar's "new event": a close X on the left, a title, and a check on the right that is tinted
 * with the accent color when it can be used and dimmed when not. In a popup the X closes it. For a
 * page that was pushed, use `leading="back"` (Framework7's back link, as iOS does for a pushed
 * page). It is a Framework7 `Navbar`. For a sheet, which has no navbar, use
 * `ModalHeader`.
 *
 * @example
 * <ModalNavbar title="Ny reservasjon" closeLabel="Avbryt" onClose={cancel}
 *   confirm={{ label: 'Opprett', disabled: !valid, onClick: save }} />
 */
export default function ModalNavbar({
  title,
  leading = 'close',
  closeLabel,
  onClose,
  closeDisabled = false,
  confirm,
}: ModalNavbarProps) {
  const confirmDisabled = !!confirm && (!!confirm.disabled || !!confirm.busy)

  return (
    // The back link is Framework7's own (not a Lucide icon of ours), so it looks exactly like the
    // back link of every other pushed page.
    <Navbar backLink={leading === 'back' ? closeLabel : undefined}>
      {leading === 'close' && (
        <NavLeft>
          <Link
            iconOnly
            aria-label={closeLabel}
            popupClose={!onClose && !closeDisabled}
            className={closeDisabled ? 'disabled' : undefined}
            onClick={closeDisabled ? undefined : onClose}
          >
            <X size={22} aria-hidden="true" />
          </Link>
        </NavLeft>
      )}
      {title && <NavTitle>{title}</NavTitle>}
      <NavRight>
        {confirm && (
          <Link
            iconOnly
            popupClose={!!confirm.closesPopup && !confirmDisabled}
            aria-label={confirm.label}
            aria-busy={confirm.busy}
            aria-disabled={confirmDisabled}
            className={confirmDisabled ? 'modal-confirm disabled' : 'modal-confirm'}
            onClick={confirmDisabled ? undefined : confirm.onClick}
          >
            {confirm.busy ? <Preloader size={18} /> : <Check size={24} aria-hidden="true" />}
          </Link>
        )}
      </NavRight>
    </Navbar>
  )
}
