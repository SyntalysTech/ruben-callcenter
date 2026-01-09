import { NextRequest, NextResponse } from 'next/server';

// ============================================
// API para enviar mensajes de WhatsApp
// ============================================
// Endpoints de Meta WhatsApp Cloud API:
// - Enviar mensaje de texto
// - Enviar plantilla
// - Enviar multimedia
// ============================================

const META_API_VERSION = 'v18.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

interface SendMessageRequest {
  to: string;                    // Numero destino (+34612345678)
  type: 'text' | 'template' | 'image' | 'document';
  text?: { body: string };       // Para mensajes de texto
  template?: {                   // Para plantillas
    name: string;
    language: { code: string };
    components?: Array<{
      type: 'header' | 'body' | 'button';
      parameters: Array<{ type: string; text?: string; image?: { link: string } }>;
    }>;
  };
  image?: { link: string; caption?: string };
  document?: { link: string; filename?: string; caption?: string };
}

export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();

    // Validar campos requeridos
    if (!body.to || !body.type) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: to, type' },
        { status: 400 }
      );
    }

    // TODO: Obtener configuracion de whatsapp_config
    // const config = await getWhatsAppConfig();
    // if (!config) {
    //   return NextResponse.json(
    //     { error: 'WhatsApp no configurado' },
    //     { status: 503 }
    //   );
    // }

    // Por ahora, responder que el modulo no esta activo
    return NextResponse.json(
      {
        error: 'Modulo WhatsApp no activo',
        message: 'El modulo de WhatsApp estara disponible cuando se configure la cuenta de Meta Business'
      },
      { status: 503 }
    );

    // ============================================
    // CODIGO PARA CUANDO ESTE ACTIVO:
    // ============================================
    /*
    const phoneNumberId = config.phone_number_id;
    const accessToken = config.access_token;

    // Formatear numero (quitar espacios, guiones)
    const formattedPhone = body.to.replace(/[\s-]/g, '');

    // Construir payload segun tipo de mensaje
    let payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
    };

    switch (body.type) {
      case 'text':
        if (!body.text?.body) {
          return NextResponse.json({ error: 'Falta texto del mensaje' }, { status: 400 });
        }
        payload.type = 'text';
        payload.text = { preview_url: true, body: body.text.body };
        break;

      case 'template':
        if (!body.template?.name) {
          return NextResponse.json({ error: 'Falta nombre de plantilla' }, { status: 400 });
        }
        payload.type = 'template';
        payload.template = body.template;
        break;

      case 'image':
        if (!body.image?.link) {
          return NextResponse.json({ error: 'Falta URL de imagen' }, { status: 400 });
        }
        payload.type = 'image';
        payload.image = body.image;
        break;

      case 'document':
        if (!body.document?.link) {
          return NextResponse.json({ error: 'Falta URL de documento' }, { status: 400 });
        }
        payload.type = 'document';
        payload.document = body.document;
        break;
    }

    // Enviar a Meta
    const response = await fetch(
      `${META_API_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Send] Error:', result);
      return NextResponse.json(
        { error: result.error?.message || 'Error al enviar mensaje' },
        { status: response.status }
      );
    }

    // Guardar mensaje en base de datos
    // const messageId = await saveOutboundMessage({
    //   conversation_id: conversationId,
    //   wamid: result.messages[0].id,
    //   type: body.type,
    //   content: body,
    // });

    return NextResponse.json({
      success: true,
      wamid: result.messages[0].id,
      // message_id: messageId,
    });
    */

  } catch (error) {
    console.error('[WhatsApp Send] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
