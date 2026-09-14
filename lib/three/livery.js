// Esquemas de pintura de cada embarcação, baseados nas fotos reais
// enviadas (marinetraffic). Isso é só aparência (cor/estilo de janela) —
// não afeta dimensões nem compartimentos, que continuam vindo do banco.
const LIVERIES = {
  "dorival-caymmi": {
    hullColor: 0xf4f0e4, // branco
    belowWaterColor: 0x5a3a2c, // antiincrustante marrom-avermelhado
    stripeColor: 0x0a4a7d, // faixa azul
    houseColor: 0xffffff,
    windowStyle: "strip",
  },
  "rio-paraguacu": {
    hullColor: 0x14314f, // casco azul-marinho sólido, sem faixa contrastante
    belowWaterColor: 0x0c2338,
    stripeColor: 0x14314f,
    houseColor: 0xf2efe6,
    windowStyle: "sparse",
  },
  "maria-bethania": {
    hullColor: 0xf4f0e4,
    belowWaterColor: 0x0c2a45, // antiincrustante azul-escuro (não marrom)
    stripeColor: 0x0a4a7d,
    houseColor: 0xffffff,
    windowStyle: "strip",
  },
  "zumbi-dos-palmares": {
    hullColor: 0xf4f0e4,
    belowWaterColor: 0x5a3a2c,
    stripeColor: 0x8ac640, // faixa verde da marca
    houseColor: 0xffffff,
    windowStyle: "strip",
  },
};

const DEFAULT_LIVERY = {
  hullColor: 0xf4f0e4,
  belowWaterColor: 0x5a3a2c,
  stripeColor: 0x0a4a7d,
  houseColor: 0xffffff,
  windowStyle: "strip",
};

export function getLivery(slug) {
  return LIVERIES[slug] || DEFAULT_LIVERY;
}
