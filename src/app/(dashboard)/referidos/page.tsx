'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Referral, Client, Lead } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Gift,
  Euro,
  UserPlus,
  Users,
  Check,
  Clock,
  Plus,
  Search,
  X,
  AlertCircle
} from 'lucide-react';

type ReferralWithDetails = Referral & {
  referrer?: Client;
  referred_lead?: Lead;
  referred_client?: Client;
};

export default function ReferidosPage() {
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const { data: referralsData } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false }) as { data: Referral[] | null };

    const { data: clientsData } = await supabase
      .from('clients')
      .select('*') as { data: Client[] | null };

    const { data: leadsData } = await supabase
      .from('leads')
      .select('*') as { data: Lead[] | null };

    if (referralsData && clientsData && leadsData) {
      const referralsWithDetails = referralsData.map(ref => ({
        ...ref,
        referrer: clientsData.find(c => c.id === ref.referrer_client_id),
        referred_lead: leadsData.find(l => l.id === ref.referred_lead_id),
        referred_client: clientsData.find(c => c.id === ref.referred_client_id)
      }));
      setReferrals(referralsWithDetails);
    }

    setClients(clientsData || []);
    setLeads(leadsData || []);
    setLoading(false);
  };

  const handleMarkPaid = async (referralId: string) => {
    await supabase
      .from('referrals')
      .update({
        bonus_paid: true,
        bonus_paid_at: new Date().toISOString()
      } as never)
      .eq('id', referralId);

    loadData();
  };

  const filteredReferrals = referrals.filter(ref =>
    ref.referrer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.referred_lead?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.referred_client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: referrals.length,
    converted: referrals.filter(r => r.referred_client_id).length,
    pending: referrals.filter(r => !r.referred_client_id).length,
    paid: referrals.filter(r => r.bonus_paid).length,
    unpaid: referrals.filter(r => r.referred_client_id && !r.bonus_paid).length,
    totalBonusPaid: referrals.filter(r => r.bonus_paid).reduce((sum, r) => sum + (r.bonus_amount || 0), 0),
    totalBonusPending: referrals.filter(r => r.referred_client_id && !r.bonus_paid).reduce((sum, r) => sum + (r.bonus_amount || 0), 0),
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programa de Referidos</h1>
          <p className="text-gray-500">20EUR por cada cliente que traigan tus clientes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition"
        >
          <Plus size={20} />
          Nuevo Referido
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Referidos</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserPlus size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Convertidos</p>
              <p className="text-xl font-bold text-green-600">{stats.converted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bonos Pendientes</p>
              <p className="text-xl font-bold text-yellow-600">{stats.totalBonusPending}EUR</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Euro size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bonos Pagados</p>
              <p className="text-xl font-bold text-emerald-600">{stats.totalBonusPaid}EUR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando referidos...</div>
        ) : filteredReferrals.length === 0 ? (
          <div className="p-8 text-center">
            <Gift size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay referidos todavia</p>
            <p className="text-sm text-gray-400 mt-1">
              Cuando un cliente refiera a alguien, aparecera aqui
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente Referidor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persona Referida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{referral.referrer?.full_name || 'Cliente'}</p>
                      <p className="text-sm text-gray-500">{referral.referrer?.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {referral.referred_client?.full_name || referral.referred_lead?.full_name || 'Sin asignar'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {referral.referred_client?.phone || referral.referred_lead?.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {referral.referred_client_id ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1 w-fit">
                        <Check size={12} />
                        Convertido
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1 w-fit">
                        <Clock size={12} />
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{referral.bonus_amount}EUR</span>
                      {referral.bonus_paid ? (
                        <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                          Pagado
                        </span>
                      ) : referral.referred_client_id ? (
                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                          Por pagar
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(referral.created_at), "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {referral.referred_client_id && !referral.bonus_paid && (
                      <button
                        onClick={() => handleMarkPaid(referral.id)}
                        className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                      >
                        Marcar pagado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-pink-100 rounded-full">
            <Gift size={24} className="text-pink-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Como funciona el programa de referidos</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>1. A los 2 meses de firma, recordar al cliente sobre el programa</li>
              <li>2. Por cada persona que traiga, el cliente recibe 20EUR</li>
              <li>3. El bono se paga cuando el referido firma su contrato</li>
              <li>4. Importante: verificar que no son estafas comerciales</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateReferralModal
          clients={clients}
          leads={leads}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            loadData();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// Modal para crear referido
function CreateReferralModal({
  clients,
  leads,
  onClose,
  onCreated
}: {
  clients: Client[];
  leads: Lead[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referrerId, setReferrerId] = useState('');
  const [referredLeadId, setReferredLeadId] = useState('');
  const [bonusAmount, setBonusAmount] = useState('20');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_client_id: referrerId,
        referred_lead_id: referredLeadId || null,
        bonus_amount: parseFloat(bonusAmount) || 20,
        notes: notes || null
      } as never);

    if (insertError) {
      setError('Error al crear el referido: ' + insertError.message);
      setLoading(false);
      return;
    }

    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Nuevo Referido</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente que refiere *</label>
            <select
              value={referrerId}
              onChange={(e) => setReferrerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              required
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.full_name} - {client.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead referido (opcional)</label>
            <select
              value={referredLeadId}
              onChange={(e) => setReferredLeadId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">Sin asignar todavia...</option>
              {leads.filter(l => l.status !== 'red' && l.status !== 'green').map(lead => (
                <option key={lead.id} value={lead.id}>
                  {lead.full_name} - {lead.phone}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Puedes asignarlo despues cuando llegue el lead</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bono (EUR)</label>
            <input
              type="number"
              step="0.01"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !referrerId}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Referido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
