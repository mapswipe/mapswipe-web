import { inflate } from 'pako'
import { decode } from 'base-64'

export function decompressTasks(tasks: unknown) {
  if (Array.isArray(tasks)) {
    return tasks;
  }

  if (typeof tasks !== 'string') {
    // NOTE: invalid tasks
    return [];
  }

  const strTasks = decode(tasks);
  const charTasks = strTasks.split('').map((x) => {
    return x.charCodeAt(0)
  })
  const binaryTasks = new Uint8Array(charTasks)
  const expandedTasks = inflate(binaryTasks, { to: 'string' })

  return JSON.parse(expandedTasks) as unknown[];
}
