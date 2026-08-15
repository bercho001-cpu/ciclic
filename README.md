# 🚀 Ciclic — Calculador y Gestor Inteligente de Costos de Software

**Ciclic** es una plataforma web para estimación de costos, presupuestación modular, planes de pago fraccionados (cuotas/hitos) y control de flujo de caja para proyectos de desarrollo **Web** y **Mobile Apps**.

Diseñado bajo principios de ingeniería de software robustos: **Domain-Driven Design (DDD)**, **Arquitectura Limpia**, **SOLID**, **DRY** y desarrollado mediante **Test-Driven Development (TDD)** con tecnologías 100% gratuitas (**Next.js 15**, **Supabase Free Tier**, **TypeScript**, **Vitest**).

---

## 📚 Índice de Documentación Técnica

Toda la documentación para planificar, diseñar y generar la aplicación con IA se encuentra estructurada en la carpeta [`/docs`](file:///C:/Users/54294/.gemini/antigravity/scratch/ciclic/docs):

| Documento | Descripción |
| :--- | :--- |
| 📄 [**01. Requerimientos y Alcance (PRD)**](file:///C:/Users/54294/.gemini/antigravity/scratch/ciclic/docs/01_product_requirements_and_scope.md) | Especificaciones funcionales, historias de usuario, cálculo de tarifas, cuotas y flujo de ingresos. |
| 🏗️ [**02. Domain-Driven Design y Arquitectura**](file:///C:/Users/54294/.gemini/antigravity/scratch/ciclic/docs/02_domain_driven_design_and_architecture.md) | Bounded Contexts, Agregados, Entidades, Value Objects, Domain Events y principios SOLID/DRY. |
| ⚡ [**03. Stack Tecnológico y Guía Supabase**](file:///C:/Users/54294/.gemini/antigravity/scratch/ciclic/docs/03_tech_stack_and_supabase_guide.md) | Configuración de Next.js 15, Supabase (Auth + PostgreSQL + RLS) y uso dentro de los límites gratuitos. |
| 🗄️ [**04. Modelos de Datos y Esquemas SQL**](file:///C:/Users/54294/.gemini/antigravity/scratch/ciclic/docs/04_data_models_and_database_schema.md) | Scripts DDL para Supabase con RLS, esquemas de validación Zod y tipos TypeScript. |
| 🧪 [**05. Estrategia TDD y Casos de Prueba**](file:///C:/Users/54294/.gemini/antigravity/scratch/ciclic/docs/05_tdd_strategy_and_test_specifications.md) | Ciclo Red-Green-Refactor, suites de pruebas unitarias de cálculo financiero e integración. |
| 🤖 [**06. Hoja de Ruta de Prompts para IA**](file:///C:/Users/54294/.gemini/antigravity/scratch/ciclic/docs/06_ai_prompting_roadmap.md) | Secuencia de prompts modulares listos para generar el código paso a paso con Antigravity. |

---

## 🎯 Capacidades Principales de Ciclic

1. **Gestión de Tarifas y Roles (Rate Cards):**
   - Configuración de costos por hora según rol (Frontend, Backend, Mobile Flutter/React Native, UI/UX Designer, DevOps, QA, Project Manager).
   - Márgenes de beneficio configurables y amortización de costos fijos.

2. **Desglose Modular de Proyectos (WBS - Work Breakdown Structure):**
   - Creación de módulos y funcionalidades con estimaciones en horas (Optimista, Probable, Pesimista - PERT).
   - Tipificación de proyectos: Web App, Mobile App (iOS/Android), API/Backend, Landing Page, E-commerce, MVP.

3. **Cálculo Financiero Completo:**
   - Subtotal, porcentaje de riesgo/contingencia, margen de ganancia, costos de infraestructura fija (servidores, licencias) e impuestos locales (IVA/VAT).

4. **Esquema de Cuotas e Hitos de Pago (Milestones):**
   - Generación de planes de cobro automáticos (ej. 30% anticipo, 35% entrega de diseño y backend, 35% pase a producción).
   - Fechas estimadas de cobro y entregables asociados.

5. **Control de Ingresos y Flujo de Caja (Cash Flow):**
   - Registro de pagos recibidos vs. facturados vs. pendientes.
   - Panel de salud financiera del proyecto y alertas de cobros vencidos.
   - Exportación de cotizaciones profesionales en PDF / JSON.
