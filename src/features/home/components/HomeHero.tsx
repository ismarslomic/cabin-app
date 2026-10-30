import { useState } from 'react'
import type { CSSProperties } from 'react'
import '@/features/home/components/HomeHero.css'
import { pickHero } from '@/features/home/components/heroes.ts'

// Photo of the cabin behind the large title, fading into the page background. Decorative only.
// A random photo is picked once per app launch, so it does not change while the page is in use.
export default function HomeHero() {
  const [hero] = useState(() => pickHero())
  const style = {
    '--hero-image': `url('${hero.src}')`,
    '--hero-position': hero.position,
  } as CSSProperties

  return (
    <>
      <div className="home-hero" style={style} aria-hidden="true" />
      <div className="home-hero-spacer" />
    </>
  )
}
