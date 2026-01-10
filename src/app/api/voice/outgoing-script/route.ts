import { NextResponse } from 'next/server';

// Voz neural de Twilio (rápida y buena calidad)
const TWILIO_VOICE = 'Polly.Lucia-Neural';
const TWILIO_LANG = 'es-ES';

function generateGreeting(leadName?: string): string {
  if (leadName) {
    return `¡${leadName}! ¿${leadName}? Sí mira, soy Cristina, del departamento de energía. Estoy entre reuniones y solo tengo treinta segundos. Te llamaba porque estamos ayudando a clientes a ahorrar cuarenta o cincuenta euros al mes en la luz. ¿Sería una locura ver si podemos hacer algo contigo, o lo descartamos?`;
  }
  return `¡Hola! Soy Cristina, del departamento de energía. Estoy entre reuniones y solo tengo treinta segundos. Te llamaba porque estamos ayudando a clientes a ahorrar cuarenta o cincuenta euros al mes en la luz. ¿Sería una locura ver si podemos hacer algo contigo, o lo descartamos?`;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const leadName = url.searchParams.get('name') || '';
  const customMessage = url.searchParams.get('message') || '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  const greeting = customMessage || generateGreeting(leadName || undefined);

  // Escapar para XML
  const escaped = greeting
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // Usar <Say> de Twilio = INSTANTÁNEO
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">${escaped}</Say>
  <Gather input="speech" language="es-ES" speechTimeout="2" timeout="8" action="${baseUrl}/api/voice/respond" method="POST"/>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">¿Sigues ahí?</Say>
  <Gather input="speech" language="es-ES" speechTimeout="2" timeout="4" action="${baseUrl}/api/voice/respond" method="POST"/>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">Vale, te llamo en otro momento.</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function GET(request: Request) {
  return POST(request);
}
