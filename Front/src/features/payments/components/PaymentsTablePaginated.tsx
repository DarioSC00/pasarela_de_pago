'use client';

import type { Payment } from '@/lib/types';
import { Icon } from '@iconify/react';
import { formatCurrency } from '@/lib/format';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PaymentDetailsModal } from './PaymentDetailsModal';

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
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Reset to page 1 if items per page changes or payments change
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, payments]);

  const { totalPages, paginatedPayments, startIndex, endIndex } = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(payments.length / itemsPerPage));
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return { totalPages, paginatedPayments: payments.slice(start, end), startIndex: start, endIndex: end };
  }, [payments, currentPage, itemsPerPage]);

  const goPage = (n: number) => {
    if (n < 1 || n > totalPages) return;
    setCurrentPage(n);
  };

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      {/* Header */}
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Registro de Pagos</h2>
          <p className="secondary-text">
            Mostrando {Math.min(startIndex + 1, payments.length)}–{Math.min(endIndex, payments.length)} de {payments.length} transacciones
          </p>
        </div>
        <div style={{ padding: '8px', background: 'rgba(99,102,241,0.1)', borderRadius: '10px' }}>
          <Icon icon="mdi:table-large" width={24} color="#818cf8" />
        </div>
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
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={7} className="table-empty">
                    <Icon icon="mdi:loading" width={20} className="spin" /> Cargando pagos...
                  </td>
                </motion.tr>
              ) : paginatedPayments.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <td colSpan={7} className="table-empty">
                    <Icon icon="mdi:magnify-remove-outline" width={32} style={{ marginBottom: '12px', color: '#818cf8' }} />
                    <br />Sin resultados para los filtros actuales.
                  </td>
                </motion.tr>
              ) : (
                paginatedPayments.map((payment, index) => (
                  <motion.tr 
                    key={payment.id_pago}
                    onClick={() => setSelectedPayment(payment)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
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
                        <Icon icon="mdi:cash" width={14} color="#34d399" />
                        {payment.moneda}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${payment.estado}`}>
                        <Icon icon={payment.estado === 'completed' ? 'mdi:check-circle' : 'mdi:refresh-circle'} width={14} />
                        {payment.estado === 'completed' ? 'Completado' : 'Reembolsado'}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(payment.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-bar">
        <div className="page-size-selector">
          <span>Filas por página:</span>
          <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={8}>8</option>
            <option value={15}>15</option>
            <option value={30}>30</option>
          </select>
        </div>
        
        <div className="page-controls">
          <span className="page-info">Página <strong>{currentPage}</strong> de <strong>{totalPages || 1}</strong></span>
          <div className="page-buttons">
            <button className="page-btn" onClick={() => goPage(currentPage - 1)} disabled={currentPage <= 1} aria-label="Anterior">
              <Icon icon="mdi:chevron-left" width={20} />
            </button>
            {pageNumbers.map((n, i) =>
              n === '...'
                ? <button key={`ellipsis-${i}`} className="page-btn" disabled>…</button>
                : <button key={n} className={`page-btn ${n === currentPage ? 'active' : ''}`} onClick={() => goPage(n as number)}>{n}</button>
            )}
            <button className="page-btn" onClick={() => goPage(currentPage + 1)} disabled={currentPage >= totalPages} aria-label="Siguiente">
              <Icon icon="mdi:chevron-right" width={20} />
            </button>
          </div>
        </div>
      </div>

      <PaymentDetailsModal 
        isOpen={!!selectedPayment} 
        onClose={() => setSelectedPayment(null)} 
        payment={selectedPayment} 
      />
    </motion.div>
  );
}