// Converte uma linha da tabela `vessels` (colunas soltas: loa, beam...)
// para o formato aninhado que os componentes 3D já esperavam
// (vessel.dims.loa, vessel.dims.beam...). Mantém ThreeViewer, deck.js,
// exterior.js e bounds.js exatamente como estavam.
export function dbRowToVessel(row) {
  return {
    slug: row.slug,
    name: row.name,
    shipyard: row.shipyard,
    doc: row.doc,
    hullType: row.hull_type,
    gltfUrl: row.gltf_url || null,
    dims: {
      loa: Number(row.loa),
      lpp: row.lpp !== null ? Number(row.lpp) : null,
      beam: Number(row.beam),
      depth: Number(row.depth),
      draft: Number(row.draft),
      crew: row.crew,
      passengers: row.passengers,
    },
    decks: row.decks || [],
  };
}

// Converte o formato aninhado de volta para colunas soltas, pra gravar
// via PUT /api/vessels/[slug].
export function vesselToDbRow(vessel) {
  return {
    name: vessel.name,
    shipyard: vessel.shipyard,
    doc: vessel.doc,
    loa: vessel.dims.loa,
    lpp: vessel.dims.lpp,
    beam: vessel.dims.beam,
    depth: vessel.dims.depth,
    draft: vessel.dims.draft,
    crew: vessel.dims.crew,
    passengers: vessel.dims.passengers,
    hull_type: vessel.hullType,
    decks: vessel.decks,
  };
}
