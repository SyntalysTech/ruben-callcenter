// ElevenLabs Text-to-Speech Service

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voces disponibles en español (puedes cambiar el voice_id)
// Lista de voces: https://api.elevenlabs.io/v1/voices
export const VOICE_CONFIG = {
  voiceId: '1eHrpOW5l98cxiSRjbzJ',
  modelId: 'eleven_multilingual_v2',
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.5,
  useSpeakerBoost: true
};

export interface ElevenLabsConfig {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export async function textToSpeech(
  text: string,
  config?: ElevenLabsConfig
): Promise<Uint8Array> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY no configurada');
  }

  const voiceId = config?.voiceId || VOICE_CONFIG.voiceId;
  const modelId = config?.modelId || VOICE_CONFIG.modelId;

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: config?.stability || VOICE_CONFIG.stability,
          similarity_boost: config?.similarityBoost || VOICE_CONFIG.similarityBoost,
          style: VOICE_CONFIG.style,
          use_speaker_boost: VOICE_CONFIG.useSpeakerBoost
        }
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('[ElevenLabs] Error:', error);
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Obtener lista de voces disponibles
export async function getVoices() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY no configurada');
  }

  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo voces: ${response.status}`);
  }

  return response.json();
}
