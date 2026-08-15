# 🏗️ Arquitectura Limpia y Domain-Driven Design (DDD) — Ciclic

## 1. Visión Estratégica de DDD

Para garantizar que Ciclic sea escalable, testeable y fácil de mantener, aplicamos **Domain-Driven Design (DDD)** táctico y estratégico, separando estrictamente la lógica de negocio de los detalles de infraestructura (Next.js, Supabase, etc.).

```
┌────────────────────────────────────────────────────────┐
│                   CAPA DE PRESENTACIÓN                  │
│       Next.js 15 (App Router, UI Components, Hooks)     │
└───────────────────────────┬────────────────────────────┘
                            │ (Usa DTOs e Invoca)
┌───────────────────────────▼────────────────────────────┐
│                    CAPA DE APLICACIÓN                  │
│   Use Cases / Interactors, DTOs, Comandos y Consultas   │
└───────────────────────────┬────────────────────────────┘
                            │ (Orquesta el Dominio)
┌───────────────────────────▼────────────────────────────┐
│                     CAPA DE DOMINIO                    │
│   Agregados, Entidades, Value Objects, Domain Events   │
│   (TypeScript Puro — 0 Dependencias de Framework)      │
└───────────────────────────▲────────────────────────────┘
                            │ (Implementa Interfaces / Inversión de Control)
┌───────────────────────────┴────────────────────────────┐
│                  CAPA DE INFRAESTRUCTURA               │
│  Supabase Repositories, Supabase Auth, PDF Adapters    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Bounded Contexts (Contextos Delimitados)

Ciclic se estructura en 4 Bounded Contexts interconectados mediante contratos explícitos:

```mermaid
graph TD
    A[Rate Card & Roles Context] -->|Provee Tarifas Base| B[Project Estimation Context]
    B -->|Genera Presupuesto y Total| C[Financial Calculation Engine]
    C -->|Define Monto Final y Moneda| D[Payment Schedule & Cash Flow Context]
