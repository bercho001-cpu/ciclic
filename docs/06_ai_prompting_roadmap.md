# 🤖 Hoja de Ruta de Prompts para Generación con IA — Ciclic

Esta guía contiene la secuencia exacta de **prompts modulares** listos para ser ejecutados en orden con **Antigravity** o cualquier asistente de IA para construir el proyecto **Ciclic** paso a paso, garantizando TDD, DDD y principios SOLID/DRY.

---

## 🗺️ Mapa de Fases de Construcción

```
[FASE 1: Inicialización & Setup TDD]
               │
               ▼
[FASE 2: Capa de Dominio Pura (Value Objects con TDD)]
               │
               ▼
[FASE 3: Dominio Avanzado (Agregados, Snapshots & Algoritmo de Centavos)]
               │
               ▼
[FASE 4: Capa de Infraestructura (Supabase SSR, Middleware & Repositorios)]
               │
               ▼
[FASE 5: Capa de Aplicación (Casos de Uso, DTOs & Plantillas)]
               │
               ▼
[FASE 6: Interfaz de Usuario (Next.js 15, Auth, Dashboard, Vista Pública & PDF)]
```

---

## 📋 Secuencia de Prompts Listos para Ejecutar

### 🟢 PROMPT 1 — Inicialización del Proyecto y Configuración de Vitest (TDD)
```text
Actúa como un arquitecto de software senior. Vamos a inicializar el proyecto "Ciclic" (calculador y gestor de costos de software web y mobile) con Next.js 15 (App Router), TypeScript y Vitest para TDD.

Sigue las especificaciones en docs/03_tech_stack_and_supabase_guide.md:
1. Crea la estructura de carpetas siguiendo Clean Architecture:
   - src/app/ (Next.js App Router: layouts, páginas, server actions)
   - src/components/ (componentes de UI y tokens de diseño)
   - src/domain/ (value-objects, entities, aggregates, services, repositories)
   - src/application/ (use-cases, dtos)
   - src/infrastructure/ (supabase, repositories, adapters)
   - src/tests/ (configuración y setup de tests)
2. Configura vitest.config.ts y src/tests/setup.ts con soporte para happy-dom y alias de TypeScript (@/*).
3. Añade los scripts en package.json para "test", "test:watch" y "test:coverage".
4. Escribe una prueba de verificación simple para confirmar que Vitest y los alias funcionan correctamente.
```

---

### 🟢 PROMPT 2 — Dominio: Value Objects con TDD Estricto
```text
Siguiendo TDD estricto (Red -> Green -> Refactor), vamos a implementar los Value Objects centrales de Ciclic según docs/02_domain_driven_design_and_architecture.md y docs/05_tdd_strategy_and_test_specifications.md:

1. Escribe primero las suites de prueba en Vitest para:
   - src/domain/value-objects/__tests__/money.spec.ts (redondeo a 2 decimales, suma/resta con misma moneda, rechazo de montos negativos, formato de moneda).
   - src/domain/value-objects/__tests__/estimation-hours.spec.ts (cálculo PERT (O+4M+P)/6, invariante Optimista <= Probable <= Pesimista).
   - src/domain/value-objects/__tests__/percentage.spec.ts (rango 0-100%, cálculo de tasas).
   - src/domain/value-objects/__tests__/installment-schedule.spec.ts (validación de suma 100% y algoritmo de centavo residual allocateResidualPenny).
2. Ejecuta las pruebas para verificar que fallen (RED).
3. Implementa los Value Objects inmutables con TypeScript puro en src/domain/value-objects/ para que todas las pruebas pasen (GREEN).
4. Asegúrate de aplicar principios SOLID y DRY con 100% de cobertura.
```

---

### 🟢 PROMPT 3 — Dominio: Motor Financiero, Agregados y Snapshots con TDD
```text
Siguiendo TDD, vamos a implementar el motor de cálculo financiero en cascada y los agregados del dominio según docs/02_domain_driven_design_and_architecture.md y docs/05_tdd_strategy_and_test_specifications.md:

1. Escribe los tests unitarios en Vitest para:
   - src/domain/services/__tests__/financial-calculation.service.spec.ts (cálculo en cascada: Mano de Obra + Costos Fijos puntuales/recurrentes + Contingencia + Margen de Ganancia + Impuestos).
   - src/domain/aggregates/__tests__/project.spec.ts (módulos, tareas PERT, congelamiento de snapshot de tarifas freezeSnapshots para inmutabilidad histórica).
   - src/domain/aggregates/__tests__/payment-plan.spec.ts (generación de cuotas 50/50, 30/40/30, distribución exacta de centavos, estados PARTIALLY_PAID y PAID al recibir recibos de cobro).
   - src/domain/aggregates/__tests__/user-profile.spec.ts (branding, logo, términos de pago).
   - src/domain/aggregates/__tests__/module-template.spec.ts (plantillas reutilizables).
2. Implementa las clases y servicios de dominio correspondientes en src/domain/aggregates/ y src/domain/services/.
3. Define las interfaces de repositorio (Puertos):
   - src/domain/repositories/project.repository.interface.ts
   - src/domain/repositories/rate-card.repository.interface.ts
   - src/domain/repositories/payment-plan.repository.interface.ts
   - src/domain/repositories/user-profile.repository.interface.ts
   - src/domain/repositories/module-template.repository.interface.ts
```

