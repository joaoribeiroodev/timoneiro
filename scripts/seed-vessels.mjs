// Carrega supabase/seed-vessels.json na tabela `vessels`.
// Rode uma vez, depois de aplicar supabase/schema.sql:
//
//   node scripts/seed-vessels.mjs
//
// Lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local (mesmo
// arquivo usado pelo Next.js) sem precisar instalar dotenv.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const content = readFileSync(join(__dirname, "..", ".env.local"), "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!match) return;
      const key = match[1];
      let value = match[2] || "";
      value = value.replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    });
  } catch {
    // sem .env.local — segue com o que já estiver no ambiente
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Configure o .env.local antes de rodar este script."
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const vessels = JSON.parse(
    readFileSync(join(__dirname, "..", "supabase", "seed-vessels.json"), "utf-8")
  );

  for (const v of vessels) {
    const { error } = await supabase.from("vessels").upsert(
      {
        slug: v.slug,
        name: v.name,
        shipyard: v.shipyard,
        doc: v.doc,
        loa: v.loa,
        lpp: v.lpp,
        beam: v.beam,
        depth: v.depth,
        draft: v.draft,
        crew: v.crew,
        passengers: v.passengers,
        hull_type: v.hull_type,
        gltf_url: v.gltf_url || null,
        decks: v.decks,
      },
      { onConflict: "slug" }
    );
    if (error) {
      console.error(`Falhou ao gravar ${v.slug}:`, error.message);
    } else {
      console.log(`OK — ${v.slug}`);
    }
  }

  console.log("Concluído.");
}

main();
