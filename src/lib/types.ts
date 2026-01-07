export type LeadStatus = 'red' | 'yellow' | 'orange' | 'blue' | 'green';

export const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  red: {
    label: 'No es posible hacerle el contrato',
    color: 'text-white',
    bgColor: 'bg-red-500',
  },
  yellow: {
    label: 'No contesta',
    color: 'text-black',
    bgColor: 'bg-yellow-400',
  },
  orange: {
    label: 'Más adelante / intentar de nuevo',
    color: 'text-white',
    bgColor: 'bg-orange-500',
  },
  blue: {
    label: 'Programado para más tarde',
    color: 'text-white',
    bgColor: 'bg-blue-500',
  },
  green: {
    label: 'Cerrado / firmado',
    color: 'text-white',
    bgColor: 'bg-green-500',
  },
};

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string | null;
  phone: string;
  contact_date: string;
  status: LeadStatus;
  notes: string | null;
  assigned_to: string | null;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  created_at: string;
  note: string;
  created_by: string | null;
}

export interface CallAccount {
  id: string;
  created_at: string;
  provider: string;
  display_name: string;
  currency: string;
  balance_current: number;
  balance_updated_at: string;
  status: 'active' | 'inactive';
}

export interface CallLog {
  id: string;
  created_at: string;
  lead_id: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  status: 'queued' | 'ringing' | 'answered' | 'failed' | 'no-answer' | 'busy';
  duration_sec: number;
  cost: number;
  recording_url: string | null;
  transcript: string | null;
  summary: string | null;
  provider_call_id: string | null;
}

export interface CallRecording {
  id: string;
  call_log_id: string;
  url: string;
  duration_sec: number;
}

export interface CallMetricsDaily {
  date: string;
  calls_total: number;
  calls_answered: number;
  calls_failed: number;
  cost_total: number;
}

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>;
      };
      lead_notes: {
        Row: LeadNote;
        Insert: Omit<LeadNote, 'id' | 'created_at'>;
        Update: Partial<Omit<LeadNote, 'id' | 'created_at'>>;
      };
      call_accounts: {
        Row: CallAccount;
        Insert: Omit<CallAccount, 'id' | 'created_at'>;
        Update: Partial<Omit<CallAccount, 'id' | 'created_at'>>;
      };
      call_logs: {
        Row: CallLog;
        Insert: Omit<CallLog, 'id' | 'created_at'>;
        Update: Partial<Omit<CallLog, 'id' | 'created_at'>>;
      };
      call_recordings: {
        Row: CallRecording;
        Insert: Omit<CallRecording, 'id'>;
        Update: Partial<Omit<CallRecording, 'id'>>;
      };
      call_metrics_daily: {
        Row: CallMetricsDaily;
        Insert: CallMetricsDaily;
        Update: Partial<CallMetricsDaily>;
      };
    };
  };
}
