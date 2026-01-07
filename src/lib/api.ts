import { supabase } from './supabase';
import type { Lead, LeadNote, LeadStatus } from './types';

export async function getLeads() {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  return { leads: (data || []) as Lead[], error };
}

export async function getLead(id: string) {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
  return { lead: data as Lead | null, error };
}

export async function createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('leads').insert(lead as never).select().single();
  return { lead: data as Lead | null, error };
}

export async function updateLead(id: string, updates: Partial<Lead>) {
  const { data, error } = await supabase.from('leads').update(updates as never).eq('id', id).select().single();
  return { lead: data as Lead | null, error };
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  return { error };
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const { error } = await supabase.from('leads').update({ status } as never).eq('id', id);
  return { error };
}

export async function getLeadNotes(leadId: string) {
  const { data, error } = await supabase.from('lead_notes').select('*').eq('lead_id', leadId).order('created_at', { ascending: false });
  return { notes: (data || []) as LeadNote[], error };
}

export async function createLeadNote(leadId: string, note: string) {
  const { data, error } = await supabase.from('lead_notes').insert({ lead_id: leadId, note } as never).select().single();
  return { note: data as LeadNote | null, error };
}

export async function deleteLeadNote(id: string) {
  const { error } = await supabase.from('lead_notes').delete().eq('id', id);
  return { error };
}
