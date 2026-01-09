import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Crear cliente de Supabase con service role para acceso completo
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Obtener datos del CRM para contexto
async function getCRMContext() {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const startOfMonth = thisMonth.toISOString().split('T')[0];

  // Obtener leads
  const { data: leads, count: leadsCount } = await supabaseAdmin
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100);

  // Estadisticas de leads por estado
  const leadsByStatus = {
    red: leads?.filter(l => l.status === 'red').length || 0,
    yellow: leads?.filter(l => l.status === 'yellow').length || 0,
    orange: leads?.filter(l => l.status === 'orange').length || 0,
    blue: leads?.filter(l => l.status === 'blue').length || 0,
    green: leads?.filter(l => l.status === 'green').length || 0,
  };

  // Leads de este mes
  const leadsThisMonth = leads?.filter(l => l.created_at >= startOfMonth).length || 0;

  // Obtener clientes
  const { data: clients, count: clientsCount } = await supabaseAdmin
    .from('clients')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100);

  // Clientes por estado
  const clientsByStatus = {
    pending: clients?.filter(c => c.status === 'pending').length || 0,
    active: clients?.filter(c => c.status === 'active').length || 0,
    signed: clients?.filter(c => c.status === 'signed').length || 0,
    cancelled: clients?.filter(c => c.status === 'cancelled').length || 0,
  };

  // Clientes con contrato proximo a vencer (30 dias)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringContracts = clients?.filter(c => {
    if (!c.contract_end_date) return false;
    const endDate = new Date(c.contract_end_date);
    return endDate <= thirtyDaysFromNow && endDate >= new Date();
  }) || [];

  // Obtener estudios de energia
  const { data: studies } = await supabaseAdmin
    .from('energy_studies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Calcular ahorro promedio
  const studiesWithSavings = studies?.filter(s => s.estimated_annual_savings) || [];
  const avgSavings = studiesWithSavings.length > 0
    ? studiesWithSavings.reduce((sum, s) => sum + (s.estimated_annual_savings || 0), 0) / studiesWithSavings.length
    : 0;

  // Obtener recordatorios
  const { data: reminders } = await supabaseAdmin
    .from('client_reminders')
    .select('*, clients(full_name)')
    .order('scheduled_date', { ascending: true })
    .limit(50);

  const todayReminders = reminders?.filter(r => r.scheduled_date === today && r.status === 'pending') || [];
  const pendingReminders = reminders?.filter(r => r.status === 'pending') || [];

  // Obtener referidos
  const { data: referrals } = await supabaseAdmin
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const pendingReferralPayments = referrals?.filter(r => r.status === 'signed' && !r.reward_paid) || [];
  const totalReferralRewards = referrals?.filter(r => r.reward_paid).reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0;

  return {
    // Resumen
    summary: {
      totalLeads: leadsCount || 0,
      totalClients: clientsCount || 0,
      leadsThisMonth,
      todayRemindersCount: todayReminders.length,
      pendingRemindersCount: pendingReminders.length,
      expiringContractsCount: expiringContracts.length,
    },
    // Leads detalle
    leads: {
      byStatus: leadsByStatus,
      recent: leads?.slice(0, 10).map(l => ({
        name: l.full_name,
        phone: l.phone,
        email: l.email,
        status: l.status,
        contactDate: l.contact_date,
        notes: l.notes,
      })) || [],
    },
    // Clientes detalle
    clients: {
      byStatus: clientsByStatus,
      expiringContracts: expiringContracts.map(c => ({
        name: c.full_name,
        phone: c.phone,
        provider: c.current_provider,
        contractEnd: c.contract_end_date,
      })),
      recent: clients?.slice(0, 10).map(c => ({
        name: c.full_name,
        phone: c.phone,
        status: c.status,
        provider: c.current_provider,
        signedDate: c.signed_date,
      })) || [],
    },
    // Estudios
    studies: {
      total: studies?.length || 0,
      avgAnnualSavings: Math.round(avgSavings * 100) / 100,
      byType: {
        withInvoice: studies?.filter(s => s.study_type === 'with_invoice').length || 0,
        withoutInvoice: studies?.filter(s => s.study_type === 'without_invoice').length || 0,
      },
    },
    // Recordatorios
    reminders: {
      today: todayReminders.map(r => ({
        type: r.reminder_type,
        clientName: (r.clients as { full_name: string } | null)?.full_name || 'N/A',
        date: r.scheduled_date,
      })),
      pending: pendingReminders.slice(0, 10).map(r => ({
        type: r.reminder_type,
        clientName: (r.clients as { full_name: string } | null)?.full_name || 'N/A',
        date: r.scheduled_date,
      })),
    },
    // Referidos
    referrals: {
      total: referrals?.length || 0,
      pendingPayments: pendingReferralPayments.length,
      totalRewardsPaid: totalReferralRewards,
      byStatus: {
        pending: referrals?.filter(r => r.status === 'pending').length || 0,
        contacted: referrals?.filter(r => r.status === 'contacted').length || 0,
        signed: referrals?.filter(r => r.status === 'signed').length || 0,
        rejected: referrals?.filter(r => r.status === 'rejected').length || 0,
      },
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key no configurada' },
        { status: 500 }
      );
    }

    // Obtener contexto del CRM
    const crmContext = await getCRMContext();

    // Construir el system prompt con el contexto
    const systemPrompt = `Eres CalidAI, el asistente inteligente de Calidad Energia, una empresa de comercializacion de energia en España.

Tu rol es ayudar a los usuarios del CRM respondiendo preguntas sobre leads, clientes, estudios de energia, recordatorios y referidos.

DATOS ACTUALES DEL CRM (fecha: ${new Date().toLocaleDateString('es-ES')}):

📊 RESUMEN:
- Total leads: ${crmContext.summary.totalLeads}
- Total clientes: ${crmContext.summary.totalClients}
- Leads este mes: ${crmContext.summary.leadsThisMonth}
- Recordatorios hoy: ${crmContext.summary.todayRemindersCount}
- Recordatorios pendientes: ${crmContext.summary.pendingRemindersCount}
- Contratos por vencer (30 dias): ${crmContext.summary.expiringContractsCount}

👥 LEADS POR ESTADO:
- Rojo (no interesado): ${crmContext.leads.byStatus.red}
- Amarillo (pendiente): ${crmContext.leads.byStatus.yellow}
- Naranja (en proceso): ${crmContext.leads.byStatus.orange}
- Azul (interesado): ${crmContext.leads.byStatus.blue}
- Verde (convertido): ${crmContext.leads.byStatus.green}

LEADS RECIENTES:
${crmContext.leads.recent.map(l => `- ${l.name} (${l.phone}) - Estado: ${l.status} - Contacto: ${l.contactDate}`).join('\n')}

👤 CLIENTES POR ESTADO:
- Pendientes: ${crmContext.clients.byStatus.pending}
- Activos: ${crmContext.clients.byStatus.active}
- Firmados: ${crmContext.clients.byStatus.signed}
- Cancelados: ${crmContext.clients.byStatus.cancelled}

CONTRATOS POR VENCER:
${crmContext.clients.expiringContracts.map(c => `- ${c.name} (${c.phone}) - Vence: ${c.contractEnd} - Comercializadora: ${c.provider || 'N/A'}`).join('\n') || 'Ninguno en los proximos 30 dias'}

CLIENTES RECIENTES:
${crmContext.clients.recent.map(c => `- ${c.name} - Estado: ${c.status} - Comercializadora: ${c.provider || 'N/A'}`).join('\n')}

⚡ ESTUDIOS DE ENERGIA:
- Total estudios: ${crmContext.studies.total}
- Con factura: ${crmContext.studies.byType.withInvoice}
- Sin factura: ${crmContext.studies.byType.withoutInvoice}
- Ahorro anual promedio: ${crmContext.studies.avgAnnualSavings}€

🔔 RECORDATORIOS DE HOY:
${crmContext.reminders.today.map(r => `- ${r.type}: ${r.clientName}`).join('\n') || 'No hay recordatorios para hoy'}

PROXIMOS RECORDATORIOS PENDIENTES:
${crmContext.reminders.pending.map(r => `- ${r.date}: ${r.type} - ${r.clientName}`).join('\n') || 'No hay recordatorios pendientes'}

🎁 REFERIDOS:
- Total referidos: ${crmContext.referrals.total}
- Pendientes de pago: ${crmContext.referrals.pendingPayments}
- Total pagado en recompensas: ${crmContext.referrals.totalRewardsPaid}€
- Por estado: Pendientes: ${crmContext.referrals.byStatus.pending}, Contactados: ${crmContext.referrals.byStatus.contacted}, Firmados: ${crmContext.referrals.byStatus.signed}, Rechazados: ${crmContext.referrals.byStatus.rejected}

INSTRUCCIONES:
1. Responde siempre en español de España
2. Se conciso pero completo
3. Usa los datos reales del CRM para responder
4. Si te preguntan por algo que no esta en los datos, indica que no tienes esa informacion
5. Puedes dar recomendaciones basadas en los datos
6. Usa emojis moderadamente para hacer las respuestas mas visuales
7. Si detectas oportunidades de negocio o alertas, mencionalas proactivamente`;

    // Construir mensajes para OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m: Message) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Llamar a OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI error:', errorData);
      throw new Error(errorData.error?.message || 'Error de OpenAI');
    }

    const data = await openaiResponse.json();
    const response = data.choices[0]?.message?.content || 'No pude generar una respuesta.';

    return NextResponse.json({ response });

  } catch (error) {
    console.error('[CalidAI] Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
