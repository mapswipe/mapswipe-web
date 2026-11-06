import type { TileServer } from './types'

export interface ValidateImagery {
  // NOTE: With `hasPreImagery`, this is the update-app image for older apps and is never shown
  tileServer: TileServer
  hasPreImagery?: boolean
  preEventTileServer?: TileServer
  postEventTileServer?: TileServer
}

// Undefined when pre-event imagery is expected but a pre-event or post-event server is missing
const getValidateTileServers = (
  imagery: ValidateImagery,
): { tileServer: TileServer; preEventTileServer?: TileServer } | undefined => {
  const { tileServer, hasPreImagery, preEventTileServer, postEventTileServer } = imagery

  if (!hasPreImagery) {
    return { tileServer }
  }
  if (!preEventTileServer || !postEventTileServer) {
    return undefined
  }
  return { tileServer: postEventTileServer, preEventTileServer }
}

export default getValidateTileServers
