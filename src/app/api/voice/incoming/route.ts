import { NextResponse } from 'next/server';

const AUDIO_INCOMING = '/audio/incoming.mp3';
const AUDIO_SIGUES_AHI = '/audio/sigues_ahi.mp3';

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${baseUrl}${AUDIO_INCOMING}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="auto" timeout="8" action="${baseUrl}/api/voice/respond?step=0" method="POST"/>
  <Play>${baseUrl}${AUDIO_SIGUES_AHI}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="auto" timeout="4" action="${baseUrl}/api/voice/respond?step=0" method="POST"/>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'Cristina - Incoming (ElevenLabs audio)' });
}
