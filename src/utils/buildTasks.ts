const arrayFromMinMax = (min, max) => {
  min = parseInt(min)
  max = parseInt(max)
  return Array.from({ length: max - min + 1 }, (_, i) => i + min)
}

const formatXYZoomKey = (urlTemplate, x, y, zoom, apiKey, wmtsLayerName = '') => {
  const url = urlTemplate
    .replace('{x}', x.toString())
    .replace('{y}', y.toString())
    .replace('{z}', zoom.toString())
    .replace(/({apiKey})|({key})/, apiKey)
    .replace(/({layer})|({name})/, wmtsLayerName)
  return url
}

const getBingURLFromQuadKey = (urlTemplate, quadKey, apiKey) => {
  const bingUrl = urlTemplate
    .replace(/({quadKey})|({quad_key})/, quadKey)
    .replace(/({apiKey})|({key})/, apiKey)
  return bingUrl
}

const getQuadKeyFromCoordsAndZoom = (x, y, zoom) => {
  // Create a quadkey for use with certain tileservers that use them, e.g. Bing
  let quadKey = ''
  for (let i = zoom; i > 0; i -= 1) {
    let digit = 0
    /* eslint-disable no-bitwise */
    const mask = 1 << (i - 1)
    if ((x & mask) !== 0) {
      digit += 1
    }
    if ((y & mask) !== 0) {
      digit += 2
    }
    /* eslint-enable no-bitwise */
    quadKey += digit.toString()
  }
  return quadKey
}

const getTileUrlFromCoordsAndTileserver = (x, y, zoom, tileServer) => {
  // based on https://github.com/mapswipe/mapswipe/blob/master/src/shared/common/tile_functions.js
  const urlTemplate = tileServer.url
  const apiKey = tileServer.apiKey
  const tileServerName = tileServer.name
  const wmtsLayerName = tileServer.wmtsLayerName
  let url = ''
  if (tileServerName === 'bing') {
    const quadKey = getQuadKeyFromCoordsAndZoom(x, y, zoom)
    url = getBingURLFromQuadKey(urlTemplate, quadKey, apiKey)
  } else if (tileServerName?.includes('maxar')) {
    const newY = 2 ** zoom - y - 1
    url = formatXYZoomKey(tileServer.url, x, newY, zoom, apiKey)
  } else if (urlTemplate.includes('{-y}')) {
    const newY = 2 ** zoom - y - 1
    url = urlTemplate.replace('{-y}', '{y}')
    url = formatXYZoomKey(url, x, newY, zoom, apiKey, wmtsLayerName)
  } else {
    url = formatXYZoomKey(urlTemplate, x, y, zoom, apiKey, wmtsLayerName)
  }
  return url
}

const buildTasks = (project, group) => {
  const xArray = arrayFromMinMax(group.xMin, group.xMax)
  const yArray = arrayFromMinMax(group.yMin, group.yMax)
  const tasks = []
  for (const x of xArray) {
    for (const y of yArray) {
      const task = {
        groupId: group.groupId,
        projectId: project.projectId,
        taskX: x,
        taskY: y,
        taskId: `${project.zoomLevel}-${x}-${y}`,
        url: getTileUrlFromCoordsAndTileserver(x, y, project.zoomLevel, project.tileServer),
      }
      if (project.tileServerB) {
        task.urlB = getTileUrlFromCoordsAndTileserver(x, y, project.zoomLevel, project.tileServerB)
      }
      tasks.push(task)
    }
  }
  return tasks
}

export default buildTasks
