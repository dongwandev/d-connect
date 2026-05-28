import { describe, expect, it } from 'vitest'
import { parseJsonArray, serializeJsonArray } from './json-array'

describe('serializeJsonArray', () => {
  it('빈 배열을 "[]"로 직렬화한다', () => {
    expect(serializeJsonArray([])).toBe('[]')
  })

  it('string 배열을 JSON으로 직렬화한다', () => {
    expect(serializeJsonArray(['a', 'b', 'c'])).toBe('["a","b","c"]')
  })

  it('숫자/객체 등 임의 값도 처리한다', () => {
    expect(serializeJsonArray([1, 2, 3])).toBe('[1,2,3]')
  })
})

describe('parseJsonArray', () => {
  it('null/undefined/빈 문자열은 빈 배열을 반환한다', () => {
    expect(parseJsonArray(null)).toEqual([])
    expect(parseJsonArray(undefined)).toEqual([])
    expect(parseJsonArray('')).toEqual([])
  })

  it('정상 JSON 배열을 파싱한다', () => {
    expect(parseJsonArray<string>('["a","b"]')).toEqual(['a', 'b'])
  })

  it('JSON 형식이지만 배열이 아니면 빈 배열로 폴백한다', () => {
    expect(parseJsonArray('{"foo":"bar"}')).toEqual([])
    expect(parseJsonArray('"string"')).toEqual([])
    expect(parseJsonArray('42')).toEqual([])
  })

  it('손상된 JSON은 빈 배열로 폴백한다 (시연 안정성)', () => {
    expect(parseJsonArray('not json')).toEqual([])
    expect(parseJsonArray('[1, 2,')).toEqual([])
  })

  it('직렬화/파싱 round-trip이 동일하다', () => {
    const original = ['일회용품 저감', '다회용 컵', '동네 행사']
    expect(parseJsonArray<string>(serializeJsonArray(original))).toEqual(original)
  })
})
