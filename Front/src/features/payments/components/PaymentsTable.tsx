import type { Payment } from '@/lib/types';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/format';

const currencyIcons: Record<string, string> = {
  USD: 'mdi:currency-usd',
  COP: 'mdi:currency-usd',
  EUR: 'mdi:currency-eur',
};

export function PaymentsTable({ payments, loading }: { payments: Payment[]; loading: boolean }) {
  return (
    <div>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Tabla de pagos</h2>
          <p className="secondary-text">Datos extraídos directamente de la tabla `pagos` en Supabase.</p>
        </div>
        <Icon icon="mdi:table-large" width="24" color="#38bdf8" />
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th><Icon icon="mdi:hash" width="16" /> ID pago</th>
              <th><Icon icon="mdi:account" width="16" /> Cliente</th>
              <th><Icon icon="mdi:school" width="16" /> Curso</th>
              <th><Icon icon="mdi:cash" width="16" /> Importe</th>
              <th><Icon icon="mdi:currency-usd" width="16" /> Moneda</th>
              <th><Icon icon="mdi:shield-check" width="16" /> Estado</th>
              <th><Icon icon="mdi:calendar-clock" width="16" /> Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center' }}>
                  Cargando pagos...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center' }}>
                  No se encontraron pagos.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id_pago}>
                  <td>{payment.id_pago}</td>
                  <td>{payment.nombre}</td>
                  <td>{payment.curso}</td>
                  <td>{formatCurrency(payment.importe, payment.moneda)}</td>
                  <td>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                      <Icon icon={currencyIcons[payment.moneda] ?? 'mdi:cash'} width={16} />
                      {payment.moneda}
                    </div>
                  </td>
                  <td>
                    <span className={`status-chip status-${payment.estado}`}>
                      <Icon
                        icon={payment.estado === 'completed' ? 'mdi:check-circle-outline' : 'mdi:refresh-alert'}
                        width={16}
                      />
                      {payment.estado}
                    </span>
                  </td>
                  <td>{new Date(payment.fecha).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
