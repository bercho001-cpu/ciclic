# 🚀 Ciclic — Calculador y Gestor Inteligente de Costos de Software

**Ciclic** es una plataforma web para estimación de costos, presupuestación modular, planes de pago fraccionados (cuotas/hitos) y control de flujo de caja para proyectos de desarrollo **Web** y **Mobile Apps**.

Diseñado bajo principios de ingeniería de software robustos: **Domain-Driven Design (DDD)**, **Arquitectura Limpia**, **SOLID**, **DRY** y desarrollado mediante **Test-Driven Development (TDD)** con tecnologías 100% gratuitas (**Next.js 15**, **Supabase Free Tier**, **TypeScript**, **Playwright**).

---

## 📚 Índice de Documentación Técnica

Toda la documentación para planificar, diseñar y generar la aplicación con IA se encuentra estructurada en la carpeta [`/docs`](file:///c:/Users/54294/OneDrive/Documents/Dev/ciclic/docs):

| Documento | Descripción |
| :--- | :--- |
| 📄 [**01. Requerimientos y Alcance (PRD)**](file:///c:/Users/54294/OneDrive/Documents/Dev/ciclic/docs/01_product_requirements_and_scope.md) | Especificaciones funcionales, historias de usuario, snapshots de tarifas, cuotas y flujo de ingresos. |
| 🏗️ [**02. Domain-Driven Design y Arquitectura**](file:///c:/Users/54294/OneDrive/Documents/Dev/ciclic/docs/02_domain_driven_design_and_architecture.md) | Bounded Contexts, Agregados, Entidades, Value Objects, Domain Events y principios SOLID/DRY. |
| ⚡ [**03. Stack Tecnológico y Guía Supabase**](file:///c:/Users/54294/OneDrive/Documents/Dev/ciclic/docs/03_tech_stack_and_supabase_guide.md) | Configuración de Next.js 15, Middleware SSR, Supabase (Auth + PostgreSQL + RLS) y cuotas gratuitas. |
| 🗄️ [**04. Modelos de Datos y Esquemas SQL**](file:///c:/Users/54294/OneDrive/Documents/Dev/ciclic/docs/04_data_models_and_database_schema.md) | Scripts DDL con perfiles, plantillas, snapshots, RLS público/privado, esquemas Zod y tipos TypeScript. |
| 🧪 [**05. Estrategia TDD y Casos de Prueba**](file:///c:/Users/54294/OneDrive/Documents/Dev/ciclic/docs/05_tdd_strategy_and_test_specifications.md) | Ciclo Red-Green-Refactor, suites de pruebas para centavos residuales, pagos parciales y cascada financiera. |
| 🤖 [**06. Hoja de Ruta de Prompts para IA**](file:///c:/Users/54294/OneDrive/Documents/Dev/ciclic/docs/06_ai_prompting_roadmap.md) | Secuencia de prompts modulares listos para generar el código paso a paso con Antigravity. |

---

## 🎯 Capacidades Principales de Ciclic

1. **Gestión de Tarifas, Roles y Perfil de Emisor (Rate Cards & Branding):**
   - Configuración de costos por hora según rol (Frontend, Backend, Mobile Flutter/React Native, UI/UX Designer, DevOps, QA, Project Manager).
   - Snapshots inmutables de tarifas al momento de cotizar para proteger el histórico de proyectos.
   - Branding corporativo: Logotipo, Tax ID, moneda predeterminada y términos de validez comercial.

2. **Desglose Modular de Proyectos y Biblioteca de Plantillas (WBS & Templates):**
   - Creación de módulos y funcionalidades con estimaciones en horas (Optimista, Probable, Pesimista - PERT).
   - Biblioteca de módulos predefinidos (Autenticación, Stripe, Panel Admin, etc.) clonables con un clic.
   - Tipificación de proyectos: Web App, Mobile App (iOS/Android), API/Backend, Landing Page, E-commerce, MVP.

3. **Cálculo Financiero Completo en Cascada:**
   - Subtotal operativo, costos externos puntuales y recurrentes ($\text{monto} \times \text{meses}$), porcentaje de contingencia/riesgo, margen de ganancia en cascada e impuestos locales (IVA/VAT).

4. **Esquema de Cuotas e Hitos con Ajuste de Centavos (Penny Allocation):**
   - Generación asistida de planes de cobro automáticos (ej. 30/40/30, 50/50, por módulo completado).
   - Algoritmo de ajuste de centavos residuales para asegurar cuadratura al 100.00%.
   - Fechas estimadas de cobro y entregables asociados.

5. **Control de Ingresos y Flujo de Caja (Cash Flow):**
   - Ciclo de vida de cuotas con soporte de pagos parciales (`PARTIALLY_PAID`) y totales (`PAID`).
   - Registro de comprobantes/recibos de cobro y métodos de pago.
   - Panel de salud financiera del proyecto y alertas de cobros vencidos.
   - Vista web de cotización interactiva compartible mediante enlace seguro (`/view/proposal/[shareToken]`) y exportación a PDF profesional.

