'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Client, ClientStatus, CLIENT_STATUS_CONFIG, ClientReminder, ReminderType, REMINDER_TYPE_CONFIG, ENERGY_PROVIDERS, EnergyProvider, Referral } from '@/lib/types';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Euro,
  TrendingDown,
  Bell,
  Gift,
  FileText,
  Check,
  AlertTriangle,
  ChevronRight,
  Building2,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ClienteDetailPage({ params }: Props) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [reminders, setReminders] = useState<ClientReminder[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);

    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single() as { data: Client | null };

    if (clientData) {
      setClient(clientData);

      // Load reminders
      const { data: remindersData } = await supabase
        .from('client_reminders')
        .select('*')
        .eq('client_id', id)
        .order('scheduled_date', { ascending: true }) as { data: ClientReminder[] | null };

      setReminders(remindersData || []);

      // Load referrals where this client is the referrer
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_client_id', id) as { data: Referral[] | null };

      setReferrals(referralsData || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">Cargando cliente...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8">
        <div className="text-center">
          <User size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Cliente no encontrado</p>
          <Link href="/clientes" className="text-brand-primary hover:underline mt-2 inline-block">
            Volver a clientes
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = CLIENT_STATUS_CONFIG[client.status as ClientStatus];
  const daysUntilRenewal = client.contract_end_date
    ? differenceInDays(new Date(client.contract_end_date), new Date())
    : null;
  const monthsSigned = client.signed_at
    ? differenceInMonths(new Date(), new Date(client.signed_at))
    : 0;

  // Calculate estimated savings
  const estimatedTotalSavings = monthsSigned * (client.total_savings_to_date / Math.max(monthsSigned, 1));

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/clientes"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{client.full_name}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-gray-500">Cliente desde {client.signed_at ? format(new Date(client.signed_at), "d 'de' MMMM yyyy", { locale: es }) : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiempo como cliente</p>
              <p className="text-xl font-bold text-gray-900">{monthsSigned} meses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingDown size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ahorro acumulado</p>
              <p className="text-xl font-bold text-emerald-600">{client.total_savings_to_date?.toFixed(2) || 0} EUR</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Euro size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Coste mensual</p>
              <p className="text-xl font-bold text-gray-900">{client.monthly_cost?.toFixed(2)} EUR</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${daysUntilRenewal !== null && daysUntilRenewal <= 30 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <Clock size={20} className={daysUntilRenewal !== null && daysUntilRenewal <= 30 ? 'text-orange-600' : 'text-gray-600'} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Renovacion</p>
              <p className={`text-xl font-bold ${daysUntilRenewal !== null && daysUntilRenewal <= 30 ? 'text-orange-600' : 'text-gray-900'}`}>
                {daysUntilRenewal !== null ? `${daysUntilRenewal} dias` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion de Contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Phone size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefono</p>
                  <p className="font-medium text-gray-900">{client.phone}</p>
                </div>
              </div>

              {client.email && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Mail size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{client.email}</p>
                  </div>
                </div>
              )}

              {client.address && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MapPin size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Direccion</p>
                    <p className="font-medium text-gray-900">{client.address}</p>
                  </div>
                </div>
              )}

              {client.dni && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CreditCard size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">DNI</p>
                    <p className="font-medium text-gray-900">{client.dni}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contract Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Contrato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Building2 size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Companía</p>
                  <p className="font-medium text-gray-900">{ENERGY_PROVIDERS[client.provider as EnergyProvider]}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Euro size={18} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Coste mensual</p>
                  <p className="font-medium text-gray-900">{client.monthly_cost?.toFixed(2)} EUR</p>
                </div>
              </div>

              {client.contract_start_date && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Inicio contrato</p>
                    <p className="font-medium text-gray-900">
                      {format(new Date(client.contract_start_date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              )}

              {client.contract_end_date && (
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${daysUntilRenewal !== null && daysUntilRenewal <= 30 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <Calendar size={18} className={daysUntilRenewal !== null && daysUntilRenewal <= 30 ? 'text-orange-600' : 'text-gray-600'} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fin contrato</p>
                    <p className={`font-medium ${daysUntilRenewal !== null && daysUntilRenewal <= 30 ? 'text-orange-600' : 'text-gray-900'}`}>
                      {format(new Date(client.contract_end_date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reminders Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell size={20} />
              Historial de Recordatorios
            </h2>
            {reminders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay recordatorios programados</p>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => {
                  const config = REMINDER_TYPE_CONFIG[reminder.reminder_type as ReminderType];
                  const isPast = new Date(reminder.scheduled_date) < new Date();

                  return (
                    <div
                      key={reminder.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        reminder.completed
                          ? 'bg-green-50 border-green-200'
                          : isPast
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        reminder.completed ? 'bg-green-100' : isPast ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {reminder.completed ? (
                          <Check size={18} className="text-green-600" />
                        ) : isPast ? (
                          <AlertTriangle size={18} className="text-yellow-600" />
                        ) : (
                          <Clock size={18} className="text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{config?.label}</p>
                        <p className="text-sm text-gray-500">{config?.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          reminder.completed ? 'text-green-600' : isPast ? 'text-yellow-600' : 'text-gray-600'
                        }`}>
                          {format(new Date(reminder.scheduled_date), "d MMM yyyy", { locale: es })}
                        </p>
                        {reminder.completed && reminder.result && (
                          <p className="text-xs text-gray-500 capitalize">{reminder.result}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas</h2>
              <p className="text-gray-600">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Referrals */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Gift size={20} />
              Referidos
            </h2>
            {referrals.length === 0 ? (
              <div className="text-center py-4">
                <Gift size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">Este cliente no ha referido a nadie todavia</p>
                <Link
                  href={`/referidos?referrer=${client.id}`}
                  className="text-brand-primary text-sm hover:underline mt-2 inline-block"
                >
                  Anadir referido
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Referido #{referral.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">{referral.bonus_amount} EUR</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      referral.bonus_paid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {referral.bonus_paid ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
                <Link
                  href="/referidos"
                  className="block text-center text-brand-primary text-sm hover:underline pt-2"
                >
                  Ver todos los referidos
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
            <div className="space-y-2">
              {client.lead_id && (
                <Link
                  href={`/leads/${client.lead_id}`}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-gray-500" />
                    <span>Ver Lead original</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
              )}

              {client.energy_study_id && (
                <Link
                  href={`/estudios/${client.energy_study_id}`}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-gray-500" />
                    <span>Ver Estudio</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
              )}

              <Link
                href="/recordatorios"
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-gray-500" />
                  <span>Ver Recordatorios</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Renewal Warning */}
          {daysUntilRenewal !== null && daysUntilRenewal <= 30 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-orange-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-800">Renovacion proxima</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    El contrato de este cliente vence en {daysUntilRenewal} dias.
                    Contactar para revisar ofertas del proximo ano.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
