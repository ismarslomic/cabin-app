import { useState } from 'react'
import type { CSSProperties } from 'react'
import '@/features/home/components/HomeHero.css'
import type { Hero } from '@/features/home/components/heroes.ts'

function heroStyle(hero: Hero) {
  return {
    '--hero-image': `url('${hero.src}')`,
    '--hero-position': hero.position,
  } as CSSProperties
}

// Photo of the cabin behind the large title, fading into the page background. Decorative only.
// When `hero` changes the new photo fades in over the old one.
export default function HomeHero({ hero }: { hero: Hero }) {
  const [shown, setShown] = useState<{ current: Hero; previous?: Hero }>({ current: hero })
  if (shown.current !== hero) setShown({ current: hero, previous: shown.current })

  return (
    <>
      {shown.previous && (
        <div className="home-hero" style={heroStyle(shown.previous)} aria-hidden="true" />
      )}
      <div
        key={shown.current.src}
        className={shown.previous ? 'home-hero home-hero-enter' : 'home-hero'}
        style={heroStyle(shown.current)}
        aria-hidden="true"
        onAnimationEnd={() => {
          setShown({ current: shown.current })
        }}
      />
      <div className="home-hero-spacer" />
    </>
  )
}
