import { NextResponse } from 'next/server';

// Configuración de voz
const VOICE_CONFIG = {
  voice: 'Polly.Lucia',
  language: 'es-ES'
};

// Script para llamadas salientes a leads
export async function POST(request: Request) {
  const url = new URL(request.url);
  const leadName = url.searchParams.get('name') || '';
  const customMessage = url.searchParams.get('message') || '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  // Saludo personalizado para llamada saliente
  let greeting: string;

  if (customMessage) {
    greeting = customMessage;
  } else if (leadName) {
    greeting = `Hola, ¿hablo con ${leadName}? Le llamo de Calidad Energía. ¿Tiene un momento para hablar sobre cómo podemos ayudarle a ahorrar en su factura de luz?`;
  } else {
    greeting = `Hola, le llamo de Calidad Energía. ¿Tiene un momento para hablar sobre cómo podemos ayudarle a ahorrar en su factura de luz?`;
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE_CONFIG.voice}" language="${VOICE_CONFIG.language}">${greeting}</Say>
  <Gather input="speech" language="es-ES" speechTimeout="auto" action="${baseUrl}/api/voice/respond" method="POST">
    <Say voice="${VOICE_CONFIG.voice}" language="${VOICE_CONFIG.language}">Le escucho.</Say>
  </Gather>
  <Say voice="${VOICE_CONFIG.voice}" language="${VOICE_CONFIG.language}">Parece que no hay respuesta. Le volveremos a llamar en otro momento. ¡Hasta luego!</Say>
</Response>`;

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

export async function GET(request: Request) {
  // También permitir GET para Twilio
  return POST(request);
}
