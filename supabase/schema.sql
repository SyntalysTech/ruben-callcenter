-- ============================================
-- CRM CALIDAD ENERGÍA - Schema SQL para Supabase
-- ============================================
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_metrics_daily ENABLE ROW LEVEL SECURITY;

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
-- DATOS DE EJEMPLO (opcional, para testing)
-- ============================================
-- INSERT INTO leads (full_name, email, phone, status, notes) VALUES
--   ('Juan García López', 'juan@example.com', '+34612345678', 'green', 'Cliente interesado en tarifa solar'),
--   ('María Rodríguez', 'maria@example.com', '+34623456789', 'yellow', 'Pendiente de llamar'),
--   ('Carlos Martínez', 'carlos@example.com', '+34634567890', 'orange', 'Llamar la próxima semana'),
--   ('Ana Fernández', 'ana@example.com', '+34645678901', 'blue', 'Cita programada para viernes'),
--   ('Pedro Sánchez', 'pedro@example.com', '+34656789012', 'red', 'No cumple requisitos');
