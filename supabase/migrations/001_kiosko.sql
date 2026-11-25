-- =====================================================================
-- MIGRACIÓN 001 · De tienda de ropa a KIOSKO
-- Pegala entera en: Supabase → SQL Editor → New query → Run
-- Es INCREMENTAL e IDEMPOTENTE: se puede correr varias veces.
-- NO borra productos, categorías ni configuración existentes.
-- Requiere haber corrido antes supabase/schema.sql (instalación original).
-- =====================================================================

-- ---------- Helper: "hoy" en hora de Buenos Aires ----------
create or replace function public.today_ar()
returns date language sql stable as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date
$$;

-- ---------- CATEGORÍAS: +18, ocultar, orden, emoji ----------
alter table public.categories
  add column if not exists is_adult   boolean not null default false,
  add column if not exists is_hidden  boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists emoji      text;

-- ---------- PRODUCTOS: presentación, etiquetas, combos, disponibilidad ----------
alter table public.products
  add column if not exists presentation text,
  add column if not exists tags         text[] not null default '{}',
  add column if not exists kind         text   not null default 'product';

-- in_stock: se crea una sola vez y se completa con el stock viejo (stock > 0)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'in_stock'
  ) then
    alter table public.products add column in_stock boolean not null default true;
    update public.products set in_stock = (coalesce(stock, 0) > 0);
  end if;
end $$;

-- "stock" pasa a ser una cantidad OPCIONAL (puede quedar vacía)
alter table public.products alter column stock drop not null;
alter table public.products alter column stock drop default;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_kind_check') then
    alter table public.products
      add constraint products_kind_check check (kind in ('product', 'combo'));
  end if;
end $$;

create index if not exists products_kind_idx on public.products(kind);

-- ---------- CONFIGURACIÓN DEL KIOSKO (fila única) ----------
alter table public.store_settings
  add column if not exists tagline             text,
  add column if not exists logo_url            text,
  add column if not exists currency            text    not null default 'ARS',
  add column if not exists map_embed_url       text,
  add column if not exists map_coords          text,
  add column if not exists active_theme        text    not null default 'normal',
  add column if not exists campaign_stack_mode text    not null default 'max',
  add column if not exists featured_title      text    not null default 'Destacados',
  add column if not exists promo_ticker        text,
  add column if not exists orders_enabled      boolean not null default true,
  add column if not exists min_order           numeric(12,2) not null default 0,
  add column if not exists delivery_enabled    boolean not null default true,
  add column if not exists delivery_fee        numeric(12,2) not null default 0,
  add column if not exists delivery_zone       text,
  add column if not exists payment_methods     text[]  not null default array['efectivo','transferencia','mercadopago'],
  add column if not exists services            text[]  not null default '{}',
  add column if not exists notice_enabled      boolean not null default false,
  add column if not exists notice_text         text,
  add column if not exists notice_type         text    not null default 'info',
  add column if not exists notice_starts_on    date,
  add column if not exists notice_ends_on      date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'settings_stack_mode_check') then
    alter table public.store_settings add constraint settings_stack_mode_check
      check (campaign_stack_mode in ('max', 'stack'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'settings_notice_type_check') then
    alter table public.store_settings add constraint settings_notice_type_check
      check (notice_type in ('info', 'importante', 'cierre'));
  end if;
  -- Aviso activo => el texto es OBLIGATORIO (también se valida en el panel)
  if not exists (select 1 from pg_constraint where conname = 'settings_notice_text_required') then
    alter table public.store_settings add constraint settings_notice_text_required
      check (not notice_enabled or length(btrim(coalesce(notice_text, ''))) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'settings_amounts_check') then
    alter table public.store_settings add constraint settings_amounts_check
      check (min_order >= 0 and delivery_fee >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'settings_notice_dates_check') then
    alter table public.store_settings add constraint settings_notice_dates_check
      check (notice_ends_on is null or notice_starts_on is null or notice_ends_on >= notice_starts_on);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'settings_map_coords_check') then
    alter table public.store_settings add constraint settings_map_coords_check
      check (map_coords is null or map_coords = ''
             or map_coords ~ '^\s*-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?\s*$');
  end if;
end $$;

-- Textos de ropa → kiosko (solo si todavía tienen el valor original)
alter table public.store_settings alter column store_name set default 'Mi Kiosko';
alter table public.store_settings alter column whatsapp_default_message
  set default 'Hola! Quería consultar por *{producto}*. ¿Está disponible?';
update public.store_settings set store_name = 'Mi Kiosko'
  where id = 1 and store_name = 'Mi Tienda';
update public.store_settings
  set whatsapp_default_message = 'Hola! Quería consultar por *{producto}*. ¿Está disponible?'
  where id = 1 and whatsapp_default_message ilike '%prenda%';

