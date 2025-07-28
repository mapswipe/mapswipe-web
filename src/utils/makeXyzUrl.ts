import getQuadKeyFromCoordsAndZoom from './getQuadKeyFromCoordsAndZoom'

const makeXyzUrl = (tileServer: string, tileCoord: [number, number, number]) => {
  const apiKey = tileServer.apiKey
  const wmtsLayerName = tileServer.wmtsLayerName
  const [zoom, x, y] = tileCoord
  const quadkey = getQuadKeyFromCoordsAndZoom(x, y, zoom)
  const url = tileServer.url
    .replace(/({apiKey})|({key})/, apiKey)
    .replace(/({layer})|({name})/, wmtsLayerName)
    .replace(/({quad_key})/, quadkey)
    .replace(/{z}/gi, zoom.toString())
    .replace(/{x}/gi, x.toString())
    .replace(/{y}/gi, y.toString())
  return url
}

export default makeXyzUrl
