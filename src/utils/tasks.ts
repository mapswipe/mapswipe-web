import { inflate } from 'pako'
import { decode } from 'base-64'

export function decompressTasks(tasks: unknown) {
  if (Array.isArray(tasks)) {
    return tasks
  }

  if (typeof tasks !== 'string') {
    // NOTE: invalid tasks
    return []
  }

  const strTasks = decode(tasks)
  const charTasks = strTasks.split('').map((x) => {
    return x.charCodeAt(0)
  })
  const binaryTasks = new Uint8Array(charTasks)
  const expandedTasks = inflate(binaryTasks, { to: 'string' })

  // NOTE: quote taskId before parsing, some task ids (i.e. Mapillary image
  // ids) exceed Number.MAX_SAFE_INTEGER and JSON.parse silently rounds them
  const safeExpandedTasks = expandedTasks.replace(/"taskId":\s*(\d+)/g, '"taskId":"$1"')

  return JSON.parse(safeExpandedTasks) as unknown[]
}
