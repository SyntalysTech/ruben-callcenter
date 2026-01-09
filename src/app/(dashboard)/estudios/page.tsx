'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { EnergyStudy, EnergyProvider, ENERGY_PROVIDERS, Lead } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Plus,
  FileText,
  Zap,
  TrendingDown,
  AlertCircle,
  Check,
  X,
  Download,
  Search,
  Calculator,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function EstudiosPage() {
  const [studies, setStudies] = useState<(EnergyStudy & { lead?: Lead })[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Cargar estudios
    const { data: studiesData } = await supabase
      .from('energy_studies')
      .select('*')
      .order('created_at', { ascending: false }) as { data: EnergyStudy[] | null };

    // Cargar leads para relacionar
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .order('full_name', { ascending: true }) as { data: Lead[] | null };

    if (studiesData && leadsData) {
      const studiesWithLeads = studiesData.map(study => ({
        ...study,
        lead: leadsData.find(l => l.id === study.lead_id)
      }));
      setStudies(studiesWithLeads);
    }

    setLeads(leadsData || []);
    setLoading(false);
  };

  const filteredStudies = studies.filter(study =>
    study.lead?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.lead?.phone?.includes(searchTerm)
  );

  const stats = {
    total: studies.length,
    withInvoice: studies.filter(s => s.has_invoice).length,
    withoutInvoice: studies.filter(s => !s.has_invoice).length,
    aiGenerated: studies.filter(s => s.ai_generated).length,
    totalSavings: studies.reduce((sum, s) => sum + (s.annual_savings || 0), 0)
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estudios Energeticos</h1>
          <p className="text-gray-500">Gestiona los estudios de ahorro para tus leads</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition"
        >
          <Plus size={20} />
          Nuevo Estudio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Estudios</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Con Factura</p>
              <p className="text-xl font-bold text-gray-900">{stats.withInvoice}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calculator size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sin Factura</p>
              <p className="text-xl font-bold text-gray-900">{stats.withoutInvoice}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">IA Generados</p>
              <p className="text-xl font-bold text-gray-900">{stats.aiGenerated}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingDown size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ahorro Total/Ano</p>
              <p className="text-xl font-bold text-emerald-600">{stats.totalSavings.toFixed(2)}EUR</p>
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
            placeholder="Buscar por nombre o telefono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </div>

      {/* Studies List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando estudios...</div>
        ) : filteredStudies.length === 0 ? (
          <div className="p-8 text-center">
            <Zap size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay estudios energeticos todavia</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition"
            >
              Crear primer estudio
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Antes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Despues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ahorro Mensual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ahorro Anual
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
              {filteredStudies.map((study) => (
                <tr key={study.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{study.lead?.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-gray-500">{study.lead?.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {study.has_invoice ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Con factura
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                          Sin factura
                        </span>
                      )}
                      {study.ai_generated && (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                          <Sparkles size={12} />
                          IA
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {study.has_invoice && study.current_provider ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {ENERGY_PROVIDERS[study.current_provider as EnergyProvider]}
                        </p>
                        <p className="text-sm text-gray-500">{study.current_monthly_cost?.toFixed(2)}EUR/mes</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {ENERGY_PROVIDERS[study.new_provider as EnergyProvider]}
                      </p>
                      <p className="text-sm text-gray-500">{study.new_monthly_cost?.toFixed(2)}EUR/mes</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-emerald-600 font-semibold">
                      -{study.monthly_savings?.toFixed(2)}EUR
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-emerald-600 font-bold">
                      -{study.annual_savings?.toFixed(2)}EUR
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(study.created_at), "d MMM yyyy", { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/estudios/${study.id}`}
                        className="p-2 text-gray-500 hover:text-brand-primary hover:bg-gray-100 rounded-lg transition"
                        title="Ver detalles"
                      >
                        <FileText size={18} />
                      </Link>
                      {study.pdf_url ? (
                        <a
                          href={study.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-lg transition"
                          title="Descargar PDF"
                        >
                          <Download size={18} />
                        </a>
                      ) : (
                        <button
                          className="p-2 text-gray-300 cursor-not-allowed rounded-lg"
                          title="PDF no disponible"
                          disabled
                        >
                          <Download size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateStudyModal
          leads={leads}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedLead(null);
          }}
          onCreated={() => {
            loadData();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// Modal para crear estudio
function CreateStudyModal({
  leads,
  onClose,
  onCreated
}: {
  leads: Lead[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [hasInvoice, setHasInvoice] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Datos actuales (si tiene factura)
    current_provider: '' as EnergyProvider | '',
    current_monthly_cost: '',
    current_power_p1: '',
    current_power_p2: '',
    current_consumption_annual: '',
    // Datos nueva propuesta
    new_provider: 'endesa' as EnergyProvider,
    new_monthly_cost: '',
    new_power_p1: '',
    new_power_p2: '',
    // Servicios adicionales
    has_maintenance_insurance: false,
    maintenance_insurance_cost: '',
    has_pac_iberdrola: false,
    pac_cost: '',
    other_services: '',
    other_services_cost: '',
    // Condiciones
    contract_duration_months: '12',
    special_conditions: '',
  });

  const calculateSavings = () => {
    const currentCost = parseFloat(formData.current_monthly_cost) || 0;
    const newCost = parseFloat(formData.new_monthly_cost) || 0;
    const monthlySavings = currentCost - newCost;
    const annualSavings = monthlySavings * 12;
    return { monthlySavings, annualSavings };
  };

  const handleSubmit = async () => {
    if (!selectedLead) return;

    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    const savings = calculateSavings();

    const studyData = {
      lead_id: selectedLead.id,
      created_by: user?.id,
      has_invoice: hasInvoice,
      current_provider: hasInvoice ? formData.current_provider || null : null,
      current_monthly_cost: hasInvoice ? parseFloat(formData.current_monthly_cost) || null : null,
      current_power_p1: hasInvoice ? parseFloat(formData.current_power_p1) || null : null,
      current_power_p2: hasInvoice ? parseFloat(formData.current_power_p2) || null : null,
      current_consumption_annual: hasInvoice ? parseFloat(formData.current_consumption_annual) || null : null,
      new_provider: formData.new_provider,
      new_monthly_cost: parseFloat(formData.new_monthly_cost) || 0,
      new_power_p1: parseFloat(formData.new_power_p1) || null,
      new_power_p2: parseFloat(formData.new_power_p2) || null,
      has_maintenance_insurance: formData.has_maintenance_insurance,
      maintenance_insurance_cost: formData.has_maintenance_insurance ? parseFloat(formData.maintenance_insurance_cost) || null : null,
      has_pac_iberdrola: formData.has_pac_iberdrola,
      pac_cost: formData.has_pac_iberdrola ? parseFloat(formData.pac_cost) || null : null,
      other_services: formData.other_services || null,
      other_services_cost: formData.other_services ? parseFloat(formData.other_services_cost) || null : null,
      monthly_savings: savings.monthlySavings,
      annual_savings: savings.annualSavings,
      contract_duration_months: parseInt(formData.contract_duration_months) || 12,
      special_conditions: formData.special_conditions || null,
      ai_generated: false,
    };

    const { error: insertError } = await supabase
      .from('energy_studies')
      .insert(studyData as never);

    if (insertError) {
      setError('Error al crear el estudio: ' + insertError.message);
      setLoading(false);
      return;
    }

    onCreated();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Nuevo Estudio Energetico</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className={`flex-1 h-1 ${step >= 2 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <div className={`flex-1 h-1 ${step >= 3 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 3 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Step 1: Select Lead */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Selecciona el lead</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {leads.filter(l => l.status !== 'red').map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`w-full p-3 text-left border rounded-lg transition ${
                      selectedLead?.id === lead.id
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-gray-200 hover:border-brand-primary/50'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{lead.full_name}</p>
                    <p className="text-sm text-gray-500">{lead.phone}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Invoice question */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Tiene factura el cliente?</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setHasInvoice(true)}
                  className={`p-6 border-2 rounded-xl text-center transition ${
                    hasInvoice === true
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-gray-200 hover:border-brand-primary/50'
                  }`}
                >
                  <Check size={32} className="mx-auto mb-2 text-green-500" />
                  <p className="font-medium">Si, tiene factura</p>
                  <p className="text-sm text-gray-500 mt-1">Introducir datos de la factura actual</p>
                </button>
                <button
                  onClick={() => setHasInvoice(false)}
                  className={`p-6 border-2 rounded-xl text-center transition ${
                    hasInvoice === false
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-gray-200 hover:border-brand-primary/50'
                  }`}
                >
                  <X size={32} className="mx-auto mb-2 text-yellow-500" />
                  <p className="font-medium">No tiene factura</p>
                  <p className="text-sm text-gray-500 mt-1">Estudio manual por el comercial</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Study details */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Datos actuales (si tiene factura) */}
              {hasInvoice && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm">1</span>
                    Factura actual (ANTES)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Companía actual</label>
                      <select
                        value={formData.current_provider}
                        onChange={(e) => setFormData({ ...formData, current_provider: e.target.value as EnergyProvider })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      >
                        <option value="">Seleccionar...</option>
                        {Object.entries(ENERGY_PROVIDERS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coste mensual (EUR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.current_monthly_cost}
                        onChange={(e) => setFormData({ ...formData, current_monthly_cost: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        placeholder="ej: 85.50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Potencia P1 (kW)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.current_power_p1}
                        onChange={(e) => setFormData({ ...formData, current_power_p1: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        placeholder="ej: 3.45"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Potencia P2 (kW)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.current_power_p2}
                        onChange={(e) => setFormData({ ...formData, current_power_p2: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        placeholder="ej: 3.45"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consumo anual (kWh)</label>
                      <input
                        type="number"
                        value={formData.current_consumption_annual}
                        onChange={(e) => setFormData({ ...formData, current_consumption_annual: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        placeholder="ej: 3500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Nueva propuesta */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">{hasInvoice ? '2' : '1'}</span>
                  Nueva propuesta (DESPUES)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva companía</label>
                    <select
                      value={formData.new_provider}
                      onChange={(e) => setFormData({ ...formData, new_provider: e.target.value as EnergyProvider })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    >
                      {Object.entries(ENERGY_PROVIDERS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo coste mensual (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.new_monthly_cost}
                      onChange={(e) => setFormData({ ...formData, new_monthly_cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="ej: 65.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva potencia P1 (kW)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.new_power_p1}
                      onChange={(e) => setFormData({ ...formData, new_power_p1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="ej: 3.45"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva potencia P2 (kW)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.new_power_p2}
                      onChange={(e) => setFormData({ ...formData, new_power_p2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="ej: 3.45"
                    />
                  </div>
                </div>
              </div>

              {/* Servicios adicionales */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Servicios adicionales</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.has_maintenance_insurance}
                      onChange={(e) => setFormData({ ...formData, has_maintenance_insurance: e.target.checked })}
                      className="w-4 h-4 text-brand-primary rounded"
                    />
                    <span className="text-sm text-gray-700">Seguro de mantenimiento</span>
                    {formData.has_maintenance_insurance && (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.maintenance_insurance_cost}
                        onChange={(e) => setFormData({ ...formData, maintenance_insurance_cost: e.target.value })}
                        className="w-24 px-2 py-1 text-sm border border-gray-200 rounded"
                        placeholder="EUR/mes"
                      />
                    )}
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.has_pac_iberdrola}
                      onChange={(e) => setFormData({ ...formData, has_pac_iberdrola: e.target.checked })}
                      className="w-4 h-4 text-brand-primary rounded"
                    />
                    <span className="text-sm text-gray-700">PAC Iberdrola</span>
                    {formData.has_pac_iberdrola && (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pac_cost}
                        onChange={(e) => setFormData({ ...formData, pac_cost: e.target.value })}
                        className="w-24 px-2 py-1 text-sm border border-gray-200 rounded"
                        placeholder="EUR/mes"
                      />
                    )}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Otros servicios</label>
                      <input
                        type="text"
                        value={formData.other_services}
                        onChange={(e) => setFormData({ ...formData, other_services: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                        placeholder="Descripcion..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coste otros (EUR/mes)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.other_services_cost}
                        onChange={(e) => setFormData({ ...formData, other_services_cost: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Condiciones */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Condiciones del contrato</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duracion (meses)</label>
                    <select
                      value={formData.contract_duration_months}
                      onChange={(e) => setFormData({ ...formData, contract_duration_months: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    >
                      <option value="6">6 meses</option>
                      <option value="12">12 meses</option>
                      <option value="24">24 meses</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones especiales</label>
                  <textarea
                    value={formData.special_conditions}
                    onChange={(e) => setFormData({ ...formData, special_conditions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    rows={2}
                    placeholder="Condiciones especiales del cliente..."
                  />
                </div>
              </div>

              {/* Resumen ahorro */}
              {hasInvoice && formData.current_monthly_cost && formData.new_monthly_cost && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h3 className="font-medium text-emerald-800 mb-2">Resumen de ahorro</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-emerald-600">Ahorro mensual</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {calculateSavings().monthlySavings.toFixed(2)} EUR
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600">Ahorro anual</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {calculateSavings().annualSavings.toFixed(2)} EUR
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Atras
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedLead) ||
                (step === 2 && hasInvoice === null)
              }
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.new_monthly_cost}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? 'Creando...' : 'Crear Estudio'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
