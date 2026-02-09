# Leadflow CRM (Personal)

Mini CRM de prospeccion para gestionar leads en un pipeline con Kanban.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM
- SQLite (por defecto), listo para migrar a Postgres

## Requisitos
- Node.js 20+
- npm

## Configuracion
1) Instalar dependencias
```bash
npm install
```

2) Configurar base de datos (SQLite por defecto)
```bash
npx prisma migrate dev
```

3) Ejecutar en desarrollo
```bash
npm run dev
```

La app corre en http://localhost:3000

## Scripts utiles
- `npm run dev` - modo desarrollo
- `npm run build` - build de produccion
- `npm run start` - iniciar build de produccion

## Arquitectura basica
- `src/app/(app)` - layout con sidebar y vistas
- `src/app/api` - API routes
- `src/components` - UI y vistas
- `src/lib` - Prisma client y utilidades

## Notas
- El datasource esta en `.env` (`DATABASE_URL="file:./dev.db"`).
- Para migrar a Postgres, actualiza `DATABASE_URL` y ejecuta `npx prisma migrate dev`.
