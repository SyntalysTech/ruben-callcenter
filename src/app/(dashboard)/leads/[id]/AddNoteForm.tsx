'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { createLeadNote } from '@/lib/api';

interface Props {
  leadId: string;
}

export function AddNoteForm({ leadId }: Props) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setLoading(true);
    const { error } = await createLeadNote(leadId, note.trim());

    if (!error) {
      setNote('');
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Agregar una nota..."
          rows={2}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none resize-none"
        />
        <button
          type="submit"
          disabled={loading || !note.trim()}
          className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 self-end"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
}
