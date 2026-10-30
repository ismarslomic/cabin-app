import { Block, Button, Segmented } from 'framework7-react'
import { useState } from 'react'

// iOS segmented control for switching between views of the same page (e.g. Måned / Liste / År).
export default function ViewSwitcher({ options }: { options: string[] }) {
  const [active, setActive] = useState(options[0])

  return (
    <Block>
      <Segmented strong>
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
    </Block>
  )
}
