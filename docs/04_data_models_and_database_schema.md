# 🗄️ Modelos de Datos y Esquemas de Base de Datos — Ciclic

## 1. Esquema SQL Relacional para Supabase (PostgreSQL)

El siguiente script DDL crea todas las tablas, relaciones, índices y políticas de seguridad **Row Level Security (RLS)** para aislar estrictamente los datos de cada usuario autenticado.

```sql
-- ==============================================================================
-- 1. TABLA: RATE CARDS (Tarifarios)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rate_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. TABLA: ROLES (Roles de Trabajo y Costos por Hora)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_card_id UUID NOT NULL REFERENCES public.rate_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name VARCHAR(100) NOT NULL,
    hourly_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    hourly_bill_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. TABLA: PROJECTS (Proyectos)
-- ==============================================================================
CREATE TYPE project_type_enum AS ENUM ('WEB_APP', 'MOBILE_APP', 'FULLSTACK', 'API_BACKEND', 'LANDING_PAGE', 'MVP');
CREATE TYPE project_status_enum AS ENUM ('DRAFT', 'ESTIMATED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    client_name VARCHAR(150),
    project_type project_type_enum NOT NULL DEFAULT 'WEB_APP',
    status project_status_enum NOT NULL DEFAULT 'DRAFT',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    contingency_percentage NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    profit_margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. TABLA: MODULES (Módulos del Proyecto)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABLA: TASKS (Tareas con Estimación PERT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    optimistic_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    probable_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    pessimistic_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    calculated_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    complexity_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. TABLA: EXTERNAL_COSTS (Costos de Infraestructura y Licencias)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.external_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept VARCHAR(200) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_monthly_recurring BOOLEAN NOT NULL DEFAULT false,
    duration_months INT DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. TABLA: PAYMENT_PLANS & INSTALLMENTS (Esquema de Cuotas e Hitos)
-- ==============================================================================
CREATE TYPE installment_status_enum AS ENUM ('PENDING', 'INVOICED', 'PAID', 'OVERDUE', 'CANCELLED');

CREATE TABLE IF NOT EXISTS public.payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    milestone_deliverable TEXT,
    percentage NUMERIC(5, 2) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE,
    status installment_status_enum NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. TABLA: PAYMENT_RECEIPTS (Control de Ingresos y Cobros Reales)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    reference_code VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento por usuario:
CREATE POLICY "Users can manage their own rate cards" ON public.rate_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own roles" ON public.roles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own modules" ON public.modules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own external costs" ON public.external_costs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own payment plans" ON public.payment_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own installments" ON public.installments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own payment receipts" ON public.payment_receipts FOR ALL USING (auth.uid() = user_id);
```

---

## 2. Tipos TypeScript y Esquemas de Validación Zod

### Value Object Zod Schemas (`/src/domain/schemas/financial.schema.ts`):

```typescript
import { z } from 'zod';

export const MoneySchema = z.object({
  amount: z.number().nonnegative({ message: "El monto no puede ser negativo" }),
  currency: z.string().length(3).default('USD'),
});

export const EstimationHoursSchema = z.object({
  optimistic: z.number().min(0),
  probable: z.number().min(0),
  pessimistic: z.number().min(0),
}).refine((data) => data.optimistic <= data.probable && data.probable <= data.pessimistic, {
  message: "Las horas deben cumplir: Optimista <= Más Probable <= Pesimista",
});

export const PercentageSchema = z.number().min(0).max(100, {
  message: "El porcentaje debe estar entre 0% y 100%",
});

export const InstallmentScheduleSchema = z.object({
  installments: z.array(z.object({
    title: z.string().min(1),
    percentage: PercentageSchema,
    dueDate: z.date().optional(),
    milestoneDeliverable: z.string().optional(),
  })).refine((items) => {
    const sum = items.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.abs(sum - 100) < 0.01;
  }, {
    message: "La suma de los porcentajes de las cuotas debe ser exactamente 100%",
  }),
});
```
