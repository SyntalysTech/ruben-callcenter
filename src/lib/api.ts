import { supabase } from './supabase';
import type { Lead, LeadNote, LeadStatus, Client } from './types';

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
  // Update the lead status
  const { error } = await supabase.from('leads').update({ status } as never).eq('id', id);

  if (error) return { error };

  // If status changed to green (signed), create a client automatically
  if (status === 'green') {
    await convertLeadToClient(id);
  }

  return { error: null };
}

// Convert a lead to client when signed
export async function convertLeadToClient(leadId: string) {
  // First, get the lead data
  const { data: leadData, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !leadData) {
    console.error('Error fetching lead for conversion:', leadError);
    return { error: leadError };
  }

  const lead = leadData as Lead;

  // Check if client already exists for this lead
  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('lead_id', leadId)
    .single();

  if (existingClient) {
    // Client already exists, no need to create
    return { client: existingClient as Client, error: null };
  }

  // Create the client
  const today = new Date().toISOString().split('T')[0];
  const clientData = {
    lead_id: leadId,
    full_name: lead.full_name,
    email: lead.email,
    phone: lead.phone,
    status: 'signed',
    signed_at: new Date().toISOString(),
    contract_start_date: today,
    // Set default values - user can update later
    provider: 'otro',
    monthly_cost: 0,
    total_savings_to_date: 0,
    referral_bonus_paid: false,
    notes: lead.notes,
    assigned_to: lead.assigned_to,
  };

  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert(clientData as never)
    .select()
    .single();

  if (clientError) {
    console.error('Error creating client:', clientError);
    return { error: clientError };
  }

  return { client: newClient as Client, error: null };
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

// ============ CLIENT FUNCTIONS ============

export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  return { clients: (data || []) as Client[], error };
}

export async function getClient(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  return { client: data as Client | null, error };
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();
  return { client: data as Client | null, error };
}
