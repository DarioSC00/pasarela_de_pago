'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, AlertCircle, RefreshCw, Sparkles, Send, TrendingUp, Zap, Shield, BarChart3, Globe, Trash2, X, MessageCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useRef, useCallback } from 'react';
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

// ── AI Chat Modal Component ──
function AiChatModal({ isOpen, onClose, payments, convertedRevenue, displayCurrency, refundRate }: { isOpen: boolean; onClose: () => void; payments: { estado: string; curso: string; moneda: string; importe: number }[]; convertedRevenue: number; displayCurrency: string; refundRate: number }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string; color: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasInit, setHasInit] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const topCourse = useMemo(() => {
    const map: Record<string, number> = {};
    payments.filter(p => p.estado === 'completed').forEach(p => { map[p.curso] = (map[p.curso] ?? 0) + 1; });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? 'N/A';
  }, [payments]);

  const courseRanking = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    payments.filter(p => p.estado === 'completed').forEach(p => {
      const cur = map[p.curso] ?? { count: 0, revenue: 0 };
      cur.count += 1; cur.revenue += p.importe;
      map[p.curso] = cur;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  }, [payments]);

  const completedCount = payments.filter(p => p.estado === 'completed').length;
  const refundedCount = payments.filter(p => p.estado === 'refunded').length;
  const currencies = [...new Set(payments.map(p => p.moneda))];
  const avgTicket = completedCount > 0 ? payments.filter(p => p.estado === 'completed').reduce((s, p) => s + p.importe, 0) / completedCount : 0;

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // Generate welcome messages when opened
  useEffect(() => {
    if (!isOpen || hasInit || payments.length === 0) return;
    setHasInit(true);
    const welcome: typeof messages = [
      { role: 'ai', text: `👋 ¡Hola! Soy tu asistente de pagos FormaPro AI. He analizado ${payments.length} transacciones en tiempo real.`, color: '#818cf8' },
    ];
    if (completedCount > 0) {
      welcome.push({ role: 'ai', text: `📊 Resumen rápido: ${completedCount} pagos completados, ${refundedCount} reembolsos. Tasa de éxito: ${((completedCount / payments.length) * 100).toFixed(0)}%. Tu curso estrella es "${topCourse}".`, color: '#34d399' });
    }
    if (refundRate > 15) {
      welcome.push({ role: 'ai', text: `⚠️ Alerta: La tasa de reembolso (${refundRate.toFixed(1)}%) está por encima del promedio. Recomiendo investigar los cursos con más devoluciones.`, color: '#fb7185' });
    }
    welcome.push({ role: 'ai', text: '💡 Puedes preguntarme sobre: ingresos, cursos, reembolsos, monedas, ticket promedio, rendimiento, resumen, tendencias, predicciones, o cualquier otra consulta.', color: '#22d3ee' });
    setMessages(welcome);
  }, [isOpen, hasInit, payments.length, completedCount, refundedCount, topCourse, refundRate]);

  const clearChat = useCallback(() => {
    setMessages([{ role: 'ai', text: '🧹 Chat limpiado. ¿En qué te puedo ayudar?', color: '#818cf8' }]);
  }, []);

  const handleSend = () => {
    if (!query.trim() || isTyping) return;
    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg, color: '#64748b' }]);
    setQuery('');
    setIsTyping(true);

    setTimeout(() => {
      let response = '';
      const q = userMsg.toLowerCase();

      if (q.includes('ingreso') || q.includes('revenue') || q.includes('ganancia') || q.includes('ventas') || q.includes('factur')) {
        const completedRevStr = formatCurrency(convertedRevenue, displayCurrency);
        response = `💰 Ingresos totales (${displayCurrency}): ${completedRevStr}\n\nDesglose por moneda: ${currencies.map(c => `${c}: ${payments.filter(p => p.moneda === c && p.estado === 'completed').length} pagos`).join(' · ')}\n\nBasado en la velocidad de ventas actual, proyectamos un crecimiento del 12-18% para el próximo período.`;
      } else if (q.includes('curso') || q.includes('popular') || q.includes('mejor') || q.includes('ranking') || q.includes('top')) {
        const rankList = courseRanking.map(([name, d], i) => `${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} ${name}: ${d.count} ventas`).join('\n');
        response = `🏆 Ranking de cursos:\n\n${rankList}\n\nRecomendación: Crea contenido complementario para "${topCourse}" y considera bundles con los cursos más bajos del ranking.`;
      } else if (q.includes('reembolso') || q.includes('refund') || q.includes('devolución') || q.includes('cancel')) {
        const riskCourses = new Map<string, number>();
        payments.filter(p => p.estado === 'refunded').forEach(p => riskCourses.set(p.curso, (riskCourses.get(p.curso) ?? 0) + 1));
        const topRisk = [...riskCourses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
        response = `📋 Análisis de reembolsos:\n\n• Total: ${refundedCount} reembolsos (${refundRate.toFixed(1)}% del total)\n• Benchmark industria: 8-12%\n• Estado: ${refundRate > 12 ? '⚠️ Por encima del promedio' : '✅ Dentro del rango saludable'}\n\n${topRisk.length ? 'Cursos con más reembolsos: ' + topRisk.map(([n, c]) => `${n} (${c})`).join(', ') : 'No hay cursos de riesgo identificados.'}\n\nRecomendación: ${refundRate > 10 ? 'Revisa las descripciones y previews de los cursos problemáticos.' : 'Mantén la calidad actual, todo se ve bien.'}`;
      } else if (q.includes('moneda') || q.includes('divisa') || q.includes('currency') || q.includes('internacional')) {
        const currDetail = currencies.map(c => {
          const count = payments.filter(p => p.moneda === c).length;
          return `${c}: ${count} transacciones (${((count / payments.length) * 100).toFixed(0)}%)`;
        });
        response = `💱 Análisis de divisas:\n\n${currDetail.join('\n')}\n\nTotal: ${currencies.length} monedas activas\n\n${currencies.length > 1 ? '🌍 Tu operación es internacional. Usa el convertidor de divisas para comparar todo en ' + displayCurrency + '.' : '📍 Operas en una sola moneda. Considera expandir a mercados internacionales.'}`;
      } else if (q.includes('ticket') || q.includes('promedio') || q.includes('precio') || q.includes('media') || q.includes('average')) {
        response = `🎟️ Análisis de ticket promedio:\n\n• Ticket medio: ${avgTicket.toFixed(2)} (moneda nativa promedio)\n• Pagos completados: ${completedCount}\n\nRecomendación: ${avgTicket > 50 ? 'Tu ticket promedio es alto, lo cual indica un producto premium. Mantén la propuesta de valor.' : 'Considera ofrecer paquetes o upsells para aumentar el ticket promedio.'}`;
      } else if (q.includes('resumen') || q.includes('dashboard') || q.includes('general') || q.includes('estado') || q.includes('summary')) {
        response = `📊 Resumen ejecutivo del dashboard:\n\n• Total transacciones: ${payments.length}\n• Completadas: ${completedCount} (${((completedCount / payments.length) * 100).toFixed(0)}%)\n• Reembolsos: ${refundedCount} (${refundRate.toFixed(1)}%)\n• Ingresos: ${formatCurrency(convertedRevenue, displayCurrency)}\n• Ticket promedio: ${avgTicket.toFixed(2)}\n• Monedas activas: ${currencies.join(', ')}\n• Curso top: ${topCourse}\n\nSalud general: ${refundRate < 10 ? '🟢 Excelente' : refundRate < 20 ? '🟡 Buena, con áreas de mejora' : '🔴 Necesita atención'}`;
      } else if (q.includes('tendencia') || q.includes('trend') || q.includes('predicción') || q.includes('futuro') || q.includes('proyección')) {
        response = `📈 Análisis de tendencias:\n\n• Velocidad actual: ~${(completedCount / 7).toFixed(1)} ventas/día\n• Proyección mensual: ~${Math.round(completedCount / 7 * 30)} transacciones\n• Proyección de ingresos: ${formatCurrency(convertedRevenue * 4.3, displayCurrency)} (mensual estimado)\n\nTendencia: ${completedCount > refundedCount * 5 ? '📈 Alcista — tu ratio es muy positivo.' : '📉 Revisa los reembolsos para mejorar la tendencia.'}`;
      } else if (q.includes('ayuda') || q.includes('help') || q.includes('qué puedes') || q.includes('que puedes') || q.includes('hola') || q.includes('opciones')) {
        response = `🤖 ¡Hola! Puedo ayudarte con:\n\n• 💰 "ingresos" — Análisis de ventas y revenue\n• 🏆 "cursos" — Ranking y rendimiento por curso\n• 📋 "reembolsos" — Análisis de devoluciones\n• 💱 "monedas" — Desglose por divisas\n• 🎟️ "ticket promedio" — Análisis de precios\n• 📊 "resumen" — Resumen ejecutivo completo\n• 📈 "tendencias" — Proyecciones y predicciones\n\n¡Escribe cualquier pregunta y haré mi mejor análisis!`;
      } else {
        response = `🤖 He analizado tu consulta "${userMsg}". Aquí va un resumen rápido de tus datos:\n\n• ${payments.length} pagos totales (${completedCount} completados, ${refundedCount} reembolsados)\n• Ingresos: ${formatCurrency(convertedRevenue, displayCurrency)}\n• Curso estrella: "${topCourse}"\n• Monedas: ${currencies.join(', ')}\n\n💡 Prueba preguntar algo más específico: "ingresos", "cursos", "reembolsos", "tendencias", "resumen" o "ayuda".`;
      }
      setMessages(prev => [...prev, { role: 'ai', text: response, color: '#818cf8' }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" style={{ zIndex: 60 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="ai-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="ai-avatar">
              <Sparkles size={22} color="#fff" />
            </div>
            <div>
              <div className="ai-title">FormaPro AI</div>
              <div className="ai-subtitle">Asistente inteligente · {payments.length} transacciones analizadas</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ai-action-btn" onClick={clearChat} title="Limpiar chat">
              <Trash2 size={16} />
            </button>
            <button className="ai-action-btn" onClick={onClose} title="Cerrar">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-messages" ref={scrollRef}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={`${i}-${msg.text.slice(0,10)}`} className={`ai-msg ${msg.role === 'user' ? 'ai-msg-user' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <div className="ai-msg-dot" style={{ background: msg.color, boxShadow: `0 0 8px ${msg.color}60` }} />
                <div className="ai-msg-text">
                  <div className="ai-msg-label" style={{ color: msg.role === 'ai' ? msg.color : '#94a3b8' }}>{msg.role === 'ai' ? 'FormaPro AI' : 'Tú'}</div>
                  {msg.text.split('\n').map((line, j) => <span key={j}>{line}<br/></span>)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div className="ai-msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="ai-msg-dot" style={{ background: '#818cf8', animation: 'pulse-dot 1s infinite' }} />
              <div className="ai-msg-text" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                <span className="typing-dots">Analizando datos</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="ai-input-row">
          <input className="ai-input" placeholder="Escribe: ingresos, cursos, reembolsos, resumen, ayuda..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} autoFocus />
          <button className="ai-send-btn" onClick={handleSend} disabled={isTyping} aria-label="Enviar">
            <Send size={18} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PaymentsDashboard() {
  const {
    payments, loading, error, searchTerm, setSearchTerm, statusFilter, setStatusFilter, currencyFilter, setCurrencyFilter, availableCurrencies, paymentsCount, refundCount, exportCsv,
  } = usePayments();

  const [displayCurrency, setDisplayCurrency] = useState('COP');
  const [isAiOpen, setIsAiOpen] = useState(false);
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

      {/* ── AI Modal ── */}
      <AnimatePresence>
        <AiChatModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} payments={payments} convertedRevenue={convertedRevenue} displayCurrency={displayCurrency} refundRate={refundRate} />
      </AnimatePresence>

      {/* ── AI Floating Button ── */}
      <motion.button className="ai-fab" onClick={() => setIsAiOpen(true)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} title="Abrir asistente IA">
        <Sparkles size={24} />
      </motion.button>

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