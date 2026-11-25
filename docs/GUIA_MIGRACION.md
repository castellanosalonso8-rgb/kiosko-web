# Guía corta: aplicar la migración sin perder datos

1. **Backup** (opcional pero recomendado): Supabase → Database → Backups, o exportá `products` y `categories` desde Table Editor.
2. Supabase → **SQL Editor → New query**. Pegá todo `supabase/migrations/001_kiosko.sql` y tocá **Run**.
3. Es **idempotente**: si falla a la mitad o querés repetirla, correla de nuevo. No borra nada.
4. Qué pasa con lo que ya tenés:
   - **Productos y categorías**: se conservan. Los productos con `stock = 0` quedan **Agotado**; el resto, **Disponible**. El stock numérico queda como "cantidad" opcional.
   - Las categorías de ropa (Remeras, Pantalones, Buzos) **siguen existiendo**; se suman las del kiosko. Borrá las viejas desde el panel (Categorías) o descomentá el bloque "Limpieza opcional" al final del SQL (solo borra las que no tienen productos).
   - Si el nombre del local era "Mi Tienda" pasa a "Mi Kiosko"; el mensaje de WhatsApp con "prenda" se reemplaza. Lo que ya personalizaste no se toca.
5. Verificá: Table Editor debería mostrar `business_hours` (7 filas), `campaigns`, `special_days`, `store_photos`, `product_views` y la vista `catalog_products`.
6. En **Authentication → Providers → Email** desactivá el registro público de usuarios.
7. Desplegá el código nuevo (Vercel/Netlify) con las mismas variables de entorno.

Si algo sale mal: restaurá el backup y avisame el mensaje de error del SQL Editor.
