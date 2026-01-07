import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';

export default function LlamadasPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historial de Llamadas</h1>
          <p className="text-gray-500">Registro de todas las llamadas realizadas</p>
        </div>
        <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          Proximamente
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Phone className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total llamadas</p>
              <p className="text-2xl font-bold text-gray-800">--</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <PhoneOutgoing className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Salientes</p>
              <p className="text-2xl font-bold text-gray-800">--</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <PhoneIncoming className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Entrantes</p>
              <p className="text-2xl font-bold text-gray-800">--</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <PhoneMissed className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Fallidas</p>
              <p className="text-2xl font-bold text-gray-800">--</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Registro de llamadas</h2>
        </div>
        <div className="p-12 text-center">
          <Phone size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Historial de llamadas disponible proximamente
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Aqui veras el registro completo de llamadas: fecha, duracion, estado, coste y enlace al lead asociado.
          </p>
        </div>
      </div>
    </div>
  );
}
