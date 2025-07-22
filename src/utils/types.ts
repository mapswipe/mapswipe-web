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

export interface CustomOption {
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

export interface Project {
  projectId: string;
  zoomLevel: number;
  tileServer: TileServer;
  tileServerB?: TileServer;
  lookFor: string;
  projectTopic: string;
}

export interface TaskGroup {
  groupId: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

