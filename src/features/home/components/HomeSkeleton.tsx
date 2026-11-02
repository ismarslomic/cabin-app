import { Block, BlockTitle, Card, List, ListItem } from 'framework7-react'
import '@/features/home/components/AvatarStack.css'
import '@/features/home/components/ReserveButton.css'
import './HomeSkeleton.css'

const wave = 'skeleton-text skeleton-effect-wave'

// Framework7's skeleton font only has plain ASCII glyphs: other characters (æ, ø, å, –) would show
// up as real letters inside the gray bars. Keep the placeholder texts ASCII-only.
const DATES = 'Xxxxxxxxxxxxxxxxxxxxxx'
const STATUS = 'Xxxxxxxxxxxx'

function ReservationSkeleton({ title, kind }: { title: string; kind: 'current' | 'next' }) {
  return (
    <List
      strong
      inset
      mediaList
      className={`reservation-card reservation-card-${kind}`}
      aria-hidden="true"
    >
      <ListItem>
        <span slot="header" className="reservation-heading">
          <span className="reservation-dot" />
          {title}
        </span>
        <span slot="title" className={wave}>
          {DATES}
        </span>
        <span slot="footer" className={wave}>
          {STATUS}
        </span>
        <span slot="after" className="avatar-stack">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={index}
              className="skeleton-block skeleton-effect-wave home-skeleton-avatar"
            />
          ))}
        </span>
      </ListItem>
    </List>
  )
}

function StatSkeleton({ width }: { width: number }) {
  return (
    <Card className="year-stat">
      <span className="skeleton-block skeleton-effect-wave home-skeleton-icon" />
      <strong className={`year-stat-value ${wave}`}>00</strong>
      <span className={`year-stat-label ${wave}`}>{'X'.repeat(width)}</span>
    </Card>
  )
}

// Placeholder for the Home content while the API answers: the same structure as the loaded page.
export default function HomeSkeleton() {
  return (
    <>
      <div role="status" className="home-skeleton-status">
        Laster …
      </div>
      <ReservationSkeleton title="Gjeldende besøk" kind="current" />
      <ReservationSkeleton title="Neste besøk" kind="next" />
      <Block inset className="home-reserve" aria-hidden="true">
        <div className="skeleton-block skeleton-effect-wave home-skeleton-button" />
      </Block>
      <div className="home-year" aria-hidden="true">
        <BlockTitle>Dette året</BlockTitle>
        <Block inset className="year-stats">
          <div className="grid grid-cols-3 grid-gap">
            <StatSkeleton width={5} />
            <StatSkeleton width={6} />
            <StatSkeleton width={9} />
          </div>
        </Block>
      </div>
    </>
  )
}
