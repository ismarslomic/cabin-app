import { Button, Segmented, Subnavbar } from 'framework7-react'
import { useState } from 'react'

// iOS segmented control for switching between views of the same page (e.g. Måned / Liste / År).
// Renders a Subnavbar, so it must be a child of <Navbar>; it stays pinned under the title (glass).
export default function ViewSwitcher({ options }: { options: string[] }) {
  const [active, setActive] = useState(options[0])

  return (
    <Subnavbar>
      <Segmented strong round>
        {options.map((option) => (
          <Button
            key={option}
            active={option === active}
            onClick={() => {
              setActive(option)
            }}
          >
            {option}
          </Button>
        ))}
      </Segmented>
    </Subnavbar>
  )
}
