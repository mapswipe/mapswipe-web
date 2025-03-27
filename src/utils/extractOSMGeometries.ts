const OHSOME_API_URL = "https://api.ohsome.org/v1/elements/geometry";

export async function extractGeometries(bbox: string, filter: string, time: string) {
  try {
    const response = await fetch(OHSOME_API_URL, {
      method: 'POST',
      headers:{
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
          bboxes: "85.5189500685426793,27.6315268785445447,85.5210126584249792,27.6342666694473813",
          filter: "building=* and geometry:polygon",
          time: "2024-03-25",
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("data", data)
    return data.features.map((feature: any) => feature.geometry);
  } catch (error) {
    console.error("Error fetching geometries:", error);
    throw error;
  }
}
