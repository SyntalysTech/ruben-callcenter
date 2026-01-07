import { Mic, Play, Download, Clock } from 'lucide-react';

export default function GrabacionesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grabaciones</h1>
          <p className="text-gray-500">Escucha y gestiona las grabaciones de llamadas</p>
        </div>
        <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          Proximamente
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Mic className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total grabaciones</p>
              <p className="text-2xl font-bold text-gray-800">--</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Duracion total</p>
              <p className="text-2xl font-bold text-gray-800">-- min</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Download className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Almacenamiento</p>
              <p className="text-2xl font-bold text-gray-800">-- MB</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Biblioteca de grabaciones</h2>
        </div>
        <div className="p-12 text-center">
          <Mic size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Grabaciones disponibles proximamente
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Aqui podras escuchar, descargar y gestionar las grabaciones de tus llamadas. Incluira transcripciones automaticas y resumen por IA.
          </p>
        </div>
      </div>
    </div>
  );
}
