import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import type { Payment } from '@/lib/types';

type PaymentFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Payment>) => Promise<any>;
};

export function PaymentFormModal({ isOpen, onClose, onSubmit }: PaymentFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    id_pago: string;
    nombre: string;
    curso: string;
    importe: string;
    moneda: string;
    estado: 'completed' | 'refunded';
    email: string;
  }>({
    id_pago: '',
    nombre: '',
    curso: '',
    importe: '',
    moneda: 'USD',
    estado: 'completed',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.id_pago || !formData.nombre || !formData.curso || !formData.importe || !formData.moneda || !formData.estado) {
        throw new Error('Por favor, completa todos los campos requeridos.');
      }

      await onSubmit({
        id_pago: formData.id_pago.trim(),
        nombre: formData.nombre.trim(),
        curso: formData.curso.trim(),
        importe: Number(formData.importe),
        moneda: formData.moneda.toUpperCase(),
        estado: formData.estado,
        email: formData.email.trim() || undefined,
        fecha: new Date().toISOString(), // UTC format
      });

      // Reset & close
      setFormData({ id_pago: '', nombre: '', curso: '', importe: '', moneda: 'USD', estado: 'completed', email: '' });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el pago');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={onClose} style={{ zIndex: 70 }}>
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="modal-card" onClick={(e) => e.stopPropagation()} style={{ width: 500 }}>
          <div className="modal-header">
            <div>
              <h2><Icon icon="mdi:plus-circle-multiple" width={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Nuevo Pago</h2>
              <p className="card-sub">Añade un registro de pago manualmente</p>
            </div>
            <button className="icon-button" onClick={onClose} disabled={loading}>
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div className="error-bar" style={{ padding: '10px 14px', marginBottom: 0 }}>
                <AlertCircle width={18} /> {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="filter-group">
                <label>ID Pago *</label>
                <div className="search-wrap" style={{ padding: '8px 12px' }}>
                  <input name="id_pago" placeholder="ej. PI_12345" value={formData.id_pago} onChange={handleChange} required />
                </div>
              </div>

              <div className="filter-group">
                <label>Estado *</label>
                <select name="estado" value={formData.estado} onChange={handleChange} required>
                  <option value="completed">Completado</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label>Nombre del Cliente *</label>
              <div className="search-wrap" style={{ padding: '8px 12px' }}>
                <input name="nombre" placeholder="Nombre completo" value={formData.nombre} onChange={handleChange} required />
              </div>
            </div>

            <div className="filter-group">
              <label>Email (Opcional)</label>
              <div className="search-wrap" style={{ padding: '8px 12px' }}>
                <input name="email" type="email" placeholder="cliente@correo.com" value={formData.email} onChange={handleChange} />
              </div>
            </div>

            <div className="filter-group">
              <label>Curso Adquirido *</label>
              <div className="search-wrap" style={{ padding: '8px 12px' }}>
                <input name="curso" placeholder="Nombre del curso" value={formData.curso} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="filter-group">
                <label>Importe *</label>
                <div className="search-wrap" style={{ padding: '8px 12px' }}>
                  <input name="importe" type="number" step="0.01" min="0" placeholder="0.00" value={formData.importe} onChange={handleChange} required />
                </div>
              </div>

              <div className="filter-group">
                <label>Moneda *</label>
                <select name="moneda" value={formData.moneda} onChange={handleChange} required>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="COP">COP</option>
                  <option value="MXN">MXN</option>
                  <option value="ARS">ARS</option>
                  <option value="CLP">CLP</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <button type="button" className="hero-button hero-button-ghost" onClick={onClose} disabled={loading} style={{ padding: '10px 16px' }}>
                Cancelar
              </button>
              <button type="submit" className="hero-button hero-button-primary" disabled={loading} style={{ padding: '10px 20px' }}>
                {loading ? <span className="spin"><Icon icon="mdi:loading" width={18} /></span> : <><Plus size={18} /> Guardar Pago</>}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
