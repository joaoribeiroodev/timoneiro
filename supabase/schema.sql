-- Timoneiro — schema inicial
-- Rode este script no SQL editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

-- Trigger genérico para manter updated_at em dia (usado por várias tabelas)
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  name text not null,
  email text,
  password_hash text not null,
  role text not null default 'tecnico' check (role in ('admin', 'tecnico', 'visualizador')),
  created_at timestamptz not null default now()
);

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  vessel_slug text not null,
  deck_code text not null,
  type text not null check (type in ('camera', 'tv')),
  name text not null,
  model text,
  serial_number text,
  ip_address text,
  area_name text,
  install_date date,
  status text not null default 'ativo' check (status in ('ativo', 'manutencao', 'inativo')),
  pos_x numeric not null,
  pos_y numeric not null,
  notes text,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipment_vessel_deck_idx on equipment (vessel_slug, deck_code);

drop trigger if exists equipment_set_updated_at on equipment;
create trigger equipment_set_updated_at
  before update on equipment
  for each row execute function set_updated_at();

-- Embarcações: dimensões e conveses editáveis via /admin/navios, sem
-- precisar mexer no código. "decks" guarda a lista de conveses e seus
-- compartimentos como JSON (mesmo formato usado antes em lib/vessels.js).
-- "gltf_url" aponta pro modelo 3D real (.glb) no Storage, quando houver.
create table if not exists vessels (
  slug text primary key,
  name text not null,
  shipyard text,
  doc text,
  loa numeric not null,
  lpp numeric,
  beam numeric,
  depth numeric,
  draft numeric,
  crew integer,
  passengers integer,
  hull_type text not null default 'duplo-castelo',
  gltf_url text,
  decks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists vessels_set_updated_at on vessels;
create trigger vessels_set_updated_at
  before update on vessels
  for each row execute function set_updated_at();

-- Histórico de manutenção por equipamento (câmera ou TV).
create table if not exists equipment_maintenance (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  date date not null default current_date,
  type text not null default 'preventiva' check (type in ('preventiva', 'corretiva', 'instalacao', 'outro')),
  description text not null,
  performed_by text,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create index if not exists equipment_maintenance_equipment_idx on equipment_maintenance (equipment_id, date desc);

-- Bucket público de Storage para os arquivos .glb de cada embarcação
-- (quando houver um modelo 3D real/CAD). Upload é feito pela API com a
-- service role key; o bucket é público só para leitura (o navegador do
-- usuário busca o .glb diretamente por URL).
insert into storage.buckets (id, name, public)
values ('models', 'models', true)
on conflict (id) do nothing;

-- RLS habilitado, sem policies públicas: todo acesso passa pela service
-- role key no backend (Next.js API routes), igual ao padrão do ITS-Demandas.
alter table users enable row level security;
alter table equipment enable row level security;
alter table vessels enable row level security;
alter table equipment_maintenance enable row level security;

-- Usuário admin inicial: senha "timoneiro123" (troque no primeiro acesso)
-- Hash gerado com bcrypt, custo 10. Gere o seu próprio com:
--   node -e "console.log(require('bcryptjs').hashSync('SUA_SENHA', 10))"
insert into users (username, name, email, password_hash, role)
values (
  'ti.salvador',
  'TI Salvador',
  'tisalvador@internacionalmaritima.com.br',
  '$2a$10$Z9WeQ/E6ApNAYoAVsCBoteg.mhhSqHbzqrRVlkDkrVYCSWW3LjPtu',
  'admin'
)
on conflict (username) do nothing;
