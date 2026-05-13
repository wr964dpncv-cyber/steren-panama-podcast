# Steren Panamá · Podcast Studio Booking

Aplicación Next.js para que los clientes reserven el podcast studio. Horario 9:00 am – 6:00 pm, bloques de 1 hora con selección múltiple.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Vercel Postgres (`@vercel/postgres`)

## Setup local
```bash
npm install
# Crea .env.local con tus credenciales de Vercel Postgres:
#   POSTGRES_URL=...
#   POSTGRES_URL_NON_POOLING=...
npm run dev
```
La tabla `bookings` se crea automáticamente en la primera llamada a la API.

## Deploy
1. Push del repo a GitHub.
2. Importar el repo en Vercel.
3. En el dashboard del proyecto → **Storage** → crear una base **Postgres** y conectarla. Vercel inyecta las variables `POSTGRES_*` automáticamente.
4. Redeploy y listo.

## Estructura
- `app/page.tsx` — formulario de reserva (cliente).
- `app/api/availability/route.ts` — `GET ?date=YYYY-MM-DD` devuelve horas ocupadas.
- `app/api/bookings/route.ts` — `POST` crea reservas con validación + comprobación de conflicto.
- `lib/db.ts` — conexión + auto-creación del esquema.

## Ver reservas
Desde el dashboard de Vercel → Storage → tu Postgres → **Data** o **Query**:
```sql
SELECT * FROM bookings ORDER BY booking_date, start_hour;
```
