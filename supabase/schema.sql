-- ============================================================
-- ORGANIZACIÓN DE ALIMENTOS — esquema inicial de Supabase
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Necesario para poder hashear la contraseña con crypt()
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. CONFIGURACIÓN DEL SITIO (contraseña única de acceso)
-- ------------------------------------------------------------
create table if not exists app_config (
  id int primary key default 1,
  password_hash text not null,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

-- Contraseña inicial: 1928
insert into app_config (id, password_hash)
values (1, crypt('1928', gen_salt('bf')))
on conflict (id) do nothing;

-- Nadie puede leer o escribir esta tabla directamente.
-- Solo se accede a través de las funciones de abajo.
alter table app_config enable row level security;
-- (sin políticas => bloqueada por defecto para anon/authenticated)

-- Verifica la contraseña ingresada. Devuelve true/false.
create or replace function check_site_password(pwd text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from app_config
    where id = 1 and password_hash = crypt(pwd, password_hash)
  );
$$;

-- Cambia la contraseña, pidiendo la actual como confirmación.
create or replace function set_site_password(old_pwd text, new_pwd text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from app_config where id = 1 and password_hash = crypt(old_pwd, password_hash)
  ) then
    return false;
  end if;

  update app_config
  set password_hash = crypt(new_pwd, gen_salt('bf')), updated_at = now()
  where id = 1;

  return true;
end;
$$;

-- Permite que el rol anónimo (el sitio, sin login de Supabase Auth)
-- ejecute estas dos funciones — pero NO leer la tabla directamente.
grant execute on function check_site_password(text) to anon, authenticated;
grant execute on function set_site_password(text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 2. TABLAS BASE PARA LAS PRÓXIMAS ETAPAS
--    (personal fijo/variable, reglas, organizaciones, historial)
--    Se crean ahora para no tener que migrar más adelante;
--    la app todavía no las usa activamente.
-- ------------------------------------------------------------

create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  sector text check (sector in ('cocina','office','menu')) not null,
  puesto text,
  horario_habitual text,
  dias_habituales text[],
  turno text,
  prioridad int default 0,
  observaciones text,
  created_at timestamptz default now()
);

create table if not exists asignaciones_variables (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade,
  dia date not null,
  sector text check (sector in ('cocina','office','menu')),
  horario text,
  turno text,
  created_at timestamptz default now()
);

create table if not exists reglas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activa boolean default true,
  prioridad int default 0,
  hora_desde time,
  hora_hasta time,
  sector text check (sector in ('cocina','office','menu')),
  condicion jsonb,
  created_at timestamptz default now()
);

create table if not exists organizaciones (
  id uuid primary key default gen_random_uuid(),
  tipo text check (tipo in ('semanal','mensual')) not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  archivo_origen text,
  datos jsonb not null,
  created_at timestamptz default now()
);

-- RLS abierta para estas tablas por ahora (un solo equipo, sin login
-- individual). Si más adelante se agrega login por usuario, esto se
-- puede restringir.
alter table personas enable row level security;
alter table asignaciones_variables enable row level security;
alter table reglas enable row level security;
alter table organizaciones enable row level security;

create policy "acceso total personas" on personas for all using (true) with check (true);
create policy "acceso total asignaciones" on asignaciones_variables for all using (true) with check (true);
create policy "acceso total reglas" on reglas for all using (true) with check (true);
create policy "acceso total organizaciones" on organizaciones for all using (true) with check (true);
