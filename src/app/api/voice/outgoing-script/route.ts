import { NextResponse } from 'next/server';

// Audios pregrabados
const AUDIO_SALUDO = '/audio/saludo.mp3';
const AUDIO_SIGUES_AHI = '/audio/sigues_ahi.mp3';

// Fallback Polly para saludos personalizados
const VOICE = 'Polly.Lucia-Neural';
const LANG = 'es-ES';

export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  // Siempre usar audio pregrabado de ElevenLabs (INSTANTÁNEO)
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
