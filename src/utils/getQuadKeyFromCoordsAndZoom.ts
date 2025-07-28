const getQuadKeyFromCoordsAndZoom = (x: number, y: number, zoom: number) => {
  // Create a quadkey for use with certain tileservers that use them, e.g. Bing
  let quadKey = ''
  for (let i = zoom; i > 0; i -= 1) {
    let digit = 0
    /* eslint-disable no-bitwise */
    const mask = 1 << (i - 1)
    if ((x & mask) !== 0) {
      digit += 1
    }
    if ((y & mask) !== 0) {
      digit += 2
    }
    /* eslint-enable no-bitwise */
    quadKey += digit.toString()
  }
  return quadKey
}

export default getQuadKeyFromCoordsAndZoom
