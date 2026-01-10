import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt profesional para Calidad Energía - MUY CORTO para velocidad
const SYSTEM_PROMPT = `Eres Cristina de Calidad Energía. Hablas natural, tuteas, respuestas ULTRA cortas (1 frase max).

FLUJO:
1. Confirmar nombre → preguntar ciudad → hacer rapport breve
2. "¿Eres el titular del contrato de luz?"
3. "¿Tienes la factura a mano?"
4. "¿Te interesa revisar si puedes ahorrar... o lo dejamos?"
5. CIERRE: "Te mando WhatsApp, envíame foto de la factura."

OBJECIONES (responde en 1 frase):
- "¿Quién eres?" → "Cristina, de energía. Revisamos si puedes pagar menos."
- "¿Cuesta algo?" → "No, sin coste. Solo miramos tu factura."
- "No quiero cambiar" → "No hace falta. ¿Revisamos si pagas de más o lo dejamos?"
- "No tengo tiempo" → "Te mando WhatsApp y me la envías cuando puedas."

REGLAS: Respuestas de 1 FRASE. Nunca digas "gratis". Suena humana.`;

// Historial por llamada
const conversationHistory: Map<string, Array<{role: string, content: string}>> = new Map();

// Voz de Twilio para respuestas rápidas
const TWILIO_VOICE = 'Polly.Lucia-Neural';
const TWILIO_LANG = 'es-ES';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult') as string;
    const callSid = formData.get('CallSid') as string;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

    console.log(`[Voice] Dijo: "${speechResult}"`);

    if (!speechResult) {
      return twimlSay('¿Perdona?', baseUrl, false);
    }

    // Detectar despedida rápida
    const lower = speechResult.toLowerCase();
    if (lower.includes('adios') || lower.includes('hasta luego') || lower.includes('no me interesa') || lower.includes('dejalo')) {
      return twimlSay('Vale, cuando quieras. ¡Hasta luego!', baseUrl, true);
    }

    // Historial
    let history = conversationHistory.get(callSid) || [];
    history.push({ role: 'user', content: speechResult });

    // GPT-4o-mini es el más rápido
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }))
      ],
      max_tokens: 40, // MUY corto
      temperature: 0.6,
    });

    const response = completion.choices[0].message.content || '¿Puedes repetir?';
    console.log(`[Voice] Respuesta: "${response}"`);

    history.push({ role: 'assistant', content: response });
    conversationHistory.set(callSid, history);

    // Limpiar cache viejo
    if (conversationHistory.size > 100) {
      const first = conversationHistory.keys().next().value;
      if (first) conversationHistory.delete(first);
    }

    // Detectar cierre
    const isClose = response.toLowerCase().includes('whatsapp');

    return twimlSay(response, baseUrl, isClose);

  } catch (error) {
    console.error('[Voice] Error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';
    return twimlSay('Perdona, ¿puedes repetir?', baseUrl, false);
  }
}

// Usar Twilio <Say> para respuesta INSTANTÁNEA
function twimlSay(message: string, baseUrl: string, endCall: boolean): NextResponse {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  let twiml: string;

  if (endCall) {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">${escaped}</Say>
  <Hangup/>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">${escaped}</Say>
  <Gather input="speech" language="es-ES" speechTimeout="2" timeout="5" action="${baseUrl}/api/voice/respond" method="POST"/>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">¿Sigues ahí?</Say>
  <Gather input="speech" language="es-ES" speechTimeout="2" timeout="3" action="${baseUrl}/api/voice/respond" method="POST"/>
  <Say voice="${TWILIO_VOICE}" language="${TWILIO_LANG}">Te llamo luego.</Say>
  <Hangup/>
</Response>`;
  }

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'Cristina - Fast Response' });
}
