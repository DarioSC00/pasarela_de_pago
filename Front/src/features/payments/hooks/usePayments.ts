'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchPayments, insertPayment } from '@/features/payments/services/paymentsService';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { Payment } from '@/lib/types';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

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
        const msg = (err as Error)?.message ?? 'Error al cargar pagos';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Supabase Real-time Subscription
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('pagos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pagos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPayment = {
              ...(payload.new as Payment),
              importe: Number(payload.new.importe),
              moneda: payload.new.moneda.toUpperCase(),
            };
            setPayments((prev) => {
              // Evitar duplicados si ya lo agregamos localmente
              if (prev.some((p) => p.id_pago === newPayment.id_pago)) return prev;
              const updated = [newPayment, ...prev];
              return updated.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            });
            toast.info(`Nuevo pago recibido: ${newPayment.nombre}`, { icon: '🚀', theme: 'dark' });
          } else if (payload.eventType === 'UPDATE') {
            const updatedPayment = {
              ...(payload.new as Payment),
              importe: Number(payload.new.importe),
              moneda: payload.new.moneda.toUpperCase(),
            };
            setPayments((prev) => prev.map((p) => p.id_pago === updatedPayment.id_pago ? updatedPayment : p));
          } else if (payload.eventType === 'DELETE') {
            setPayments((prev) => prev.filter((p) => p.id_pago !== payload.old.id_pago));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const exportExcel = () => {
    try {
      const dataForExport = filteredPayments.map((p) => ({
        'ID Pago': p.id_pago,
        'Cliente': p.nombre,
        'Email': p.email || 'N/A',
        'Curso': p.curso,
        'Importe': Number(p.importe),
        'Moneda': p.moneda,
        'Estado': p.estado === 'completed' ? 'Completado' : 'Reembolsado',
        'Fecha': new Date(p.fecha).toLocaleString('es-CO'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pagos');
      
      // Auto-size columns roughly
      const colWidths = [
        { wch: 20 }, // ID Pago
        { wch: 25 }, // Cliente
        { wch: 30 }, // Email
        { wch: 35 }, // Curso
        { wch: 15 }, // Importe
        { wch: 10 }, // Moneda
        { wch: 15 }, // Estado
        { wch: 25 }, // Fecha
      ];
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, 'Reporte_Pagos_FormaPro.xlsx');
      toast.success('¡Reporte exportado correctamente en Excel!');
    } catch (err) {
      toast.error('Ocurrió un error al exportar el archivo');
    }
  };

  const addPayment = async (paymentData: Partial<Payment>) => {
    try {
      const newPayment = await insertPayment(paymentData);
      setPayments((prev) => [newPayment, ...prev]);
      toast.success('¡Pago creado y sincronizado con éxito!');
      return newPayment;
    } catch (err) {
      const msg = (err as Error)?.message ?? 'Error al crear pago';
      setError(msg);
      toast.error(msg);
      throw err;
    }
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
    exportExcel,
    addPayment,
  };
}
