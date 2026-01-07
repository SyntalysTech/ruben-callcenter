'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase';
import type { Lead, LeadStatus } from '@/lib/types';

interface Props {
  leads: Lead[];
}

const STATUS_MAP: Record<string, LeadStatus> = {
  // Spanish labels
  'no es posible hacerle el contrato': 'red',
  'no posible': 'red',
  'rojo': 'red',
  'red': 'red',
  'no contesta': 'yellow',
  'amarillo': 'yellow',
  'yellow': 'yellow',
  'mas adelante / intentar de nuevo': 'orange',
  'mas adelante': 'orange',
  'naranja': 'orange',
  'orange': 'orange',
  'programado para mas tarde': 'blue',
  'programado': 'blue',
  'azul': 'blue',
  'blue': 'blue',
  'cerrado / firmado': 'green',
  'cerrado': 'green',
  'firmado': 'green',
  'firmados': 'green',
  'verde': 'green',
  'green': 'green',
  // Facebook Ads statuses
  'created': 'yellow',
  'done': 'green',
  'qualified': 'blue',
  'disqualified': 'red',
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  red: 'No es posible hacerle el contrato',
  yellow: 'No contesta',
  orange: 'Mas adelante / intentar de nuevo',
  blue: 'Programado para mas tarde',
  green: 'Cerrado / firmado',
};

