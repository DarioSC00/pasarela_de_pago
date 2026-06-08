'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Icon } from '@iconify/react';
import { PaymentsChart } from '@/features/payments/components/PaymentsChart';
import { PaymentsTablePaginated } from '@/features/payments/components/PaymentsTablePaginated';
import { PaymentsTrendChart } from '@/features/payments/components/PaymentsTrendChart';
import { PaymentsDonutChart } from '@/features/payments/components/PaymentsDonutChart';
import { PaymentsCourseRanking } from '@/features/payments/components/PaymentsCourseRanking';
import { PaymentsRecentActivity } from '@/features/payments/components/PaymentsRecentActivity';
import { usePayments } from '@/features/payments/hooks/usePayments';
import { formatCurrency } from '@/lib/format';
import { HeroBadge } from '@/lib/ui/HeroBadge';
import { HeroButton } from '@/lib/ui/HeroButton';
import { HeroCard } from '@/lib/ui/HeroCard';
import { convertAmount, fetchExchangeRates, supportedCurrencies } from '@/lib/currency';
import { getDashboardInsight } from '@/lib/insights';

function KpiCard({
  title,
  value,
  delta,
  deltaUp,
  icon,
  accentColor,
  iconBg,
}: {
  title: string;
  value: string;
  delta: string;
  deltaUp: boolean;
  icon: string;
  accentColor: string;
  iconBg: string;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-accent" style={{ background: accentColor }} />
      <div className="kpi-icon" style={{ background: iconBg, color: accentColor }}>
        <Icon icon={icon} width={18} />
      </div>
      <p className="kpi-label">{title}</p>
      <p className="kpi-value">{value}</p>
      <p className={`kpi-delta ${deltaUp ? 'delta-up' : 'delta-down'}`}>
        <Icon icon={deltaUp ? 'mdi:trending-up' : 'mdi:trending-down'} width={13} />
        {delta}
      </p>
    </div>
  );
}

