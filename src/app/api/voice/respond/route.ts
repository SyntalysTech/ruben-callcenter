import { NextResponse } from 'next/server';

// Audios pregrabados (ElevenLabs)
const A = {
  titular: '/audio/titular.mp3',
  factura: '/audio/factura.mp3',
  cierre: '/audio/cierre.mp3',
  titular_ahi: '/audio/titular_ahi.mp3',
  titular_numero: '/audio/titular_numero.mp3',
  titular_hora: '/audio/titular_hora.mp3',
  titular_whatsapp: '/audio/titular_whatsapp.mp3',
  adios: '/audio/adios.mp3',
  adios_factura: '/audio/adios_factura.mp3',
  adios_llamar: '/audio/adios_llamar.mp3',
  quien_soy: '/audio/quien_soy.mp3',
  gratis: '/audio/gratis.mp3',
  como_funciona: '/audio/como_funciona.mp3',
  no_entendi: '/audio/no_entendi.mp3',
  repite: '/audio/repite.mp3',
};

/*
FLUJO DE ESTADOS:
0 = esperando respuesta al saludo (¿te interesa?)
1 = preguntó si es titular
2 = es titular, preguntó factura
3 = no es titular, preguntó si está por ahí
4 = no está, preguntó número del titular
5 = no tiene número, preguntó hora para llamar
*/

export async function POST(request: Request) {
  const formData = await request.formData();
  const speech = (formData.get('SpeechResult') as string || '').toLowerCase().trim();
  const url = new URL(request.url);
  const step = parseInt(url.searchParams.get('step') || '0');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruben-callcenter.vercel.app';

  console.log(`[Voice] step=${step}: "${speech}"`);

  // === RECHAZOS DIRECTOS (cualquier momento) ===
  if (speech.includes('no me interesa') || speech.includes('no gracias') ||
      speech.includes('adios') || speech.includes('adiós') || speech.includes('dejalo')) {
    return playEnd(A.adios, baseUrl);
  }

  // === OBJECIONES (cualquier momento) ===
  if (speech.includes('quien') || speech.includes('quién')) {
    return play(A.quien_soy, baseUrl, 1); // Vuelve a preguntar titular
  }
  if (speech.includes('cuanto') || speech.includes('cuánto') || speech.includes('gratis') || speech.includes('coste')) {
    return play(A.gratis, baseUrl, 1);
  }
  if (speech.includes('como funciona') || speech.includes('cómo funciona')) {
    return play(A.como_funciona, baseUrl, 1);
  }

  // === DETECCIÓN DE SÍ/NO ===
  const esSi = speech.includes('si') || speech.includes('sí') || speech.includes('vale') ||
               speech.includes('claro') || speech.includes('ok') || speech.includes('bueno') ||
               speech.includes('adelante') || speech.includes('dime') || speech.includes('correcto');

  const esNo = speech.includes('no ') || speech.startsWith('no') || speech === 'no';

  // === FLUJO POR ESTADO ===

  // STEP 0: Respuesta al saludo inicial
  if (step === 0) {
    if (esSi || speech.length > 2) {
      return play(A.titular, baseUrl, 1); // Preguntar si es titular
    }
    return play(A.no_entendi, baseUrl, 0);
  }

  // STEP 1: ¿Eres el titular?
  if (step === 1) {
    // PRIMERO: No es titular (detectar antes que el "si" de "soy")
    if (speech.includes('no soy') || speech.includes('no, ') ||
        (speech.startsWith('no') && !speech.includes('no sé'))) {
      return play(A.titular_ahi, baseUrl, 3); // ¿Está el titular por ahí?
    }
    // Es titular
    if (esSi || speech.includes('titular') || speech.includes('soy yo') || speech.includes('yo soy')) {
      return play(A.factura, baseUrl, 2); // Preguntar factura
    }
    return play(A.repite, baseUrl, 1);
  }

  // STEP 2: ¿Tienes la factura? (es titular)
  if (step === 2) {
    // Tiene factura
    if (esSi || speech.includes('tengo') || speech.includes('la tengo') ||
        speech.includes('aquí') || speech.includes('aqui') || speech.includes('movil') || speech.includes('papel')) {
      return playEnd(A.cierre, baseUrl); // Cierre exitoso
    }
    // No tiene factura
    if (esNo || speech.includes('no la tengo') || speech.includes('ahora no')) {
      return playEnd(A.adios_factura, baseUrl);
    }
    return play(A.repite, baseUrl, 2);
  }

  // STEP 3: ¿Está el titular por ahí?
  if (step === 3) {
    // Sí está
    if (esSi || speech.includes('espera') || speech.includes('ahora') || speech.includes('te paso')) {
      return play(A.titular, baseUrl, 1); // Esperar a que se ponga el titular
    }
    // No está
    if (esNo || speech.includes('no está') || speech.includes('no esta') || speech.includes('trabaja')) {
      return play(A.titular_numero, baseUrl, 4); // Pedir número
    }
    return play(A.repite, baseUrl, 3);
  }

  // STEP 4: ¿Me das el número del titular?
  if (step === 4) {
    // Da el número (detectar dígitos)
    if (/\d{3,}/.test(speech) || speech.includes('seis') || speech.includes('siete') ||
        speech.includes('ocho') || speech.includes('nueve')) {
      return playEnd(A.adios_llamar, baseUrl); // Gracias, le llamo
    }
    // No tiene/no quiere
    if (esNo || speech.includes('no sé') || speech.includes('no se') || speech.includes('no tengo')) {
      return play(A.titular_hora, baseUrl, 5); // ¿A qué hora estará?
    }
    return play(A.repite, baseUrl, 4);
  }

  // STEP 5: ¿A qué hora estará?
  if (step === 5) {
    // Da una hora
    if (speech.includes('mañana') || speech.includes('tarde') || speech.includes('noche') ||
        /\d+/.test(speech) || speech.includes('hora') || speech.includes('luego')) {
      return playEnd(A.adios_llamar, baseUrl);
    }
    // No sabe
    if (esNo || speech.includes('no sé') || speech.includes('no se')) {
      return playEnd(A.titular_whatsapp, baseUrl); // Envío WhatsApp
    }
    return play(A.repite, baseUrl, 5);
  }

  // Fallback
  return play(A.no_entendi, baseUrl, step);
}

function play(audioPath: string, baseUrl: string, nextStep: number): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${baseUrl}${audioPath}</Play><Gather input="speech" language="es-ES" speechTimeout="auto" timeout="5" action="${baseUrl}/api/voice/respond?step=${nextStep}" method="POST"/><Hangup/></Response>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

function playEnd(audioPath: string, baseUrl: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Play>${baseUrl}${audioPath}</Play><Hangup/></Response>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
