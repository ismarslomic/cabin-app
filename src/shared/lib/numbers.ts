/**
 * Whether a string is exactly the way JavaScript writes a number: `String(Number(value))` gives
 * the same text back. That rules out every other spelling of a number that `Number()` accepts:
 * an empty string, spaces, `'+5'`, `'01'`, `'1.0'`, `'.5'`, `'-0'`, `'1e3'`, `'0x10'`, `'NaN'` and
 * `'Infinity'`. It does not trim, so callers trim first. JavaScript writes very small and very
 * large numbers with an exponent (`'5e-7'`, `'1e+21'`), so `'5e-7'` is accepted; a number whose
 * digits do not survive the round trip (`'9007199254740993'`) is rejected.
 *
 * @example
 * isNumber('1985') // true
 * isNumber('-3.14') // true
 * isNumber('') // false
 * isNumber('1e3') // false (JavaScript writes 1000)
 * isNumber('0x10') // false
 */
export function isNumber(value: string): boolean {
  const number = Number(value)
  // Writing the number back must give the same text: that rules out every other spelling.
  return Number.isFinite(number) && String(number) === value
}
