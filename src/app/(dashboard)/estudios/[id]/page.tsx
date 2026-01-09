'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { EnergyStudy, Lead, ENERGY_PROVIDERS, EnergyProvider } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  FileText,
  Download,
  Zap,
  TrendingDown,
  Check,
  Building2,
  Calendar,
  User,
  Sparkles,
  AlertCircle,
  Euro,
  Bolt
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Importar PDF dinámicamente para evitar SSR
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span>Cargando PDF...</span> }
);

const EnergyStudyPDF = dynamic(
  () => import('./EnergyStudyPDF').then((mod) => mod.EnergyStudyPDF),
  { ssr: false }
);

interface Props {
  params: Promise<{ id: string }>;
}

export default function EstudioDetailPage({ params }: Props) {
  const { id } = use(params);
  const [study, setStudy] = useState<EnergyStudy | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);

  useEffect(() => {
    loadData();
    // Delay PDF rendering to avoid hydration issues
    const timer = setTimeout(() => setPdfReady(true), 1000);
    return () => clearTimeout(timer);
  }, [id]);

  const loadData = async () => {
    setLoading(true);

    const { data: studyData } = await supabase
      .from('energy_studies')
      .select('*')
      .eq('id', id)
      .single() as { data: EnergyStudy | null };

    if (studyData) {
      setStudy(studyData);

      const { data: leadData } = await supabase
        .from('leads')
        .select('*')
        .eq('id', studyData.lead_id)
        .single() as { data: Lead | null };

      setLead(leadData);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">Cargando estudio...</div>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Estudio no encontrado</p>
          <Link href="/estudios" className="text-brand-primary hover:underline mt-2 inline-block">
            Volver a estudios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/estudios"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estudio Energetico</h1>
            <p className="text-gray-500">{lead?.full_name || 'Cliente'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pdfReady && study && lead && (
            <PDFDownloadLink
              document={<EnergyStudyPDF study={study} lead={lead} />}
              fileName={`estudio-${lead?.full_name?.replace(/\s+/g, '-').toLowerCase() || 'cliente'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition"
            >
              {({ loading: pdfLoading }) =>
                pdfLoading ? 'Generando...' : (
                  <>
                    <Download size={18} />
                    Descargar PDF
                  </>
                )
              }
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Savings Summary */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingDown size={20} />
              Resumen de Ahorro
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-emerald-100">Ahorro mensual</p>
                <p className="text-4xl font-bold">{study.monthly_savings?.toFixed(2)} EUR</p>
              </div>
              <div>
                <p className="text-emerald-100">Ahorro anual</p>
                <p className="text-4xl font-bold">{study.annual_savings?.toFixed(2)} EUR</p>
              </div>
            </div>
          </div>

          {/* Before/After Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BEFORE */}
            {study.has_invoice && study.current_provider && (
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  ANTES - {ENERGY_PROVIDERS[study.current_provider as EnergyProvider]}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coste mensual</span>
                    <span className="font-semibold text-red-600">{study.current_monthly_cost?.toFixed(2)} EUR</span>
                  </div>
                  {study.current_power_p1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Potencia P1</span>
                      <span className="font-medium">{study.current_power_p1} kW</span>
                    </div>
                  )}
                  {study.current_power_p2 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Potencia P2</span>
                      <span className="font-medium">{study.current_power_p2} kW</span>
                    </div>
                  )}
                  {study.current_consumption_annual && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Consumo anual</span>
                      <span className="font-medium">{study.current_consumption_annual} kWh</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AFTER */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">{study.has_invoice ? '2' : '1'}</span>
                DESPUES - {ENERGY_PROVIDERS[study.new_provider as EnergyProvider]}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Coste mensual</span>
                  <span className="font-semibold text-green-600">{study.new_monthly_cost?.toFixed(2)} EUR</span>
                </div>
                {study.new_power_p1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Potencia P1</span>
                    <span className="font-medium">{study.new_power_p1} kW</span>
                  </div>
                )}
                {study.new_power_p2 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Potencia P2</span>
                    <span className="font-medium">{study.new_power_p2} kW</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Services */}
          {(study.has_maintenance_insurance || study.has_pac_iberdrola || study.other_services) && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Servicios Adicionales</h3>
              <div className="space-y-3">
                {study.has_maintenance_insurance && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check size={18} className="text-green-500" />
                      <span>Seguro de mantenimiento</span>
                    </div>
                    {study.maintenance_insurance_cost && (
                      <span className="font-medium">{study.maintenance_insurance_cost.toFixed(2)} EUR/mes</span>
                    )}
                  </div>
                )}
                {study.has_pac_iberdrola && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check size={18} className="text-green-500" />
                      <span>PAC Iberdrola</span>
                    </div>
                    {study.pac_cost && (
                      <span className="font-medium">{study.pac_cost.toFixed(2)} EUR/mes</span>
                    )}
                  </div>
                )}
                {study.other_services && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check size={18} className="text-green-500" />
                      <span>{study.other_services}</span>
                    </div>
                    {study.other_services_cost && (
                      <span className="font-medium">{study.other_services_cost.toFixed(2)} EUR/mes</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Conditions */}
          {study.special_conditions && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Condiciones Especiales</h3>
              <p className="text-gray-600">{study.special_conditions}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informacion del Cliente</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium text-gray-900">{lead?.full_name}</p>
                </div>
              </div>
              {lead?.phone && (
                <div className="flex items-center gap-3">
                  <Bolt size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Telefono</p>
                    <p className="font-medium text-gray-900">{lead.phone}</p>
                  </div>
                </div>
              )}
              {lead?.email && (
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{lead.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contract Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Detalles del Contrato</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Duracion</p>
                  <p className="font-medium text-gray-900">{study.contract_duration_months} meses</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nueva companía</p>
                  <p className="font-medium text-gray-900">{ENERGY_PROVIDERS[study.new_provider as EnergyProvider]}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Study Meta */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Informacion del Estudio</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${study.has_invoice ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {study.has_invoice ? 'Con factura' : 'Sin factura'}
                </span>
              </div>
              {study.ai_generated && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Generado por</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <Sparkles size={12} />
                    IA
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Creado</span>
                <span className="text-gray-900">{format(new Date(study.created_at), "d MMM yyyy", { locale: es })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Link
              href={`/leads/${study.lead_id}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <User size={18} />
              Ver Lead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
