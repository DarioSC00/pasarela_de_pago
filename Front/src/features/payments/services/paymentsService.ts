import { getSupabaseClient } from '@/lib/supabaseClient';
import type { Payment } from '@/lib/types';

export async function fetchPayments(): Promise<Payment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) {
    throw error;
  }

  return (
    (data ?? []) as Payment[]
  ).map((payment) => ({
    ...payment,
    importe: Number(payment.importe),
    moneda: payment.moneda.toUpperCase(),
  }));
}

export async function insertPayment(payment: Partial<Payment>): Promise<Payment> {
  // Disparamos el webhook a través de nuestro backend proxy para evitar problemas de CORS
  try {
    await fetch('/api/n8n', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
  } catch (e) {
    console.warn('Failed to trigger n8n webhook proxy:', e);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pagos')
    .insert([payment])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    ...(data as Payment),
    importe: Number(data.importe),
    moneda: data.moneda.toUpperCase(),
  };
}
