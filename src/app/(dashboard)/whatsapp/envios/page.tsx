'use client';

import { Send, Plus, Calendar, Users } from 'lucide-react';

export default function WhatsAppBroadcastsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Envios Masivos</h1>
          <p className="text-gray-600 mt-1">Envia mensajes a multiples contactos</p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg opacity-50 cursor-not-allowed"
        >
          <Plus size={20} />
          Nuevo envio
        </button>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Send size={40} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Envios Masivos de WhatsApp
          </h2>
          <p className="text-gray-600 max-w-md mb-6">
            Proximamente podras enviar mensajes masivos a tus clientes usando plantillas
            aprobadas por Meta. Ideal para campañas, recordatorios y promociones.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Nota:</strong> Los envios masivos requieren plantillas aprobadas por Meta
              y respetan los limites de la API de WhatsApp Business.
            </p>
          </div>

          {/* Preview Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-gray-600" />
                <h3 className="font-medium text-gray-900">Segmentacion</h3>
              </div>
              <p className="text-sm text-gray-600">Filtra por estado, comercializadora, fecha</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-gray-600" />
                <h3 className="font-medium text-gray-900">Programacion</h3>
              </div>
              <p className="text-sm text-gray-600">Programa envios para fecha y hora</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Send size={18} className="text-gray-600" />
                <h3 className="font-medium text-gray-900">Metricas</h3>
              </div>
              <p className="text-sm text-gray-600">Seguimiento de entrega y lectura</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disabled Stats Preview */}
      <div className="mt-6 grid grid-cols-4 gap-4 opacity-50 pointer-events-none">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Total enviados</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Entregados</p>
          <p className="text-2xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Leidos</p>
          <p className="text-2xl font-bold text-blue-600">0</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600">Fallidos</p>
          <p className="text-2xl font-bold text-red-600">0</p>
        </div>
      </div>
    </div>
  );
}
