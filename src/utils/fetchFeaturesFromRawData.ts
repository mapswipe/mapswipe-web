const RAW_DATA_API_URL = 'https://api-prod.raw-data.hotosm.org'

const geomFromExtent = (extent) => {
  const [xmin, ymin, xmax, ymax] = extent
  const geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [xmin, ymin],
        [xmin, ymax],
        [xmax, ymax],
        [xmax, ymin],
        [xmin, ymin],
      ],
    ],
  }
  return geometry
}

export async function fetchFeaturesFromRawData(extent, filters) {
  const geom = geomFromExtent(extent)
  const snapshotPlainEndpoint = new URL('/v1/snapshot/plain/', RAW_DATA_API_URL)
  const response = await fetch(snapshotPlainEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      outputType: 'geojson',
      geometryType: ['polygon'],
      centroid: false,
      useStWithin: true,
      includeUserMetadata: false,
      filters: filters,
      includeStatsHtml: false,
      includeTranslit: false,
      geometry: geom,
    }),
  })
  if (!response.ok) {
    throw new Error(`Error: ${response.statusText}`)
  }
  const geojson = await response.json()
  const features = geojson.features
  return features
}
