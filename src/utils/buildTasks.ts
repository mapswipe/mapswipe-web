import getQuadKeyFromCoordsAndZoom from './getQuadKeyFromCoordsAndZoom'

import type { Project, TaskGroup, TileServer, TileTask } from "./types";

const arrayFromMinMax = (min: number | string, max: number | string) => {
  const minValue = parseInt(String(min));
  const maxValue = parseInt(String(max));
  return Array.from({ length: maxValue - minValue + 1 }, (_, i) => i + minValue)
}

const formatXYZoomKey = (
  urlTemplate: string,
  x: number,
  y: number,
  zoom: number,
  apiKey: string,
  wmtsLayerName = ''
) => {
  const url = urlTemplate
    .replace('{x}', x.toString())
    .replace('{y}', y.toString())
    .replace('{z}', zoom.toString())
    .replace(/({apiKey})|({key})/, apiKey)
    .replace(/({layer})|({name})/, wmtsLayerName)
  return url
}

const getBingURLFromQuadKey = (urlTemplate: string, quadKey: string, apiKey: string) => {
  const bingUrl = urlTemplate
    .replace(/({quadKey})|({quad_key})/, quadKey)
    .replace(/({apiKey})|({key})/, apiKey)
  return bingUrl
}

const getTileUrlFromCoordsAndTileserver = (x: number, y: number, zoom: number, tileServer: TileServer) => {
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

const buildTasks = (project: Project, group: TaskGroup) => {
  const xArray = arrayFromMinMax(group.xMin, group.xMax)
  const yArray = arrayFromMinMax(group.yMin, group.yMax)
  const tasks: TileTask[] = [];
  for (const x of xArray) {
    for (const y of yArray) {
      const task: TileTask = {
        groupId: String(group.groupId),
        projectId: String(project.projectId),
        taskX: x,
        taskY: y,
        taskZ: Number(project.zoomLevel),
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
