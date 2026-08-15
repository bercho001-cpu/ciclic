# 📄 Documento de Requerimientos de Producto (PRD) — Ciclic

## 1. Visión y Propósito del Producto

**Ciclic** es una aplicación web diseñada para desarrolladores independientes, agencias de software y consultores de tecnología que necesitan estimar de forma precisa, modular y profesional el costo de desarrollo de proyectos Web y Mobile Apps, estructurar planes de pago por cuotas/hitos y llevar un control riguroso de sus ingresos y flujo de caja (Cash Flow).

El problema principal que resuelve es la **subestimación de costos**, la falta de consideración de imprevistos/impuestos, y la desorganización en el cobro escalonado de proyectos de software.

---

## 2. Arquetipos de Usuario (Personas)

1. **El Freelancer / Consultor Senior:**
   - *Necesidad:* Cotizar rápido con plantillas predefinidas (Auth, CRUD, Pagos, Notificaciones), calcular su valor hora real considerando impuestos y presentar una propuesta profesional con cuotas claras.
2. **El Líder de Agencia / Software Studio:**
   - *Necesidad:* Desglosar proyectos asignando diferentes tarifas por rol (Frontend Dev, Mobile Dev, UI/UX Designer, QA, DevOps), calcular márgenes de rentabilidad de la agencia y monitorear el flujo de ingresos mensual por cliente.
3. **El Emprendedor / Product Owner:**
   - *Necesidad:* Estimar el presupuesto requerido para construir un MVP (Web vs Mobile) y entender el costo desglojado por módulo para priorizar el roadmap.

---

## 3. Épicas y Requerimientos Funcionales

### Épica 1: Gestión de Tarifas y Roles (Rate Cards & Labor Economics)
- **RF-1.1:** Creación de catálogo de roles (ej: *Frontend Dev Senior*, *Mobile Flutter Specialist*, *Backend Node.js*, *UI/UX Designer*, *QA Tester*, *DevOps/Cloud Engineer*).
- **RF-1.2:** Configuración de costo por hora base por rol y precio de venta al cliente (incluyendo margen de agencia).
- **RF-1.3:** Soporte multimoneda (USD, EUR, ARS, MXN, etc.) con formato numérico localizado y tasa de conversión opcional.
- **RF-1.4:** Factores de ajuste de productividad y complejidad tecnológica (Multiplicador de dificultad: 1.0x estándar, 1.25x media, 1.5x alta complejidad).

### Épica 2: Desglose Modular de Proyectos (WBS & Estimation Engine)
- **RF-2.1:** Creación de proyectos tipificados: *Web Application*, *Mobile App (iOS / Android / Cross-platform)*, *Fullstack Web + Mobile*, *API & Backend*, *MVP Rápido*.
- **RF-2.2:** Creación de Módulos (ej: *Autenticación y Seguridad*, *Pasarela de Pagos*, *Chat en Tiempo Real*, *Panel Administrativo*, *Notificaciones Push*, *Geolocalización*).
- **RF-2.3:** Desglose de tareas por funcionalidad dentro de cada módulo asignando:
  - Rol responsable.
  - Estimación de tiempo: Modo directo (Horas fijas) o Modo PERT estadístico:
    $$\text{Horas Estimadas} = \frac{\text{Optimista} + 4 \times \text{Más Probable} + \text{Pesimista}}{6}$$
- **RF-2.4:** Biblioteca de Módulos Reutilizables (Plantillas de módulos comunes con horas pre-calculadas para acelerar cotizaciones).

