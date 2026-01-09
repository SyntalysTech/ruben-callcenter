-- ============================================
-- CRM CALIDAD ENERGÍA - Schema SQL para Supabase
-- ============================================
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: user_profiles (perfiles de usuario con roles)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ============================================
-- TABLA: leads
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  contact_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'yellow' CHECK (status IN ('red', 'yellow', 'orange', 'blue', 'green')),
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_contact_date ON leads(contact_date);
CREATE INDEX IF NOT EXISTS idx_leads_full_name ON leads(full_name);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- TABLA: lead_notes (historial de notas)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);

-- ============================================
-- TABLAS PARA CALL CENTER (Solo schema, sin integraciones)
-- ============================================

-- Tabla: call_accounts (saldo y configuración)
CREATE TABLE IF NOT EXISTS call_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  provider TEXT NOT NULL DEFAULT 'twilio',
  display_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  balance_current NUMERIC(10, 2) DEFAULT 0,
  balance_updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive'))
);

-- Tabla: call_logs (historial de llamadas)
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'ringing', 'answered', 'failed', 'no-answer', 'busy')),
  duration_sec INTEGER DEFAULT 0,
  cost NUMERIC(10, 4) DEFAULT 0,
  recording_url TEXT,
  transcript TEXT,
  summary TEXT,
  provider_call_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at);

-- Tabla: call_recordings
CREATE TABLE IF NOT EXISTS call_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_log_id UUID NOT NULL REFERENCES call_logs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  duration_sec INTEGER DEFAULT 0
);

-- Tabla: call_metrics_daily (métricas diarias)
CREATE TABLE IF NOT EXISTS call_metrics_daily (
  date DATE PRIMARY KEY,
  calls_total INTEGER DEFAULT 0,
  calls_answered INTEGER DEFAULT 0,
  calls_failed INTEGER DEFAULT 0,
  cost_total NUMERIC(10, 2) DEFAULT 0
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Usuarios pueden ver su propio perfil" ON user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins pueden actualizar perfiles" ON user_profiles
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden insertar perfiles" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins pueden eliminar perfiles" ON user_profiles
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para leads (usuarios autenticados pueden ver/editar todo)
CREATE POLICY "Usuarios autenticados pueden ver leads" ON leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear leads" ON leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar leads" ON leads
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar leads" ON leads
  FOR DELETE TO authenticated USING (true);

-- Políticas para lead_notes
CREATE POLICY "Usuarios autenticados pueden ver notas" ON lead_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear notas" ON lead_notes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar notas" ON lead_notes
  FOR DELETE TO authenticated USING (true);

-- Políticas para call_accounts (solo lectura por ahora)
CREATE POLICY "Usuarios autenticados pueden ver cuentas" ON call_accounts
  FOR SELECT TO authenticated USING (true);

-- Políticas para call_logs (solo lectura por ahora)
CREATE POLICY "Usuarios autenticados pueden ver llamadas" ON call_logs
  FOR SELECT TO authenticated USING (true);

-- Políticas para call_recordings (solo lectura)
CREATE POLICY "Usuarios autenticados pueden ver grabaciones" ON call_recordings
  FOR SELECT TO authenticated USING (true);

-- Políticas para call_metrics_daily (solo lectura)
CREATE POLICY "Usuarios autenticados pueden ver métricas" ON call_metrics_daily
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- TABLA: energy_studies (estudios energéticos)
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

  -- IA generó el estudio?
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
-- TABLA: referrals (programa de referidos)
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

-- Políticas para energy_studies
CREATE POLICY "Usuarios autenticados pueden ver estudios" ON energy_studies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear estudios" ON energy_studies
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar estudios" ON energy_studies
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar estudios" ON energy_studies
  FOR DELETE TO authenticated USING (true);

-- Políticas para clients
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear clientes" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON clients
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar clientes" ON clients
  FOR DELETE TO authenticated USING (true);

-- Políticas para client_reminders
CREATE POLICY "Usuarios autenticados pueden ver recordatorios" ON client_reminders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear recordatorios" ON client_reminders
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar recordatorios" ON client_reminders
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar recordatorios" ON client_reminders
  FOR DELETE TO authenticated USING (true);

-- Políticas para referrals
CREATE POLICY "Usuarios autenticados pueden ver referidos" ON referrals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear referidos" ON referrals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar referidos" ON referrals
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar referidos" ON referrals
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- Función para crear recordatorios automáticos al firmar cliente
-- ============================================
CREATE OR REPLACE FUNCTION create_client_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear recordatorios cuando el cliente se marca como firmado
  IF NEW.signed_at IS NOT NULL AND (OLD.signed_at IS NULL OR OLD.signed_at != NEW.signed_at) THEN
    -- Día 1: Bienvenida
    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'day1_welcome', NEW.signed_at::date + INTERVAL '1 day');

    -- Semana 1: Confirmación
    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'week1_confirmation', NEW.signed_at::date + INTERVAL '7 days');

    -- 2 meses: Revisión + Referidos
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

    -- 12 meses (1 semana antes): Renovación
    INSERT INTO client_reminders (client_id, reminder_type, scheduled_date)
    VALUES (NEW.id, 'month12_renewal', NEW.signed_at::date + INTERVAL '358 days');

    -- Actualizar fecha del próximo recordatorio
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