---

### 🟢 PROMPT 4 — Infraestructura: Clientes Supabase, Middleware y Repositorios
```text
Vamos a implementar la capa de infraestructura conectada a Supabase (PostgreSQL con RLS) según docs/03_tech_stack_and_supabase_guide.md y docs/04_data_models_and_database_schema.md:

1. Configura los clientes de Supabase para SSR y Cliente navegador en src/infrastructure/supabase/ (client.ts y server.ts).
2. Implementa el Middleware de Next.js 15 en src/middleware.ts para refrescar sesiones de Supabase y proteger rutas autenticadas, permitiendo acceso público a /login, /register y /view/proposal/*.
3. Implementa los repositorios concretos con Supabase:
   - src/infrastructure/repositories/supabase-project.repository.ts
   - src/infrastructure/repositories/supabase-rate-card.repository.ts
   - src/infrastructure/repositories/supabase-payment-plan.repository.ts
   - src/infrastructure/repositories/supabase-profile.repository.ts
   - src/infrastructure/repositories/supabase-module-template.repository.ts
4. Crea implementaciones InMemory de estos repositorios para que las suites de tests de aplicación se ejecuten en memoria de forma instantánea sin Supabase.
```

---

### 🟢 PROMPT 5 — Aplicación: Casos de Uso y DTOs con Zod
```text
Implementa la capa de aplicación con casos de uso desacoplados testeados con InMemory repositories:

1. Define los DTOs de entrada y salida con esquemas Zod en src/application/dtos/.
2. Implementa los siguientes Casos de Uso con sus respectivos tests unitarios:
   - CreateProjectUseCase
   - AddModuleWithTasksUseCase
   - CloneModuleTemplateToProjectUseCase
   - CalculateProjectBudgetUseCase
   - GeneratePaymentPlanUseCase
   - RecordPaymentReceiptUseCase
   - GetFinancialHealthSummaryUseCase
   - GetPublicProposalUseCase (búsqueda por shareToken para clientes)
   - UpdateUserProfileUseCase
3. Cada caso de uso debe recibir sus repositorios por inyección de dependencias (DIP).
```

---

### 🟢 PROMPT 6 — Presentación: Next.js 15 UI, Dashboard, Cotizador y PDF
```text
Vamos a construir la interfaz de usuario en Next.js 15 (App Router) con diseño moderno, elegante y responsivo:

1. Autenticación (/login, /register): Formularios de inicio de sesión y registro integrados con Supabase Auth.
2. Configuración (/settings/profile y /settings/rates):
   - Perfil de empresa / freelancer (Logo, Tax ID, moneda por defecto, términos y condiciones).
   - Gestión de tarifarios y roles con costo/hora y tarifa de venta.
3. Creador y Estimador de Proyectos (/projects/new y /projects/[id]):
   - Desglose WBS por Módulos y Tareas PERT.
   - Botón para importar desde Biblioteca de Plantillas.
   - Panel lateral de liquidación financiera en tiempo real.
4. Planificador de Cuotas y Flujo de Cobro (/projects/[id]/payments):
   - Generación asistida de cuotas (30/40/30, 50/50, por módulo) con ajuste de centavos.
   - Modal para registrar cobros (método, monto, comprobante) con cambio a Parcialmente Pagado / Pagado.
5. Dashboard de Salud Financiera (/dashboard):
   - KPIs: Total Facturado, Cobrado en Mano, Pendiente de Cobro, Cobros Atrasados y proyección a 30/60/90 días.
6. Vista de Cotización para Cliente y PDF (/projects/[id]/proposal y /view/proposal/[shareToken]):
   - Vista web compartible para clientes sin login.
   - Botón de exportación a PDF limpio con branding corporativo usando window.print() con @media print.
```
