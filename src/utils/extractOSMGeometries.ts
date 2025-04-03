const OHSOME_API_URL = 'https://api.ohsome.org/v1/elements/geometry'

export async function extractGeometries(bbox: string, filter: string, time: string) {
  try {
    const response = await fetch(OHSOME_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        bboxes: bbox,
        filter: filter,
        time: time,
        properties: 'metadata',
        clipGeometry: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }

    const data = await response.json()

    return data.features.map((feature: any) => feature.geometry)
  } catch (error) {
    console.error('Error fetching geometries:', error)
    throw error
  }
}
