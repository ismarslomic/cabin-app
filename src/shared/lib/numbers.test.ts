import { describe, expect, it } from 'vitest'
import { isNumber } from '@/shared/lib/numbers.ts'

describe('isNumber', () => {
  it.each([
    '0',
    '7',
    '1985',
    '-5',
    '3.14',
    '-0.5',
    '1234567',
    '9007199254740992',
    // JavaScript writes very small numbers with an exponent, so this is its own spelling.
    '5e-7',
    '1e+21',
  ])('accepts "%s"', (value) => {
    expect(isNumber(value)).toBe(true)
  })

  it.each([
    ['an empty string', ''],
    ['only spaces', '   '],
    ['leading space', ' 5'],
    ['trailing space', '5 '],
    ['a plus sign', '+5'],
    ['a leading zero', '01985'],
    ['a trailing zero decimal', '1.0'],
    ['no digit before the point', '.5'],
    ['no digit after the point', '5.'],
    ['an exponent', '1e3'],
    ['hexadecimal', '0x7C0'],
    ['minus zero', '-0'],
    ['a decimal comma', '1,5'],
    ['a new line', '1\n'],
    ['a non-breaking space', '\u00a0'],
    ['Arabic-Indic digits', '٣'],
    ['full-width digits', '１９８５'],
    ['a very large number written with all its digits', '1000000000000000000000'],
    ['an exponent JavaScript would not write', '0.0000001'],
    ['letters', 'abc'],
    ['NaN', 'NaN'],
    ['Infinity', 'Infinity'],
    ['a number too large for its digits', '9007199254740993'],
  ])('rejects %s', (_description, value) => {
    expect(isNumber(value)).toBe(false)
  })
})
