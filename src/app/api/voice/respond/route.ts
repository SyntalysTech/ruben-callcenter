import { NextResponse } from 'next/server';

const VOICE = 'Polly.Lucia-Neural';
const LANG = 'es-ES';

// Estados: 0=titular, 1=factura, 2=cierre
const PREGUNTAS = [
  '¿Eres el titular del contrato de luz?',
  '¿Tienes la factura a mano?',
  'Perfecto. Te mando WhatsApp, envíame foto de la factura. ¡Hasta luego!'
];

export async function POST(request: Request) {
  const formData = await request.formData();
  const speech = (formData.get('SpeechResult') as string || '').toLowerCase();
  // Estado viene en el query param (persistencia sin Map)
  const url = new URL(request.url);
  const step = parseInt(url.searchParams.get('step') || '0');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  console.log(`[Voice] step=${step}: "${speech}"`);

  // Rechazo directo
  if (speech.includes('no me interesa') || speech.includes('no gracias') || speech.includes('adios')) {
    return end('Vale, ¡hasta luego!');
  }

  // No titular
  if (speech.includes('no soy') && speech.includes('titular')) {
    return end('Vale, te mando WhatsApp para el titular. ¡Hasta luego!');
  }

  // No factura (solo en step 1)
  if (step === 1 && (speech.includes('no la tengo') || speech.includes('no tengo') || speech.includes('ahora no'))) {
    return end('Te mando WhatsApp y me la pasas cuando puedas. ¡Hasta luego!');
  }

  // Siguiente paso
  const next = step + 1;

  if (next >= PREGUNTAS.length) {
    return end(PREGUNTAS[PREGUNTAS.length - 1]);
  }

  // Continuar conversación
  return gather(PREGUNTAS[next], baseUrl, next);
}

function gather(msg: string, baseUrl: string, step: number): NextResponse {
  const escaped = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="${VOICE}" language="${LANG}">${escaped}</Say><Gather input="speech" language="es-ES" speechTimeout="auto" timeout="5" action="${baseUrl}/api/voice/respond?step=${step}" method="POST"/><Hangup/></Response>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

function end(msg: string): NextResponse {
  const escaped = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="${VOICE}" language="${LANG}">${escaped}</Say><Hangup/></Response>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
