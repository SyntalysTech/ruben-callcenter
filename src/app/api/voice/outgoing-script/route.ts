import { NextResponse } from 'next/server';

function getTtsUrl(text: string, baseUrl: string): string {
  return `${baseUrl}/api/voice/tts?text=${encodeURIComponent(text)}`;
}

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

  const listeningMsg = `Le escucho.`;
  const noResponseMsg = `Parece que no hay respuesta. Le volveremos a llamar en otro momento. ¡Hasta luego!`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${getTtsUrl(greeting, baseUrl)}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="auto" action="${baseUrl}/api/voice/respond" method="POST">
    <Play>${getTtsUrl(listeningMsg, baseUrl)}</Play>
  </Gather>
  <Play>${getTtsUrl(noResponseMsg, baseUrl)}</Play>
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
