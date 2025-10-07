export function isDefined<T>(item: T | null | undefined): item is T {
  return item !== null && item !== undefined
}

export function isNotDefined<T>(item: T | null | undefined): item is undefined | null {
  return item === null || item === undefined
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function tileToLng(x: number, z: number) {
  return (x / 2 ** z) * 360 - 180
}

export function tileToLat(y: number, z: number) {
  const n = Math.PI - 2 * Math.PI * (y / 2 ** z)
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

export interface GeoJsonProps {
  taskId: string
  taskX: number
  taskY: number
  taskZ: number
  reference?: number | undefined
}

export function createGeoJsonFromTasks(tasks: GeoJsonProps[] | undefined) {
  if (isNotDefined(tasks) || tasks.length === 0) {
    return undefined
  }

  const geojson: GeoJSON.GeoJSON<GeoJSON.Polygon, GeoJsonProps> = {
    type: 'FeatureCollection' as const,
    features: tasks
      .map((task, i) => {
        const { taskId, taskX, taskY, taskZ, reference } = task

        if (isNotDefined(taskX) || isNotDefined(taskY) || isNotDefined(taskZ)) {
          return undefined
        }

        const west = tileToLng(taskX, taskZ)
        const east = tileToLng(taskX + 1, taskZ)
        const north = tileToLat(taskY, taskZ)
        const south = tileToLat(taskY + 1, taskZ)

        const feature = {
          id: i + 1,
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [west, south],
                [east, south],
                [east, north],
                [west, north],
                [west, south],
              ],
            ],
          },
          properties: {
            taskId,
            taskX,
            taskY,
            taskZ,
            reference: reference ?? 0,
          },
        }

        return feature
      })
      .filter(isDefined),
  }

  return geojson
}

export function getInstruction(
  instruction: string | null | undefined,
  lookFor: string | null | undefined,
  projectType: string,
) {
  if (isNotDefined(instruction) && isNotDefined(lookFor)) {
    return '??'
  }

  if (isDefined(instruction)) {
    return instruction
  }

  // Validate = 2, Validate image = '10'
  const fallbackInstruction =
    projectType === '2' || projectType === '10'
      ? `Does the shape outline ${lookFor}?`
      : `You are looking for ${lookFor}`

  return fallbackInstruction
}
