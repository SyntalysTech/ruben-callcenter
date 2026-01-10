import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Audios pregrabados (ElevenLabs) - INSTANTÁNEOS
const AUDIO = {
  titular: '/audio/titular.mp3',
  factura: '/audio/factura.mp3',
  cierre: '/audio/cierre.mp3',
  adios: '/audio/adios.mp3',
  adios_titular: '/audio/adios_titular.mp3',
  adios_factura: '/audio/adios_factura.mp3',
  quien_soy: '/audio/quien_soy.mp3',
  gratis: '/audio/gratis.mp3',
  como_funciona: '/audio/como_funciona.mp3',
  no_entendi: '/audio/no_entendi.mp3',
};

// Fallback a Polly si OpenAI falla
const VOICE = 'Polly.Lucia-Neural';
const LANG = 'es-ES';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  const formData = await request.formData();
  const speech = (formData.get('SpeechResult') as string || '').toLowerCase().trim();
  const url = new URL(request.url);
  const step = parseInt(url.searchParams.get('step') || '0');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  console.log(`[Voice] step=${step}: "${speech}"`);

  // === RESPUESTAS PREGRABADAS (instantáneas) ===

  // Rechazo directo
  if (speech.includes('no me interesa') || speech.includes('no gracias') || speech.includes('adios') || speech.includes('adiós')) {
    return playEnd(AUDIO.adios, baseUrl);
  }

  // No titular
  if (speech.includes('no soy') && speech.includes('titular')) {
    return playEnd(AUDIO.adios_titular, baseUrl);
  }

  // No factura (step 1)
  if (step === 1 && (speech.includes('no la tengo') || speech.includes('no tengo') || speech.includes('ahora no'))) {
    return playEnd(AUDIO.adios_factura, baseUrl);
  }

  // Quién eres
  if (speech.includes('quien') || speech.includes('quién')) {
    return play(AUDIO.quien_soy, baseUrl, 0); // Vuelve a preguntar titular
  }

  // Cuánto cuesta / gratis
  if (speech.includes('cuanto') || speech.includes('cuánto') || speech.includes('gratis') || speech.includes('coste')) {
    return play(AUDIO.gratis, baseUrl, 0);
  }

  // Cómo funciona
  if (speech.includes('como funciona') || speech.includes('cómo funciona') || speech.includes('explica')) {
    return play(AUDIO.como_funciona, baseUrl, 1);
  }

  // Respuestas positivas claras - avanzar
  const isPositive = speech.includes('si') || speech.includes('sí') || speech.includes('vale') ||
                     speech.includes('claro') || speech.includes('ok') || speech.includes('bueno') ||
                     speech.includes('adelante') || speech.includes('dime') || speech.includes('correcto');

  if (isPositive) {
    const next = step + 1;
    if (next === 1) return play(AUDIO.factura, baseUrl, 1);
    if (next >= 2) return playEnd(AUDIO.cierre, baseUrl);
  }

  // Titular confirmado
  if (speech.includes('titular') || speech.includes('soy yo')) {
    return play(AUDIO.factura, baseUrl, 1);
  }

  // Factura confirmada
  if (speech.includes('tengo') || speech.includes('la tengo') || speech.includes('aquí') || speech.includes('aqui')) {
    return playEnd(AUDIO.cierre, baseUrl);
  }

  // === RESPUESTA DINÁMICA CON IA (solo si no matchea nada) ===
  if (speech.length > 3) {
    try {
      const aiResponse = await getAIResponse(speech, step);
      // Usar Polly para la respuesta de IA (más rápido que generar audio)
      return say(aiResponse.text, baseUrl, aiResponse.end, aiResponse.nextStep);
    } catch (error) {
      console.error('[Voice] AI error:', error);
    }
  }

  // Fallback: no entendí
  return play(AUDIO.no_entendi, baseUrl, step);
}

// Respuesta de IA para casos no mapeados
async function getAIResponse(speech: string, step: number): Promise<{ text: string; end: boolean; nextStep: number }> {
  const context = step === 0 ? 'Preguntaste si es el titular del contrato.' :
                  step === 1 ? 'Preguntaste si tiene la factura a mano.' : '';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 60,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: `Eres Cristina, agente de Calidad Energía. Hablas español de España, muy breve y natural.
${context}
Tu objetivo: conseguir que envíe foto de factura por WhatsApp.
Responde en 1-2 frases máximo. Si rechaza, despídete amablemente.
Responde SOLO con el texto a decir, nada más.`
      },
      { role: 'user', content: speech }
    ]
  });

  const text = completion.choices[0]?.message?.content || '¿Perdona?';
  const isEnd = text.toLowerCase().includes('hasta luego') || text.toLowerCase().includes('adiós');

  return { text, end: isEnd, nextStep: step };
}

// Play audio pregrabado + gather
function play(audioPath: string, baseUrl: string, nextStep: number): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${baseUrl}${audioPath}</Play><Gather input="speech" language="es-ES" speechTimeout="auto" timeout="5" action="${baseUrl}/api/voice/respond?step=${nextStep}" method="POST"/><Hangup/></Response>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

// Play audio pregrabado + hangup
function playEnd(audioPath: string, baseUrl: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${baseUrl}${audioPath}</Play><Hangup/></Response>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

// Say con Polly (para respuestas IA)
function say(msg: string, baseUrl: string, end: boolean, step: number): NextResponse {
  const escaped = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const xml = end
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="${VOICE}" language="${LANG}">${escaped}</Say><Hangup/></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="${VOICE}" language="${LANG}">${escaped}</Say><Gather input="speech" language="es-ES" speechTimeout="auto" timeout="5" action="${baseUrl}/api/voice/respond?step=${step}" method="POST"/><Hangup/></Response>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
