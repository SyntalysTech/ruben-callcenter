'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { deleteLead } from '@/lib/api';
import { STATUS_CONFIG, type Lead, type LeadStatus } from '@/lib/types';
import { StatusSelect } from './StatusSelect';

interface Props {
  leads: Lead[];
}

export function LeadsTable({ leads }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await deleteLead(id);
    if (!error) {
      router.refresh();
    }
    setDeleting(null);
    setShowDeleteModal(null);
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <p className="text-gray-500">No se encontraron leads</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Nombre</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Telefono</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Fecha contacto</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Estado</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Ultima nota</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <Link href={"/leads/" + lead.id} className="font-medium text-gray-800 hover:text-brand-primary">
                      {lead.full_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.email || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {format(new Date(lead.contact_date), 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    <StatusSelect leadId={lead.id} currentStatus={lead.status as LeadStatus} />
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm max-w-[200px] truncate">
                    {lead.notes || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={"/leads/" + lead.id}
                        className="p-2 text-gray-400 hover:text-brand-primary hover:bg-gray-100 rounded-lg transition"
                        title="Ver"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={"/leads/" + lead.id + "/edit"}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </Link>
                      <button
                        onClick={() => setShowDeleteModal(lead.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Eliminar lead</h3>
            <p className="text-gray-600 mb-6">
              Esta seguro de que desea eliminar este lead? Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deleting === showDeleteModal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting === showDeleteModal ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
