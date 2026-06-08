'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpRightIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Icon } from '@iconify/react';
import { PaymentsChart } from '@/features/payments/components/PaymentsChart';
import { PaymentsTable } from '@/features/payments/components/PaymentsTable';
import { usePayments } from '@/features/payments/hooks/usePayments';
import { formatCurrency } from '@/lib/format';
import { HeroBadge } from '@/lib/ui/HeroBadge';
import { HeroButton } from '@/lib/ui/HeroButton';
import { HeroCard } from '@/lib/ui/HeroCard';
import { convertAmount, fetchExchangeRates, supportedCurrencies } from '@/lib/currency';
import { getDashboardInsight } from '@/lib/insights';

function SummaryCard({ title, value, note, icon }: { title: string; value: string; note: string; icon: string }) {
  return (
    <HeroCard title={title} topRight={<Icon icon={icon} width="22" color="#38bdf8" />} className="stats-card">
      <p className="stat-value">{value}</p>
      <p className="secondary-text">{note}</p>
    </HeroCard>
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
    summaryByCurrency,
    totalRevenue,
    paymentsCount,
    refundCount,
    averageTicketByCurrency,
    exportCsv,
  } = usePayments();

  const [displayCurrency, setDisplayCurrency] = useState('COP');
  const [isConversionOpen, setIsConversionOpen] = useState(false);
  const [conversionCurrency, setConversionCurrency] = useState('USD');
  const [selectedConversionId, setSelectedConversionId] = useState('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const selectedConversionPayment = payments.find((payment) => payment.id_pago === selectedConversionId);

  const conversionResult = selectedConversionPayment
    ? convertAmount(
        selectedConversionPayment.importe,
        selectedConversionPayment.moneda,
        conversionCurrency,
        exchangeRates
      )
    : 0;

  const openConversionModal = () => {
    setSelectedConversionId(payments[0]?.id_pago ?? '');
    setIsConversionOpen(true);
  };

  useEffect(() => {
    let active = true;

    const loadRates = async () => {
      try {
        const rates = await fetchExchangeRates('USD');
        if (!active) return;
        setExchangeRates(rates);
        setRatesUpdatedAt(new Date().toLocaleString());
        setRatesError(null);
      } catch (error) {
        if (!active) return;
        setRatesError('No se pudo actualizar tasas en línea, usando valores locales.');
      }
    };

    loadRates();

    return () => {
      active = false;
    };
  }, []);

  const convertedPayments = useMemo(
    () =>
      payments.map((payment) => ({
        ...payment,
        importe: convertAmount(payment.importe, payment.moneda, displayCurrency, exchangeRates),
        moneda: displayCurrency,
      })),
    [payments, displayCurrency, exchangeRates]
  );

  const convertedRevenue = useMemo(
    () =>
      payments.reduce((total, payment) => {
        if (payment.estado !== 'completed') {
          return total;
        }
        return total + convertAmount(payment.importe, payment.moneda, displayCurrency, exchangeRates);
      }, 0),
    [payments, displayCurrency, exchangeRates]
  );

  const totalAverage = useMemo(() => {
    const completedPayments = payments.filter((payment) => payment.estado === 'completed');
    if (!completedPayments.length) return 0;
    return (
      completedPayments.reduce(
        (sum, payment) => sum + convertAmount(payment.importe, payment.moneda, displayCurrency, exchangeRates),
        0
      ) / completedPayments.length
    );
  }, [payments, displayCurrency, exchangeRates]);

  const revenueSummary = Object.entries(summaryByCurrency).map(([currency, summary]) => {
    return `${formatCurrency(summary.totalRevenue, currency)} (${currency})`;
  });

  const averageSummary = Object.entries(averageTicketByCurrency).map(([currency, average]) => {
    return `${formatCurrency(average, currency)} avg/${currency}`;
  });

  const insight = getDashboardInsight(payments, displayCurrency, convertedRevenue);

  return (
    <main className="container">
      <section className="page-header">
        <div>
          <HeroBadge variant="success">
            <ArrowUpRightIcon width={20} height={20} /> Dashboard
          </HeroBadge>
          <h1 className="page-title">Dashboard de pagos</h1>
          <p className="page-copy">
            Conecta tu tabla `pagos` de Supabase y revisa ingresos, reembolsos, ticket medio, búsqueda y exportación.
          </p>
        </div>

        <div className="controls">
          <HeroButton variant="secondary" icon={<Icon icon="mdi:swap-horizontal" width="20" />} onClick={openConversionModal}>
            Conversión
          </HeroButton>
          <HeroButton variant="primary" icon={<ArrowDownTrayIcon width={20} height={20} />} onClick={exportCsv}>
            Exportar CSV
          </HeroButton>
        </div>
      </section>

      <section className="grid-3 stats-grid">
        <SummaryCard
          title="Ingresos totales"
          value={formatCurrency(convertedRevenue, displayCurrency)}
          note={`Total completed convertido a ${displayCurrency}`}
          icon="mdi:cash-multiple"
        />
        <SummaryCard
          title="Pagos totales"
          value={loading ? 'Cargando...' : paymentsCount.toString()}
          note="Filtrados por búsqueda y filtros activos"
          icon="mdi:clipboard-list"
        />
        <SummaryCard
          title="Reembolsos"
          value={loading ? 'Cargando...' : refundCount.toString()}
          note="Total de pagos con estado refunded"
          icon="mdi:refund"
        />
      </section>

      <section className="grid-2" style={{ marginTop: '1rem' }}>
        <HeroCard title="Filtros activos" topRight={<Icon icon="mdi:filter-variant" width="22" color="#a5b4fc" />}>
          <p className="secondary-text">Aplica filtros y selecciona la moneda de reporte.</p>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label className="secondary-text" htmlFor="status-filter">
                Estado
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'completed' | 'refunded')}
              >
                <option value="all">Todos</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label className="secondary-text" htmlFor="currency-filter">
                Moneda
              </label>
              <select
                id="currency-filter"
                value={currencyFilter}
                onChange={(event) => setCurrencyFilter(event.target.value)}
              >
                <option value="all">Todas</option>
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <label className="secondary-text" htmlFor="display-currency">
                Moneda de reporte
              </label>
              <select
                id="display-currency"
                value={displayCurrency}
                onChange={(event) => setDisplayCurrency(event.target.value)}
              >
                {supportedCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group search-field">
            <label htmlFor="search" className="secondary-text">
              Buscar pagos
            </label>
            <div className="search-control">
              <Icon icon="mdi:magnify" width="18" color="#94a3b8" />
              <input
                id="search"
                type="search"
                placeholder="Ej. ana, COP, refunded"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <p className="footer-note">
              {exchangeRates
                ? `Tasas actualizadas en línea ${ratesUpdatedAt}`
                : ratesError ?? 'Usando tasas locales de referencia.'}
            </p>
          </div>
        </HeroCard>

        <HeroCard title="Ticket medio" topRight={<Icon icon="mdi:robot-happy" width="20" color="#8b5cf6" />}>
          <p className="secondary-text">Media de pagos completed por moneda de reporte.</p>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div className="secondary-text">
              {formatCurrency(totalAverage, displayCurrency)} avg/{displayCurrency}
            </div>
            {averageSummary.length > 0 ? (
              averageSummary.map((item) => (
                <div key={item} className="secondary-text">
                  {item}
                </div>
              ))
            ) : null}
          </div>
          <p className="footer-note">
            Al no tener una sola moneda, puedes ver la conversión de reporte según la tasa interna.
          </p>
        </HeroCard>
      </section>

      <section className="grid-2" style={{ marginTop: '1rem' }}>
        <HeroCard title="Insight de IA" topRight={<Icon icon="mdi:brain" width="20" color="#38bdf8" />}>
          <p className="secondary-text">Estas recomendaciones se generan con una pequeña lógica de IA heurística.</p>
          <p style={{ marginTop: '0.75rem', fontWeight: 700, color: insight.variant === 'danger' ? '#fb7185' : '#a5f3fc' }}>
            {insight.message}
          </p>
        </HeroCard>
      </section>

      {isConversionOpen ? (
        <div className="modal-backdrop" onClick={() => setIsConversionOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Conversión de ventas</h2>
                <p className="secondary-text">Selecciona una venta y convierte su importe a otra moneda.</p>
              </div>
              <button className="icon-button" onClick={() => setIsConversionOpen(false)}>
                <Icon icon="mdi:close" width="20" />
              </button>
            </div>

            <div className="modal-grid">
              <div className="modal-field">
                <label htmlFor="conversion-payment">Venta</label>
                <select
                  id="conversion-payment"
                  value={selectedConversionId}
                  onChange={(event) => setSelectedConversionId(event.target.value)}
                >
                  {payments.map((payment) => (
                    <option key={payment.id_pago} value={payment.id_pago}>
                      {payment.id_pago} - {payment.nombre} - {payment.curso}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label htmlFor="conversion-currency">Moneda objetivo</label>
                <select
                  id="conversion-currency"
                  value={conversionCurrency}
                  onChange={(event) => setConversionCurrency(event.target.value)}
                >
                  {supportedCurrencies.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="conversion-result">
              <div>
                <span className="result-label">Importe original</span>
                <strong>
                  {selectedConversionPayment
                    ? `${formatCurrency(selectedConversionPayment.importe, selectedConversionPayment.moneda)} (${selectedConversionPayment.moneda})`
                    : 'Seleccione una venta'}
                </strong>
              </div>
              <div>
                <span className="result-label">Importe convertido</span>
                <strong>{selectedConversionPayment ? `${formatCurrency(conversionResult, conversionCurrency)} (${conversionCurrency})` : '-'}</strong>
              </div>
            </div>

            <p className="footer-note">
              Esta conversión solo es una vista de la venta actual para comparar monedas.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="card dashboard-panel" style={{ marginTop: '1.5rem' }}>
          <p className="secondary-text">Error: {error}</p>
        </div>
      ) : null}

      <section className="chart-grid" style={{ marginTop: '1.75rem' }}>
        <div className="card chart-card">
          <div className="panel-header">
            <div>
              <h2 className="chart-title">Gráfico de pagos por moneda</h2>
              <p className="secondary-text">Comparación de pagos completed y refunded por cada moneda.</p>
            </div>
            <Icon icon="mdi:chart-bar" width="24" color="#38bdf8" />
          </div>
          <PaymentsChart payments={payments} />
        </div>

        <div className="card chart-card">
          <div className="panel-header">
            <div>
              <h2 className="chart-title">Resumen rápido</h2>
              <p className="secondary-text">Esta vista muestra los ingresos totales, cantidad de pagos y reembolsos.</p>
            </div>
          </div>
          <div className="bar-chart">
              <div className="chart-row">
              <span className="bar-label">Ingresos únicos</span>
              <span>{formatCurrency(convertedRevenue, displayCurrency)}</span>
            </div>
            <div className="chart-row">
              <span className="bar-label">Pagos</span>
              <span>{paymentsCount}</span>
            </div>
            <div className="chart-row">
              <span className="bar-label">Reembolsos</span>
              <span>{refundCount}</span>
            </div>
          </div>
          {refundCount > 0 ? (
            <p className="footer-note">
              <ExclamationCircleIcon width={18} height={18} /> Hay {refundCount} reembolso(s) registrados.
            </p>
          ) : null}
        </div>
      </section>

      <section className="card dashboard-panel" style={{ marginTop: '1.75rem' }}>
        <PaymentsTable payments={convertedPayments} loading={loading} />
      </section>
    </main>
  );
}
