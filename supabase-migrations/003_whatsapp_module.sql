-- ============================================
-- MIGRACION 003: Modulo WhatsApp Business
-- Fecha: 2026-01-09
-- Descripcion: Integracion con Meta WhatsApp Business API
-- ============================================
-- IMPORTANTE: Ejecutar cuando el cliente tenga su cuenta Meta Business
-- ============================================

-- ============================================
-- TABLA: whatsapp_config (configuracion de la cuenta)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Meta Business Config
  phone_number_id TEXT NOT NULL,           -- ID del numero de telefono en Meta
  business_account_id TEXT NOT NULL,       -- ID de la cuenta de negocio
  access_token TEXT NOT NULL,              -- Token de acceso (encriptado en produccion)
  webhook_verify_token TEXT NOT NULL,      -- Token para verificar webhook

  -- Info del numero
  display_phone_number TEXT NOT NULL,      -- Numero visible (+34 612 345 678)
  verified_name TEXT,                      -- Nombre verificado del negocio

  -- Estado
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,

  -- Limites API
  daily_messages_limit INTEGER DEFAULT 1000,
  daily_messages_sent INTEGER DEFAULT 0,
  limit_reset_at DATE DEFAULT CURRENT_DATE
);

-- ============================================
-- TABLA: whatsapp_templates (plantillas de mensajes)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Info de Meta
  template_id TEXT,                        -- ID en Meta (si esta aprobada)
  name TEXT NOT NULL,                      -- Nombre interno
  language TEXT NOT NULL DEFAULT 'es',     -- Codigo idioma

  -- Estado en Meta
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending', 'approved', 'rejected', 'disabled'
  )),
  rejection_reason TEXT,

  -- Categoria
  category TEXT NOT NULL DEFAULT 'MARKETING' CHECK (category IN (
    'AUTHENTICATION', 'MARKETING', 'UTILITY'
  )),

  -- Contenido
  header_type TEXT CHECK (header_type IN ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT')),
  header_content TEXT,                     -- Texto o URL del media
  body_text TEXT NOT NULL,                 -- Texto principal con {{1}}, {{2}} etc
  footer_text TEXT,

  -- Botones (JSON array)
  buttons JSONB,

  -- Variables ejemplo
  example_values JSONB,                    -- Valores de ejemplo para aprobar

  -- Uso interno
  description TEXT,                        -- Descripcion para el equipo
  use_case TEXT                            -- Para que se usa (bienvenida, recordatorio, etc)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON whatsapp_templates(category);

-- ============================================
-- TABLA: whatsapp_conversations (conversaciones)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contacto
  phone_number TEXT NOT NULL,              -- Numero del cliente (+34612345678)
  contact_name TEXT,                       -- Nombre del perfil de WhatsApp

  -- Relacion con CRM
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Estado de la conversacion
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'pending', 'resolved', 'spam'
  )),

  -- Ventana de 24h
  last_customer_message_at TIMESTAMPTZ,    -- Ultima vez que el cliente escribio
  can_send_template_only BOOLEAN DEFAULT true, -- Si paso 24h, solo plantillas

  -- Asignacion
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Contadores
  unread_count INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,

  -- Ultimo mensaje (preview)
  last_message_text TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_direction TEXT CHECK (last_message_direction IN ('inbound', 'outbound')),

  -- Tags/Labels
  labels TEXT[]
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_assigned ON whatsapp_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_lead ON whatsapp_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_client ON whatsapp_conversations(client_id);

