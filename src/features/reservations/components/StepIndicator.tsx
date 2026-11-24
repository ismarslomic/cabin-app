import './StepIndicator.css'

interface StepIndicatorProps {
  steps: string[]
  /** Index of the current step. */
  current: number
}

// Shows where the user is in a multi-step flow: done and current steps are filled.
export default function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <ol className="step-indicator" aria-label="Steg">
      {steps.map((label, index) => (
        <li
          key={label}
          className={index <= current ? 'step-indicator-step step-active' : 'step-indicator-step'}
          aria-current={index === current ? 'step' : undefined}
        >
          <span className="step-indicator-dot" aria-hidden="true">
            {index + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  )
}
