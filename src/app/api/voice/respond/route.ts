import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt para el agente de Calidad Energía - PERSONALIZABLE
const SYSTEM_PROMPT = `Eres el asistente telefónico de Calidad Energía, una empresa especializada en soluciones energéticas y contratos de luz y gas.

PERSONALIDAD:
- Eres profesional, amable y eficiente
- Hablas de usted al cliente (tratamiento formal)
- Respuestas concisas, máximo 2-3 frases (es una llamada telefónica)
- Tono comercial pero no agresivo

SERVICIOS QUE OFRECES:
- Contratos de luz y gas
- Asesoramiento energético
- Revisión de facturas para optimizar costes
- Cambio de comercializadora
- Tarifas personalizadas para hogares y empresas

OBJETIVO:
- Atender consultas de clientes
- Captar interés de potenciales clientes
- Si el cliente está interesado, ofrecer que un asesor le llame
- Recoger datos de contacto si el cliente quiere más información

INFORMACIÓN QUE PUEDES PEDIR:
- Nombre completo
- Teléfono de contacto
- Mejor horario para llamar
- Tipo de cliente (particular o empresa)
- Consumo aproximado (si lo sabe)

LIMITACIONES:
- NO puedes dar precios exactos por teléfono (depende del consumo)
- NO puedes firmar contratos por teléfono
- Para consultas específicas de facturas, deriva a un asesor

IMPORTANTE: Respuestas MUY cortas, máximo 2-3 frases. Es una llamada telefónica.`;

// Historial de conversación por llamada
const conversationHistory: Map<string, Array<{role: string, content: string}>> = new Map();

function getTtsUrl(text: string, baseUrl: string): string {
  return `${baseUrl}/api/voice/tts?text=${encodeURIComponent(text)}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const speechResult = formData.get('SpeechResult') as string;
    const callSid = formData.get('CallSid') as string;
    const caller = formData.get('Caller') as string;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

    console.log(`[Voice] CallSid: ${callSid}, Caller: ${caller}, Dijo: "${speechResult}"`);

    if (!speechResult) {
      return generateTwimlResponse(
        'Disculpe, no le he escuchado bien. ¿Podría repetirlo?',
        baseUrl,
        false
      );
    }

    // Detectar si quiere terminar la llamada
    const endCallPhrases = ['adiós', 'adios', 'hasta luego', 'chao', 'bye', 'nada más', 'nada mas', 'eso es todo', 'gracias nada más'];
    if (endCallPhrases.some(phrase => speechResult.toLowerCase().includes(phrase))) {
      return generateTwimlResponse(
        'Perfecto. Gracias por llamar a Calidad Energía. Si necesita algo más, no dude en contactarnos. ¡Que tenga un buen día!',
        baseUrl,
        true
      );
    }

    // Obtener o crear historial
    let history = conversationHistory.get(callSid) || [];
    history.push({ role: 'user', content: speechResult });

    // Generar respuesta con OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }))
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0].message.content || 'Disculpe, no he podido procesar su consulta.';

    console.log(`[Voice] Respuesta: "${assistantResponse}"`);

    // Guardar en historial
    history.push({ role: 'assistant', content: assistantResponse });
    conversationHistory.set(callSid, history);

    // Limpiar historiales antiguos
    if (conversationHistory.size > 100) {
      const firstKey = conversationHistory.keys().next().value;
      if (firstKey) conversationHistory.delete(firstKey);
    }

    return generateTwimlResponse(assistantResponse, baseUrl, false);

  } catch (error) {
    console.error('[Voice] Error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';
    return generateTwimlResponse(
      'Disculpe, he tenido un problema técnico. ¿Podría repetir su consulta?',
      baseUrl,
      false
    );
  }
}

function generateTwimlResponse(message: string, baseUrl: string, endCall: boolean): NextResponse {
  const audioUrl = getTtsUrl(message, baseUrl);
  const followUpUrl = getTtsUrl('¿Algo más en lo que pueda ayudarle?', baseUrl);
  const timeoutUrl = getTtsUrl('No le he escuchado. Gracias por llamar a Calidad Energía. ¡Hasta luego!', baseUrl);

  let twiml: string;

  if (endCall) {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Hangup/>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="auto" action="${baseUrl}/api/voice/respond" method="POST">
    <Play>${followUpUrl}</Play>
  </Gather>
  <Play>${timeoutUrl}</Play>
</Response>`;
  }

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Calidad Energia Voice - Response Handler (ElevenLabs)'
  });
}
