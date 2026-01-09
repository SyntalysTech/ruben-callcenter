export type LeadStatus = 'red' | 'yellow' | 'orange' | 'blue' | 'green';

export type UserRole = 'admin' | 'manager' | 'agent';

export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  admin: {
    label: 'Administrador',
    color: 'text-white',
    bgColor: 'bg-purple-600',
  },
  manager: {
    label: 'Manager',
    color: 'text-white',
    bgColor: 'bg-blue-600',
  },
  agent: {
    label: 'Agente',
    color: 'text-white',
    bgColor: 'bg-gray-600',
  },
};

export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

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

// ============ ESTUDIO ENERGETICO ============

export type EnergyProvider = 'iberdrola' | 'endesa' | 'naturgy' | 'repsol' | 'totalenergies' | 'otro';

export const ENERGY_PROVIDERS: Record<EnergyProvider, string> = {
  iberdrola: 'Iberdrola',
  endesa: 'Endesa',
  naturgy: 'Naturgy',
  repsol: 'Repsol',
  totalenergies: 'TotalEnergies',
  otro: 'Otro',
};

export interface EnergyStudy {
  id: string;
  created_at: string;
  updated_at: string;
  lead_id: string;
  created_by: string;

  // Datos factura actual (si tiene)
  has_invoice: boolean;
  current_provider: EnergyProvider | null;
  current_monthly_cost: number | null;
  current_power_p1: number | null; // kW
  current_power_p2: number | null; // kW
  current_consumption_annual: number | null; // kWh

  // Datos propuesta nueva
  new_provider: EnergyProvider;
  new_monthly_cost: number;
  new_power_p1: number | null;
  new_power_p2: number | null;

  // Servicios adicionales
  has_maintenance_insurance: boolean;
  maintenance_insurance_cost: number | null;
  has_pac_iberdrola: boolean;
  pac_cost: number | null;
  other_services: string | null;
  other_services_cost: number | null;

  // Ahorro calculado
  monthly_savings: number;
  annual_savings: number;

  // Condiciones
  contract_duration_months: number;
  special_conditions: string | null;

  // IA generó el estudio?
  ai_generated: boolean;
  ai_error: string | null;

  // PDF generado
  pdf_url: string | null;
}

// ============ CLIENTES (leads firmados) ============

export type ClientStatus =
  | 'pending_signature'      // Esperando firma
  | 'signed'                 // Firmado
  | 'reminder_day1'          // Recordatorio día siguiente
  | 'reminder_week1'         // Recordatorio semana 1
  | 'reminder_month2'        // Recordatorio 2 meses
  | 'reminder_month4'        // Recordatorio 4 meses
  | 'reminder_month6'        // Recordatorio 6 meses
  | 'reminder_month12'       // Recordatorio 12 meses (renovación)
  | 'renewed';               // Renovado

export const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bgColor: string }> = {
  pending_signature: { label: 'Pendiente firma', color: 'text-white', bgColor: 'bg-yellow-500' },
  signed: { label: 'Firmado', color: 'text-white', bgColor: 'bg-green-500' },
  reminder_day1: { label: 'Recordado (1 día)', color: 'text-white', bgColor: 'bg-blue-400' },
  reminder_week1: { label: 'Recordado (1 semana)', color: 'text-white', bgColor: 'bg-blue-500' },
  reminder_month2: { label: 'Seguimiento 2 meses', color: 'text-white', bgColor: 'bg-purple-400' },
  reminder_month4: { label: 'Seguimiento 4 meses', color: 'text-white', bgColor: 'bg-purple-500' },
  reminder_month6: { label: 'Seguimiento 6 meses', color: 'text-white', bgColor: 'bg-purple-600' },
  reminder_month12: { label: 'Renovación pendiente', color: 'text-white', bgColor: 'bg-orange-500' },
  renewed: { label: 'Renovado', color: 'text-white', bgColor: 'bg-green-600' },
};

export interface Client {
  id: string;
  created_at: string;
  updated_at: string;
  lead_id: string;
  energy_study_id: string | null;

  // Info del cliente
  full_name: string;
  email: string | null;
  phone: string;
  address: string | null;
  dni: string | null;

  // Contrato
  signed_at: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  provider: EnergyProvider;
  monthly_cost: number;

  // Ahorro tracking
  total_savings_to_date: number;

  // Estado y recordatorios
  status: ClientStatus;
  last_reminder_sent: string | null;
  next_reminder_date: string | null;

  // Referidos
  referred_by_client_id: string | null;
  referral_bonus_paid: boolean;

  // Notas
  notes: string | null;

  assigned_to: string | null;
}

// ============ RECORDATORIOS ============

export type ReminderType =
  | 'day1_welcome'           // Día siguiente: bienvenida
  | 'week1_confirmation'     // Semana 1: confirmación todo ok
  | 'month2_checkup'         // 2 meses: revisar si se puede bajar precio
  | 'month4_checkup'         // 4 meses: consulta incidencias
  | 'month6_checkup'         // 6 meses: seguimiento
  | 'month12_renewal'        // 12 meses: renovación
  | 'referral_program';      // Programa referidos

export const REMINDER_TYPE_CONFIG: Record<ReminderType, { label: string; description: string; days_after_sign: number }> = {
  day1_welcome: {
    label: 'Bienvenida',
    description: 'Recordatorio de que estás con nosotros, mejores condiciones del mercado',
    days_after_sign: 1
  },
  week1_confirmation: {
    label: 'Confirmación',
    description: 'Verificar que todo está correcto con el nuevo contrato',
    days_after_sign: 7
  },
  month2_checkup: {
    label: 'Revisión 2 meses',
    description: 'En Endesa: revisar si se puede bajar el precio. Programa de referidos.',
    days_after_sign: 60
  },
  month4_checkup: {
    label: 'Consulta 4 meses',
    description: 'Consulta por si ha tenido incidencias',
    days_after_sign: 120
  },
  month6_checkup: {
    label: 'Seguimiento 6 meses',
    description: 'Seguimiento general del servicio',
    days_after_sign: 180
  },
  month12_renewal: {
    label: 'Renovación',
    description: 'Tu contrato vence el día X. Gracias a nosotros has ahorrado X. Agendar cita para ofertas del próximo año.',
    days_after_sign: 358 // Una semana antes de cumplir el año
  },
  referral_program: {
    label: 'Programa referidos',
    description: 'Si traes otra persona 20€ por cada persona de tu parte',
    days_after_sign: 60
  },
};

export interface ClientReminder {
  id: string;
  created_at: string;
  client_id: string;
  reminder_type: ReminderType;
  scheduled_date: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  result: 'pending' | 'contacted' | 'no_answer' | 'rescheduled' | 'completed' | null;
}

// ============ REFERIDOS ============

export interface Referral {
  id: string;
  created_at: string;
  referrer_client_id: string;   // Cliente que refiere
  referred_lead_id: string;      // Lead referido
  referred_client_id: string | null; // Si el lead se convierte en cliente
  bonus_amount: number;          // 20€ por defecto
  bonus_paid: boolean;
  bonus_paid_at: string | null;
  notes: string | null;
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
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
