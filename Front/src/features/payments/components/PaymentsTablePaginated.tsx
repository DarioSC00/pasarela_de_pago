'use client';

import type { Payment } from '@/lib/types';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/format';
import { useState, useMemo } from 'react';

const ITEMS_PER_PAGE = 8;

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return pages;
}

export function PaymentsTablePaginated({ payments, loading }: { payments: Payment[]; loading: boolean }) {
  const [currentPage, setCurrentPage] = useState(1);

  const { totalPages, paginatedPayments, startIndex, endIndex } = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(payments.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return { totalPages, paginatedPayments: payments.slice(startIndex, endIndex), startIndex, endIndex };
  }, [payments, currentPage]);

  const goPage = (n: number) => {
    if (n < 1 || n > totalPages) return;
    setCurrentPage(n);
  };

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <div>
      {/* Header */}
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Tabla de pagos</h2>
          <p className="secondary-text">
            Mostrando {Math.min(startIndex + 1, payments.length)}–{Math.min(endIndex, payments.length)} de {payments.length} registros
          </p>
        </div>
        <Icon icon="mdi:table-large" width={24} color="#6366f1" />
      </div>

      {/* Table */}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th><Icon icon="mdi:hash" width={14} /> ID</th>
              <th><Icon icon="mdi:account" width={14} /> Cliente</th>
              <th><Icon icon="mdi:school" width={14} /> Curso</th>
              <th><Icon icon="mdi:cash" width={14} /> Importe</th>
              <th><Icon icon="mdi:currency-usd" width={14} /> Moneda</th>
              <th><Icon icon="mdi:shield-check" width={14} /> Estado</th>
              <th><Icon icon="mdi:calendar-clock" width={14} /> Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <Icon icon="mdi:loading" width={20} className="spin" /> Cargando pagos...
                </td>
              </tr>
            ) : paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <Icon icon="mdi:magnify-remove-outline" width={24} />
                  <br />Sin resultados para los filtros actuales.
                </td>
              </tr>
            ) : (
              paginatedPayments.map((payment) => (
                <tr key={payment.id_pago}>
                  <td><span className="id-code">{payment.id_pago}</span></td>
                  <td>
                    <div className="client-cell">
                      <div className="avatar">{getInitials(payment.nombre)}</div>
                      <span>{payment.nombre}</span>
                    </div>
                  </td>
                  <td>{payment.curso}</td>
                  <td className="amount-cell">{formatCurrency(payment.importe, payment.moneda)}</td>
                  <td>
                    <span className="currency-badge">
                      <Icon icon="mdi:cash" width={12} />
                      {payment.moneda}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill status-${payment.estado}`}>
                      <Icon icon={payment.estado === 'completed' ? 'mdi:check-circle' : 'mdi:refresh-circle'} width={13} />
                      {payment.estado}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(payment.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <span className="page-info">Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong></span>
          <div className="page-buttons">
            <button className="page-btn" onClick={() => goPage(currentPage - 1)} disabled={currentPage <= 1} aria-label="Anterior">
              <Icon icon="mdi:chevron-left" width={18} />
            </button>
            {pageNumbers.map((n, i) =>
              n === '...'
                ? <button key={`ellipsis-${i}`} className="page-btn" disabled>…</button>
                : <button key={n} className={`page-btn ${n === currentPage ? 'active' : ''}`} onClick={() => goPage(n as number)}>{n}</button>
            )}
            <button className="page-btn" onClick={() => goPage(currentPage + 1)} disabled={currentPage >= totalPages} aria-label="Siguiente">
              <Icon icon="mdi:chevron-right" width={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}