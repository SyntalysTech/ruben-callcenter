import { NextResponse } from 'next/server';

// Configuración de voz de Twilio para español
const VOICE_CONFIG = {
  voice: 'Polly.Lucia', // Voz española de Amazon Polly
  language: 'es-ES'
};

// Saludo inicial - PERSONALIZABLE
const GREETING = `¡Hola! Gracias por llamar a Calidad Energía. Soy el asistente virtual. ¿En qué puedo ayudarle hoy?`;

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  // TwiML para el saludo inicial y escuchar al usuario
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE_CONFIG.voice}" language="${VOICE_CONFIG.language}">${GREETING}</Say>
  <Gather input="speech" language="es-ES" speechTimeout="auto" action="${baseUrl}/api/voice/respond" method="POST">
    <Say voice="${VOICE_CONFIG.voice}" language="${VOICE_CONFIG.language}">Le escucho.</Say>
  </Gather>
  <Say voice="${VOICE_CONFIG.voice}" language="${VOICE_CONFIG.language}">No le he escuchado. Si necesita ayuda, vuelva a llamar. ¡Hasta luego!</Say>
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
    endpoint: 'Calidad Energia Voice - Incoming Call Handler'
  });
}
