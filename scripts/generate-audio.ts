// Script para generar audios pregrabados con ElevenLabs
// Ejecutar con: npx ts-node scripts/generate-audio.ts

import * as fs from 'fs';
import * as path from 'path';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const VOICE_ID = '1eHrpOW5l98cxiSRjbzJ';
const MODEL_ID = 'eleven_turbo_v2_5';

// Todos los audios que necesitamos
const AUDIOS = {
  // Saludo inicial (outgoing)
  'saludo': '¡Hola! Soy Cristina, del departamento de energía. Estoy entre reuniones y solo tengo treinta segundos. Te llamaba porque estamos ayudando a clientes a ahorrar cuarenta o cincuenta euros al mes en la luz. ¿Sería una locura ver si podemos hacer algo contigo, o lo descartamos?',

  // Preguntas del flujo
  'titular': '¿Eres el titular del contrato de luz?',
  'factura': '¿Tienes la factura a mano?',
  'cierre': 'Perfecto. Te mando WhatsApp ahora, envíame foto de la factura y te digo cuánto puedes ahorrar. ¡Hasta luego!',

  // Despedidas
  'adios': 'Vale, sin problema. ¡Hasta luego!',
  'adios_titular': 'Vale, te mando WhatsApp para el titular. ¡Hasta luego!',
  'adios_factura': 'Te mando WhatsApp y me la pasas cuando puedas. ¡Hasta luego!',

  // Objeciones comunes
  'quien_soy': 'Cristina, de Calidad Energía. Ayudamos a bajar la factura de la luz. ¿Eres el titular?',
  'gratis': 'Sí, es sin coste. Solo revisamos tu factura para ver si puedes ahorrar. ¿Eres el titular?',
  'como_funciona': 'Muy fácil. Me mandas foto de la factura por WhatsApp y te digo cuánto puedes ahorrar. ¿La tienes a mano?',

  // Fallbacks
  'no_entendi': '¿Perdona? No te he escuchado bien.',
  'sigues_ahi': '¿Sigues ahí?',

  // Incoming
  'incoming': 'Hola, gracias por llamar a Calidad Energía. Soy Cristina. ¿En qué puedo ayudarte?',
};

async function generateAudio(text: string, filename: string): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY no configurada. Usa: ELEVENLABS_API_KEY=xxx npx ts-node scripts/generate-audio.ts');
  }

  console.log(`Generando: ${filename}...`);

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: false
        }
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error generando ${filename}: ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const outputPath = path.join(__dirname, '..', 'public', 'audio', `${filename}.mp3`);

  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  console.log(`✓ ${filename}.mp3 guardado`);
}

async function main() {
  console.log('Generando audios con ElevenLabs...\n');

  for (const [name, text] of Object.entries(AUDIOS)) {
    try {
      await generateAudio(text, name);
      // Pequeña pausa para no saturar la API
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`✗ Error en ${name}:`, error);
    }
  }

  console.log('\n¡Listo! Audios generados en public/audio/');
}

main();
