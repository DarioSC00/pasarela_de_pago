'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchPayments } from '@/features/payments/services/paymentsService';
import type { Payment } from '@/lib/types';

type CurrencySummary = {
  totalRevenue: number;
  completedCount: number;
  refundCount: number;
};

type StatusFilter = 'all' | 'completed' | 'refunded';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchPayments();
        setPayments(data);
      } catch (err) {
        setError((err as Error)?.message ?? 'Error al cargar pagos');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const availableCurrencies = useMemo(() => {
    return Array.from(new Set(payments.map((payment) => payment.moneda.toUpperCase()))).sort();
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch = [
        payment.id_pago,
        payment.nombre,
        payment.email,
        payment.curso,
        payment.moneda,
        payment.estado,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);

      const matchesStatus = statusFilter === 'all' || payment.estado === statusFilter;
      const matchesCurrency = currencyFilter === 'all' || payment.moneda.toUpperCase() === currencyFilter;

      return matchesSearch && matchesStatus && matchesCurrency;
    });
  }, [payments, searchTerm, statusFilter, currencyFilter]);

  const summaryByCurrency = useMemo(() => {
    return filteredPayments.reduce<Record<string, CurrencySummary>>((summary, payment) => {
      const currency = payment.moneda.toUpperCase();
      const current = summary[currency] ?? { totalRevenue: 0, completedCount: 0, refundCount: 0 };
      current.totalRevenue += payment.estado === 'completed' ? payment.importe : 0;
      if (payment.estado === 'completed') {
        current.completedCount += 1;
      }
      if (payment.estado === 'refunded') {
        current.refundCount += 1;
      }
      summary[currency] = current;
      return summary;
    }, {});
  }, [filteredPayments]);

  const totalRevenue = useMemo(
    () => Object.values(summaryByCurrency).reduce((total, item) => total + item.totalRevenue, 0),
    [summaryByCurrency]
  );

  const refundCount = useMemo(
    () => filteredPayments.filter((payment) => payment.estado === 'refunded').length,
    [filteredPayments]
  );

  const paymentsCount = filteredPayments.length;

  const averageTicketByCurrency = useMemo(() => {
    return Object.entries(summaryByCurrency).reduce<Record<string, number>>((acc, [currency, item]) => {
      acc[currency] = item.completedCount > 0 ? item.totalRevenue / item.completedCount : 0;
      return acc;
    }, {});
  }, [summaryByCurrency]);

  const exportCsv = () => {
    const header = ['id_pago', 'email', 'nombre', 'curso', 'importe', 'moneda', 'estado', 'fecha'];
    const rows = filteredPayments.map((payment) => [
      payment.id_pago,
      payment.email,
      payment.nombre,
      payment.curso,
      payment.importe.toString(),
      payment.moneda,
      payment.estado,
      payment.fecha,
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pagos_exportados.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    payments: filteredPayments,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currencyFilter,
    setCurrencyFilter,
    availableCurrencies,
    summaryByCurrency,
    totalRevenue,
    paymentsCount,
    refundCount,
    averageTicketByCurrency,
    exportCsv,
  };
}
