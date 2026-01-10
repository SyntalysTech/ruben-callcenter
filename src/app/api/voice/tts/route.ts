import { NextResponse } from 'next/server';
import { textToSpeech } from '@/lib/elevenlabs';

// Cache simple para audios generados (evitar regenerar el mismo texto)
const audioCache = new Map<string, { audio: ArrayBuffer; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Limpiar cache antiguo
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of audioCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      audioCache.delete(key);
    }
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const text = url.searchParams.get('text');

    if (!text) {
      return NextResponse.json({ error: 'Parámetro text requerido' }, { status: 400 });
    }

    // Limpiar cache viejo
    cleanCache();

    // Buscar en cache
    const cacheKey = text.toLowerCase().trim();
    const cached = audioCache.get(cacheKey);
    if (cached) {
      console.log('[TTS] Audio desde cache');
      return new Response(cached.audio, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    console.log(`[TTS] Generando audio para: "${text.substring(0, 50)}..."`);

    const audioData = await textToSpeech(text);
    const arrayBuffer = audioData.buffer.slice(
      audioData.byteOffset,
      audioData.byteOffset + audioData.byteLength
    ) as ArrayBuffer;

    // Guardar en cache
    audioCache.set(cacheKey, { audio: arrayBuffer, timestamp: Date.now() });

    // Limitar tamaño del cache
    if (audioCache.size > 50) {
      const firstKey = audioCache.keys().next().value;
      if (firstKey) audioCache.delete(firstKey);
    }

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=300',
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[TTS] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Campo text requerido' }, { status: 400 });
    }

    console.log(`[TTS] Generando audio para: "${text.substring(0, 50)}..."`);

    const audioData = await textToSpeech(text);
    const arrayBuffer = audioData.buffer.slice(
      audioData.byteOffset,
      audioData.byteOffset + audioData.byteLength
    ) as ArrayBuffer;

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[TTS] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
