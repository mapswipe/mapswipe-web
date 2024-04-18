import hex2rgb from '@/utils/hex2rgb'

const rgb = [255, 170, 17, 0.3]

test('correctly converts hex color with alpha to rgba', () => {
  expect(hex2rgb('#ffaa11', 0.3)).toStrictEqual(rgb)
})
