import { NextResponse } from 'next/server';

// Voz de Twilio
const TWILIO_VOICE = 'Polly.Lucia-Neural';
const TWILIO_LANG = 'es-ES';

// Respuestas pre-definidas para casos comunes (INSTANTÁNEO, sin OpenAI)
const QUICK_RESPONSES: Record<string, string> = {
  // Afirmaciones
  'si': '¿Eres el titular del contrato de luz?',
  'sí': '¿Eres el titular del contrato de luz?',
  'vale': 'Perfecto. ¿Tienes la factura a mano?',
  'ok': 'Perfecto. ¿Tienes la factura a mano?',
  'claro': 'Genial. ¿Tienes la factura a mano?',
  'bueno': 'Genial. ¿Tienes la factura a mano?',
  'dime': 'Vale, solo necesito confirmar tres cosas rápidas. ¿Eres el titular del contrato?',
  'adelante': 'Vale, solo necesito confirmar tres cosas rápidas. ¿Eres el titular del contrato?',

  // Titular
  'soy el titular': 'Perfecto. ¿Tienes la factura a mano, en papel o en el móvil?',
  'si soy el titular': 'Perfecto. ¿Tienes la factura a mano, en papel o en el móvil?',
  'yo soy el titular': 'Perfecto. ¿Tienes la factura a mano, en papel o en el móvil?',

  // Factura
  'si la tengo': 'Genial. Te mando un WhatsApp ahora, envíame una foto y te digo el ahorro exacto.',
  'sí la tengo': 'Genial. Te mando un WhatsApp ahora, envíame una foto y te digo el ahorro exacto.',
  'la tengo': 'Genial. Te mando un WhatsApp ahora, envíame una foto y te digo el ahorro exacto.',
  'si tengo': 'Genial. Te mando un WhatsApp ahora, envíame una foto y te digo el ahorro exacto.',

  // No tiene factura
  'no la tengo': 'No pasa nada. Te mando WhatsApp y me la envías cuando puedas.',
  'ahora no': 'Sin problema. Te mando WhatsApp y me la envías cuando tengas un momento.',
  'no tengo': 'Vale. Te mando WhatsApp y cuando la tengas me la pasas.',

  // Objeciones comunes
  'quien eres': 'Cristina, de Calidad Energía. Revisamos si puedes pagar menos en la luz.',
  'quién eres': 'Cristina, de Calidad Energía. Revisamos si puedes pagar menos en la luz.',
  'de donde llamas': 'De Calidad Energía. Ayudamos a bajar la factura de la luz.',
  'de dónde llamas': 'De Calidad Energía. Ayudamos a bajar la factura de la luz.',
  'esto que es': 'Revisamos tu factura de luz para ver si puedes ahorrar. Sin coste ni compromiso.',
  'esto qué es': 'Revisamos tu factura de luz para ver si puedes ahorrar. Sin coste ni compromiso.',
  'cuanto cuesta': 'Nada, es sin coste. Solo miramos si puedes pagar menos.',
  'cuánto cuesta': 'Nada, es sin coste. Solo miramos si puedes pagar menos.',
  'es gratis': 'Sí, sin coste. Solo revisamos tu factura.',

  // No interesado
  'no me interesa': 'Vale, sin problema. Cuando quieras estoy por aquí. ¡Hasta luego!',
  'no gracias': 'Vale, sin problema. ¡Hasta luego!',
  'no quiero': 'Perfecto, cuando quieras. ¡Hasta luego!',
  'dejalo': 'Vale. ¡Hasta luego!',
  'déjalo': 'Vale. ¡Hasta luego!',

  // Despedidas positivas
  'gracias': 'A ti. Te mando el WhatsApp ahora. ¡Hasta luego!',
  'perfecto': 'Genial. Te mando WhatsApp ahora, envíame la foto de la factura.',
  'de acuerdo': 'Perfecto. Te mando WhatsApp, envíame la factura cuando puedas.',
  'muy bien': 'Genial. Te mando WhatsApp ahora.',
};

// Detectar fin de llamada
const END_PHRASES = ['no me interesa', 'no gracias', 'no quiero', 'dejalo', 'déjalo', 'adios', 'adiós', 'hasta luego', 'cuelgo'];

export async function POST(request: Request) {
  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult') as string;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  console.log(`[Voice] Dijo: "${speechResult}"`);

  if (!speechResult) {
    return twiml('¿Perdona?', baseUrl, false);
  }

  const input = speechResult.toLowerCase().trim();

  // Detectar fin de llamada
  const isEnd = END_PHRASES.some(p => input.includes(p));
  if (isEnd) {
    return twiml('Vale, cuando quieras. ¡Hasta luego!', baseUrl, true);
  }

  // Buscar respuesta rápida (SIN OPENAI = INSTANTÁNEO)
  for (const [key, response] of Object.entries(QUICK_RESPONSES)) {
    if (input.includes(key) || input === key) {
      const shouldEnd = response.includes('Hasta luego');
      return twiml(response, baseUrl, shouldEnd);
    }
  }

  // Fallback: respuesta genérica (aún sin OpenAI)
  // Solo usamos OpenAI si realmente no entendemos
  if (input.length < 3) {
    return twiml('¿Puedes repetir?', baseUrl, false);
  }

  // Para casos no mapeados, damos respuesta genérica que avanza la conversación
  return twiml('Vale, perfecto. ¿Tienes la factura de la luz a mano?', baseUrl, false);
}

function twiml(message: string, baseUrl: string, endCall: boolean): NextResponse {
  const escaped = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const xml = endCall
    ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">${escaped}</Say>
  <Hangup/>
</Response>`
    : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">${escaped}</Say>
  <Gather input="speech" language="es-ES" speechTimeout="2" timeout="5" action="${baseUrl}/api/voice/respond" method="POST"/>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">¿Sigues ahí?</Say>
  <Gather input="speech" language="es-ES" speechTimeout="2" timeout="3" action="${baseUrl}/api/voice/respond" method="POST"/>
  <Hangup/>
</Response>`;

  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
