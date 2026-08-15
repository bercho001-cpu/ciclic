-- ==============================================================================
-- 1. TABLA: PROFILES (Perfil de Usuario y Branding de la Agencia/Consultor)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name VARCHAR(150),
    contact_email VARCHAR(150),
    tax_id VARCHAR(50),
    logo_url TEXT,
    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    default_payment_terms TEXT DEFAULT 'Propuesta válida por 15 días corridos. Los costos de terceros se facturan según consumo real.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger para crear perfil automáticamente al registrarse en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name, contact_email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 2. TABLA: RATE CARDS (Tarifarios y Roles de Trabajo)
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
-- 3. TABLA: MODULE_TEMPLATES (Biblioteca de Plantillas Reutilizables)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.module_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL si es plantilla global
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_global BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.module_templates(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    suggested_role_name VARCHAR(100) NOT NULL DEFAULT 'Fullstack Developer',
    optimistic_hours NUMERIC(6, 2) NOT NULL DEFAULT 4.00,
    probable_hours NUMERIC(6, 2) NOT NULL DEFAULT 8.00,
    pessimistic_hours NUMERIC(6, 2) NOT NULL DEFAULT 16.00,
    sort_order INT NOT NULL DEFAULT 0
);

-- ==============================================================================
-- 4. TABLA: PROJECTS (Proyectos y Configuración de Costos)
-- ==============================================================================
CREATE TYPE project_type_enum AS ENUM ('WEB_APP', 'MOBILE_APP', 'FULLSTACK', 'API_BACKEND', 'LANDING_PAGE', 'MVP');
CREATE TYPE project_status_enum AS ENUM ('DRAFT', 'ESTIMATED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rate_card_id UUID REFERENCES public.rate_cards(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    client_name VARCHAR(150),
    project_type project_type_enum NOT NULL DEFAULT 'WEB_APP',
    status project_status_enum NOT NULL DEFAULT 'DRAFT',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    contingency_percentage NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    profit_margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    share_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABLA: MODULES & TASKS (WBS, PERT y Snapshots de Tarifa)
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

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    hourly_rate_snapshot NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Preserva la tarifa exacta al cotizar
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
    duration_months INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. TABLA: PAYMENT_PLANS & INSTALLMENTS (Esquema de Cuotas e Hitos)
-- ==============================================================================
CREATE TYPE installment_status_enum AS ENUM ('PENDING', 'INVOICED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- Políticas de usuario autenticado:
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own rate cards" ON public.rate_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own roles" ON public.roles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own templates and read global" ON public.module_templates FOR ALL USING (auth.uid() = user_id OR is_global = true);
CREATE POLICY "Users can view task templates" ON public.task_templates FOR ALL USING (true);
CREATE POLICY "Users can manage their own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own modules" ON public.modules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own external costs" ON public.external_costs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own payment plans" ON public.payment_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own installments" ON public.installments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own payment receipts" ON public.payment_receipts FOR ALL USING (auth.uid() = user_id);

-- Políticas de lectura pública por share_token (para clientes):
CREATE POLICY "Public read project proposal by share_token" ON public.projects FOR SELECT USING (is_public = true);
CREATE POLICY "Public read modules for public projects" ON public.modules FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = modules.project_id AND is_public = true)
);
CREATE POLICY "Public read tasks for public projects" ON public.tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.modules JOIN public.projects ON projects.id = modules.project_id WHERE modules.id = tasks.module_id AND projects.is_public = true)
);
CREATE POLICY "Public read external costs for public projects" ON public.external_costs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = external_costs.project_id AND is_public = true)
);
CREATE POLICY "Public read payment plan for public projects" ON public.payment_plans FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.projects WHERE id = payment_plans.project_id AND is_public = true)
);
CREATE POLICY "Public read installments for public projects" ON public.installments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.payment_plans JOIN public.projects ON projects.id = payment_plans.project_id WHERE payment_plans.id = installments.payment_plan_id AND projects.is_public = true)
);
