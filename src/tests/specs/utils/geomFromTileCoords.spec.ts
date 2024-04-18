import { expect, test } from 'vitest'
import geomFromTileCoords from '@/utils/geomFromTileCoords'

const geom = [
  [
    [-8209441.938741822, 2060178.5594847477],
    [-8209432.384113287, 2060178.5594847477],
    [-8209432.384113287, 2060169.0048562116],
    [-8209441.938741822, 2060169.0048562116],
    [-8209441.938741822, 2060178.5594847477],
  ],
]

test('correctly converts xyz tile coordinates to polygon geom', () => {
  expect(geomFromTileCoords(1237941, 1881531, 22)).toStrictEqual(geom)
})
