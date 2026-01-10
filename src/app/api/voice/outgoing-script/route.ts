import { NextResponse } from 'next/server';

// Audios pregrabados
const AUDIO_SALUDO = '/audio/saludo.mp3';
const AUDIO_SIGUES_AHI = '/audio/sigues_ahi.mp3';

// Fallback Polly para saludos personalizados
const VOICE = 'Polly.Lucia-Neural';
const LANG = 'es-ES';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const leadName = url.searchParams.get('name') || '';
  const customMessage = url.searchParams.get('message') || '';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  // Si hay nombre o mensaje custom, usar Polly
  if (leadName || customMessage) {
    const greeting = customMessage || `¡${leadName}! ¿${leadName}? Soy Cristina, del departamento de energía. Te llamaba porque estamos ayudando a ahorrar cuarenta o cincuenta euros al mes en la luz. ¿Sería una locura ver si podemos hacer algo contigo?`;
    const escaped = greeting.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANG}">${escaped}</Say>
  <Gather input="speech" language="es-ES" speechTimeout="auto" timeout="6" action="${baseUrl}/api/voice/respond?step=0" method="POST"/>
  <Play>${baseUrl}${AUDIO_SIGUES_AHI}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="auto" timeout="4" action="${baseUrl}/api/voice/respond?step=0" method="POST"/>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }

  // Sin nombre: usar audio pregrabado (INSTANTÁNEO)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${baseUrl}${AUDIO_SALUDO}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="auto" timeout="6" action="${baseUrl}/api/voice/respond?step=0" method="POST"/>
  <Play>${baseUrl}${AUDIO_SIGUES_AHI}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="auto" timeout="4" action="${baseUrl}/api/voice/respond?step=0" method="POST"/>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
}

export async function GET(request: Request) {
  return POST(request);
}
