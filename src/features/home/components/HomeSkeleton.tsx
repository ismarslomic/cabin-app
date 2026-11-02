import { Block, BlockTitle, Card, List, ListItem } from 'framework7-react'
import './HomeSkeleton.css'

const wave = 'skeleton-text skeleton-effect-wave'

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
          fre 31. okt – søn 2. nov
        </span>
        <span slot="footer" className={wave}>
          På hytta nå
        </span>
        <span slot="after" className="skeleton-block skeleton-effect-wave home-skeleton-avatar" />
      </ListItem>
    </List>
  )
}

function StatSkeleton({ label }: { label: string }) {
  return (
    <Card className="year-stat">
      <span className="skeleton-block skeleton-effect-wave home-skeleton-icon" />
      <strong className={`year-stat-value ${wave}`}>00</strong>
      <span className={`year-stat-label ${wave}`}>{label}</span>
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
      <div className="home-year" aria-hidden="true">
        <BlockTitle>Dette året</BlockTitle>
        <Block inset className="year-stats">
          <div className="grid grid-cols-3 grid-gap">
            <StatSkeleton label="Besøk" />
            <StatSkeleton label="Netter" />
            <StatSkeleton label="Kjørte km" />
          </div>
        </Block>
      </div>
    </>
  )
}
