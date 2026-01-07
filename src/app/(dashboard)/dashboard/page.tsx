import { createServerSupabaseClient } from '@/lib/supabase-server';
import { STATUS_CONFIG, type LeadStatus, type Lead } from '@/lib/types';
import { Users, UserPlus, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

async function getStats() {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase.from('leads').select('*');
  const leads = (data || []) as Lead[];

  const sevenDaysAgo = subDays(new Date(), 7);
  const new7days = leads.filter(l => new Date(l.created_at) >= sevenDaysAgo).length;

  const byStatus: Record<LeadStatus, number> = {
    red: 0,
    yellow: 0,
    orange: 0,
    blue: 0,
    green: 0,
  };

  leads.forEach(lead => {
    if (lead.status in byStatus) {
      byStatus[lead.status as LeadStatus]++;
    }
  });

  const recentLeads = leads
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return {
    total: leads.length,
    new7days,
    byStatus,
    recentLeads,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-primary/10 rounded-lg">
              <Users className="text-brand-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Leads</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserPlus className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nuevos (7 dias)</p>
              <p className="text-2xl font-bold text-gray-800">{stats.new7days}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cerrados</p>
              <p className="text-2xl font-bold text-gray-800">{stats.byStatus.green}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-gray-800">
                {stats.byStatus.yellow + stats.byStatus.orange + stats.byStatus.blue}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Leads por Estado</h2>
          <div className="space-y-3">
            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => (
              <Link
                key={status}
                href={"/leads?status=" + status}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className={"w-4 h-4 rounded-full " + STATUS_CONFIG[status].bgColor} />
                  <span className="text-gray-700">{STATUS_CONFIG[status].label}</span>
                </div>
                <span className="font-semibold text-gray-800">{stats.byStatus[status]}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Ultimos Leads</h2>
            <Link href="/leads" className="text-brand-primary hover:underline text-sm">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentLeads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay leads todavia</p>
            ) : (
              stats.recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={"/leads/" + lead.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-medium text-gray-800">{lead.full_name}</p>
                    <p className="text-sm text-gray-500">{lead.phone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={"w-3 h-3 rounded-full " + STATUS_CONFIG[lead.status as LeadStatus].bgColor} />
                    <span className="text-sm text-gray-500">
                      {format(new Date(lead.created_at), 'dd MMM', { locale: es })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
