import { createServerSupabaseClient } from '@/lib/supabase-server';
import { STATUS_CONFIG, type LeadStatus, type Lead, type LeadNote } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Pencil, Phone, Mail, Calendar, FileText, PhoneCall } from 'lucide-react';
import { StatusSelect } from '../StatusSelect';
import { AddNoteForm } from './AddNoteForm';
import { NotesList } from './NotesList';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    notFound();
  }

  const lead = data as Lead;

  const { data: notesData } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false });

  const notes = (notesData || []) as LeadNote[];
  const config = STATUS_CONFIG[lead.status as LeadStatus];

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/leads"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{lead.full_name}</h1>
          <p className="text-gray-500">Lead desde {format(new Date(lead.created_at), "d 'de' MMMM yyyy", { locale: es })}</p>
        </div>
        <Link
          href={"/leads/" + id + "/edit"}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <Pencil size={18} />
          Editar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Informacion de contacto</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Phone size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefono</p>
                  <p className="font-medium text-gray-800">{lead.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{lead.email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de contacto</p>
                  <p className="font-medium text-gray-800">
                    {format(new Date(lead.contact_date), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={"p-2 rounded-lg " + config.bgColor}>
                  <FileText size={20} className={config.color} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <StatusSelect leadId={lead.id} currentStatus={lead.status as LeadStatus} />
                </div>
              </div>
            </div>

            {lead.notes && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Nota principal</h3>
                <p className="text-gray-700">{lead.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Historial de notas</h2>
            <AddNoteForm leadId={lead.id} />
            <NotesList notes={notes} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Llamadas</h2>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Proximamente
              </span>
            </div>
            <div className="text-center py-8">
              <PhoneCall size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                El registro de llamadas estara disponible proximamente
              </p>
              <button
                disabled
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
              >
                Nueva llamada
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Actividad reciente</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-brand-primary" />
                <div>
                  <p className="text-sm text-gray-600">Lead creado</p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(lead.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
              {lead.updated_at !== lead.created_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Ultima actualizacion</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(lead.updated_at), "d MMM yyyy, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
