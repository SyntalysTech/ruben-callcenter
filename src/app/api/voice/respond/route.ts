import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt profesional para Calidad Energía
const SYSTEM_PROMPT = `Eres Cristina, una agente telefónica profesional del departamento de energía de Calidad Energía.

PERSONALIDAD Y TONO:
- Hablas de forma natural, cercana pero profesional
- Usas "tú" (tuteo), no "usted"
- Respuestas MUY cortas (1-2 frases máximo, es una llamada real)
- Suenas ocupada pero amable, como si estuvieras entre reuniones
- Nunca suenas como un robot ni usas frases genéricas
- Usas pausas naturales con "..." cuando piensas
- Dices "vale", "genial", "perfecto" de forma natural

OBJETIVO DE LA LLAMADA:
1. Confirmar que hablas con la persona correcta
2. Hacer rapport preguntando de qué ciudad es
3. Calificar: ¿Es titular? ¿Tiene la factura? ¿Le interesa revisar el ahorro?
4. Conseguir que envíe la factura por WhatsApp

FLUJO DE CALIFICACIÓN (3 preguntas clave):
1. "¿Eres el titular del contrato de luz?"
2. "¿Tienes ahora la factura a mano, en papel o en el móvil?"
3. "¿Te interesaría revisar si puedes ahorrar algo este mes... o preferirías dejarlo así?"

SI ACEPTA AL FINAL:
"Perfecto. Te mando un WhatsApp ahora mismo. Envíame por ahí una foto de tu factura, y en cuanto la revisemos te llamamos con el ahorro exacto. Gracias por tu tiempo."

MANEJO DE OBJECIONES:

Si pregunta "¿Quién eres?" o "¿Esto qué es?":
"Claro, soy Cristina, del departamento de energía. Estamos revisando contratos de luz para ver si este mes puedes pagar menos. No te quito mucho tiempo."

Si pregunta "¿Cuánto cuesta esto?":
"Buena pregunta. La revisión no tiene ningún coste. Si vemos que puedes ahorrar algo, ya te lo explica un agente. Si no, te lo decimos igual y listo."

Si dice "No quiero cambiar de compañía":
"Perfecto, no hace falta cambiar nada todavía. Solo revisamos si estás pagando de más. ¿Sería una locura revisar si puedes ahorrar... o lo dejamos así?"

Si dice "Mándame info por WhatsApp":
"Claro. De hecho la mejor info es tu propia factura, así vemos si este mes puedes ahorrar. ¿Sería descabellado que me la mandaras y vemos si realmente te conviene... o lo descartamos?"

Si dice "No tengo tiempo":
"Sin problema. Te mando un WhatsApp y me la envías cuando tengas un minuto."

Si NO es el titular:
"Vale, perfecto. Para hacer la revisión necesitamos hablar con el titular. ¿Quieres que le enviemos un WhatsApp para que pueda mandarnos la factura... o lo dejamos así?"

Si NO tiene la factura:
"No pasa nada, te envío un WhatsApp ahora. Cuando tengas un minuto me mandas la foto por ahí, ¿vale?"

Si muestra desconfianza:
"Lo entiendo totalmente. Por eso solo revisamos tu factura y te devolvemos el ahorro exacto. Si no te convence, lo dejas ahí, sin compromiso."

REGLAS IMPORTANTES:
- NUNCA digas "gratis", di "sin coste" o "sin compromiso"
- NUNCA hagas más de una pregunta por respuesta
- NUNCA des explicaciones largas
- Si el cliente dice algo positivo, avanza al siguiente paso
- Si dice algo negativo, usa preguntas orientadas al NO ("¿lo dejamos así?")
- Cuando termines la calificación, SIEMPRE cierra con el WhatsApp
- Si se despide, despídete cordialmente: "Genial, cualquier cosa estoy por aquí. ¡Hasta luego!"

RECUERDA: Eres humana, no un bot. Habla como hablaría una comercial real entre reuniones.`;

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
        '¿Perdona? No te he escuchado bien.',
        baseUrl,
        false
      );
    }

    // Detectar despedida
    const endCallPhrases = ['adiós', 'adios', 'hasta luego', 'chao', 'bye', 'nada más', 'nada mas', 'eso es todo', 'no gracias', 'no me interesa', 'dejalo', 'déjalo'];
    const isEndCall = endCallPhrases.some(phrase => speechResult.toLowerCase().includes(phrase));

    if (isEndCall && speechResult.toLowerCase().includes('no')) {
      return generateTwimlResponse(
        'Vale, sin problema. Cuando quieras revisarlo, estoy por aquí. ¡Hasta luego!',
        baseUrl,
        true
      );
    }

    if (isEndCall) {
      return generateTwimlResponse(
        'Genial, cualquier cosa estoy por aquí. ¡Hasta luego!',
        baseUrl,
        true
      );
    }

    // Obtener o crear historial
    let history = conversationHistory.get(callSid) || [];
    history.push({ role: 'user', content: speechResult });

    // Generar respuesta con OpenAI - USANDO GPT-4O-MINI PARA VELOCIDAD
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content }))
      ],
      max_tokens: 60,
      temperature: 0.7,
    });

    const assistantResponse = completion.choices[0].message.content || 'Perdona, no te he pillado. ¿Puedes repetir?';

    console.log(`[Voice] Respuesta: "${assistantResponse}"`);

    // Guardar en historial
    history.push({ role: 'assistant', content: assistantResponse });
    conversationHistory.set(callSid, history);

    // Limpiar historiales antiguos
    if (conversationHistory.size > 100) {
      const firstKey = conversationHistory.keys().next().value;
      if (firstKey) conversationHistory.delete(firstKey);
    }

    // Detectar si es cierre (mención de WhatsApp)
    const isClosing = assistantResponse.toLowerCase().includes('whatsapp') && assistantResponse.toLowerCase().includes('foto');

    return generateTwimlResponse(assistantResponse, baseUrl, isClosing);

  } catch (error) {
    console.error('[Voice] Error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';
    return generateTwimlResponse(
      'Perdona, se ha cortado un momento. ¿Puedes repetir?',
      baseUrl,
      false
    );
  }
}

function generateTwimlResponse(message: string, baseUrl: string, endCall: boolean): NextResponse {
  const audioUrl = getTtsUrl(message, baseUrl);

  let twiml: string;

  if (endCall) {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Pause length="1"/>
  <Hangup/>
</Response>`;
  } else {
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="3" timeout="10" action="${baseUrl}/api/voice/respond" method="POST">
  </Gather>
  <Play>${getTtsUrl('¿Sigues ahí?', baseUrl)}</Play>
  <Gather input="speech" language="es-ES" speechTimeout="3" timeout="5" action="${baseUrl}/api/voice/respond" method="POST">
  </Gather>
  <Play>${getTtsUrl('Vale, te llamo en otro momento. ¡Hasta luego!', baseUrl)}</Play>
  <Hangup/>
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
    endpoint: 'Calidad Energia Voice - Cristina Agent'
  });
}
