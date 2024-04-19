type TileServer = {
  url: string
  apiKey: string
  name: string
  wmtsLayerName?: string
}

type Group = {
  xMin: string
  xMax: string
  yMin: string
  yMax: string
  groupId: string
}

type Project = {
  projectId: string
  zoomLevel: number
  tileServer: TileServer
  tileServerB?: TileServer
}

type Task = {
  groupId: string
  projectId: string
  taskX: number
  taskY: number
  taskId: string
  url: string
  urlB?: string
}

const arrayFromMinMax = (min: string, max: string): number[] => {
  const minNum = parseInt(min, 10)
  const maxNum = parseInt(max, 10)
  return Array.from({ length: maxNum - minNum + 1 }, (_, i) => i + minNum)
}

const formatXYZoomKey = (
    urlTemplate: string,
    x: number,
    y: number,
    zoom: number,
    apiKey: string,
    wmtsLayerName: string = ''
): string => {
  const url = urlTemplate
      .replace('{x}', x.toString())
      .replace('{y}', y.toString())
      .replace('{z}', zoom.toString())
      .replace(/({apiKey})|({key})/, apiKey)
      .replace(/({layer})|({name})/, wmtsLayerName)
  return url
}

const getBingURLFromQuadKey = (urlTemplate: string, quadKey: string, apiKey: string): string => {
  const bingUrl = urlTemplate
      .replace(/({quadKey})|({quad_key})/, quadKey)
      .replace(/({apiKey})|({key})/, apiKey)
  return bingUrl
}

const getQuadKeyFromCoordsAndZoom = (x: number, y: number, zoom: number): string => {
  let quadKey = ''
  for (let i = zoom; i > 0; i -= 1) {
    let digit = 0
    const mask = 1 << (i - 1)
    if ((x & mask) !== 0) {
      digit += 1
    }
    if ((y & mask) !== 0) {
      digit += 2
    }
    quadKey += digit.toString()
  }
  return quadKey
}

const getTileUrlFromCoordsAndTileserver = (x: number, y: number, zoom: number, tileServer: TileServer): string => {
  const urlTemplate = tileServer.url
  const apiKey = tileServer.apiKey
  const tileServerName = tileServer.name
  const wmtsLayerName = tileServer.wmtsLayerName || ''
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

const buildTasks = (project: Project, group: Group): Task[] => {
  const xArray = arrayFromMinMax(group.xMin, group.xMax)
  const yArray = arrayFromMinMax(group.yMin, group.yMax)
  const tasks: Task[] = []
  for (const x of xArray) {
    for (const y of yArray) {
      const task: Task = {
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
