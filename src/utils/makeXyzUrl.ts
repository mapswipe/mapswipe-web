type TileServer = {
  url: string
  apiKey: string
  wmtsLayerName?: string
}

const makeXyzUrl = (tileServer: TileServer): string => {
  const apiKey: string = tileServer.apiKey
  const wmtsLayerName: string | undefined = tileServer.wmtsLayerName
  const url: string = tileServer.url
      .replace(/({apiKey})|({key})/, apiKey)
      .replace(/({layer})|({name})/, wmtsLayerName || '')
  return url
}

export default makeXyzUrl
