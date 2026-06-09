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
