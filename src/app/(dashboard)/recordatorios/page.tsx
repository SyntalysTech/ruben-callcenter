'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ClientReminder, ReminderType, REMINDER_TYPE_CONFIG, Client } from '@/lib/types';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bell,
  Calendar,
  Check,
  Phone,
  Clock,
  AlertTriangle,
  ChevronRight,
  Filter,
  RefreshCw,
  X,
  MessageSquare,
  PhoneOff,
  CalendarClock
} from 'lucide-react';
import Link from 'next/link';

type ReminderWithClient = ClientReminder & { client?: Client };

export default function RecordatoriosPage() {
  const [reminders, setReminders] = useState<ReminderWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'today' | 'week' | 'completed'>('pending');
  const [selectedReminder, setSelectedReminder] = useState<ReminderWithClient | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const { data: remindersData } = await supabase
      .from('client_reminders')
      .select('*')
      .order('scheduled_date', { ascending: true }) as { data: ClientReminder[] | null };

    const { data: clientsData } = await supabase
      .from('clients')
      .select('*') as { data: Client[] | null };

    if (remindersData && clientsData) {
      const remindersWithClients = remindersData.map(reminder => ({
        ...reminder,
        client: clientsData.find(c => c.id === reminder.client_id)
      }));
      setReminders(remindersWithClients);
    }

    setClients(clientsData || []);
    setLoading(false);
  };

  const getFilteredReminders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekFromNow = addDays(today, 7);

    switch (filter) {
      case 'pending':
        return reminders.filter(r => !r.completed && isPast(new Date(r.scheduled_date)));
      case 'today':
        return reminders.filter(r => !r.completed && isToday(new Date(r.scheduled_date)));
      case 'week':
        return reminders.filter(r => {
          const date = new Date(r.scheduled_date);
          return !r.completed && date >= today && date <= weekFromNow;
        });
      case 'completed':
        return reminders.filter(r => r.completed);
      default:
        return reminders;
    }
  };

  const filteredReminders = getFilteredReminders();

  const stats = {
    overdue: reminders.filter(r => !r.completed && isPast(new Date(r.scheduled_date)) && !isToday(new Date(r.scheduled_date))).length,
    today: reminders.filter(r => !r.completed && isToday(new Date(r.scheduled_date))).length,
    tomorrow: reminders.filter(r => !r.completed && isTomorrow(new Date(r.scheduled_date))).length,
    thisWeek: reminders.filter(r => {
      const date = new Date(r.scheduled_date);
      return !r.completed && date >= new Date() && date <= addDays(new Date(), 7);
    }).length,
  };

  const handleMarkComplete = async (reminder: ReminderWithClient, result: 'contacted' | 'no_answer' | 'rescheduled' | 'completed') => {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('client_reminders')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user?.id,
        result
      } as never)
      .eq('id', reminder.id);

    // Actualizar el estado del cliente
    if (reminder.client_id) {
      const statusMap: Record<ReminderType, string> = {
        day1_welcome: 'reminder_day1',
        week1_confirmation: 'reminder_week1',
        month2_checkup: 'reminder_month2',
        month4_checkup: 'reminder_month4',
        month6_checkup: 'reminder_month6',
        month12_renewal: 'reminder_month12',
        referral_program: 'reminder_month2',
      };

      await supabase
        .from('clients')
        .update({
          status: statusMap[reminder.reminder_type as ReminderType],
          last_reminder_sent: new Date().toISOString()
        } as never)
        .eq('id', reminder.client_id);
    }

    setSelectedReminder(null);
    loadData();
  };

  const handleReschedule = async (reminder: ReminderWithClient, newDate: string) => {
    await supabase
      .from('client_reminders')
      .update({
        scheduled_date: newDate,
        result: 'rescheduled'
      } as never)
      .eq('id', reminder.id);

    setSelectedReminder(null);
    loadData();
  };

  const getReminderIcon = (type: ReminderType) => {
    switch (type) {
      case 'day1_welcome':
        return <Bell className="text-blue-500" size={18} />;
      case 'week1_confirmation':
        return <Check className="text-green-500" size={18} />;
      case 'month2_checkup':
      case 'month4_checkup':
      case 'month6_checkup':
        return <Phone className="text-purple-500" size={18} />;
      case 'month12_renewal':
        return <RefreshCw className="text-orange-500" size={18} />;
      case 'referral_program':
        return <MessageSquare className="text-pink-500" size={18} />;
      default:
        return <Bell className="text-gray-500" size={18} />;
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Manana';
    if (isPast(date)) return 'Atrasado';
    return format(date, "d MMM", { locale: es });
  };

  const getDateColor = (dateStr: string, completed: boolean) => {
    if (completed) return 'text-gray-400';
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return 'text-red-600';
    if (isToday(date)) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recordatorios</h1>
          <p className="text-gray-500">Gestiona los seguimientos de tus clientes</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('pending')}
          className={`bg-white rounded-xl shadow-sm p-4 text-left transition ${filter === 'pending' ? 'ring-2 ring-brand-primary' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Atrasados</p>
              <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter('today')}
          className={`bg-white rounded-xl shadow-sm p-4 text-left transition ${filter === 'today' ? 'ring-2 ring-brand-primary' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hoy</p>
              <p className="text-xl font-bold text-yellow-600">{stats.today}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter('week')}
          className={`bg-white rounded-xl shadow-sm p-4 text-left transition ${filter === 'week' ? 'ring-2 ring-brand-primary' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Esta semana</p>
              <p className="text-xl font-bold text-blue-600">{stats.thisWeek}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`bg-white rounded-xl shadow-sm p-4 text-left transition ${filter === 'completed' ? 'ring-2 ring-brand-primary' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completados</p>
              <p className="text-xl font-bold text-green-600">
                {reminders.filter(r => r.completed).length}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Reminders List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {filter === 'pending' && 'Recordatorios atrasados'}
            {filter === 'today' && 'Recordatorios de hoy'}
            {filter === 'week' && 'Recordatorios de esta semana'}
            {filter === 'completed' && 'Recordatorios completados'}
          </h2>
          <span className="text-sm text-gray-500">{filteredReminders.length} recordatorios</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando recordatorios...</div>
        ) : filteredReminders.length === 0 ? (
          <div className="p-8 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No hay recordatorios en esta categoria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReminders.map((reminder) => {
              const config = REMINDER_TYPE_CONFIG[reminder.reminder_type as ReminderType];

              return (
                <div
                  key={reminder.id}
                  className={`p-4 hover:bg-gray-50 transition ${reminder.completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getReminderIcon(reminder.reminder_type as ReminderType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{reminder.client?.full_name || 'Cliente'}</h3>
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            {config?.label}
                          </span>
                          {reminder.completed && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-600 rounded-full">
                              Completado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{config?.description}</p>
                        {reminder.client?.phone && (
                          <p className="text-sm text-gray-400 mt-1">Tel: {reminder.client.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`font-medium ${getDateColor(reminder.scheduled_date, reminder.completed)}`}>
                          {getDateLabel(reminder.scheduled_date)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {format(new Date(reminder.scheduled_date), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>

                      {!reminder.completed && (
                        <button
                          onClick={() => setSelectedReminder(reminder)}
                          className="px-3 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition text-sm"
                        >
                          Completar
                        </button>
                      )}

                      <Link
                        href={`/clientes/${reminder.client_id}`}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ChevronRight size={20} className="text-gray-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete Modal */}
      {selectedReminder && (
        <CompleteReminderModal
          reminder={selectedReminder}
          onClose={() => setSelectedReminder(null)}
          onComplete={handleMarkComplete}
          onReschedule={handleReschedule}
        />
      )}
    </div>
  );
}

// Modal para completar recordatorio
function CompleteReminderModal({
  reminder,
  onClose,
  onComplete,
  onReschedule
}: {
  reminder: ReminderWithClient;
  onClose: () => void;
  onComplete: (reminder: ReminderWithClient, result: 'contacted' | 'no_answer' | 'rescheduled' | 'completed') => void;
  onReschedule: (reminder: ReminderWithClient, newDate: string) => void;
}) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const config = REMINDER_TYPE_CONFIG[reminder.reminder_type as ReminderType];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Completar Recordatorio</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-medium text-gray-900">{reminder.client?.full_name}</p>
            <p className="text-sm text-gray-500">{config?.label}</p>
            <p className="text-sm text-gray-400 mt-1">{config?.description}</p>
          </div>

          {!showReschedule ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Resultado de la llamada:</p>

              <button
                onClick={() => onComplete(reminder, 'contacted')}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition"
              >
                <Phone size={20} className="text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Contactado</p>
                  <p className="text-sm text-gray-500">Se hablo con el cliente</p>
                </div>
              </button>

              <button
                onClick={() => onComplete(reminder, 'no_answer')}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition"
              >
                <PhoneOff size={20} className="text-yellow-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">No contesto</p>
                  <p className="text-sm text-gray-500">El cliente no atendio</p>
                </div>
              </button>

              <button
                onClick={() => setShowReschedule(true)}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
              >
                <CalendarClock size={20} className="text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Reprogramar</p>
                  <p className="text-sm text-gray-500">Cambiar fecha del recordatorio</p>
                </div>
              </button>

              <button
                onClick={() => onComplete(reminder, 'completed')}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
              >
                <Check size={20} className="text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Marcar completado</p>
                  <p className="text-sm text-gray-500">Sin mas acciones</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReschedule(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => newDate && onReschedule(reminder, newDate)}
                  disabled={!newDate}
                  className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition disabled:opacity-50"
                >
                  Reprogramar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
