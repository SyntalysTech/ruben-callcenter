import { NextResponse } from 'next/server';

// Saludo inicial - PERSONALIZABLE
const GREETING = `¡Hola! Gracias por llamar a Calidad Energía. Soy el asistente virtual. ¿En qué puedo ayudarle hoy?`;
const LISTENING_MSG = `Le escucho.`;
const NO_RESPONSE_MSG = `No le he escuchado. Si necesita ayuda, vuelva a llamar. ¡Hasta luego!`;

function getTtsUrl(text: string, baseUrl: string): string {
  return `${baseUrl}/api/voice/tts?text=${encodeURIComponent(text)}`;
}

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  // TwiML usando <Play> con ElevenLabs en lugar de <Say>
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${getTtsUrl(GREETING, baseUrl)}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="auto" action="${baseUrl}/api/voice/respond" method="POST">
    <Play>${getTtsUrl(LISTENING_MSG, baseUrl)}</Play>
  </Gather>
  <Play>${getTtsUrl(NO_RESPONSE_MSG, baseUrl)}</Play>
</Response>`;

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Calidad Energia Voice - Incoming Call Handler (ElevenLabs)'
  });
}
