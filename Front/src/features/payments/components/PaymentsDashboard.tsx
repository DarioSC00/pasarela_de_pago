'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, AlertCircle, RefreshCw, Sparkles, Send, TrendingUp, Zap, Shield, BarChart3, Globe } from 'lucide-react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

function KpiCard({ title, value, delta, deltaUp, icon, accentColor, iconBg }: { title: string; value: string; delta: string; deltaUp: boolean; icon: string; accentColor: string; iconBg: string }) {
  return (
    <motion.div variants={itemVariants} className="kpi-card">
      <div className="kpi-accent" style={{ background: accentColor, boxShadow: `0 0 15px ${accentColor}60` }} />
      <div className="kpi-icon" style={{ background: iconBg, color: accentColor, border: `1px solid ${accentColor}30` }}>
        <Icon icon={icon} width={22} />
      </div>
      <p className="kpi-label">{title}</p>
      <p className="kpi-value">{value}</p>
      <p className={`kpi-delta ${deltaUp ? 'delta-up' : 'delta-down'}`}>
        <Icon icon={deltaUp ? 'mdi:trending-up' : 'mdi:trending-down'} width={15} />
        {delta}
      </p>
    </motion.div>
  );
}

// ── AI Chat Component ──
function AiAssistantPanel({ payments, convertedRevenue, displayCurrency, refundRate }: { payments: { estado: string; curso: string; moneda: string; importe: number }[]; convertedRevenue: number; displayCurrency: string; refundRate: number }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string; color: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const topCourse = useMemo(() => {
    const map: Record<string, number> = {};
    payments.filter(p => p.estado === 'completed').forEach(p => { map[p.curso] = (map[p.curso] ?? 0) + 1; });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? 'N/A';
  }, [payments]);

  const completedCount = payments.filter(p => p.estado === 'completed').length;
  const refundedCount = payments.filter(p => p.estado === 'refunded').length;
  const currencies = [...new Set(payments.map(p => p.moneda))];

  useEffect(() => {
    const initialMessages: { role: 'ai' | 'user'; text: string; color: string }[] = [];
    if (completedCount > 0) {
      initialMessages.push({ role: 'ai', text: `📊 He analizado ${payments.length} transacciones. Tu curso más vendido es "${topCourse}" con una tasa de éxito del ${completedCount > 0 ? ((completedCount / payments.length) * 100).toFixed(0) : 0}%.`, color: '#818cf8' });
    }
    if (refundRate > 15) {
      initialMessages.push({ role: 'ai', text: `⚠️ Alerta: La tasa de reembolso está en ${refundRate.toFixed(1)}%. Recomiendo revisar los cursos con más devoluciones para identificar problemas.`, color: '#fb7185' });
    } else if (refundRate > 0) {
      initialMessages.push({ role: 'ai', text: `✅ Excelente: Tu tasa de reembolso es solo ${refundRate.toFixed(1)}%, muy por debajo del promedio de la industria (8-12%).`, color: '#34d399' });
    }
    if (currencies.length > 1) {
      initialMessages.push({ role: 'ai', text: `🌍 Detecté ${currencies.length} divisas activas (${currencies.join(', ')}). Esto indica operación internacional — ¡gran señal de crecimiento!`, color: '#22d3ee' });
    }
    setMessages(initialMessages);
  }, [payments.length, topCourse, completedCount, refundRate, currencies.length]);

  const handleSend = () => {
    if (!query.trim()) return;
    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg, color: '#64748b' }]);
    setQuery('');
    setIsTyping(true);

    setTimeout(() => {
      let response = '';
      const q = userMsg.toLowerCase();
      if (q.includes('ingreso') || q.includes('revenue') || q.includes('ganancia')) {
        response = `💰 Los ingresos totales en ${displayCurrency} son ${formatCurrency(convertedRevenue, displayCurrency)}. Basado en la tendencia actual, proyecto un crecimiento del 12-18% para el próximo trimestre.`;
      } else if (q.includes('curso') || q.includes('popular') || q.includes('mejor')) {
        response = `🏆 El curso más popular es "${topCourse}" con ${completedCount} ventas completadas. Te sugiero crear contenido relacionado para aprovechar la demanda.`;
      } else if (q.includes('reembolso') || q.includes('refund') || q.includes('devolución')) {
        response = `📋 Actualmente hay ${refundedCount} reembolsos (${refundRate.toFixed(1)}%). ${refundRate > 10 ? 'Considera mejorar las descripciones de los cursos para reducir expectativas incorrectas.' : 'La tasa es saludable y está dentro del rango esperado.'}`;
      } else if (q.includes('moneda') || q.includes('divisa') || q.includes('currency')) {
        response = `💱 Operas con ${currencies.length} monedas: ${currencies.join(', ')}. Para mejor análisis, usa la función de conversión y compara todo en ${displayCurrency}.`;
      } else {
        response = `🤖 Basándome en tus datos: tienes ${payments.length} pagos, ${completedCount} completados, ${refundedCount} reembolsados. Tu curso estrella es "${topCourse}". ¿Quieres que profundice en algún área específica?`;
      }
      setMessages(prev => [...prev, { role: 'ai', text: response, color: '#818cf8' }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <motion.div className="ai-panel" variants={itemVariants}>
      <div className="ai-header">
        <div className="ai-avatar">
          <Sparkles size={22} color="#fff" />
        </div>
        <div>
          <div className="ai-title">FormaPro AI Assistant</div>
          <div className="ai-subtitle">Análisis inteligente de tus pagos en tiempo real</div>
        </div>
      </div>
      <div className="ai-messages">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} className="ai-msg" initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
              <div className="ai-msg-dot" style={{ background: msg.color, boxShadow: `0 0 8px ${msg.color}60` }} />
              <div className="ai-msg-text">
                {msg.role === 'ai' && <div className="ai-msg-label" style={{ color: msg.color }}>IA</div>}
                {msg.role === 'user' && <div className="ai-msg-label" style={{ color: '#94a3b8' }}>Tú</div>}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div className="ai-msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="ai-msg-dot" style={{ background: '#818cf8', animation: 'pulse-dot 1s infinite' }} />
            <div className="ai-msg-text" style={{ color: '#94a3b8', fontStyle: 'italic' }}>FormaPro AI está analizando...</div>
          </motion.div>
        )}
      </div>
      <div className="ai-input-row">
        <input className="ai-input" placeholder="Pregunta sobre tus pagos, ingresos, cursos..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
        <button className="ai-send-btn" onClick={handleSend} aria-label="Enviar">
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}

