import { Link } from 'framework7-react'
import { Check, X } from 'lucide-react'
import type { ModalConfirm } from '@/shared/ui/ModalNavbar.tsx'
import '@/shared/ui/modal-chrome.css'

/** What a sheet header's check needs: a sheet has no popup to close and nothing to wait for. */
type HeaderConfirm = Pick<ModalConfirm, 'label' | 'disabled' | 'onClick'>

interface ModalHeaderProps {
  title: string
  /** A line under the title, for example how many are picked. */
  subtitle?: string
  /** The accessible name of the close X (it is an icon). */
  closeLabel: string
  onClose: () => void
  confirm: HeaderConfirm
}

/**
 * The header of a sheet, which has no navbar: the same look as `ModalNavbar` (glass circles with a
 * close X on the left and a check on the right, tinted when it can be used) with the title and a
 * subtitle in the middle.
 *
 * @example
 * <ModalHeader title="Velg gjester" subtitle="2 valgt" closeLabel="Lukk" onClose={close}
 *   confirm={{ label: 'Legg til valgte', disabled: none, onClick: add }} />
 */
export default function ModalHeader({
  title,
  subtitle,
  closeLabel,
  onClose,
  confirm,
}: ModalHeaderProps) {
  const confirmDisabled = !!confirm.disabled

  return (
    <div className="modal-header">
      <Link iconOnly aria-label={closeLabel} className="modal-header-button" onClick={onClose}>
        <X size={22} aria-hidden="true" />
      </Link>
      <div className="modal-header-title">
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <Link
        iconOnly
        aria-label={confirm.label}
        aria-disabled={confirmDisabled}
        className={['modal-header-button', 'modal-header-confirm', confirmDisabled && 'disabled']
          .filter(Boolean)
          .join(' ')}
        onClick={confirmDisabled ? undefined : confirm.onClick}
      >
        <Check size={24} aria-hidden="true" />
      </Link>
    </div>
  )
}
