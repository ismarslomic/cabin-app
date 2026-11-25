import { Block, Button } from 'framework7-react'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

// A page or section that failed to load: the message and a retry, in place of the content.
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert">
      <Block className="text-align-center">
        <p>{message}</p>
        <Button onClick={onRetry}>Prøv igjen</Button>
      </Block>
    </div>
  )
}
