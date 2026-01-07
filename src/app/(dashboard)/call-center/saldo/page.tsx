import { Wallet, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

export default function SaldoPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Saldo Call Center</h1>
          <p className="text-gray-500">Gestion de saldo y facturacion</p>
        </div>
        <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          Proximamente
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Wallet className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Saldo actual</p>
              <p className="text-2xl font-bold text-gray-800">-- EUR</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Gastado este mes</p>
              <p className="text-2xl font-bold text-gray-800">-- EUR</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Coste por llamada</p>
              <p className="text-2xl font-bold text-gray-800">-- EUR</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 opacity-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className="text-2xl font-bold text-gray-800">--</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Wallet size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Gestion de saldo disponible proximamente
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Aqui podras ver tu saldo actual, recargar credito, configurar alertas de saldo bajo y revisar tu historial de facturacion.
        </p>
      </div>
    </div>
  );
}
