import { NextResponse } from 'next/server';

// Callback para estado de llamadas
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const to = formData.get('To');
    const from = formData.get('From');
    const duration = formData.get('CallDuration');
    const direction = formData.get('Direction');

    console.log(`[Voice Status] ${callSid}: ${callStatus} | ${direction} | From: ${from} To: ${to} | Duration: ${duration}s`);

    // Aquí podrías guardar los logs en Supabase
    // Por ejemplo, registrar la llamada en la tabla call_logs

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Voice Status] Error:', error);
    return NextResponse.json({ error: 'Error processing status' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Calidad Energia Voice - Call Status Webhook'
  });
}
