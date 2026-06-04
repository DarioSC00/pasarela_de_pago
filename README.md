# FormaPro Academy — Prueba Técnica n8n · Logali Group

Flujo de automatización que recibe pagos vía webhook, los guarda en Supabase de forma idempotente, maneja reembolsos y envía emails de bienvenida en HTML.

---

## 📁 Archivos incluidos

| Archivo | Descripción |
|---------|-------------|
| `formapro_workflow.json` | Flujo n8n listo para importar |
| `supabase_schema.sql` | Script SQL para crear la tabla `pagos` |
| `email_template.html` | Plantilla de correo HTML de bienvenida (diseño premium y responsivo) |
| `README.md` | Esta guía |

---

## 🚀 Pasos de configuración

### 1. Supabase — Crear la tabla

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. En el **SQL Editor** ejecuta el contenido de `supabase_schema.sql`
3. Anota estos dos valores (Settings → API):
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon key**

### 2. n8n — Importar el flujo

1. Ve a [n8n.io](https://n8n.io) → inicia sesión
2. Crea un nuevo workflow → menú `···` → **Import from file**
3. Selecciona `formapro_workflow.json`

### 3. n8n — Configurar credenciales

#### Supabase
- **Settings → Credentials → New → Supabase**
- Completa con tu **Project URL** y **anon key**
- Asígnala a los nodos: *Supabase — Guardar Pago* y *Supabase — Marcar Refunded*

#### Gmail
- **Settings → Credentials → New → Gmail OAuth2**
- Autoriza con tu cuenta de Google
- Asígnala al nodo *Gmail — Email Bienvenida HTML*

> **Alternativa SMTP gratuita:** Reemplaza el nodo Gmail por **Send Email** + credenciales de [Mailtrap](https://mailtrap.io) (gratis para pruebas).

### 4. Activar y obtener la URL

1. Activa el toggle **Active** del flujo
2. Copia la **Webhook URL** del nodo *Webhook — Recibir Pago*
   - Formato: `https://tu-instancia.n8n.io/webhook/formapro-pagos`

---

## 🧪 Pruebas — Enviar los 9 pagos de ejemplo

Copia este script en tu terminal (bash/Git Bash). Reemplaza `TU_WEBHOOK_URL`:

```bash
WEBHOOK="TU_WEBHOOK_URL"

curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d '{"id_pago":"PAY-001","email":"ana@gmail.com","nombre":"Ana Ruiz","curso":"Excel Avanzado","importe":120000,"moneda":"COP","estado":"completed","fecha":"2026-05-20T10:00:00Z"}' &

curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d '{"id_pago":"PAY-002","email":"luis@gmail.com","nombre":"Luis Gomez","curso":"Python","importe":45,"moneda":"USD","estado":"failed","fecha":"2026-05-20T11:00:00Z"}' &

curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d '{"id_pago":"PAY-003","email":"marta@gmail.com","nombre":"Marta Diaz","curso":"Marketing Digital","importe":80000,"moneda":"COP","estado":"completed","fecha":"2026-05-20T12:00:00Z"}' &

curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d '{"id_pago":"PAY-001","email":"ana@gmail.com","nombre":"Ana Ruiz","curso":"Excel Avanzado","importe":120000,"moneda":"COP","estado":"completed","fecha":"2026-05-20T10:00:05Z"}' &

curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d '{"id_pago":"PAY-004","email":"","nombre":"Carlos Perez","curso":"SQL","importe":60000,"moneda":"COP","estado":"completed","fecha":"2026-05-20T13:00:00Z"}' &

curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d '{"id_pago":"PAY-005","email":"  ANA.Lopez@GMAIL.com ","nombre":"Ana Lopez","curso":"Power BI","importe":90000,"moneda":"cop","estado":"completed","fecha":"2026-05-20T14:00:00Z"}' &

curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d '{"id_pago":"PAY-006","email":"diego@gmail.com","nombre":"Diego Mora","curso":"Java","importe":"75000","moneda":"COP","estado":"completed","fecha":"2026-05-20T15:00:00Z"}' &

curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d '{"id_pago":"PAY-003","email":"marta@gmail.com","nombre":"Marta Diaz","curso":"Marketing Digital","importe":80000,"moneda":"COP","estado":"refunded","fecha":"2026-05-20T16:00:00Z"}' &

curl -s -X POST "$WEBHOOK" -H "Content-Type: application/json" \
  -d '{"id_pago":"PAY-007","email":"juan@gmail.com","nombre":"Juan Rios","curso":"Excel Avanzado","importe":120000,"moneda":"COP","estado":"completed","fecha":"2026-05-20T17:00:00Z"}' &

wait && echo "✅ Todos los pagos enviados"
```

---

## ✅ Resultado esperado en Supabase (6 filas)

| id_pago | nombre | curso | importe | moneda | estado | email |
|---------|--------|-------|---------|--------|--------|-------|
| PAY-001 | Ana Ruiz | Excel Avanzado | 120000 | COP | completed | ana@gmail.com |
| PAY-003 | Marta Diaz | Marketing Digital | 80000 | COP | **refunded** | marta@gmail.com |
| PAY-004 | Carlos Perez | SQL | 60000 | COP | completed | *(vacío)* |
| PAY-005 | Ana Lopez | Power BI | 90000 | COP | completed | ana.lopez@gmail.com |
| PAY-006 | Diego Mora | Java | 75000 | COP | completed | diego@gmail.com |
| PAY-007 | Juan Rios | Excel Avanzado | 120000 | COP | completed | juan@gmail.com |

### Pagos que NO generan nueva fila

| Pago | Razón |
|------|-------|
| PAY-002 | Estado `failed` → descartado en el Switch |
| PAY-001 (2.ª vez) | Duplicado → `UPSERT ON CONFLICT DO NOTHING` |
| PAY-003 (2.ª vez) | Estado `refunded` → solo actualiza fila existente |

---

## 🏗️ Decisiones de diseño

### Idempotencia a dos niveles
1. **Base de datos:** `id_pago` es `PRIMARY KEY`. El `UPSERT` con `ON CONFLICT` es atómico y thread-safe. 100 peticiones duplicadas simultáneas → siempre 1 sola fila.
2. **Flujo n8n:** El Switch descarta `failed` antes de tocar la BD, y `refunded` va a `UPDATE` (nunca `INSERT`).

### Respuesta inmediata al cliente
El nodo **Respond to Webhook** corre en paralelo gracias a `responseMode: responseNode`. El cliente recibe `{ "ok": true }` en milisegundos sin esperar a Supabase ni al email.

### Normalización centralizada
Un único nodo **Code** limpia todos los datos antes de cualquier otra operación:

| Campo | Transformación |
|-------|---------------|
| `email` | `trim()` + `toLowerCase()` → `"  ANA.Lopez@GMAIL.com "` → `"ana.lopez@gmail.com"` |
| `moneda` | `trim()` + `toUpperCase()` → `"cop"` → `"COP"` |
| `importe` | `parseFloat(String(...).replace(/[^0-9.]/g, ''))` → `"75000"` → `75000` |
| `id_pago` | `trim()` + `toUpperCase()` |
| `fecha` | `new Date().toISOString()` → normaliza a UTC |

### Flujo del email
Solo reciben email: pagos `completed` + campo `email` no vacío.

| Pago | Email |
|------|-------|
| PAY-001 | ✅ ana@gmail.com |
| PAY-003 | ✅ marta@gmail.com (al momento de completarse) |
| PAY-004 | ❌ Email vacío |
| PAY-005 | ✅ ana.lopez@gmail.com (normalizado) |
| PAY-006 | ✅ diego@gmail.com |
| PAY-007 | ✅ juan@gmail.com |

---

*Prueba técnica para Logali Group · Mayo 2026*
