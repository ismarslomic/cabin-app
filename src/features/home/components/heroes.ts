export interface Hero {
  /** Path in `public/` (also listed in `includeAssets` in `vite.config.ts` so it works offline). */
  src: string
  /** CSS `background-position` that keeps the subject of the photo in the strip behind the title. */
  position: string
}

export const heroes: Hero[] = [
  { src: '/images/hero-sunset.webp', position: 'center 45%' },
  { src: '/images/hero-waterfall.webp', position: 'center 40%' },
  { src: '/images/hero-forest.webp', position: 'center 30%' },
]

/**
 * A random hero, never `current` when there is a choice. `random` returns a number in [0, 1) and is
 * injectable for tests.
 */
export function pickHero(random: () => number = Math.random, current?: Hero): Hero {
  const choices = heroes.filter((hero) => hero !== current)
  const pool = choices.length > 0 ? choices : heroes
  return pool[Math.floor(random() * pool.length)] ?? heroes[0]
}
