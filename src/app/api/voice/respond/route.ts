import { NextResponse } from 'next/server';

const VOICE = 'Polly.Lucia-Neural';
const LANG = 'es-ES';

// Estados de la conversación
type State = 'inicio' | 'titular' | 'factura' | 'cierre';

// Memoria de estado por llamada
const callState = new Map<string, State>();

// Flujo de la conversación
const FLOW: Record<State, { question: string; nextState: State }> = {
  inicio: {
    question: '¿Eres el titular del contrato de luz?',
    nextState: 'titular'
  },
  titular: {
    question: '¿Tienes la factura a mano, en papel o en el móvil?',
    nextState: 'factura'
  },
  factura: {
    question: 'Perfecto. Te mando un WhatsApp ahora, envíame una foto de la factura y te digo cuánto puedes ahorrar.',
    nextState: 'cierre'
  },
  cierre: {
    question: '¡Genial! Te llega el WhatsApp en un momento. ¡Hasta luego!',
    nextState: 'cierre'
  }
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const speech = (formData.get('SpeechResult') as string || '').toLowerCase().trim();
  const callSid = formData.get('CallSid') as string;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  console.log(`[Voice] ${callSid}: "${speech}"`);

  // Detectar rechazo
  if (speech.includes('no me interesa') || speech.includes('no gracias') || speech.includes('adios') || speech.includes('dejalo')) {
    callState.delete(callSid);
    return say('Vale, sin problema. ¡Hasta luego!', baseUrl, true);
  }

  // Detectar "no soy titular"
  if (speech.includes('no soy') && speech.includes('titular')) {
    callState.delete(callSid);
    return say('Vale, necesitamos hablar con el titular. Te mando WhatsApp para que nos pase la factura. ¡Hasta luego!', baseUrl, true);
  }

  // Detectar "no tengo factura"
  if ((speech.includes('no') && speech.includes('tengo')) || speech.includes('no la tengo') || speech.includes('ahora no')) {
    callState.delete(callSid);
    return say('Sin problema. Te mando WhatsApp y me la envías cuando puedas. ¡Hasta luego!', baseUrl, true);
  }

  // Objeciones rápidas
  if (speech.includes('quien eres') || speech.includes('quién eres')) {
    return say('Cristina, de Calidad Energía. Revisamos si puedes ahorrar en la luz. ¿Eres el titular?', baseUrl, false);
  }
  if (speech.includes('cuanto cuesta') || speech.includes('cuánto cuesta')) {
    return say('Nada, sin coste. ¿Eres el titular del contrato?', baseUrl, false);
  }

  // Obtener estado actual
  let state = callState.get(callSid) || 'inicio';

  // Detectar respuesta positiva y avanzar
  const isPositive = speech.includes('si') || speech.includes('sí') || speech.includes('vale') ||
                     speech.includes('claro') || speech.includes('ok') || speech.includes('bueno') ||
                     speech.includes('tengo') || speech.includes('titular') || speech.includes('correcto');

  if (isPositive || speech.length > 2) {
    // Avanzar al siguiente estado
    const current = FLOW[state];
    state = current.nextState;
    callState.set(callSid, state);

    const next = FLOW[state];
    const isEnd = state === 'cierre';

    if (isEnd) {
      callState.delete(callSid);
    }

    return say(next.question, baseUrl, isEnd);
  }

  // No entendí - repetir pregunta actual
  return say('¿Perdona? ' + FLOW[state].question, baseUrl, false);
}

function say(msg: string, baseUrl: string, end: boolean): NextResponse {
  const escaped = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const xml = end
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="${VOICE}" language="${LANG}">${escaped}</Say><Hangup/></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="${VOICE}" language="${LANG}">${escaped}</Say><Gather input="speech" language="es-ES" speechTimeout="2" timeout="6" action="${baseUrl}/api/voice/respond" method="POST"/><Hangup/></Response>`;

  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
