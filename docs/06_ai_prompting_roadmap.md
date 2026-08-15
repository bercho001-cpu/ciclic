# 🤖 Hoja de Ruta de Prompts para Generación con IA — Ciclic

Esta guía contiene la secuencia exacta de **prompts modulares** listos para ser ejecutados en orden con **Antigravity** o cualquier asistente de IA para construir el proyecto **Ciclic** paso a paso, garantizando TDD, DDD y principios SOLID/DRY.

---

## 🗺️ Mapa de Fases de Construcción

```
[FASE 1: Inicialización & Setup TDD]
               │
               ▼
[FASE 2: Capa de Dominio Pura (Value Objects & Agregados con TDD)]
               │
               ▼
[FASE 3: Capa de Infraestructura (Supabase, RLS & Repositorios)]
               │
               ▼
[FASE 4: Capa de Aplicación (Casos de Uso & DTOs)]
               │
               ▼
[FASE 5: Interfaz de Usuario (Next.js 15, Componentes & Exportación)]
```

---

## 📋 Secuencia de Prompts Listos para Ejecutar

### 🟢 PROMPT 1 — Inicialización del Proyecto y Configuración de Vitest (TDD)
```text
Actúa como un arquitecto de software senior. Vamos a inicializar el proyecto "Ciclic" (calculador de costos de proyectos de desarrollo web y mobile) con Next.js 15 (App Router), TypeScript y Vitest para TDD.

Sigue las especificaciones en docs/03_tech_stack_and_supabase_guide.md:
1. Crea la estructura de carpetas siguiendo Clean Architecture:
   - src/domain/ (value-objects, entities, aggregates, services, repositories)
   - src/application/ (use-cases, dtos)
   - src/infrastructure/ (supabase, repositories, adapters)
   - src/presentation/ (components, hooks, app)
2. Configura vitest.config.ts y src/tests/setup.ts con soporte para happy-dom y alias de TypeScript (@/*).
3. Añade los scripts en package.json para "test", "test:watch" y "test:coverage".
4. Escribe una prueba de verificación simple para confirmar que Vitest funciona correctamente.
```

---

### 🟢 PROMPT 2 — Dominio: Value Objects con TDD Estricto
```text
Siguiendo TDD estricto (Red -> Green -> Refactor), vamos a implementar los Value Objects centrales de Ciclic según docs/02_domain_driven_design_and_architecture.md y docs/05_tdd_strategy_and_test_specifications.md:

1. Escribe primero las suites de prueba en Vitest para:
   - src/domain/value-objects/__tests__/money.spec.ts (manejo de redondeo, sumas, restas, validación de no negativos, formato de moneda).
   - src/domain/value-objects/__tests__/estimation-hours.spec.ts (cálculo PERT (O+4M+P)/6, validaciones de invariantes).
   - src/domain/value-objects/__tests__/percentage.spec.ts (rango 0-100%, cálculo de tasas).
2. Ejecuta las pruebas para verificar que fallen (RED).
3. Implementa los Value Objects inmutables con TypeScript puro en src/domain/value-objects/ para que todas las pruebas pasen (GREEN).
4. Asegúrate de aplicar principios SOLID y DRY con 100% de cobertura en estos archivos.
```

---

### 🟢 PROMPT 3 — Dominio: Motor Financiero y Agregados con TDD
```text
Siguiendo TDD, vamos a implementar el motor de cálculo financiero y los agregados del dominio:

1. Escribe los tests unitarios en Vitest para:
   - src/domain/services/__tests__/financial-calculation.service.spec.ts (cálculo de Mano de Obra + Costos Fijos + Contingencia + Margen de Ganancia + Impuestos).
   - src/domain/aggregates/__tests__/project.spec.ts (agregación de módulos, tareas con roles, cálculo de horas totales).
   - src/domain/aggregates/__tests__/payment-plan.spec.ts (generación de cuotas 50/50, 30/40/30, registro de pagos y cálculo de balance de cobro).
2. Implementa las clases y servicios de dominio correspondientes en src/domain/aggregates/ y src/domain/services/.
3. Define las interfaces de repositorio (Puertos):
   - src/domain/repositories/project.repository.interface.ts
   - src/domain/repositories/rate-card.repository.interface.ts
   - src/domain/repositories/payment-plan.repository.interface.ts
```

---

### 🟢 PROMPT 4 — Infraestructura: Clientes Supabase y Repositorios
```text
Vamos a implementar la capa de infraestructura conectada a Supabase (PostgreSQL con RLS) según docs/04_data_models_and_database_schema.md:

1. Configura los clientes de Supabase para SSR y Cliente navegador en src/infrastructure/supabase/ (client.ts y server.ts).
2. Implementa los repositorios concretos implementando las interfaces de dominio:
   - src/infrastructure/repositories/supabase-project.repository.ts
   - src/infrastructure/repositories/supabase-rate-card.repository.ts
   - src/infrastructure/repositories/supabase-payment-plan.repository.ts
3. Crea un InMemoryProjectRepository para que los tests de los casos de uso puedan ejecutarse sin depender de una base de datos real.
```

---

### 🟢 PROMPT 5 — Aplicación: Casos de Uso (Use Cases & DTOs)
```text
Implementa la capa de aplicación con casos de uso desacoplados e independientes:

1. Define los DTOs de entrada y salida con esquemas Zod en src/application/dtos/.
2. Implementa los siguientes Casos de Uso con sus respectivos tests unitarios:
   - CreateProjectUseCase
   - AddModuleWithTasksUseCase
   - CalculateProjectBudgetUseCase
   - GeneratePaymentPlanUseCase
   - RecordPaymentReceiptUseCase
   - GetFinancialHealthSummaryUseCase
3. Cada caso de uso debe recibir sus repositorios por inyección de dependencias (DIP).
```

---

### 🟢 PROMPT 6 — Presentación: Interfaz de Usuario, Dashboard y Cotizador
```text
Vamos a construir la interfaz de usuario en Next.js 15 (App Router) con diseño moderno, intuitivo y responsivo:

1. Página de Tarifarios (/settings/rates): Gestión visual de roles y valor hora.
2. Creador / Estimador de Proyectos (/projects/new y /projects/[id]):
   - Desglose interactivo por Módulos y Tareas (PERT).
   - Selector de roles con cálculo en tiempo real.
   - Panel lateral de liquidación financiera (Costo base, Contingencia, Margen, Impuestos, Total).
3. Planificador de Cuotas e Hitos (/projects/[id]/payments):
   - Generador automático de planes (30/40/30, 50/50, por módulo).
   - Control de cobros: Botón para marcar cuotas como "Cobradas", ingresar comprobante y fecha.
4. Dashboard de Flujo de Caja (/dashboard):
   - Tarjetas de KPIs: Total Facturado, Total Cobrado, Pendiente de Cobro, Cobros Atrasados.
5. Vista de Cotización para Cliente y Exportación a PDF (/projects/[id]/proposal) optimizada para impresión limpia (window.print() con @media print).
```