```

1. **Labor & Rate Cards Context:** Gestión de roles de desarrollo/diseño, tarifas por hora y monedas.
2. **Project Estimation & WBS Context:** Desglose de proyectos en módulos, tareas y horas PERT.
3. **Financial Calculation Context:** Motor de cálculo puro (contingencias, márgenes, impuestos, totales).
4. **Payment Schedule & Cash Flow Context:** Fraccionamiento en cuotas/hitos y control de cobros e ingresos.

---

## 3. Lenguaje Ubicuo (Ubiquitous Language)

- **Project (Proyecto):** Unidad central de estimación que agrupa módulos, costos y configuración financiera.
- **Module (Módulo):** Agrupación lógica de funcionalidades (ej. *Autenticación*, *Módulo de Pagos*).
- **Task (Tarea / Funcionalidad):** Ítem elemental de trabajo estimado en horas y asociado a un Rol.
- **RateCard (Tarifario):** Catálogo de tarifas horarias por perfil profesional.
- **PERT Estimate:** Estimación ponderada de horas mediante fórmula estadística $\frac{O + 4M + P}{6}$.
- **Contingency (Contingencia / Riesgo):** Porcentaje de seguridad añadido para absorber imprevistos.
- **Profit Margin (Margen de Ganancia):** Porcentaje de utilidad sobre el costo operativo.
- **Installment / Milestone (Cuota / Hito):** Fracción del pago total asociada a una fecha, porcentaje o entrega.
- **Cash Flow Record:** Registro de una transacción de cobro realizada con fecha, método y estado.

---

## 4. Agregados, Entidades y Value Objects (Dominio Táctico)

### 4.1. Value Objects (Inmutables, comparables por valor)

Los Value Objects garantizan la consistencia y eliminan la obsesión por tipos primitivos (*primitive obsession*):

- **`Money`:**
  - Atributos: `amount: number`, `currency: CurrencyCode` (USD, EUR, ARS, etc.).
  - Comportamiento: `add(other)`, `subtract(other)`, `multiply(factor)`, `format(locale)`. Controla el redondeo a 2 decimales sin pérdida de precisión.
- **`EstimationHours`:**
  - Atributos: `optimistic: number`, `probable: number`, `pessimistic: number`.
  - Invariante: $optimistic \le probable \le pessimistic$.
  - Método: `calculateExpectedHours(): number`.
- **`Percentage`:**
  - Atributo: `value: number` (Rango: $0 \le value \le 100$).
  - Método: `applyTo(amount: number): number`.
- **`InstallmentSchedule`:**
  - Atributo: `installments: ReadonlyArray<Installment>`.
  - Invariante: $\sum \text{porcentajes} = 100\%$.

### 4.2. Agregados y Entidades

#### Agregado 1: `Project` (Aggregate Root)
- **ID:** `ProjectId`
- **Atributos:** `name`, `type` (Web, Mobile, Fullstack, API), `currency`, `contingencyRate: Percentage`, `profitMarginRate: Percentage`, `taxRate: Percentage`.
- **Entidades Hijas:**
  - `Module`: `id`, `name`, `description`, `tasks: FeatureTask[]`.
  - `FeatureTask`: `id`, `name`, `roleId`, `hours: EstimationHours`, `complexityMultiplier: number`.
  - `ExternalCost`: `id`, `concept`, `amount: Money`, `isRecurringMonthly: boolean`.
- **Métodos de Negocio:**
  - `addModule(name, description): Module`
  - `addTaskToModule(moduleId, taskData): void`
  - `calculateLaborCost(rateCard: RateCard): Money`
  - `calculateTotalBudget(rateCard: RateCard): ProjectFinancialSummary`

#### Agregado 2: `RateCard` (Aggregate Root)
- **ID:** `RateCardId`
- **Atributos:** `userId`, `name`, `currency`, `isDefault: boolean`.
- **Entidades Hijas:**
  - `RoleRate`: `roleId`, `roleName`, `hourlyCost: Money`, `hourlyBillRate: Money`.
- **Métodos de Negocio:**
  - `addRole(roleName, hourlyCost, hourlyBillRate): void`
  - `getRateForRole(roleId): RoleRate`

#### Agregado 3: `PaymentPlan` (Aggregate Root)
- **ID:** `PaymentPlanId`
- **Atributos:** `projectId`, `totalAmount: Money`, `status: PaymentPlanStatus`.
- **Entidades Hijas:**
  - `Installment`: `id`, `sequenceNumber`, `title`, `percentage: Percentage`, `amount: Money`, `dueDate: Date`, `status: InstallmentStatus` (`PENDING`, `INVOICED`, `PAID`, `OVERDUE`).
  - `PaymentReceipt`: `id`, `installmentId`, `paidAmount: Money`, `paidAt: Date`, `paymentMethod: string`, `referenceNotes: string`.
- **Métodos de Negocio:**
  - `generateEvenSplit(numberOfInstallments: number): void`
  - `generateStandardMilestones(advancePct, betaPct, releasePct): void`
  - `recordPayment(installmentId, amount, date, method, notes): void`
  - `getFinancialHealth(): CashFlowSummary`

---

## 5. Principios SOLID y DRY en Ciclic

- **Single Responsibility Principle (SRP):**
  - El agregador `Project` no calcula impuestos ni interactúa con la base de datos; delega el cálculo matemático al `FinancialCalculationService` y la persistencia al `ProjectRepository`.
- **Open/Closed Principle (OCP):**
  - Se pueden añadir nuevos modelos de estimación (ej. *Story Points*, *T-Shirt sizing*) implementando la interfaz `EstimationStrategy` sin alterar las entidades existentes.
- **Liskov Substitution Principle (LSP):**
  - Cualquier repositorio (ej. `SupabaseProjectRepository` o `InMemoryProjectRepository` para tests unitarios) cumple estrictamente con el contrato `IProjectRepository`.
- **Interface Segregation Principle (ISP):**
  - Interfaces específicas y compactas: `IReadOnlyProjectRepository`, `IProjectWriterRepository`, `IPdfExportService`.
- **Dependency Inversion Principle (DIP):**
  - Los casos de uso dependen exclusivamente de interfaces de repositorio (Puertos), no de clientes directos de Supabase (Adaptadores).
- **DRY (Don't Repeat Yourself):**
  - Encapsulación de toda lógica de cálculo monetario y redondeos en el Value Object `Money`.
