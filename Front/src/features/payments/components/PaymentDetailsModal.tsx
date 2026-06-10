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
  const [isExporting, setIsExporting] = useState(false);

  if (!payment) return null;

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: '#0f172a', // match dark theme
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
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
        </div>
      )}
    </AnimatePresence>
  );
}
