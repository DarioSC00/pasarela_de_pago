import type { Payment } from '@/lib/types';

export function getDashboardInsight(payments: Payment[], displayCurrency: string, totalRevenue: number) {
  if (payments.length === 0) {
    return {
      message: 'No hay pagos aún. Cuando lleguen, te mostraré alertas y oportunidades.',
      variant: 'success' as const,
    };
  }

  const refundCount = payments.filter((payment) => payment.estado === 'refunded').length;
  const refundRate = refundCount / payments.length;
  const multipleCurrencies = new Set(payments.map((payment) => payment.moneda)).size > 1;

  if (refundRate >= 0.25) {
    return {
      message:
        'IA: El porcentaje de reembolsos es alto. Revisa los cursos con más devoluciones y mejora el proceso de pago.',
      variant: 'danger' as const,
    };
  }

  if (multipleCurrencies) {
    return {
      message: `IA: Hay varias monedas en los pagos. Elige ${displayCurrency} como divisa de reporte para comparar más fácil los ingresos.`,
      variant: 'warning' as const,
    };
  }

  if (totalRevenue > 0 && payments.length > 0) {
    return {
      message: 'IA: El ticket medio es estable. Podrías ofrecer un paquete premium basado en los cursos más vendidos.',
      variant: 'success' as const,
    };
  }

  return {
    message: 'IA: Todo luce bien. Monitorea los reembolsos y ajusta las monedas de tu dashboard si aparecen nuevas divisas.',
    variant: 'success' as const,
  };
}
