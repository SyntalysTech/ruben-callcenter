-- ============================================
-- MIGRACION 001: Schema inicial
-- Fecha: 2026-01-08
-- Descripcion: Tablas base - leads, notas, call center, user_profiles
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

-- Funcion para crear perfil automaticamente al registrar usuario
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

CREATE TABLE IF NOT EXISTS call_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_log_id UUID NOT NULL REFERENCES call_logs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  duration_sec INTEGER DEFAULT 0
);

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

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_metrics_daily ENABLE ROW LEVEL SECURITY;

-- Politicas para user_profiles
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

-- Politicas para leads
CREATE POLICY "Usuarios autenticados pueden ver leads" ON leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear leads" ON leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar leads" ON leads
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar leads" ON leads
  FOR DELETE TO authenticated USING (true);

-- Politicas para lead_notes
CREATE POLICY "Usuarios autenticados pueden ver notas" ON lead_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden crear notas" ON lead_notes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar notas" ON lead_notes
  FOR DELETE TO authenticated USING (true);

-- Politicas para call_accounts
CREATE POLICY "Usuarios autenticados pueden ver cuentas" ON call_accounts
  FOR SELECT TO authenticated USING (true);

-- Politicas para call_logs
CREATE POLICY "Usuarios autenticados pueden ver llamadas" ON call_logs
  FOR SELECT TO authenticated USING (true);

-- Politicas para call_recordings
CREATE POLICY "Usuarios autenticados pueden ver grabaciones" ON call_recordings
  FOR SELECT TO authenticated USING (true);

-- Politicas para call_metrics_daily
CREATE POLICY "Usuarios autenticados pueden ver metricas" ON call_metrics_daily
  FOR SELECT TO authenticated USING (true);
