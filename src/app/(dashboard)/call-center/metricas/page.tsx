import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react';

export default function MetricasPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Metricas</h1>
          <p className="text-gray-500">Analisis y rendimiento del call center</p>
        </div>
        <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          Proximamente
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Llamadas/dia</p>
              <p className="text-2xl font-bold text-gray-800">--</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasa de exito</p>
              <p className="text-2xl font-bold text-gray-800">-- %</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Duracion media</p>
              <p className="text-2xl font-bold text-gray-800">-- min</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Conversion</p>
              <p className="text-2xl font-bold text-gray-800">-- %</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Llamadas por dia</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Grafico disponible proximamente</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Rendimiento por estado</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Target size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">Grafico disponible proximamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
