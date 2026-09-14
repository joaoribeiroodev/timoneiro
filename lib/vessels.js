// Constantes compartilhadas pelo app. Os dados das embarcações (dimensões,
// conveses e compartimentos) NÃO ficam mais neste arquivo — eles moraram
// aqui até a versão anterior, mas agora vivem na tabela `vessels` do
// Supabase e são editáveis em /admin/navios sem mexer em código.
// Os dados originais foram migrados para supabase/seed-vessels.json —
// rode `npm run seed` uma vez para carregá-los no banco.

export const COMPARTMENT_COLORS = {
  garagem: "#4a5568",
  salao: "#8ac640",
  maquinas: "#c1462f",
  comando: "#00335e",
  camarote: "#5c85ab",
  servico: "#e8a33d",
  paiol: "#7a6a53",
  tecnico: "#7a6a53",
  aberta: "#a3d966",
};

export const COMPARTMENT_TYPES = [
  { value: "garagem", label: "Garagem" },
  { value: "salao", label: "Salão de passageiros" },
  { value: "maquinas", label: "Praça de máquinas" },
  { value: "comando", label: "Comando / passadiço" },
  { value: "camarote", label: "Camarote" },
  { value: "servico", label: "Serviço (copa, bar, WC...)" },
  { value: "paiol", label: "Paiol / tanque" },
  { value: "tecnico", label: "Técnico" },
  { value: "aberta", label: "Área aberta" },
];

export const EQUIPMENT_TYPES = [
  { value: "camera", label: "Câmera" },
  { value: "tv", label: "Televisão" },
];

export const EQUIPMENT_STATUS = [
  { value: "ativo", label: "Ativo" },
  { value: "manutencao", label: "Em manutenção" },
  { value: "inativo", label: "Inativo" },
];

export const MAINTENANCE_TYPES = [
  { value: "preventiva", label: "Preventiva" },
  { value: "corretiva", label: "Corretiva" },
  { value: "instalacao", label: "Instalação" },
  { value: "outro", label: "Outro" },
];
