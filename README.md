# Kiosko · React + Vite + Supabase

Catálogo de kiosko con pedido por WhatsApp, horarios en vivo, ubicación, temáticas por fecha, campañas de descuento y panel de admin oculto en `/admin`. Adaptado de la tienda de ropa reutilizando su base (catálogo, fotos, categorías, auth, RLS).

## Arranque
```bash
cp .env.example .env     # VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev              # npm run build para producción
```
Base de datos: **instalación nueva** → `supabase/schema.sql` y después `supabase/migrations/001_kiosko.sql`. **Tienda ya en uso** → solo la migración (ver `docs/GUIA_MIGRACION.md`).

> ⚠️ **Seguridad:** en Supabase → Authentication → Providers → Email, **desactivá "Allow new users to sign up"**. Las políticas de escritura son para cualquier usuario `authenticated`: si el registro público está abierto, cualquiera podría registrarse y editar. Creá el usuario del dueño a mano (Authentication → Users → Add user).

## Estructura
```
supabase/migrations/001_kiosko.sql   Migración incremental e idempotente
src/themes/                          UN archivo por tema (index.js los detecta con import.meta.glob)
src/lib/hours.js                     Abierto/Cerrado en America/Argentina/Buenos_Aires
src/context/                         Settings, Theme, Hours, Cart, Toast, UI(confirm), Auth
src/components/store/                Header, Hero, Ticker, Notice, catálogo, carrito, ubicación…
src/components/decor/                Decoraciones livianas (solo se montan si el tema las pide)
src/admin/                           resources.jsx (recursos declarados) + CrudPage + formKit + SettingsForm
src/admin/sections.jsx               Lista de secciones del panel
```

## Cómo se suma…
- **Un tema**: copiar `src/themes/normal.js` → `{id, name, emoji, order, preview, vars, decorations:[{component, props}], messages}`. Aparece solo en el admin y en `/demo`.
- **Una sección del admin**: declarar un recurso en `src/admin/resources.jsx` (`{title, singular, table, fields, card, …}`) y agregarlo a `sections.jsx`.

## Reglas de precio (un solo lugar)
La vista SQL `catalog_products` calcula `final_price`. Por defecto se aplica el **mayor** entre el descuento propio del producto y el de la campaña vigente (sin acumular); en Datos del kiosko se puede cambiar a "acumular". El frontend solo muestra el resultado. El precio final se redondea al peso.

## Decisiones
- Fotos en el mismo bucket `product-images` (carpetas `products/`, `store/`, `branding/`).
- `stock` pasó a ser una cantidad opcional; la disponibilidad real es `in_stock` (Disponible/Agotado).
- Campañas: un % por campaña; categorías/productos guardados como arrays de ids.
- Vistas de producto: tabla aparte `product_views` + RPC pública que solo suma 1.
