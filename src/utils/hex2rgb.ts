const hex2rgb = (hex: string, alpha: number = 1): [number, number, number, number] => {
  const r: number = parseInt(hex.slice(1, 3), 16)
  const g: number = parseInt(hex.slice(3, 5), 16)
  const b: number = parseInt(hex.slice(5, 7), 16)
  return [r, g, b, alpha]
}

export default hex2rgb
