'use client';

import { MessageCircle, Search, Filter, Plus } from 'lucide-react';

export default function WhatsAppConversationsPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversaciones WhatsApp</h1>
          <p className="text-gray-600 mt-1">Gestiona las conversaciones con tus clientes</p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg opacity-50 cursor-not-allowed"
        >
          <Plus size={20} />
          Nueva conversacion
        </button>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <MessageCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Modulo WhatsApp Business
          </h2>
          <p className="text-gray-600 max-w-md mb-6">
            Proximamente podras gestionar todas tus conversaciones de WhatsApp directamente desde el CRM.
            Responde a clientes, envia plantillas y mas.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Requisito:</strong> Para activar este modulo necesitas una cuenta de Meta Business
              verificada y acceso a la WhatsApp Business API.
            </p>
          </div>

          {/* Preview Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-1">Inbox unificado</h3>
              <p className="text-sm text-gray-600">Todas las conversaciones en un solo lugar</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-1">Vinculacion CRM</h3>
              <p className="text-sm text-gray-600">Asocia chats con leads y clientes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-1">Respuestas rapidas</h3>
              <p className="text-sm text-gray-600">Plantillas predefinidas para agilizar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disabled Search/Filter Preview */}
      <div className="mt-6 flex gap-4 opacity-50 pointer-events-none">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            disabled
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white" disabled>
          <Filter size={20} />
          Filtrar
        </button>
      </div>
    </div>
  );
}
