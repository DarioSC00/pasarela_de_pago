-- ============================================================
-- FormaPro Academy — Esquema Supabase
-- Prueba técnica n8n · Logali Group
-- ============================================================

-- Tabla principal de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id_pago   TEXT        PRIMARY KEY,               -- PK garantiza idempotencia a nivel BD
  email     TEXT        DEFAULT '',
  nombre    TEXT        NOT NULL,
  curso     TEXT        NOT NULL,
  importe   NUMERIC     NOT NULL,
  moneda    TEXT        NOT NULL,
  estado    TEXT        NOT NULL CHECK (estado IN ('completed', 'refunded')),
  fecha     TIMESTAMPTZ NOT NULL,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas frecuentes por email
CREATE INDEX IF NOT EXISTS idx_pagos_email ON pagos (email);

-- Índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos (estado);

-- ============================================================
-- TRIGGER DE SEGURIDAD (IDEMPOTENCIA DE ESTADO)
-- Evita que reintentos de red tardíos resuciten un pago reembolsado
-- ============================================================

CREATE OR REPLACE FUNCTION proteger_estado_pago()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el estado registrado ya es 'refunded', impedimos volver a 'completed'
  IF OLD.estado = 'refunded' AND NEW.estado = 'completed' THEN
    NEW.estado := 'refunded';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_proteger_estado_pago
  BEFORE UPDATE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION proteger_estado_pago();

-- ============================================================
-- TRIGGER DE UPSERT AUTOMÁTICO (SOLUCIÓN DE IDEMPOTENCIA BD)
-- Convierte el INSERT en UPDATE si el id_pago ya existe
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_pago_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el pago ya existe en la base de datos
  IF EXISTS (SELECT 1 FROM pagos WHERE id_pago = NEW.id_pago) THEN
    -- Realizamos un UPDATE sobre la fila existente
    UPDATE pagos 
    SET email = NEW.email,
        nombre = NEW.nombre,
        curso = NEW.curso,
        importe = NEW.importe,
        moneda = NEW.moneda,
        estado = NEW.estado,
        fecha = NEW.fecha
    WHERE id_pago = NEW.id_pago;
    
    -- Retornamos NULL para cancelar el INSERT silenciosamente sin arrojar error
    RETURN NULL;
  END IF;
  
  -- Si no existe, permitimos el INSERT normal
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_upsert_pago
  BEFORE INSERT ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION upsert_pago_trigger();

-- Comentarios de columnas
COMMENT ON TABLE pagos IS 'Pagos completados de FormaPro Academy';
COMMENT ON COLUMN pagos.id_pago   IS 'Identificador único del pago (PK). Garantiza idempotencia.';
COMMENT ON COLUMN pagos.email     IS 'Email normalizado del cliente (lowercase, trim)';
COMMENT ON COLUMN pagos.nombre    IS 'Nombre del cliente (trim)';
COMMENT ON COLUMN pagos.curso     IS 'Nombre del curso adquirido';
COMMENT ON COLUMN pagos.importe   IS 'Importe numérico del pago (normalizado desde string si viene así)';
COMMENT ON COLUMN pagos.moneda    IS 'Código de moneda en mayúsculas (COP, USD, EUR...)';
COMMENT ON COLUMN pagos.estado    IS 'Estado actual: completed o refunded';
COMMENT ON COLUMN pagos.fecha     IS 'Fecha y hora del pago en UTC';
COMMENT ON COLUMN pagos.creado_en IS 'Timestamp de inserción en esta base de datos';
