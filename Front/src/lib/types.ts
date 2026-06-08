export type Payment = {
  id_pago: string;
  email: string;
  nombre: string;
  curso: string;
  importe: number;
  moneda: string;
  estado: 'completed' | 'refunded';
  fecha: string;
};