-- ---------- TABLAS NUEVAS ----------
-- Horarios por día (1 = lunes … 7 = domingo). slots = [{"from":"07:00","to":"13:00"}, …]
create table if not exists public.business_hours (
  weekday    smallint primary key check (weekday between 1 and 7),
  is_open    boolean not null default true,
  slots      jsonb   not null default '[]'::jsonb check (jsonb_typeof(slots) = 'array'),
  updated_at timestamptz not null default now()
);

-- Días especiales (feriados, cierres o horario distinto)
create table if not exists public.special_days (
  id         uuid primary key default gen_random_uuid(),
  day        date not null unique,
  reason     text not null check (length(btrim(reason)) > 0),
  is_closed  boolean not null default true,
  slots      jsonb not null default '[]'::jsonb check (jsonb_typeof(slots) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fotos del local (frente / interior)
create table if not exists public.store_photos (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null default 'front' check (kind in ('front', 'interior')),
  image_url  text not null,
  caption    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Campañas de descuento (+ tema asociado opcional)
create table if not exists public.campaigns (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (length(btrim(name)) > 0),
  theme_id         text,
  banner_message   text,
  starts_on        date,
  ends_on          date,
  is_active        boolean not null default false,
  discount_percent integer not null default 0 check (discount_percent between 0 and 100),
  apply_to_all     boolean not null default false,
  category_ids     uuid[] not null default '{}',
  product_ids      uuid[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

-- Contador de vistas por producto (separado, para no tocar updated_at de products)
create table if not exists public.product_views (
  product_id uuid primary key references public.products(id) on delete cascade,
  views      integer not null default 0
);

-- ---------- Triggers updated_at ----------
drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

drop trigger if exists business_hours_set_updated_at on public.business_hours;
create trigger business_hours_set_updated_at
  before update on public.business_hours
  for each row execute function public.set_updated_at();

drop trigger if exists special_days_set_updated_at on public.special_days;
create trigger special_days_set_updated_at
  before update on public.special_days
  for each row execute function public.set_updated_at();

-- ---------- DATOS INICIALES (no pisan nada) ----------
insert into public.categories (name, slug, emoji, is_adult, sort_order) values
  ('Golosinas',   'golosinas',   '🍬', false, 10),
  ('Chocolates',  'chocolates',  '🍫', false, 20),
  ('Bebidas',     'bebidas',     '🥤', false, 30),
  ('Snacks',      'snacks',      '🍿', false, 40),
  ('Helados',     'helados',     '🍦', false, 50),
  ('Almacén',     'almacen',     '🛒', false, 60),
  ('Cigarrillos', 'cigarrillos', '🚬', true,  70),
  ('Limpieza',    'limpieza',    '🧴', false, 80)
on conflict (slug) do nothing;

insert into public.business_hours (weekday, is_open, slots) values
  (1, true,  '[{"from":"07:00","to":"13:00"},{"from":"17:00","to":"23:00"}]'),
  (2, true,  '[{"from":"07:00","to":"13:00"},{"from":"17:00","to":"23:00"}]'),
  (3, true,  '[{"from":"07:00","to":"13:00"},{"from":"17:00","to":"23:00"}]'),
  (4, true,  '[{"from":"07:00","to":"13:00"},{"from":"17:00","to":"23:00"}]'),
  (5, true,  '[{"from":"07:00","to":"13:00"},{"from":"17:00","to":"23:00"}]'),
  (6, true,  '[{"from":"07:00","to":"13:00"},{"from":"17:00","to":"23:00"}]'),
  (7, false, '[]')
on conflict (weekday) do nothing;

-- ---------- VISTA: precio final calculado en UN solo lugar ----------
-- security_invoker: respeta el RLS de quien consulta (anon solo ve lo público).
-- Regla: descuento propio vs. descuento de campaña vigente (la de mayor %).
--   campaign_stack_mode = 'max'   → se aplica el mayor, sin acumular (por defecto)
--   campaign_stack_mode = 'stack' → se acumulan: 1 - (1-propio)*(1-campaña)
-- El precio final se redondea al peso.
create or replace view public.catalog_products
with (security_invoker = true) as
select
  p.id, p.name, p.description, p.presentation, p.tags, p.kind,
  p.price,
  p.discount_percent                       as own_discount_percent,
  p.in_stock, p.stock, p.is_active, p.is_featured, p.image_url,
  p.category_id, p.created_at, p.updated_at,
  c.name                                   as category_name,
  c.slug                                   as category_slug,
  coalesce(c.is_adult, false)              as category_is_adult,
  coalesce(c.is_hidden, false)             as category_hidden,
  camp.id                                  as campaign_id,
  camp.name                                as campaign_name,
  e.eff                                    as discount_percent,
  round(p.price * (1 - e.eff / 100.0))     as final_price,
  case when x.cp > 0 and (st.mode = 'stack' or x.cp > x.own)
       then camp.name end                  as discount_label
from public.products p
left join public.categories c on c.id = p.category_id
left join lateral (
  select ca.id, ca.name, ca.discount_percent
  from public.campaigns ca
  where ca.is_active
    and ca.discount_percent > 0
    and (ca.starts_on is null or ca.starts_on <= public.today_ar())
    and (ca.ends_on   is null or ca.ends_on   >= public.today_ar())
    and (ca.apply_to_all
         or p.id = any (ca.product_ids)
         or (p.category_id is not null and p.category_id = any (ca.category_ids)))
  order by ca.discount_percent desc, ca.created_at desc
  limit 1
) camp on true
cross join lateral (
  select coalesce((select s.campaign_stack_mode from public.store_settings s where s.id = 1), 'max') as mode
) st
cross join lateral (
  select p.discount_percent::numeric as own, coalesce(camp.discount_percent, 0)::numeric as cp
) x
cross join lateral (
  select case when st.mode = 'stack'
              then round(100 * (1 - (1 - x.own / 100.0) * (1 - x.cp / 100.0)), 2)
              else greatest(x.own, x.cp) end as eff
) e;

-- ---------- RPC: registrar una vista de producto (anónimo, solo suma 1) ----------
create or replace function public.register_product_view(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.product_views (product_id, views)
  select id, 1 from public.products where id = p_id and is_active
  on conflict (product_id) do update set views = public.product_views.views + 1;
$$;
revoke all on function public.register_product_view(uuid) from public;
grant execute on function public.register_product_view(uuid) to anon, authenticated;

-- ---------- PERMISOS (grants mínimos) ----------
grant select on public.catalog_products to anon, authenticated;
grant select on public.business_hours, public.special_days, public.store_photos, public.campaigns
  to anon, authenticated;
grant insert, update on public.business_hours to authenticated;
grant insert, update, delete on public.special_days, public.store_photos, public.campaigns to authenticated;
grant select on public.product_views to authenticated;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.business_hours enable row level security;
alter table public.special_days   enable row level security;
alter table public.store_photos   enable row level security;
alter table public.campaigns      enable row level security;
alter table public.product_views  enable row level security;

-- Categorías: el público NO ve las ocultas; el admin ve todas
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select to anon, authenticated using (not is_hidden);

-- Productos: el público solo ve activos y de categorías no ocultas
drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active" on public.products
  for select to anon, authenticated
  using (
    is_active = true
    and (category_id is null
         or exists (select 1 from public.categories c
                    where c.id = products.category_id and not c.is_hidden))
  );

-- Horarios
drop policy if exists "hours_public_read"  on public.business_hours;
drop policy if exists "hours_admin_insert" on public.business_hours;
drop policy if exists "hours_admin_update" on public.business_hours;
create policy "hours_public_read"  on public.business_hours for select to anon, authenticated using (true);
create policy "hours_admin_insert" on public.business_hours for insert to authenticated with check (true);
create policy "hours_admin_update" on public.business_hours for update to authenticated using (true) with check (true);

-- Días especiales
drop policy if exists "special_days_public_read" on public.special_days;
drop policy if exists "special_days_admin_write" on public.special_days;
create policy "special_days_public_read" on public.special_days for select to anon, authenticated using (true);
create policy "special_days_admin_write" on public.special_days for all to authenticated using (true) with check (true);

-- Fotos del local
drop policy if exists "store_photos_public_read" on public.store_photos;
drop policy if exists "store_photos_admin_write" on public.store_photos;
create policy "store_photos_public_read" on public.store_photos for select to anon, authenticated using (true);
create policy "store_photos_admin_write" on public.store_photos for all to authenticated using (true) with check (true);

-- Campañas: el público solo ve las activas y vigentes (hora Argentina); el admin ve todas
drop policy if exists "campaigns_public_read_active" on public.campaigns;
drop policy if exists "campaigns_admin_all"          on public.campaigns;
create policy "campaigns_public_read_active" on public.campaigns
  for select to anon, authenticated
  using (
    is_active
    and (starts_on is null or starts_on <= public.today_ar())
    and (ends_on   is null or ends_on   >= public.today_ar())
  );
create policy "campaigns_admin_all" on public.campaigns
  for all to authenticated using (true) with check (true);

-- Vistas por producto: solo lectura para el admin (el público suma vía RPC)
drop policy if exists "product_views_admin_read" on public.product_views;
create policy "product_views_admin_read" on public.product_views
  for select to authenticated using (true);

-- ---------- STORAGE ----------
-- Se reutiliza el bucket público 'product-images' (carpetas products/, store/, branding/).
-- Sus políticas existentes (lectura pública, escritura solo authenticated) ya alcanzan.

-- ---------- LIMPIEZA OPCIONAL (descomentar solo si querés) ----------
-- Borra las categorías de ropa de ejemplo que no tengan productos:
-- delete from public.categories c
--  where c.slug in ('remeras','pantalones','buzos')
--    and not exists (select 1 from public.products p where p.category_id = c.id);