export function PaymentsDashboard() {
  const {
    payments,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currencyFilter,
    setCurrencyFilter,
    availableCurrencies,
    paymentsCount,
    refundCount,
    exportCsv,
  } = usePayments();

  const [displayCurrency, setDisplayCurrency] = useState('COP');
  const [isConversionOpen, setIsConversionOpen] = useState(false);
  const [conversionCurrency, setConversionCurrency] = useState('USD');
  const [selectedConversionId, setSelectedConversionId] = useState('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const selectedConversionPayment = payments.find((p) => p.id_pago === selectedConversionId);

  const conversionResult = selectedConversionPayment
    ? convertAmount(selectedConversionPayment.importe, selectedConversionPayment.moneda, conversionCurrency, exchangeRates)
    : 0;

  useEffect(() => {
    let active = true;
    const loadRates = async () => {
      try {
        const rates = await fetchExchangeRates('USD');
        if (!active) return;
        setExchangeRates(rates);
        setRatesUpdatedAt(new Date().toLocaleString());
        setRatesError(null);
      } catch {
        if (!active) return;
        setRatesError('No se pudo actualizar tasas en línea, usando valores locales.');
      }
    };
    loadRates();
    return () => { active = false; };
  }, []);

  const convertedRevenue = useMemo(
    () =>
      payments.reduce((total, p) => {
        if (p.estado !== 'completed') return total;
        return total + convertAmount(p.importe, p.moneda, displayCurrency, exchangeRates);
      }, 0),
    [payments, displayCurrency, exchangeRates]
  );

  const totalAverage = useMemo(() => {
    const completed = payments.filter((p) => p.estado === 'completed');
    if (!completed.length) return 0;
    return (
      completed.reduce((sum, p) => sum + convertAmount(p.importe, p.moneda, displayCurrency, exchangeRates), 0) /
      completed.length
    );
  }, [payments, displayCurrency, exchangeRates]);

  const refundRate = paymentsCount > 0 ? (refundCount / paymentsCount) * 100 : 0;

  const insight = getDashboardInsight(payments, displayCurrency, convertedRevenue);

  return (
    <main className="dash-container">
      {/* ── Header ── */}
      <section className="dash-header">
        <div>
          <HeroBadge variant="success">
            <span className="dot-live" />
            En vivo
          </HeroBadge>
          <h1 className="dash-title">Dashboard de pagos</h1>
          <p className="dash-sub">Ingresos · Tendencias · Análisis por moneda</p>
        </div>
        <div className="dash-actions">
          <HeroButton variant="secondary" icon={<Icon icon="mdi:swap-horizontal" width={20} />} onClick={() => { setSelectedConversionId(payments[0]?.id_pago ?? ''); setIsConversionOpen(true); }}>
            Conversión
          </HeroButton>
          <HeroButton variant="primary" icon={<ArrowDownTrayIcon width={20} />} onClick={exportCsv}>
            Exportar CSV
          </HeroButton>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <section className="kpi-grid">
        <KpiCard title="Ingresos totales" value={formatCurrency(convertedRevenue, displayCurrency)} delta="+12.4% vs mes anterior" deltaUp icon="mdi:cash-multiple" accentColor="#6366f1" iconBg="rgba(99,102,241,0.1)" />
        <KpiCard title="Pagos totales" value={loading ? '—' : paymentsCount.toString()} delta="+3 hoy" deltaUp icon="mdi:clipboard-list" accentColor="#22d3ee" iconBg="rgba(34,211,238,0.1)" />
        <KpiCard title="Completados" value={loading ? '—' : (paymentsCount - refundCount).toString()} delta={`${paymentsCount ? (((paymentsCount - refundCount) / paymentsCount) * 100).toFixed(0) : 0}% conversión`} deltaUp icon="mdi:check-circle" accentColor="#10b981" iconBg="rgba(16,185,129,0.1)" />
        <KpiCard title="Reembolsos" value={loading ? '—' : refundCount.toString()} delta={`${refundRate.toFixed(1)}% tasa`} deltaUp={false} icon="mdi:receipt" accentColor="#f43f5e" iconBg="rgba(244,63,94,0.1)" />
        <KpiCard title="Ticket medio" value={formatCurrency(totalAverage, displayCurrency)} delta="+5.2%" deltaUp icon="mdi:ticket" accentColor="#f59e0b" iconBg="rgba(245,158,11,0.1)" />
      </section>

      {/* ── Insight ── */}
      <div className="insight-banner">
        <div className="insight-icon">
          <Icon icon="mdi:brain" width={20} color="#6366f1" />
        </div>
        <div>
          <p className="insight-title">Insight de IA</p>
          <p className="insight-text">{insight.message}</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <section className="filters-row">
        <div className="filter-group">
          <label htmlFor="f-status">Estado</label>
          <select id="f-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'refunded')}>
            <option value="all">Todos</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="f-currency">Moneda origen</label>
          <select id="f-currency" value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)}>
            <option value="all">Todas</option>
            {availableCurrencies.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="f-display">Moneda reporte</label>
          <select id="f-display" value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)}>
            {supportedCurrencies.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="f-search">Buscar</label>
          <div className="search-wrap">
            <Icon icon="mdi:magnify" width={16} color="#94a3b8" />
            <input id="f-search" type="search" placeholder="Nombre, curso, estado..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </section>

      <p className="rates-note">
        {exchangeRates ? `✓ Tasas actualizadas: ${ratesUpdatedAt}` : ratesError ?? 'Usando tasas locales de referencia.'}
      </p>

      {/* ── Charts row 1 ── */}
      <section className="charts-main">
        <HeroCard title="Tendencia diaria" className="chart-wide" topRight={<span className="chip chip-blue"><Icon icon="mdi:chart-line" width={12} /> Trend</span>}>
          <p className="card-sub">Últimos 7 días · completed vs refunded</p>
          <PaymentsTrendChart payments={payments} />
        </HeroCard>
        <HeroCard title="Estado" topRight={<span className="chip chip-pink"><Icon icon="mdi:chart-donut" width={12} /> Mix</span>}>
          <p className="card-sub">Distribución por estado</p>
          <PaymentsDonutChart payments={payments} />
        </HeroCard>
      </section>

      {/* ── Charts row 2 ── */}
      <section className="charts-secondary">
        <HeroCard title="Ingresos por moneda" topRight={<span className="chip chip-teal"><Icon icon="mdi:chart-bar" width={12} /></span>}>
          <p className="card-sub">Completed — en moneda nativa</p>
          <PaymentsChart payments={payments} />
        </HeroCard>
        <HeroCard title="Top cursos" topRight={<span className="chip chip-green"><Icon icon="mdi:school" width={12} /></span>}>
          <p className="card-sub">Pagos completados por curso</p>
          <PaymentsCourseRanking payments={payments} />
        </HeroCard>
        <HeroCard title="Actividad reciente" topRight={<span className="chip chip-amber"><Icon icon="mdi:lightning-bolt" width={12} /></span>}>
          <p className="card-sub">Últimas transacciones</p>
          <PaymentsRecentActivity payments={payments} />
        </HeroCard>
      </section>

      {/* ── Error ── */}
      {error && (
        <div className="error-bar">
          <ExclamationCircleIcon width={18} /> {error}
        </div>
      )}

      {/* ── Table ── */}
      <section className="table-section">
        <PaymentsTablePaginated payments={payments} loading={loading} />
      </section>

      {/* ── Conversion Modal ── */}
      {isConversionOpen && (
        <div className="modal-backdrop" onClick={() => setIsConversionOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Conversión de divisa</h2>
                <p className="card-sub">Convierte el importe de cualquier pago</p>
              </div>
              <button className="icon-button" onClick={() => setIsConversionOpen(false)}>
                <Icon icon="mdi:close" width={20} />
              </button>
            </div>
            <div className="modal-fields">
              <div className="filter-group">
                <label htmlFor="conv-payment">Venta</label>
                <select id="conv-payment" value={selectedConversionId} onChange={(e) => setSelectedConversionId(e.target.value)}>
                  {payments.map((p) => (<option key={p.id_pago} value={p.id_pago}>{p.id_pago} — {p.nombre} — {p.curso}</option>))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="conv-currency">Moneda destino</label>
                <select id="conv-currency" value={conversionCurrency} onChange={(e) => setConversionCurrency(e.target.value)}>
                  {supportedCurrencies.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
            </div>
            <div className="conversion-result">
              <div>
                <span className="result-label">Original</span>
                <strong>{selectedConversionPayment ? `${formatCurrency(selectedConversionPayment.importe, selectedConversionPayment.moneda)} (${selectedConversionPayment.moneda})` : '—'}</strong>
              </div>
              <div>
                <span className="result-label">Convertido</span>
                <strong className="result-accent">{selectedConversionPayment ? `${formatCurrency(conversionResult, conversionCurrency)} (${conversionCurrency})` : '—'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}