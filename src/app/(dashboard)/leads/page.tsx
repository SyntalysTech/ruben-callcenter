import { createServerSupabaseClient } from '@/lib/supabase-server';
import { STATUS_CONFIG, type LeadStatus, type Lead } from '@/lib/types';
import { LeadsTable } from './LeadsTable';
import { LeadFilters } from './LeadFilters';
import { CreateLeadButton } from './CreateLeadButton';
import { ExcelButtons } from './ExcelButtons';

interface Props {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sort?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase.from('leads').select('*');

  // Filter by status
  if (params.status && params.status in STATUS_CONFIG) {
    query = query.eq('status', params.status);
  }

  // Search filter
  if (params.search) {
    query = query.or(
      `full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`
    );
  }

  // Date range filter
  if (params.from) {
    query = query.gte('contact_date', params.from);
  }
  if (params.to) {
    query = query.lte('contact_date', params.to);
  }

  // Sorting
  switch (params.sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'name_asc':
      query = query.order('full_name', { ascending: true });
      break;
    case 'name_desc':
      query = query.order('full_name', { ascending: false });
      break;
    case 'contact_date':
      query = query.order('contact_date', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  const leads = (data || []) as Lead[];

  const { data: allLeadsData } = await supabase.from('leads').select('status');
  const allLeads = (allLeadsData || []) as { status: string }[];

  const statusCounts: Record<LeadStatus, number> = {
    red: 0,
    yellow: 0,
    orange: 0,
    blue: 0,
    green: 0,
  };

  allLeads.forEach(lead => {
    if (lead.status in statusCounts) {
      statusCounts[lead.status as LeadStatus]++;
    }
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Leads</h1>
        <div className="flex items-center gap-3">
          <ExcelButtons leads={leads} />
          <CreateLeadButton />
        </div>
      </div>

      <LeadFilters statusCounts={statusCounts} />

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Error al cargar leads: {error.message}
        </div>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  );
}
