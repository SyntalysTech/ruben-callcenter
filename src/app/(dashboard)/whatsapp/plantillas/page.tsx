'use client';

import { FileText, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function WhatsAppTemplatesPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Mensaje</h1>
          <p className="text-gray-600 mt-1">Gestiona tus plantillas aprobadas por Meta</p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg opacity-50 cursor-not-allowed"
        >
          <Plus size={20} />
          Nueva plantilla
        </button>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <FileText size={40} className="text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Plantillas de WhatsApp
          </h2>
          <p className="text-gray-600 max-w-md mb-6">
            Proximamente podras crear y gestionar plantillas de mensaje. Las plantillas
            son necesarias para iniciar conversaciones y envios masivos.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Importante:</strong> Las plantillas deben ser aprobadas por Meta antes de poder
              usarse. El proceso de aprobacion puede tardar hasta 24 horas.
            </p>
          </div>

          {/* Template Status Legend */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm text-green-800">Aprobada</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full">
              <Clock size={16} className="text-yellow-600" />
              <span className="text-sm text-yellow-800">Pendiente</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
              <XCircle size={16} className="text-red-600" />
              <span className="text-sm text-red-800">Rechazada</span>
            </div>
          </div>

          {/* Template Categories */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-1">Marketing</h3>
              <p className="text-sm text-gray-600">Promociones, ofertas y novedades</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-1">Utility</h3>
              <p className="text-sm text-gray-600">Confirmaciones, recordatorios, actualizaciones</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-1">Authentication</h3>
              <p className="text-sm text-gray-600">Codigos de verificacion</p>
            </div>
          </div>

          {/* Example Templates */}
          <div className="mt-8 w-full max-w-2xl">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-left">Ejemplos de plantillas sugeridas:</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 text-left border-l-4 border-green-500">
                <p className="font-medium text-gray-900">bienvenida_cliente</p>
                <p className="text-sm text-gray-600 mt-1">
                  Hola {"{{1}}"}, bienvenido/a a Calidad Energia. Tu contrato ha sido firmado correctamente...
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-left border-l-4 border-blue-500">
                <p className="font-medium text-gray-900">recordatorio_seguimiento</p>
                <p className="text-sm text-gray-600 mt-1">
                  Hola {"{{1}}"}, hace {"{{2}}"} que eres cliente. Queremos saber como va todo...
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-left border-l-4 border-purple-500">
                <p className="font-medium text-gray-900">promocion_referidos</p>
                <p className="text-sm text-gray-600 mt-1">
                  Hola {"{{1}}"}, recuerda que por cada amigo que nos recomiendes recibes 20€...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