-- ============================================
-- TABLA: whatsapp_messages (mensajes)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Relacion
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,

  -- IDs de Meta
  wamid TEXT,                              -- WhatsApp Message ID

  -- Direccion
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Tipo de mensaje
  message_type TEXT NOT NULL CHECK (message_type IN (
    'text', 'image', 'video', 'audio', 'document',
    'sticker', 'location', 'contacts', 'template',
    'interactive', 'reaction', 'unknown'
  )),

  -- Contenido
  content JSONB NOT NULL,                  -- Contenido estructurado segun tipo
  -- Para texto: { "body": "mensaje" }
  -- Para media: { "url": "...", "caption": "...", "mime_type": "..." }
  -- Para template: { "template_name": "...", "parameters": [...] }
  -- Para location: { "latitude": ..., "longitude": ..., "name": "..." }

  -- Estado del mensaje (outbound)
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'read', 'failed'
  )),
  error_code TEXT,
  error_message TEXT,

  -- Timestamps de Meta
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Metadata
  context_message_id TEXT,                 -- Si es respuesta a otro mensaje
  forwarded BOOLEAN DEFAULT false,

  -- Quien envio (si outbound)
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wamid ON whatsapp_messages(wamid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

-- ============================================
-- TABLA: whatsapp_media (archivos multimedia)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- ID de Meta
  media_id TEXT NOT NULL,

  -- Info del archivo
  mime_type TEXT NOT NULL,
  file_size INTEGER,
  sha256 TEXT,

  -- URLs
  meta_url TEXT,                           -- URL temporal de Meta
  storage_url TEXT,                        -- URL en nuestro storage (Supabase)

  -- Estado
  downloaded BOOLEAN DEFAULT false,
  download_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_media_media_id ON whatsapp_media(media_id);

-- ============================================
-- TABLA: whatsapp_quick_replies (respuestas rapidas)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contenido
  title TEXT NOT NULL,                     -- Titulo corto para mostrar
  message TEXT NOT NULL,                   -- Mensaje completo

  -- Categoria
  category TEXT,                           -- Agrupacion (saludos, precios, etc)

  -- Uso
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Orden
  sort_order INTEGER DEFAULT 0,

  -- Activo
  is_active BOOLEAN DEFAULT true,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_category ON whatsapp_quick_replies(category);

-- ============================================
-- TABLA: whatsapp_broadcast (envios masivos)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Info
  name TEXT NOT NULL,
  description TEXT,

  -- Plantilla a usar
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,

  -- Destinatarios (filtros o lista)
  recipient_filter JSONB,                  -- { "status": "signed", "provider": "endesa" }
  recipient_count INTEGER DEFAULT 0,

  -- Estado
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'sending', 'completed', 'cancelled', 'failed'
  )),

  -- Programacion
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Resultados
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_whatsapp_config_updated_at ON whatsapp_config;
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_whatsapp_conversations_updated_at ON whatsapp_conversations;
CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCION: Actualizar conversacion al recibir mensaje
-- ============================================
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_conversations SET
    last_message_text = CASE
      WHEN NEW.message_type = 'text' THEN NEW.content->>'body'
      ELSE '[' || NEW.message_type || ']'
    END,
    last_message_at = NEW.created_at,
    last_message_direction = NEW.direction,
    total_messages = total_messages + 1,
    unread_count = CASE
      WHEN NEW.direction = 'inbound' THEN unread_count + 1
      ELSE unread_count
    END,
    last_customer_message_at = CASE
      WHEN NEW.direction = 'inbound' THEN NEW.created_at
      ELSE last_customer_message_at
    END,
    can_send_template_only = CASE
      WHEN NEW.direction = 'inbound' THEN false
      ELSE can_send_template_only
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON whatsapp_messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- RLS
-- ============================================

ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_broadcasts ENABLE ROW LEVEL SECURITY;

-- Politicas (solo admins pueden ver config)
CREATE POLICY "Admins pueden ver config" ON whatsapp_config
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins pueden modificar config" ON whatsapp_config
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Templates
CREATE POLICY "Ver templates" ON whatsapp_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Crear templates" ON whatsapp_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Actualizar templates" ON whatsapp_templates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Eliminar templates" ON whatsapp_templates FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Conversaciones
CREATE POLICY "Ver conversaciones" ON whatsapp_conversations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Crear conversaciones" ON whatsapp_conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Actualizar conversaciones" ON whatsapp_conversations FOR UPDATE TO authenticated USING (true);

-- Mensajes
CREATE POLICY "Ver mensajes" ON whatsapp_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Crear mensajes" ON whatsapp_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Actualizar mensajes" ON whatsapp_messages FOR UPDATE TO authenticated USING (true);

-- Media
CREATE POLICY "Ver media" ON whatsapp_media FOR SELECT TO authenticated USING (true);
CREATE POLICY "Crear media" ON whatsapp_media FOR INSERT TO authenticated WITH CHECK (true);

-- Quick replies
CREATE POLICY "Ver quick replies" ON whatsapp_quick_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestionar quick replies" ON whatsapp_quick_replies FOR ALL TO authenticated USING (true);

-- Broadcasts
CREATE POLICY "Ver broadcasts" ON whatsapp_broadcasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestionar broadcasts" ON whatsapp_broadcasts FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
