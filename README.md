# CRM Calidad Energia

Panel de gestion de leads para Calidad Energia.

## Funcionalidades

- **Dashboard**: Vista general con KPIs (total leads, nuevos ultimos 7 dias, cerrados, pendientes)
- **Gestion de Leads**: CRUD completo con busqueda y filtros por estado
- **Estados de Lead**:
  - Rojo: No es posible hacerle el contrato
  - Amarillo: No contesta
  - Naranja: Mas adelante / intentar de nuevo
  - Azul: Programado para mas tarde
  - Verde: Cerrado / firmado
- **Notas**: Historial de notas por lead
- **Call Center**: Placeholders preparados para futuras integraciones

## Requisitos

- Node.js 18+
- Cuenta de Supabase

## Instalacion

1. Clonar el repositorio

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env.local
```

4. Editar `.env.local` con tus credenciales de Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

5. Crear las tablas en Supabase:
   - Ve a tu proyecto en Supabase
   - Abre el SQL Editor
   - Copia y ejecuta el contenido de `supabase/schema.sql`

6. Crear un usuario para acceso:
   - En Supabase, ve a Authentication > Users
   - Crea un nuevo usuario con email y password

7. Ejecutar en desarrollo:
```bash
npm run dev
```

## Deploy en Vercel

1. Conectar el repositorio a Vercel
2. Configurar las variables de entorno en Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automatico

## Estructura del proyecto

```
src/
  app/
    (auth)/
      login/          # Pagina de login
    (dashboard)/
      dashboard/      # Dashboard con KPIs
      leads/          # Listado y CRUD de leads
        [id]/         # Detalle y edicion de lead
      call-center/    # Placeholders call center
        saldo/
        llamadas/
        grabaciones/
        metricas/
  components/         # Componentes reutilizables
  lib/               # Configuracion Supabase y tipos
supabase/
  schema.sql         # Schema SQL para Supabase
```

## Modelo de datos

### leads
- id, created_at, updated_at
- full_name, email, phone
- contact_date, status, notes
- assigned_to (para futuro)

### lead_notes
- id, lead_id, created_at
- note, created_by

### Tablas Call Center (schema listo, sin integracion)
- call_accounts
- call_logs
- call_recordings
- call_metrics_daily

## Tecnologias

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Supabase (Auth + Database)
- Lucide Icons
- date-fns
