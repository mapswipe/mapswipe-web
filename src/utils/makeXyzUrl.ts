const makeXyzUrl = (tileServer) => {
  const apiKey = tileServer.apiKey
  const wmtsLayerName = tileServer.wmtsLayerName
  const url = tileServer.url
    .replace(/({apiKey})|({key})/, apiKey)
    .replace(/({layer})|({name})/, wmtsLayerName)
  return url
}

export default makeXyzUrl
