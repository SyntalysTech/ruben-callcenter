import { createServerSupabaseClient } from '@/lib/supabase-server';
import { type Lead } from '@/lib/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditLeadForm } from './EditLeadForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditLeadPage({ params }: Props) {
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

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={"/leads/" + id}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Editar Lead</h1>
      </div>

      <div className="max-w-2xl">
        <EditLeadForm lead={lead} />
      </div>
    </div>
  );
}
