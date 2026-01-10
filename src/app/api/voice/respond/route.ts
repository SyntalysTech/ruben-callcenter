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
  dime_numero: '/audio/dime_numero.mp3',
  que_dia: '/audio/que_dia.mp3',
  que_hora: '/audio/que_hora.mp3',
  gracias_llamar: '/audio/gracias_llamar.mp3',
  adios: '/audio/adios.mp3',
  adios_factura: '/audio/adios_factura.mp3',
  quien_soy: '/audio/quien_soy.mp3',
  gratis: '/audio/gratis.mp3',
  como_funciona: '/audio/como_funciona.mp3',
  no_entendi: '/audio/no_entendi.mp3',
  repite: '/audio/repite.mp3',
};

/*
FLUJO DE ESTADOS:
0 = respuesta al saludo (¿te pillo bien?)
1 = ¿eres el titular?
2 = (es titular) ¿tienes la factura?
3 = (no es titular) ¿está el titular por ahí?
4 = ¿me das el número del titular?
5 = (no tiene número) ¿a qué hora estará?
6 = esperando el número
7 = ¿qué día le viene mejor?
8 = ¿a qué hora?
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
    return play(A.quien_soy, baseUrl, 1);
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

  // === FLUJO POR ESTADO ===

  // STEP 0: Respuesta al saludo inicial
  if (step === 0) {
    if (esSi || speech.length > 2) {
      return play(A.titular, baseUrl, 1);
    }
    return play(A.no_entendi, baseUrl, 0);
  }

  // STEP 1: ¿Eres el titular?
  if (step === 1) {
    // No es titular
    if (speech.includes('no soy') || speech.includes('no, ') ||
        (speech.startsWith('no') && !speech.includes('no sé'))) {
      return play(A.titular_ahi, baseUrl, 3);
    }
    // Es titular
    if (esSi || speech.includes('titular') || speech.includes('soy yo') || speech.includes('yo soy')) {
      return play(A.factura, baseUrl, 2);
    }
    return play(A.repite, baseUrl, 1);
  }

  // STEP 2: ¿Tienes la factura?
  if (step === 2) {
    if (esSi || speech.includes('tengo') || speech.includes('la tengo') ||
        speech.includes('aquí') || speech.includes('aqui') || speech.includes('movil') || speech.includes('papel')) {
      return playEnd(A.cierre, baseUrl);
    }
    if (speech.startsWith('no') || speech.includes('no la tengo') || speech.includes('ahora no')) {
      return playEnd(A.adios_factura, baseUrl);
    }
    return play(A.repite, baseUrl, 2);
  }

  // STEP 3: ¿Está el titular por ahí?
  if (step === 3) {
    if (esSi || speech.includes('espera') || speech.includes('ahora') || speech.includes('te paso')) {
      return play(A.titular, baseUrl, 1);
    }
    if (speech.startsWith('no') || speech.includes('no está') || speech.includes('no esta') || speech.includes('trabaja')) {
      return play(A.titular_numero, baseUrl, 4);
    }
    return play(A.repite, baseUrl, 3);
  }

  // STEP 4: ¿Me das el número del titular?
  if (step === 4) {
    // Dice que sí
    if (esSi || speech.includes('apunta') || speech.includes('toma nota')) {
      return play(A.dime_numero, baseUrl, 6);
    }
    // Da el número directamente
    if (tieneNumeros(speech)) {
      return play(A.que_dia, baseUrl, 7); // Preguntar qué día
    }
    // No tiene/no quiere
    if (speech.startsWith('no') || speech.includes('no sé') || speech.includes('no se') || speech.includes('no tengo')) {
      return play(A.titular_hora, baseUrl, 5);
    }
    return play(A.repite, baseUrl, 4);
  }

  // STEP 6: Esperando el número
  if (step === 6) {
    if (tieneNumeros(speech) || speech.length > 5) {
      return play(A.que_dia, baseUrl, 7); // Preguntar qué día
    }
    return play(A.repite, baseUrl, 6);
  }

  // STEP 7: ¿Qué día le viene mejor?
  if (step === 7) {
    if (speech.includes('hoy') || speech.includes('mañana') || speech.includes('pasado') ||
        speech.includes('lunes') || speech.includes('martes') || speech.includes('miercoles') ||
        speech.includes('jueves') || speech.includes('viernes') || speech.includes('sabado') ||
        speech.includes('semana') || speech.includes('dia') || speech.length > 2) {
      return play(A.que_hora, baseUrl, 8); // Preguntar hora
    }
    return play(A.repite, baseUrl, 7);
  }

  // STEP 8: ¿A qué hora?
  if (step === 8) {
    if (speech.includes('mañana') || speech.includes('tarde') || speech.includes('noche') ||
        speech.includes('mediodia') || speech.includes('hora') || /\d/.test(speech) ||
        speech.length > 2) {
      return playEnd(A.gracias_llamar, baseUrl); // Cierre
    }
    return play(A.repite, baseUrl, 8);
  }

  // STEP 5: ¿A qué hora estará? (no tiene número)
  if (step === 5) {
    if (speech.includes('mañana') || speech.includes('tarde') || speech.includes('noche') ||
        /\d+/.test(speech) || speech.includes('hora') || speech.includes('luego')) {
      return playEnd(A.gracias_llamar, baseUrl);
    }
    if (speech.startsWith('no') || speech.includes('no sé') || speech.includes('no se')) {
      return playEnd(A.titular_whatsapp, baseUrl);
    }
    return play(A.repite, baseUrl, 5);
  }

  return play(A.no_entendi, baseUrl, step);
}

function tieneNumeros(s: string): boolean {
  return /\d/.test(s) || s.includes('seis') || s.includes('siete') ||
         s.includes('ocho') || s.includes('nueve') || s.includes('cero') ||
         s.includes('uno') || s.includes('dos') || s.includes('tres') ||
         s.includes('cuatro') || s.includes('cinco');
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