### Épica 3: Motor de Cálculo Financiero y Presupuestación
- **RF-3.1 (Costo Base de Mano de Obra):** Sumatoria de $\sum (\text{Horas por Tarea} \times \text{Tarifa del Rol})$.
- **RF-3.2 (Costos Fijos y de Terceros):** Inclusión de licencias, cuentas de desarrollador (Apple Developer $99/año, Google Play $25), servidores (AWS/Vercel), APIs de pago (OpenAI, Twilio, SendGrid).
- **RF-3.3 (Margen de Contingencia / Riesgo):** Aplicación de buffer porcentual configurable (ej. 10% a 25%) para mitigar *scope creep*.
- **RF-3.4 (Margen de Rentabilidad / Ganancia):** Aplicación de markup sobre el costo base (ej. 20% a 50%).
- **RF-3.5 (Impuestos y Retenciones):** Configuración de tasas impositivas (IVA/VAT, retenciones fiscales según el país).
- **RF-3.6 (Fórmula Consolidada del Total):**
  $$\text{Subtotal} = \text{Costo Mano de Obra} + \text{Costos Terceros}$$
  $$\text{Base Imponible} = (\text{Subtotal} \times (1 + \text{Riesgo})) \times (1 + \text{Margen})$$
  $$\text{Precio Final} = \text{Base Imponible} \times (1 + \text{Impuestos})$$

### Épica 4: Esquema de Pagos en Cuotas e Hitos (Payment Schedule & Milestones)
- **RF-4.1:** Generación asistida de esquemas de pago fraccionados:
  - *Modelo 50/50:* 50% anticipo al inicio, 50% al entregar en producción.
  - *Modelo 30/40/30 (Recomendado):* 30% anticipo, 40% al completar MVP/Beta, 30% al cierre y traspaso.
  - *Modelo por Hitos de Entrega:* Cuota asociada al cierre de cada Módulo completado.
  - *Modelo Personalizado:* Definición manual de número de cuotas, porcentajes y montos.
- **RF-4.2:** Validación de consistencia: La suma de los porcentajes de las cuotas debe ser estrictamente igual al 100% (o la suma de montos igual al Total).
- **RF-4.3:** Asignación de fechas límite estimadas de pago (Due Dates) y entregables clave asociados a cada cuota.

### Épica 5: Control de Ingresos y Flujo de Caja (Cash Flow Tracker)
- **RF-5.1:** Registro del ciclo de vida de cada cuota:
  - Estados: `Pendiente (Draft)` $\to$ `Emitida/Por Cobrar` $\to$ `Pagada (Cobrada)` $\to$ `Atrasada (Overdue)` $\to$ `Cancelada`.
- **RF-5.2:** Registro de comprobantes/referencias de cobro (Fecha de cobro real, método de pago, nota/ID de transferencia).
- **RF-5.3:** Dashboard de Salud Financiera:
  - *Total Facturado vs. Cobrado en Mano vs. Pendiente de Cobro*.
  - *Proyección de Flujo de Caja*: Calendario o gráfico de ingresos esperados en los próximos 30/60/90 días.
  - *Alertas de Vencimiento*: Indicador visual de cobros que han superado su fecha de vencimiento.

### Épica 6: Exportación de Cotizaciones y Compartición
- **RF-6.1:** Generación de Vista de Cotización para Cliente (Formato limpio, sin mostrar márgenes internos confidenciales, solo módulos, alcances, hitos y montos).
- **RF-6.2:** Exportación a PDF imprimible / descargable con branding personalizado.
- **RF-6.3:** Exportación e importación en formato JSON para respaldos.

---

## 4. Requerimientos No Funcionales

1. **Rendimiento:** Tiempos de carga iniciales menores a 1.2 segundos (Next.js Server Components y Core Web Vitals optimizados).
2. **Seguridad y Aislamiento:** Políticas de **Row Level Security (RLS)** en Supabase; los usuarios solo pueden ver y modificar sus propios proyectos, roles y cobros.
3. **Costo Cero de Operación:** Arquitectura dimensionada para operar 100% dentro del *Free Tier* de Supabase y Vercel/Netlify.
4. **Diseño y Usabilidad:** Interfaz adaptable a pantallas Desktop y Mobile, con diseño moderno, accesible, tipografía legible y micro-interacciones fluidas.
5. **Calidad de Código y TDD:** Cobertura de pruebas unitarias $\ge 90\%$ en la lógica del motor financiero y agregados de dominio.
