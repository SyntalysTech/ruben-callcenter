'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { deleteLeadNote } from '@/lib/api';
import type { LeadNote } from '@/lib/types';

interface Props {
  notes: LeadNote[];
}

export function NotesList({ notes }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (noteId: string) => {
    setDeleting(noteId);
    const { error } = await deleteLeadNote(noteId);
    if (!error) {
      router.refresh();
    }
    setDeleting(null);
  };

  if (notes.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No hay notas todavia
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="p-4 bg-gray-50 rounded-lg group"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-gray-700 flex-1">{note.note}</p>
            <button
              onClick={() => handleDelete(note.id)}
              disabled={deleting === note.id}
              className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {format(new Date(note.created_at), "d MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>
      ))}
    </div>
  );
}
