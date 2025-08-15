export interface ImageTask {
  taskId: string;
  fileName: string;
  url: string;
  width: number;
  height: number;
  bbox: [number, number, number, number];
}

export interface TileTask {
  groupId: string;
  projectId: string;
  taskX: number;
  taskY: number;
  taskZ: number;
  taskId: string;
  url: string;
  urlB?: string;
}

export interface TutorialTileTask extends TileTask {
  screen: number;
  referenceAnswer: number;
}

export interface CustomOption {
  mdiIcon: string;
  description: string;
  iconColor: string;
  shortKey: number;
  title: string;
  value: number;
}

export interface DefaultOption {
  color: string;
  label: string;
  value: number;
}

export interface TileServer {
  apiKey: string;
  credits: string;
  name: string;
  url: string;
  maxZoom?: number;
  imagerySet?: string;
  wmtsLayerName?: string;
}

export interface VectorTileServer {
  circleColor: string;
  circleOpacity: number;
  circleRadius: number;
  fillColor: string;
  fillOpacity: number;
  lineColor: string;
  lineDasharray: [number, number];
  lineOpacity: number;
  lineWidth: number;
  tileServer: {
    credits: string;
    maxZoom: number;
    minZoom: number;
    name: string;
    url: string;
    sourceLayer: string;
  }
}

export type OverlayTileServer = {
    type: 'vector'
    vector: VectorTileServer;
  } | {
    type: 'raster';
    raster: TileServer;
}

export interface Project {
  projectId: string;
  zoomLevel: number;
  tileServer: TileServer;
  tileServerB?: TileServer;
  overlayTileServer?: OverlayTileServer;
  lookFor: string;
  projectTopic: string;
  manualUrl?: string;
  projectType: string;
}

interface Screen {
  title: string
  icon: string
  description: string
}

export interface Tutorial {
  projectId: string
  name: string
  lookFor?: string
  exampleImage1?: string;
  exampleImage2?: string;
  screens: {
    hint: Screen
    instructions: Screen
    success: Screen
  }[]
}

export interface TaskGroup {
  groupId: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}
