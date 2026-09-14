// Calcula o retângulo (bounding box) que envolve os compartimentos de um
// convés, com uma margem. Usado tanto no corte 2D/3D do convés isolado
// quanto no volume externo (casaria) da visão do navio inteiro — assim os
// dois usam exatamente a mesma área, sem discrepância visual entre eles.
export function computeDeckBounds(deck, dims) {
  let minX = -dims.loa * 0.42,
    maxX = dims.loa * 0.42,
    minY = -dims.beam * 0.46,
    maxY = dims.beam * 0.46;

  if (deck.compartments.length > 0) {
    minX = Math.min(...deck.compartments.map((c) => c.x - c.l / 2)) - 1.2;
    maxX = Math.max(...deck.compartments.map((c) => c.x + c.l / 2)) + 1.2;
    minY = Math.min(...deck.compartments.map((c) => c.y - c.w / 2)) - 1.0;
    maxY = Math.max(...deck.compartments.map((c) => c.y + c.w / 2)) + 1.0;
  }

  return { minX, maxX, minY, maxY };
}

export function isOpenDeck(deck) {
  if (deck.compartments.length === 0) return true;
  return deck.compartments.every((c) => c.type === "aberta");
}