export function ExcelButtons({ leads }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, show: false });

  const handleExport = () => {
    setExporting(true);
    try {
      const data = leads.map(lead => ({
        'Nombre': lead.full_name,
        'Telefono': lead.phone,
        'Email': lead.email || '',
        'Fecha Contacto': lead.contact_date,
        'Estado': STATUS_LABELS[lead.status as LeadStatus] || lead.status,
        'Notas': lead.notes || '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');

      // Auto-size columns
      const colWidths = [
        { wch: 25 }, // Nombre
        { wch: 15 }, // Telefono
        { wch: 30 }, // Email
        { wch: 15 }, // Fecha Contacto
        { wch: 35 }, // Estado
        { wch: 50 }, // Notas
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `leads_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar los leads');
    }
    setExporting(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Read raw data to get all columns including those without headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
      const headerRow = rawData[0] as string[];

      // Find column indices
      const colIndices = {
        full_name: headerRow.findIndex(h => h === 'full_name' || h === 'Nombre'),
        phone_number: headerRow.findIndex(h => h === 'phone_number' || h === 'Telefono'),
        email: headerRow.findIndex(h => h === 'email' || h === 'Email'),
        created_time: headerRow.findIndex(h => h === 'created_time' || h === 'Fecha Contacto'),
        lead_status: headerRow.findIndex(h => h === 'lead_status' || h === 'Estado'),
      };

      // The notes column is typically the last one (after lead_status)
      const notesColIndex = colIndices.lead_status >= 0 ? colIndices.lead_status + 1 : -1;

      const leadsToInsert = rawData.slice(1).map((row: unknown[]) => {
        // Support both custom format and Facebook Ads format
        const nombre = colIndices.full_name >= 0 ? row[colIndices.full_name] : '';
        const telefono = colIndices.phone_number >= 0 ? row[colIndices.phone_number] : '';
        const email = colIndices.email >= 0 ? row[colIndices.email] : '';
        const fechaContacto = colIndices.created_time >= 0 ? row[colIndices.created_time] : '';
        const leadStatusCol = colIndices.lead_status >= 0 ? row[colIndices.lead_status] : '';
        const notasCol = notesColIndex >= 0 ? row[notesColIndex] : '';

        // Use notes column for status if it contains status keywords, otherwise use lead_status
        const notasStr = String(notasCol || '').toLowerCase().trim();
        let estadoText = String(leadStatusCol || 'yellow').toLowerCase().trim();

        // Check if notes contain status keywords
        if (notasStr.includes('firmado') || notasStr.includes('firmados')) {
          estadoText = 'firmado';
        } else if (notasStr.includes('no le interesa') || notasStr.includes('no interesa') || notasStr.includes('rancio')) {
          estadoText = 'red';
        } else if (notasStr.includes('deuda') || notasStr.includes('bono social') || notasStr.includes('corta')) {
          estadoText = 'red';
        } else if (notasStr.includes('llamar') || notasStr.includes('falta')) {
          estadoText = 'orange';
        }

        const notas = notasCol || '';

        // Parse status
        const statusLower = String(estadoText).toLowerCase().trim();
        const status = STATUS_MAP[statusLower] || 'yellow';

        // Parse phone - remove "p:" prefix if present
        let phone = String(telefono).trim();
        if (phone.startsWith('p:')) {
          phone = phone.substring(2).trim();
        }
        // Remove test data markers
        if (phone.includes('<test lead:')) {
          phone = '';
        }

        // Parse name - remove test data markers
        let fullName = String(nombre).trim();
        if (fullName.includes('<test lead:')) {
          fullName = '';
        }

        // Parse date - extract date part from ISO string
        let contactDate = new Date().toISOString().split('T')[0];
        if (fechaContacto) {
          const dateStr = String(fechaContacto);
          if (dateStr.includes('T')) {
            contactDate = dateStr.split('T')[0];
          } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            contactDate = dateStr.substring(0, 10);
          }
        }

        return {
          full_name: fullName,
          phone: phone,
          email: email ? String(email).trim() : null,
          contact_date: contactDate,
          status,
          notes: notas ? String(notas).trim() : null,
        };
      }).filter(lead => {
        // Filter out empty rows and rows with "undefined" string values
        const hasValidName = lead.full_name && lead.full_name !== 'undefined' && lead.full_name.trim() !== '';
        const hasValidPhone = lead.phone && lead.phone !== 'undefined' && lead.phone.trim() !== '';
        return hasValidName && hasValidPhone;
      });

      if (leadsToInsert.length === 0) {
        alert('No se encontraron leads validos en el archivo. Asegurate de que tenga columnas "Nombre"/"full_name" y "Telefono"/"phone_number".');
        setImporting(false);
        return;
      }

      // Insert in batches of 50 for progress tracking
      const batchSize = 50;
      const totalBatches = Math.ceil(leadsToInsert.length / batchSize);
      let insertedCount = 0;
      let errorOccurred = false;

      setProgress({ current: 0, total: leadsToInsert.length, show: true });

      for (let i = 0; i < totalBatches; i++) {
        const batch = leadsToInsert.slice(i * batchSize, (i + 1) * batchSize);
        const { error } = await supabase.from('leads').insert(batch as never[]);

        if (error) {
          console.error('Error inserting batch:', error);
          alert(`Error al importar lote ${i + 1}: ${error.message}`);
          errorOccurred = true;
          break;
        }

        insertedCount += batch.length;
        setProgress({ current: insertedCount, total: leadsToInsert.length, show: true });
      }

      setProgress({ current: 0, total: 0, show: false });

      if (!errorOccurred) {
        alert(`Se importaron ${insertedCount} leads correctamente`);
        router.refresh();
      } else if (insertedCount > 0) {
        alert(`Se importaron ${insertedCount} de ${leadsToInsert.length} leads antes del error`);
        router.refresh();
      }
    } catch (error) {
      console.error('Error importing:', error);
      alert('Error al leer el archivo Excel');
    }
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    setShowDeleteConfirm(false);

    try {
      // Delete all leads
      const { error } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.error('Error deleting:', error);
        alert('Error al borrar leads: ' + error.message);
      } else {
        alert('Se han borrado todos los leads');
        router.refresh();
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al borrar leads');
    }
    setDeleting(false);
  };

  const progressPercent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Borrar todos los leads</h3>
            <p className="text-gray-600 mb-6">
              Estas seguro de que deseas borrar <strong>todos los {leads.length} leads</strong>? Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Borrando...' : 'Borrar todo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {progress.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Importando leads...</h3>
            <div className="mb-2">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-brand-primary h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              {progress.current} de {progress.total} leads ({progressPercent}%)
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          className="hidden"
        />
        {leads.length > 0 && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
            title="Borrar todos los leads"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">{deleting ? 'Borrando...' : 'Borrar todo'}</span>
          </button>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
          title="Importar desde Excel"
        >
          <Upload size={18} />
          <span className="hidden sm:inline">{importing ? 'Importando...' : 'Importar'}</span>
        </button>
        <button
          onClick={handleExport}
          disabled={exporting || leads.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          title="Exportar a Excel"
        >
          <Download size={18} />
          <span className="hidden sm:inline">{exporting ? 'Exportando...' : 'Exportar'}</span>
        </button>
      </div>
    </>
  );
}