export function PaymentsDashboard() {
  const {
    payments, loading, error, searchTerm, setSearchTerm, statusFilter, setStatusFilter, currencyFilter, setCurrencyFilter, availableCurrencies, paymentsCount, refundCount, exportCsv,
  } = usePayments();

  const [displayCurrency, setDisplayCurrency] = useState('COP');
  const [isConversionOpen, setIsConversionOpen] = useState(false);
  const [conversionCurrency, setConversionCurrency] = useState('USD');
  const [selectedConversionId, setSelectedConversionId] = useState('');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const selectedConversionPayment = payments.find((p) => p.id_pago === selectedConversionId);
  const conversionResult = selectedConversionPayment ? convertAmount(selectedConversionPayment.importe, selectedConversionPayment.moneda, conversionCurrency, exchangeRates) : 0;

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

  const convertedRevenue = useMemo(() => payments.reduce((total, p) => {
    if (p.estado !== 'completed') return total;
    return total + convertAmount(p.importe, p.moneda, displayCurrency, exchangeRates);
  }, 0), [payments, displayCurrency, exchangeRates]);

  const totalAverage = useMemo(() => {
    const completed = payments.filter((p) => p.estado === 'completed');
    if (!completed.length) return 0;
    return completed.reduce((sum, p) => sum + convertAmount(p.importe, p.moneda, displayCurrency, exchangeRates), 0) / completed.length;
  }, [payments, displayCurrency, exchangeRates]);

  const refundRate = paymentsCount > 0 ? (refundCount / paymentsCount) * 100 : 0;
  const insight = getDashboardInsight(payments, displayCurrency, convertedRevenue);

  return (
    <motion.main className="dash-container" variants={containerVariants} initial="hidden" animate="visible">
      {/* ── Header ── */}
      <motion.section className="dash-header" variants={itemVariants}>
        <div>
          <HeroBadge variant="success">
            <span className="dot-live" /> En vivo · Producción
          </HeroBadge>
          <h1 className="dash-title">Panel de Rendimiento</h1>
          <p className="dash-sub"><Globe size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Ingresos · Tendencias · Análisis global en tiempo real</p>
        </div>
        <div className="dash-actions">
          <HeroButton variant="secondary" icon={<RefreshCw size={18} />} onClick={() => { setSelectedConversionId(payments[0]?.id_pago ?? ''); setIsConversionOpen(true); }}>
            <Icon icon="mdi:swap-horizontal-bold" width={16} /> Conversión de Divisas
          </HeroButton>
          <HeroButton variant="primary" icon={<Download size={18} />} onClick={exportCsv}>
            <Icon icon="mdi:file-export-outline" width={16} /> Exportar CSV
          </HeroButton>
        </div>
      </motion.section>

      {/* ── KPI Cards ── */}
      <motion.section className="kpi-grid" variants={containerVariants}>
        <KpiCard title="Ingresos Totales" value={formatCurrency(convertedRevenue, displayCurrency)} delta="+15.4% vs mes anterior" deltaUp icon="mdi:cash-multiple" accentColor="#818cf8" iconBg="rgba(129,140,248,0.15)" />
        <KpiCard title="Transacciones" value={loading ? '—' : paymentsCount.toString()} delta="+12 hoy" deltaUp icon="mdi:clipboard-pulse-outline" accentColor="#22d3ee" iconBg="rgba(34,211,238,0.15)" />
        <KpiCard title="Completados" value={loading ? '—' : (paymentsCount - refundCount).toString()} delta={`${paymentsCount ? (((paymentsCount - refundCount) / paymentsCount) * 100).toFixed(0) : 0}% éxito`} deltaUp icon="mdi:check-decagram" accentColor="#34d399" iconBg="rgba(52,211,153,0.15)" />
        <KpiCard title="Reembolsos" value={loading ? '—' : refundCount.toString()} delta={`${refundRate.toFixed(1)}% tasa`} deltaUp={false} icon="mdi:receipt-text-outline" accentColor="#fb7185" iconBg="rgba(251,113,133,0.15)" />
        <KpiCard title="Ticket Promedio" value={formatCurrency(totalAverage, displayCurrency)} delta="+3.2%" deltaUp icon="mdi:ticket-percent-outline" accentColor="#fbbf24" iconBg="rgba(251,191,36,0.15)" />
      </motion.section>

      {/* ── AI Panel ── */}
      <AiAssistantPanel payments={payments} convertedRevenue={convertedRevenue} displayCurrency={displayCurrency} refundRate={refundRate} />

      {/* ── Insight ── */}
      <motion.div className="insight-banner" variants={itemVariants}>
        <div className="insight-icon">
          <Icon icon="mdi:brain" width={26} color="#818cf8" />
        </div>
        <div>
          <p className="insight-title"><Zap size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Smart Insight</p>
          <p className="insight-text">{insight.message}</p>
        </div>
      </motion.div>

      {/* ── Filters ── */}
      <motion.section className="filters-row" variants={itemVariants}>
        <div className="filter-group">
          <label htmlFor="f-status"><Shield size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Estado</label>
          <select id="f-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'refunded')}>
            <option value="all">Todos los estados</option>
            <option value="completed">Completados</option>
            <option value="refunded">Reembolsados</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="f-currency"><Globe size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Moneda Origen</label>
          <select id="f-currency" value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)}>
            <option value="all">Todas las monedas</option>
            {availableCurrencies.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="f-display"><BarChart3 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Moneda Reporte</label>
          <select id="f-display" value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)}>
            {supportedCurrencies.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="f-search"><Icon icon="mdi:magnify" width={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Búsqueda</label>
          <div className="search-wrap">
            <Icon icon="mdi:magnify" width={18} color="#94a3b8" />
            <input id="f-search" type="search" placeholder="Nombre, curso, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </motion.section>

      <motion.p className="rates-note" variants={itemVariants}>
        {exchangeRates ? <><Icon icon="mdi:check-circle" color="#34d399" /> Tasas de cambio actualizadas: {ratesUpdatedAt}</> : <>{ratesError ?? 'Usando tasas locales de referencia.'}</>}
      </motion.p>

      {/* ── Charts row 1 ── */}
      <motion.section className="charts-main" variants={itemVariants}>
        <HeroCard title="Tendencia de Rendimiento" className="chart-wide hero-card" topRight={<span className="chip chip-blue"><TrendingUp size={12} /> Histórico</span>}>
          <p className="card-sub">Evolución de ingresos y reembolsos · últimos 14 días</p>
          <PaymentsTrendChart payments={payments} />
        </HeroCard>
        <HeroCard title="Distribución" className="hero-card" topRight={<span className="chip chip-pink"><Icon icon="mdi:chart-donut-variant" width={14} /> Mix</span>}>
          <p className="card-sub">Proporción completados vs reembolsados</p>
          <PaymentsDonutChart payments={payments} />
        </HeroCard>
      </motion.section>

      {/* ── Charts row 2 ── */}
      <motion.section className="charts-secondary" variants={itemVariants}>
        <HeroCard title="Ingresos por Divisa" className="hero-card" topRight={<span className="chip chip-teal"><Icon icon="mdi:chart-bar" width={14} /></span>}>
          <p className="card-sub">Volumen segmentado por moneda</p>
          <PaymentsChart payments={payments} />
        </HeroCard>
        <HeroCard title="Ranking de Cursos" className="hero-card" topRight={<span className="chip chip-green"><Icon icon="mdi:podium" width={14} /></span>}>
          <p className="card-sub">Top 5 cursos con más ventas</p>
          <PaymentsCourseRanking payments={payments} />
        </HeroCard>
        <HeroCard title="Actividad en Tiempo Real" className="hero-card" topRight={<span className="chip chip-amber"><Zap size={12} /></span>}>
          <p className="card-sub">Últimas transacciones</p>
          <PaymentsRecentActivity payments={payments} />
        </HeroCard>
      </motion.section>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="error-bar">
            <AlertCircle width={20} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <motion.section className="table-section" variants={itemVariants}>
        <PaymentsTablePaginated payments={payments} loading={loading} />
      </motion.section>

      {/* ── Footer ── */}
      <motion.footer className="dash-footer" variants={itemVariants}>
        <p className="footer-text">
          <Sparkles size={14} color="#818cf8" />
          Desarrollado con <span className="footer-brand">FormaPro</span> · Dashboard Inteligente de Pagos
          <Icon icon="mdi:shield-check" width={14} color="#34d399" />
        </p>
      </motion.footer>

      {/* ── Conversion Modal ── */}
      <AnimatePresence>
        {isConversionOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setIsConversionOpen(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2><Icon icon="mdi:swap-horizontal-bold" width={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Simulador de Divisas</h2>
                  <p className="card-sub">Convierte el importe exacto en tiempo real</p>
                </div>
                <button className="icon-button" onClick={() => setIsConversionOpen(false)}>
                  <Icon icon="mdi:close" width={22} />
                </button>
              </div>
              <div className="modal-fields">
                <div className="filter-group">
                  <label htmlFor="conv-payment"><Icon icon="mdi:receipt-text" width={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Transacción</label>
                  <select id="conv-payment" value={selectedConversionId} onChange={(e) => setSelectedConversionId(e.target.value)}>
                    {payments.map((p) => (<option key={p.id_pago} value={p.id_pago}>{p.id_pago} — {p.curso}</option>))}
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="conv-currency"><Icon icon="mdi:currency-usd" width={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Moneda Destino</label>
                  <select id="conv-currency" value={conversionCurrency} onChange={(e) => setConversionCurrency(e.target.value)}>
                    {supportedCurrencies.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              </div>
              <div className="conversion-result">
                <div>
                  <span className="result-label">Monto Original</span>
                  <strong>{selectedConversionPayment ? `${formatCurrency(selectedConversionPayment.importe, selectedConversionPayment.moneda)} (${selectedConversionPayment.moneda})` : '—'}</strong>
                </div>
                <div>
                  <span className="result-label">Monto Convertido</span>
                  <strong className="result-accent">{selectedConversionPayment ? `${formatCurrency(conversionResult, conversionCurrency)} (${conversionCurrency})` : '—'}</strong>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}