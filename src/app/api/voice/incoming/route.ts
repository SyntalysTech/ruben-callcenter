import { NextResponse } from 'next/server';

// Voz neural de Twilio (rápida)
const TWILIO_VOICE = 'Polly.Lucia-Neural';
const TWILIO_LANG = 'es-ES';

const GREETING = `Hola, gracias por llamar a Calidad Energía. Soy Cristina. ¿En qué puedo ayudarte?`;

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">${GREETING}</Say>
  <Gather input="speech" language="es-ES" speechTimeout="2" timeout="8" action="${baseUrl}/api/voice/respond" method="POST"/>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">¿Sigues ahí?</Say>
  <Gather input="speech" language="es-ES" speechTimeout="2" timeout="4" action="${baseUrl}/api/voice/respond" method="POST"/>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">Vale, si necesitas algo llámame.</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'Cristina - Incoming Fast' });
}
