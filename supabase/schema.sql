-- =====================================================================
-- TIENDA DE ROPA · Esquema completo para Supabase
-- Pegalo entero en: Supabase → SQL Editor → New query → Run
-- Se puede correr más de una vez sin romper nada.
-- =====================================================================

-- ---------- TABLAS ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  price            numeric(12,2) not null check (price > 0),
  discount_percent integer not null default 0 check (discount_percent between 0 and 100),
  stock            integer not null default 0 check (stock >= 0),
  is_active        boolean not null default true,
  is_featured      boolean not null default false,
  image_url        text,
  category_id      uuid references public.categories(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_created_idx  on public.products(created_at desc);

-- Una sola fila (id siempre = 1)
create table if not exists public.store_settings (
  id                       integer primary key default 1 check (id = 1),
  store_name               text not null default 'Mi Tienda',
  whatsapp_number          text,
  whatsapp_default_message text not null default 'Hola! Quería consultar por la prenda *{producto}*. ¿Está disponible?',
  instagram_username       text,
  address                  text,
  opening_hours            text,
  updated_at               timestamptz not null default now()
);

-- ---------- updated_at automático ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists settings_set_updated_at on public.store_settings;
create trigger settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- ---------- DATOS INICIALES ----------
insert into public.store_settings
  (id, store_name, whatsapp_number, whatsapp_default_message, instagram_username, address, opening_hours)
values
  (1, 'Mi Tienda', '5491112345678',
   'Hola! Quería consultar por la prenda *{producto}*. ¿Está disponible?',
   'mitienda', 'Av. Corrientes 1234, CABA, Argentina', 'Lunes a Sábado de 10 a 19 hs')
on conflict (id) do nothing;

insert into public.categories (name, slug) values
  ('Remeras', 'remeras'),
  ('Pantalones', 'pantalones'),
  ('Buzos', 'buzos')
on conflict (slug) do nothing;

-- ---------- PERMISOS (grants) ----------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.store_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant insert, update on public.store_settings to authenticated;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.store_settings enable row level security;

-- Categorías
drop policy if exists "categories_public_read"  on public.categories;
drop policy if exists "categories_admin_write"  on public.categories;
create policy "categories_public_read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated using (true) with check (true);

-- Productos: el público solo ve los activos; el admin ve todos
drop policy if exists "products_public_read_active" on public.products;
drop policy if exists "products_admin_read_all"     on public.products;
drop policy if exists "products_admin_insert"       on public.products;
drop policy if exists "products_admin_update"       on public.products;
drop policy if exists "products_admin_delete"       on public.products;
create policy "products_public_read_active" on public.products
  for select to anon, authenticated using (is_active = true);
create policy "products_admin_read_all" on public.products
  for select to authenticated using (true);
create policy "products_admin_insert" on public.products
  for insert to authenticated with check (true);
create policy "products_admin_update" on public.products
  for update to authenticated using (true) with check (true);
create policy "products_admin_delete" on public.products
  for delete to authenticated using (true);

-- Datos de la tienda
drop policy if exists "settings_public_read"  on public.store_settings;
drop policy if exists "settings_admin_insert" on public.store_settings;
drop policy if exists "settings_admin_update" on public.store_settings;
create policy "settings_public_read" on public.store_settings
  for select to anon, authenticated using (true);
create policy "settings_admin_insert" on public.store_settings
  for insert to authenticated with check (id = 1);
create policy "settings_admin_update" on public.store_settings
  for update to authenticated using (true) with check (id = 1);

-- ---------- STORAGE: bucket público para fotos ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "product_images_public_read"  on storage.objects;
drop policy if exists "product_images_admin_insert" on storage.objects;
drop policy if exists "product_images_admin_update" on storage.objects;
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
create policy "product_images_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');
create policy "product_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
