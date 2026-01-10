import { NextResponse } from 'next/server';

// Saludo para llamadas entrantes (cuando el cliente llama a nosotros)
const GREETING = `Hola, gracias por llamar a Calidad Energía. Soy Cristina, del departamento de energía. ¿En qué puedo ayudarte?`;

function getTtsUrl(text: string, baseUrl: string): string {
  return `${baseUrl}/api/voice/tts?text=${encodeURIComponent(text)}`;
}

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${getTtsUrl(GREETING, baseUrl)}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="3" timeout="10" action="${baseUrl}/api/voice/respond" method="POST">
  </Gather>
  <Play>${getTtsUrl('¿Sigues ahí?', baseUrl)}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="3" timeout="5" action="${baseUrl}/api/voice/respond" method="POST">
  </Gather>
  <Play>${getTtsUrl('Vale, si necesitas algo me llamas. ¡Hasta luego!', baseUrl)}</Play>
  <Hangup/>
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
    endpoint: 'Calidad Energia Voice - Incoming (Cristina)'
  });
}
