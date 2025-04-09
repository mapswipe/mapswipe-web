import osmtogeojson from 'osmtogeojson'

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter'

export async function fetchFeaturesFromOverpass(bbox: string, filter: string) {
  const query = `[out:json][bbox];${filter}; out meta; out geom;`

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      body: new URLSearchParams({
        data: query,
        bbox: bbox,
      }),
    })
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    const json = await response.json()
    const geojson = osmtogeojson(json, { flatProperties: true })
    const features = geojson.features
    return features
  } catch (error) {
    console.error('Error fetching geometries:', error)
    throw error
  }
}
