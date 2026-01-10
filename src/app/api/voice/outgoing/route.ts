import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Iniciar una llamada saliente a un lead
export async function POST(request: Request) {
  try {
    const { to, leadName, customMessage } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Número de teléfono requerido' }, { status: 400 });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

    // URL para la llamada saliente (con mensaje personalizado opcional)
    let url = `${baseUrl}/api/voice/outgoing-script`;
    if (leadName) {
      url += `?name=${encodeURIComponent(leadName)}`;
    }
    if (customMessage) {
      url += `${leadName ? '&' : '?'}message=${encodeURIComponent(customMessage)}`;
    }

    const call = await client.calls.create({
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      url: url,
      statusCallback: `${baseUrl}/api/voice/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    });

    console.log(`[Voice] Llamada saliente a ${to} - SID: ${call.sid}`);

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      message: `Llamada iniciada a ${to}`
    });

  } catch (error: any) {
    console.error('[Voice] Error iniciando llamada:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Calidad Energia Voice - Outgoing Call',
    usage: 'POST { "to": "+34600000000", "leadName": "Juan García", "customMessage": "opcional" }'
  });
}
