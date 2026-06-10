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
  // Disparamos el webhook a través de nuestro backend proxy para evitar problemas de CORS.
  // El webhook de n8n se encargará de guardar el pago en Supabase y enviar el correo.
  const response = await fetch('/api/n8n', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en el webhook: ${errorText}`);
  }

  // Devolvemos el pago optimista; la suscripción realtime de Supabase
  // se encargará de actualizar el estado cuando n8n lo inserte.
  return {
    ...(payment as Payment),
    importe: Number(payment.importe),
    moneda: payment.moneda?.toUpperCase() || 'USD',
  };
}
