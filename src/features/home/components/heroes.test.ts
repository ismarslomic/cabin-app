import { describe, expect, it } from 'vitest'
import { heroes, pickHero } from '@/features/home/components/heroes.ts'

describe('pickHero', () => {
  it('can pick every hero and never goes out of range', () => {
    const picked = [0, 0.34, 0.67, 0.999999].map((value) => pickHero(() => value))

    expect(new Set(picked)).toEqual(new Set(heroes))
  })

  it('never picks the current hero again', () => {
    for (const current of heroes) {
      for (const value of [0, 0.34, 0.67, 0.999999]) {
        expect(pickHero(() => value, current)).not.toBe(current)
      }
    }
  })
})
