import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export function PaymentDetailsModal({ isOpen, onClose, payment }: PaymentDetailsModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!payment) return null;

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        windowWidth: 800,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Recibo_${payment.id_pago}.pdf`);
      toast.success('Recibo descargado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop">
          <motion.div
            className="modal-card details-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div ref={contentRef} style={{ padding: '16px', borderRadius: '16px', background: 'transparent' }}>
              <div className="modal-header">
                <div>
                  <h2>Detalle de Transacción</h2>
                  <p className="secondary-text id-badge">ID: {payment.id_pago}</p>
                </div>
                <button onClick={onClose} className="icon-button" aria-label="Cerrar modal">
                  <Icon icon="mdi:close" width={24} />
                </button>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-icon"><Icon icon="mdi:account" width={20} /></div>
                  <div className="detail-content">
                    <span className="detail-label">Cliente</span>
                    <span className="detail-value">{payment.nombre}</span>
                    <span className="detail-subtext">{payment.email}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon"><Icon icon="mdi:school" width={20} /></div>
                  <div className="detail-content">
                    <span className="detail-label">Curso</span>
                    <span className="detail-value">{payment.curso}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon"><Icon icon="mdi:calendar-clock" width={20} /></div>
                  <div className="detail-content">
                    <span className="detail-label">Fecha y Hora</span>
                    <span className="detail-value">
                      {new Date(payment.fecha).toLocaleDateString('es-CO', { 
                        day: 'numeric', month: 'long', year: 'numeric' 
                      })}
                    </span>
                    <span className="detail-subtext">
                      {new Date(payment.fecha).toLocaleTimeString('es-CO', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="details-amount-card">
                <div className="amount-info">
                  <span className="amount-label">Importe Total</span>
                  <span className="amount-value">{formatCurrency(payment.importe, payment.moneda)}</span>
                </div>
                <div className="status-info">
                  <span className={`status-pill status-${payment.estado} large-pill`}>
                    <Icon icon={payment.estado === 'completed' ? 'mdi:check-circle' : 'mdi:refresh-circle'} width={18} />
                    {payment.estado === 'completed' ? 'Completado' : 'Reembolsado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="details-footer" style={{ display: 'flex', gap: '12px' }}>
               <button onClick={handleDownloadPDF} disabled={isExporting} className="hero-button hero-button-primary full-width" style={{ flex: 1, justifyContent: 'center' }}>
                 {isExporting ? <Icon icon="mdi:loading" className="spin" width={20} /> : <Icon icon="mdi:download" width={20} />}
                 {isExporting ? 'Generando...' : 'Descargar Recibo'}
               </button>
               <button onClick={onClose} className="hero-button hero-button-secondary full-width" style={{ flex: 1, justifyContent: 'center', marginTop: 0 }}>
                 Cerrar
                </button>
            </div>
          </motion.div>

          {/* Off-screen beautiful receipt for PDF */}
          <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -100, opacity: 0, pointerEvents: 'none' }}>
            <div ref={receiptRef} style={{ width: '800px', padding: '60px', background: '#ffffff', color: '#1e293b', fontFamily: 'Inter, sans-serif' }}>
              <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '32px', color: '#6366f1', fontWeight: 800 }}>FormaPro</h1>
                  <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#64748b' }}>Recibo de Pago Oficial</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>ID: {payment.id_pago}</p>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{new Date(payment.fecha).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', margin: '0 0 8px', fontWeight: 700 }}>Facturado a</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>{payment.nombre}</p>
                  <p style={{ color: '#64748b', margin: 0 }}>{payment.email}</p>
                </div>
                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', margin: '0 0 8px', fontWeight: 700 }}>Detalles del Curso</p>
                  <p style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>{payment.curso}</p>
                  <p style={{ color: payment.estado === 'completed' ? '#059669' : '#e11d48', margin: 0, fontWeight: 600 }}>Estado: {payment.estado === 'completed' ? 'Completado' : 'Reembolsado'}</p>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', color: 'white', padding: '30px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(99,102,241,0.2)' }}>
                <span style={{ fontSize: '18px', fontWeight: 600 }}>Importe Total Pagado</span>
                <span style={{ fontSize: '36px', fontWeight: 800 }}>{formatCurrency(payment.importe, payment.moneda)}</span>
              </div>

              <div style={{ marginTop: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                <p style={{ margin: 0 }}>Este es un recibo generado automáticamente por FormaPro Payments.</p>
                <p style={{ margin: '4px 0 0' }}>Gracias por tu compra.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
