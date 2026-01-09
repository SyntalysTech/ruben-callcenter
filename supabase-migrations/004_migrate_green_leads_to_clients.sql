-- ============================================
-- MIGRACION 004: Convertir leads verdes a clientes
-- Fecha: 2026-01-09
-- Descripcion: Migra todos los leads con status='green' a la tabla clients
-- ============================================
-- EJECUTAR UNA SOLA VEZ para migrar leads existentes
-- ============================================

-- Insertar clientes desde leads verdes que NO tienen ya un cliente asociado
INSERT INTO clients (
  lead_id,
  full_name,
  email,
  phone,
  status,
  signed_at,
  contract_start_date,
  provider,
  monthly_cost,
  total_savings_to_date,
  referral_bonus_paid,
  notes,
  assigned_to
)
SELECT
  l.id as lead_id,
  l.full_name,
  l.email,
  l.phone,
  'signed' as status,
  COALESCE(l.updated_at, l.created_at) as signed_at,
  DATE(COALESCE(l.updated_at, l.created_at)) as contract_start_date,
  'otro' as provider,
  0 as monthly_cost,
  0 as total_savings_to_date,
  false as referral_bonus_paid,
  l.notes,
  l.assigned_to
FROM leads l
WHERE l.status = 'green'
  AND NOT EXISTS (
    SELECT 1 FROM clients c WHERE c.lead_id = l.id
  );

-- Mostrar cuantos se migraron
-- SELECT COUNT(*) as clientes_migrados FROM clients WHERE lead_id IN (SELECT id FROM leads WHERE status = 'green');
