import { NextResponse } from 'next/server';

function getTtsUrl(text: string, baseUrl: string): string {
  return `${baseUrl}/api/voice/tts?text=${encodeURIComponent(text)}`;
}

// Script profesional de llamada saliente (estilo Jeremy Miner / Cole Gordon)
function generateGreeting(leadName?: string): string {
  if (leadName) {
    return `¡${leadName}! ¿${leadName}? Sí, mira, soy Cristina, del departamento de energía. Estoy entre reuniones y tengo literalmente treinta segunditos... Solo te llamaba porque estamos revisando facturas de luz, y acabamos de ayudar a varios clientes a ahorrar unos cuarenta o cincuenta euros al mes. ¿Sería una locura ver si podemos hacer algo parecido contigo... o lo descartamos por completo?`;
  }
  return `¡Hola! Soy Cristina, del departamento de energía. Estoy entre reuniones y tengo literalmente treinta segunditos... Solo te llamaba porque estamos revisando facturas de luz, y acabamos de ayudar a varios clientes a ahorrar unos cuarenta o cincuenta euros al mes. ¿Sería una locura ver si podemos hacer algo parecido contigo... o lo descartamos por completo?`;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const leadName = url.searchParams.get('name') || '';
  const customMessage = url.searchParams.get('message') || '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  // Usar mensaje personalizado si existe, si no usar el script profesional
  const greeting = customMessage || generateGreeting(leadName || undefined);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${getTtsUrl(greeting, baseUrl)}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="3" timeout="10" action="${baseUrl}/api/voice/respond" method="POST">
  </Gather>
  <Play>${getTtsUrl('¿Sigues ahí?', baseUrl)}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="3" timeout="5" action="${baseUrl}/api/voice/respond" method="POST">
  </Gather>
  <Play>${getTtsUrl('Vale, te llamo en otro momento. ¡Hasta luego!', baseUrl)}</Play>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

export async function GET(request: Request) {
  return POST(request);
}
