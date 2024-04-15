import { transform } from 'ol/proj'

const pixelCoordsZoomToLonLat = (pixelX, pixelY, zoom, size = 256) => {
  const mapSize = size * Math.pow(2, zoom)
  const x = pixelX / mapSize - 0.5
  const y = 0.5 - pixelY / mapSize
  const lon = 360 * x
  const lat = 90 - (360 * Math.atan(Math.exp(-y * 2 * Math.PI))) / Math.PI
  return [lon, lat]
}

const geomFromTileCoords = (tileX, tileY, zoom, size = 256, epsg = 3857) => {
  const leftPixelX = tileX * size
  const topPixelY = tileY * size
  const lonLeftLatTop = pixelCoordsZoomToLonLat(leftPixelX, topPixelY, zoom, size)
  const [left, top] = transform(lonLeftLatTop, 'EPSG:4326', `EPSG:${epsg}`)

  const rightPixelX = (tileX + 1) * size
  const bottomPixelY = (tileY + 1) * size
  const lonRightLatBottom = pixelCoordsZoomToLonLat(rightPixelX, bottomPixelY, zoom, size)
  const [right, bottom] = transform(lonRightLatBottom, 'EPSG:4326', `EPSG:${epsg}`)

  const coordinates = [
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
