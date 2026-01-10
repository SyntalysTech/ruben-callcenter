'use client';

import { useState } from 'react';
import { Phone, PhoneCall, Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react';

// Numero verificado en Twilio para pruebas
const VERIFIED_TEST_NUMBER = '+34684094634';

export default function PruebaLlamadaPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; callSid?: string } | null>(null);
  const [leadName, setLeadName] = useState('Carlos');
  const [customMessage, setCustomMessage] = useState('');

  const handleTestCall = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/voice/outgoing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: VERIFIED_TEST_NUMBER,
          leadName: leadName || undefined,
          customMessage: customMessage || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Llamada iniciada correctamente a ${VERIFIED_TEST_NUMBER}`,
          callSid: data.callSid,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Error al iniciar la llamada',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error de conexion. Verifica que el servidor este funcionando.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestTTS = async () => {
    const text = customMessage || 'Hola, esto es una prueba del sistema de voz con ElevenLabs.';
    const audioUrl = `/api/voice/tts?text=${encodeURIComponent(text)}`;

    const audio = new Audio(audioUrl);
    audio.play().catch(err => {
      console.error('Error reproduciendo audio:', err);
      alert('Error reproduciendo audio. Verifica la API key de ElevenLabs.');
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Prueba de Llamadas</h1>
          <p className="text-gray-500">Probar el agente de voz con ElevenLabs</p>
        </div>
        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          Activo
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de prueba */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PhoneCall size={20} />
            Iniciar llamada de prueba
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero de destino (verificado)
              </label>
              <input
                type="text"
                value={VERIFIED_TEST_NUMBER}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo se pueden hacer llamadas a numeros verificados en Twilio
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del lead
              </label>
              <input
                type="text"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Nombre para personalizar el saludo"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cristina dira: &quot;¡Carlos! ¿Carlos?&quot; al inicio
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje personalizado (opcional)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Deja vacio para usar el script profesional..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                Si escribes algo aqui, se usara en lugar del script por defecto
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTestCall}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Phone size={20} />
                    Llamar ahora
                  </>
                )}
              </button>

              <button
                onClick={handleTestTTS}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Probar solo la voz (sin llamar)"
              >
                <Volume2 size={20} />
                Probar voz
              </button>
            </div>

            {result && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="text-green-600 shrink-0" size={20} />
                ) : (
                  <XCircle className="text-red-600 shrink-0" size={20} />
                )}
                <div>
                  <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                    {result.message}
                  </p>
                  {result.callSid && (
                    <p className="text-xs text-gray-500 mt-1">
                      Call SID: {result.callSid}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informacion */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Como funciona
            </h2>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <span>Twilio inicia la llamada al numero verificado</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <span>ElevenLabs genera el audio del saludo con voz natural</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <span>El sistema escucha tu respuesta y la transcribe</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                <span>OpenAI genera una respuesta inteligente</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">5</span>
                <span>ElevenLabs convierte la respuesta a voz natural</span>
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">Nota importante</h3>
            <p className="text-sm text-blue-700">
              En modo de prueba de Twilio, solo puedes llamar a numeros verificados.
              Para llamar a cualquier numero, necesitas actualizar tu cuenta de Twilio a produccion.
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
            <h3 className="font-semibold text-amber-800 mb-2">Configuracion en Twilio</h3>
            <p className="text-sm text-amber-700 mb-2">
              Para recibir llamadas entrantes, configura el webhook en Twilio:
            </p>
            <code className="block text-xs bg-amber-100 p-2 rounded text-amber-900 break-all">
              https://ruben-callcenter.vercel.app/api/voice/incoming
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
