import { transform } from 'ol/proj'
import type {Coordinate} from "ol/coordinate"

const pixelCoordsZoomToLonLat = (pixelX: number, pixelY: number, zoom: number, size: number = 256): Coordinate => {
  const mapSize = size * Math.pow(2, zoom)
  const x = pixelX / mapSize - 0.5
  const y = 0.5 - pixelY / mapSize
  const lon = 360 * x
  const lat = 90 - (360 * Math.atan(Math.exp(-y * 2 * Math.PI))) / Math.PI
  return [lon, lat]
}

const geomFromTileCoords = (tileX: number, tileY: number, zoom: number, size: number = 256, epsg: number = 3857): Coordinate[][] => {
  const leftPixelX = tileX * size
  const topPixelY = tileY * size
  const lonLeftLatTop: Coordinate = pixelCoordsZoomToLonLat(leftPixelX, topPixelY, zoom, size)
  const [left, top]: Coordinate = transform(lonLeftLatTop, 'EPSG:4326', `EPSG:${epsg}`)

  const rightPixelX = (tileX + 1) * size
  const bottomPixelY = (tileY + 1) * size
  const lonRightLatBottom: Coordinate = pixelCoordsZoomToLonLat(rightPixelX, bottomPixelY, zoom, size)
  const [right, bottom]: Coordinate = transform(lonRightLatBottom, 'EPSG:4326', `EPSG:${epsg}`)

  const coordinates: Coordinate[][] = [
    [
      [left, top],
      [right, top],
      [right, bottom],
      [left, bottom],
      [left, top],
    ],
  ]
  return coordinates
}

export default geomFromTileCoords
