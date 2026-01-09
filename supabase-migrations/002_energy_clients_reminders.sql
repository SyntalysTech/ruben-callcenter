-- ============================================
-- MIGRACION 002: Estudios energeticos, clientes, recordatorios y referidos
-- Fecha: 2026-01-09
-- Descripcion: Sistema completo de gestion de clientes firmados
-- ============================================
-- IMPORTANTE: Ejecutar SOLO si ya tienes la migracion 001 aplicada
-- ============================================

-- ============================================
-- TABLA: energy_studies (estudios energeticos)
-- ============================================
CREATE TABLE IF NOT EXISTS energy_studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Datos factura actual (si tiene)
  has_invoice BOOLEAN DEFAULT false,
  current_provider TEXT CHECK (current_provider IN ('iberdrola', 'endesa', 'naturgy', 'repsol', 'totalenergies', 'otro')),
  current_monthly_cost NUMERIC(10, 2),
  current_power_p1 NUMERIC(10, 3), -- kW
  current_power_p2 NUMERIC(10, 3), -- kW
  current_consumption_annual NUMERIC(10, 2), -- kWh

  -- Datos propuesta nueva
  new_provider TEXT NOT NULL CHECK (new_provider IN ('iberdrola', 'endesa', 'naturgy', 'repsol', 'totalenergies', 'otro')),
  new_monthly_cost NUMERIC(10, 2) NOT NULL,
  new_power_p1 NUMERIC(10, 3),
  new_power_p2 NUMERIC(10, 3),

  -- Servicios adicionales
  has_maintenance_insurance BOOLEAN DEFAULT false,
  maintenance_insurance_cost NUMERIC(10, 2),
  has_pac_iberdrola BOOLEAN DEFAULT false,
  pac_cost NUMERIC(10, 2),
  other_services TEXT,
  other_services_cost NUMERIC(10, 2),

  -- Ahorro calculado
  monthly_savings NUMERIC(10, 2) DEFAULT 0,
  annual_savings NUMERIC(10, 2) DEFAULT 0,

  -- Condiciones
  contract_duration_months INTEGER DEFAULT 12,
  special_conditions TEXT,

  -- IA genero el estudio?
  ai_generated BOOLEAN DEFAULT false,
  ai_error TEXT,

  -- PDF generado
  pdf_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_energy_studies_lead_id ON energy_studies(lead_id);

DROP TRIGGER IF EXISTS update_energy_studies_updated_at ON energy_studies;
CREATE TRIGGER update_energy_studies_updated_at
  BEFORE UPDATE ON energy_studies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: clients (clientes firmados)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  energy_study_id UUID REFERENCES energy_studies(id) ON DELETE SET NULL,

  -- Info del cliente
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  dni TEXT,

  -- Contrato
  signed_at TIMESTAMPTZ,
  contract_start_date DATE,
  contract_end_date DATE,
  provider TEXT NOT NULL CHECK (provider IN ('iberdrola', 'endesa', 'naturgy', 'repsol', 'totalenergies', 'otro')),
  monthly_cost NUMERIC(10, 2) NOT NULL,

  -- Ahorro tracking
  total_savings_to_date NUMERIC(10, 2) DEFAULT 0,

  -- Estado y recordatorios
  status TEXT NOT NULL DEFAULT 'signed' CHECK (status IN (
    'pending_signature', 'signed', 'reminder_day1', 'reminder_week1',
    'reminder_month2', 'reminder_month4', 'reminder_month6', 'reminder_month12', 'renewed'
  )),
  last_reminder_sent TIMESTAMPTZ,
  next_reminder_date DATE,

  -- Referidos
  referred_by_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  referral_bonus_paid BOOLEAN DEFAULT false,

  -- Notas
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_next_reminder ON clients(next_reminder_date);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON clients(lead_id);

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA: client_reminders (recordatorios programados)
-- ============================================
CREATE TABLE IF NOT EXISTS client_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN (
    'day1_welcome', 'week1_confirmation', 'month2_checkup',
    'month4_checkup', 'month6_checkup', 'month12_renewal', 'referral_program'
  )),
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  result TEXT CHECK (result IN ('pending', 'contacted', 'no_answer', 'rescheduled', 'completed'))
);

CREATE INDEX IF NOT EXISTS idx_client_reminders_client_id ON client_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_scheduled_date ON client_reminders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_client_reminders_completed ON client_reminders(completed);

-- ============================================
-- TABLA: referrals (programa de referidos - 20EUR por referido)
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  referrer_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  referred_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  referred_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  bonus_amount NUMERIC(10, 2) DEFAULT 20.00,
  bonus_paid BOOLEAN DEFAULT false,
  bonus_paid_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_lead ON referrals(referred_lead_id);

-- ============================================
-- RLS para nuevas tablas
-- ============================================

ALTER TABLE energy_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Politicas para energy_studies
CREATE POLICY "Usuarios autenticados pueden ver estudios" ON energy_studies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear estudios" ON energy_studies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar estudios" ON energy_studies
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar estudios" ON energy_studies
  FOR DELETE TO authenticated USING (true);

-- Politicas para clients
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear clientes" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON clients
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar clientes" ON clients
  FOR DELETE TO authenticated USING (true);

-- Politicas para client_reminders
CREATE POLICY "Usuarios autenticados pueden ver recordatorios" ON client_reminders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear recordatorios" ON client_reminders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar recordatorios" ON client_reminders
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar recordatorios" ON client_reminders
  FOR DELETE TO authenticated USING (true);

-- Politicas para referrals
CREATE POLICY "Usuarios autenticados pueden ver referidos" ON referrals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear referidos" ON referrals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar referidos" ON referrals
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar referidos" ON referrals
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- Funcion para crear recordatorios automaticos al firmar cliente
-- Recordatorios: 1 dia, 1 semana, 2-4-6-12 meses
-- ============================================
CREATE OR REPLACE FUNCTION create_client_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear recordatorios cuando el cliente se marca como firmado
  IF NEW.signed_at IS NOT NULL AND (OLD.signed_at IS NULL OR OLD.signed_at != NEW.signed_at) THEN
    -- Dia 1: Bienvenida - "Recordatorio de que estas con nosotros, mejores condiciones del mercado"
    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'day1_welcome', NEW.signed_at::date + INTERVAL '1 day');

    -- Semana 1: Confirmacion - Estado en CRM: recordado
    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'week1_confirmation', NEW.signed_at::date + INTERVAL '7 days');

    -- 2 meses: Revision (Endesa: ver si se puede bajar precio) + Programa referidos (20EUR)
    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'month2_checkup', NEW.signed_at::date + INTERVAL '60 days');

    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'referral_program', NEW.signed_at::date + INTERVAL '60 days');

    -- 4 meses: Consulta incidencias
    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'month4_checkup', NEW.signed_at::date + INTERVAL '120 days');

    -- 6 meses: Seguimiento
    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'month6_checkup', NEW.signed_at::date + INTERVAL '180 days');

    -- 12 meses (1 semana antes): Renovacion
    -- "Tu contrato vence el dia X. Gracias a nosotros has ahorrado X. Agendar cita para ofertas del proximo ano."
    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'month12_renewal', NEW.signed_at::date + INTERVAL '358 days');

    -- Actualizar fecha del proximo recordatorio
    UPDATE clients SET next_reminder_date = NEW.signed_at::date + INTERVAL '1 day' WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_create_client_reminders ON clients;
CREATE TRIGGER trigger_create_client_reminders
  AFTER INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION create_client_reminders();
