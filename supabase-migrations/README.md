# Supabase Migrations

Historial de migraciones SQL para el CRM Calidad Energia.

## Como ejecutar

Ejecutar cada archivo en orden en el **SQL Editor** de Supabase.

## Migraciones

### 001_initial_schema.sql
- **Fecha**: 2026-01-08
- **Descripcion**: Schema inicial
- **Tablas**: user_profiles, leads, lead_notes, call_accounts, call_logs, call_recordings, call_metrics_daily
- **RLS**: Configurado para todas las tablas

### 002_energy_clients_reminders.sql
- **Fecha**: 2026-01-09
- **Descripcion**: Sistema de gestion de clientes
- **Tablas**:
  - `energy_studies` - Estudios energeticos (con/sin factura)
  - `clients` - Clientes firmados
  - `client_reminders` - Recordatorios automaticos
  - `referrals` - Programa de referidos (20EUR)
- **Funciones**:
  - `create_client_reminders()` - Trigger que crea recordatorios automaticos al firmar:
    - Dia 1: Bienvenida
    - Semana 1: Confirmacion
    - 2 meses: Revision + Referidos
    - 4 meses: Consulta incidencias
    - 6 meses: Seguimiento
    - 12 meses: Renovacion

## Nota importante

Si ya tienes la migracion 001 aplicada, solo ejecuta la 002.

Si te da error de "policy already exists", es porque ya la ejecutaste antes. En ese caso, solo necesitas ejecutar las tablas nuevas sin las politicas que ya existen.
