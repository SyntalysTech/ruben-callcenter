import { NextRequest, NextResponse } from 'next/server';

// ============================================
// WhatsApp Business API Webhook
// ============================================
// Este endpoint recibe:
// 1. Verificacion del webhook (GET) - Meta envia un challenge
// 2. Mensajes entrantes (POST) - Mensajes de clientes
// 3. Actualizaciones de estado (POST) - delivered, read, etc.
// ============================================

// Token de verificacion - CAMBIAR por uno seguro en produccion
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'calidad_energia_webhook_token';

// GET: Verificacion del webhook por Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verificar que es una solicitud de suscripcion valida
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Verificacion exitosa');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('[WhatsApp Webhook] Verificacion fallida - token invalido');
  return new NextResponse('Forbidden', { status: 403 });
}

// POST: Recibir mensajes y actualizaciones
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[WhatsApp Webhook] Evento recibido:', JSON.stringify(body, null, 2));

    // Verificar que es un evento de WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid object type' }, { status: 400 });
    }

    // Procesar cada entrada
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          const value = change.value;

          // Procesar mensajes entrantes
          if (value.messages) {
            for (const message of value.messages) {
              await handleIncomingMessage(message, value.contacts?.[0], value.metadata);
            }
          }

          // Procesar actualizaciones de estado
          if (value.statuses) {
            for (const status of value.statuses) {
              await handleStatusUpdate(status);
            }
          }
        }
      }
    }

    // Siempre responder 200 a Meta
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    // Aun con error, responder 200 para que Meta no reintente
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

// Procesar mensaje entrante
async function handleIncomingMessage(
  message: {
    id: string;
    from: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    image?: { id: string; mime_type: string; sha256: string; caption?: string };
    video?: { id: string; mime_type: string; sha256: string; caption?: string };
    audio?: { id: string; mime_type: string; sha256: string };
    document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string };
    location?: { latitude: number; longitude: number; name?: string; address?: string };
    contacts?: Array<{ name: { formatted_name: string }; phones: Array<{ phone: string }> }>;
    context?: { message_id: string };
  },
  contact: { wa_id: string; profile: { name: string } } | undefined,
  metadata: { phone_number_id: string; display_phone_number: string }
) {
  console.log('[WhatsApp] Mensaje entrante:', {
    from: message.from,
    type: message.type,
    contact_name: contact?.profile?.name,
  });

  // TODO: Implementar cuando este lista la cuenta de Meta Business
  // 1. Buscar o crear conversacion en whatsapp_conversations
  // 2. Guardar mensaje en whatsapp_messages
  // 3. Actualizar contadores de la conversacion
  // 4. Buscar lead/cliente asociado por numero de telefono
  // 5. Enviar notificacion en tiempo real (opcional: websocket o polling)

  // Ejemplo de estructura del mensaje guardado:
  // const messageData = {
  //   conversation_id: conversationId,
  //   wamid: message.id,
  //   direction: 'inbound',
  //   message_type: message.type,
  //   content: getMessageContent(message),
  //   status: 'delivered',
  // };
}

// Procesar actualizacion de estado
async function handleStatusUpdate(status: {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}) {
  console.log('[WhatsApp] Status update:', {
    wamid: status.id,
    status: status.status,
    recipient: status.recipient_id,
  });

  // TODO: Implementar cuando este lista la cuenta de Meta Business
  // 1. Buscar mensaje por wamid en whatsapp_messages
  // 2. Actualizar status y timestamps (sent_at, delivered_at, read_at)
  // 3. Si hay error, guardar error_code y error_message
}
