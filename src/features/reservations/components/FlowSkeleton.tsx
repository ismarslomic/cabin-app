import { Block, BlockTitle, List, ListItem } from 'framework7-react'
import '@/features/reservations/components/FlowSkeleton.css'
import '@/shared/ui/chips.css'

const wave = 'skeleton-text skeleton-effect-wave'
const block = 'skeleton-block skeleton-effect-wave'

// Framework7's skeleton font only has plain ASCII glyphs: other characters (æ, ø, å) would show up as
// real letters inside the gray bars. Keep the placeholder texts ASCII-only.
const ROWS = ['Xxxxxxx', 'Xxxxxxx', 'Xxxxxxx']
const GUESTS = ['Xxxxxxxxxxxxx', 'Xxxxxxxxxxxxxxx', 'Xxxxxxxxxxxx']

// Placeholder for the flow while the data loads: the same structure as the loaded page (the quick
// picks, the period card, the guest list), so nothing jumps when the data arrives. It is built from
// plain list items, not from wrapper components: see the README rule for Framework7's `List`.
export default function FlowSkeleton() {
  return (
    <>
      <div role="status" className="flow-skeleton-status">
        Laster …
      </div>
      <div aria-hidden="true">
        <BlockTitle className={wave}>Xxxxxxxxxx</BlockTitle>
        <Block>
          <div className={`${block} flow-skeleton-segmented`} />
        </Block>
        <BlockTitle className={wave}>Xxxx xxxxx xxxxxx</BlockTitle>
        <List strong inset dividersIos>
          {ROWS.map((row, index) => (
            <ListItem key={`period-${index}`}>
              <span slot="title" className={wave}>
                {row}
              </span>
              <span slot="after" className="chips">
                <span className={`${block} flow-skeleton-chip`} />
                <span className={`${block} flow-skeleton-chip flow-skeleton-chip-time`} />
              </span>
            </ListItem>
          ))}
        </List>
        <BlockTitle className={wave}>Xxxxxxx (0)</BlockTitle>
        <List strong inset dividersIos>
          {GUESTS.map((guest, index) => (
            <ListItem key={`guest-${index}`}>
              <span slot="media" className={`${block} flow-skeleton-avatar`} />
              <span slot="title" className={wave}>
                {guest}
              </span>
            </ListItem>
          ))}
        </List>
      </div>
    </>
  )
}
