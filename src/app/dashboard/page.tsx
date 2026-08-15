'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/client';
import { 
  Plus, DollarSign, Calendar, AlertTriangle, 
  ChevronRight, Briefcase, FileText, CheckCircle2,
  TrendingUp, Users, Clock, Settings, LogOut, ExternalLink
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  client_name?: string;
  project_type: string;
  status: 'DRAFT' | 'ESTIMATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  currency: string;
  is_public: boolean;
  share_token: string;
  created_at: string;
}

interface PaymentPlan {
  id: string;
  project_id: string;
  status: string;
  installments: Array<{
    id: string;
    name: string;
    amount: number;
    percentage: number;
    status: 'DRAFT' | 'INVOICED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    due_date?: string;
    payment_records?: Array<{
      amount: number;
    }>;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  // Dashboard lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [userName, setUserName] = useState('');

  // Financial KPIs
  const [metrics, setMetrics] = useState({
    totalFacturado: 0,
    cobradoEnMano: 0,
    pendienteCobro: 0,
    cobrosAtrasados: 0,
    activeCurrency: 'USD'
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch User Name / Business Name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, default_currency')
        .eq('id', user.id)
        .single();
      
      setUserName(profile?.display_name || user.email?.split('@')[0] || 'Desarrollador');
      const defaultCurrency = profile?.default_currency || 'USD';

      // 1. Fetch Projects
      const { data: fetchedProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchedProjects) {
        setProjects(fetchedProjects);
      }

      // 2. Fetch Payment Plans with Installments and Payments
      const { data: fetchedPlans } = await supabase
        .from('payment_plans')
        .select(`
          id, 
          project_id, 
          status,
          installments (
            id,
            name,
            amount,
            percentage,
            status,
            due_date,
            payment_records (
              amount
            )
          )
        `)
        .eq('user_id', user.id);

      // Aggregate financials
      let totalFacturado = 0;
      let cobradoEnMano = 0;
      let pendienteCobro = 0;
      let cobrosAtrasados = 0;
      const today = new Date().toISOString().split('T')[0];

      if (fetchedPlans) {
        fetchedPlans.forEach((plan: any) => {
          if (plan.installments) {
            plan.installments.forEach((inst: any) => {
              const amount = Number(inst.amount) || 0;
              
              // Calculate collected amount for this installment
              let collectedForInst = 0;
              if (inst.payment_records) {
                inst.payment_records.forEach((rec: any) => {
                  collectedForInst += Number(rec.amount) || 0;
                });
              }

              // Update totals
              totalFacturado += amount;
              cobradoEnMano += collectedForInst;
              pendienteCobro += (amount - collectedForInst);

              // Check if Overdue (due date in the past, and not fully paid)
              const isPaid = inst.status === 'PAID' || Math.abs(amount - collectedForInst) < 0.01;
              const hasDueDatePassed = inst.due_date && inst.due_date < today;
              
              if (!isPaid && hasDueDatePassed) {
                cobrosAtrasados += (amount - collectedForInst);
              }
            });
          }
        });
      }

      setMetrics({
        totalFacturado,
        cobradoEnMano,
        pendienteCobro,
        cobrosAtrasados,
        activeCurrency: defaultCurrency
      });

    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'ESTIMATED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'IN_PROGRESS': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'COMPLETED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'ARCHIVED': return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const getProjectTypeName = (type: string) => {
    switch (type) {
      case 'WEB_APP': return 'Aplicación Web';
      case 'MOBILE_APP': return 'App Móvil';
      case 'FULLSTACK': return 'Web + App Móvil';
      case 'API_BACKEND': return 'API / Backend';
      case 'LANDING_PAGE': return 'Landing Page';
      case 'MVP': return 'MVP Rápido';
      default: return type;
    }
  };

  const formatCurrencyValue = (val: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl">⚡</div>
          <span className="text-sm text-slate-400 font-medium">Cargando tu panel financiero...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header/Nav */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white">
              <span className="text-blue-500 font-extrabold text-2xl">⚡</span> Ciclic
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm text-slate-300">
              <Link href="/dashboard" className="text-blue-400 font-semibold transition-colors">Dashboard</Link>
              <Link href="/settings" className="hover:text-white transition-colors">Configuraciones</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/settings"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-900 hover:bg-red-950/35 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/40 transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">¡Hola, {userName}! 👋</h1>
            <p className="text-xs text-slate-400">
              Aquí tienes el resumen financiero y operativo de tus proyectos de desarrollo de software.
            </p>
          </div>
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all cursor-pointer shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" /> Nueva Estimación
          </Link>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Facturado */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/85 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Facturado</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><FileText className="w-4 h-4" /></div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">
                {formatCurrencyValue(metrics.totalFacturado, metrics.activeCurrency)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Suma acumulada de planes de pago activos</p>
            </div>
          </div>

          {/* Card 2: Cobrado en Mano */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/85 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cobrado en Mano</span>
              <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400"><CheckCircle2 className="w-4 h-4" /></div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-green-400">
                {formatCurrencyValue(metrics.cobradoEnMano, metrics.activeCurrency)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Pagos percibidos y validados</p>
            </div>
          </div>

          {/* Card 3: Pendiente de Cobro */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/85 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendiente de Cobro</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Clock className="w-4 h-4" /></div>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-400">
                {formatCurrencyValue(metrics.pendienteCobro, metrics.activeCurrency)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Por facturar o cuotas no vencidas</p>
            </div>
          </div>

          {/* Card 4: Cobros Atrasados */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/85 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cobros Atrasados</span>
              <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><AlertTriangle className="w-4 h-4" /></div>
            </div>
            <div>
              <p className={`text-2xl font-extrabold ${metrics.cobrosAtrasados > 0 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                {formatCurrencyValue(metrics.cobrosAtrasados, metrics.activeCurrency)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Cuotas con fecha de vencimiento superada</p>
            </div>
          </div>
        </div>

        {/* Cash Flow Projection Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/10 via-slate-900 to-slate-900 border border-blue-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white">Previsión de Caja a 30/60/90 días</h4>
              <p className="text-xs text-slate-400">
                El flujo proyectado estima un ingreso mensual estimado de <strong className="text-blue-400 font-semibold">{formatCurrencyValue(metrics.pendienteCobro / 3, metrics.activeCurrency)}</strong> basado en tus hitos activos de desarrollo.
              </p>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" /> Mis Estimaciones y Proyectos
            </h3>
            <span className="text-xs text-slate-400">{projects.length} en total</span>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16 space-y-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-300">Aún no tienes proyectos creados</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Crea tu primera estimación de software modular y desglosa tareas utilizando el algoritmo estadístico PERT.
                </p>
              </div>
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Crear Proyecto
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-850">
              {projects.map((project) => (
                <div key={project.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/20 px-2 rounded-lg transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/projects/${project.id}`} className="font-bold text-white hover:text-blue-400 text-base hover:underline transition-colors flex items-center gap-1">
                        {project.name}
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                      <span>Cliente: <strong className="text-slate-300">{project.client_name || 'No especificado'}</strong></span>
                      <span>Categoría: <strong className="text-slate-300">{getProjectTypeName(project.project_type)}</strong></span>
                      <span>Creado: <strong className="text-slate-300">{new Date(project.created_at).toLocaleDateString('es-AR')}</strong></span>
                    </div>
                  </div>

                  {/* Actions / Links */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 transition-colors flex items-center gap-1"
                    >
                      Editar Estimación
                    </Link>
                    <Link
                      href={`/projects/${project.id}/payments`}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 transition-colors flex items-center gap-1"
                    >
                      Hitos & Pagos
                    </Link>
                    <Link
                      href={`/projects/${project.id}/proposal`}
                      className="px-2 py-1.5 rounded-lg bg-blue-900/10 hover:bg-blue-900/20 text-blue-400 border border-blue-900/20 text-xs transition-colors flex items-center gap-1"
                      title="Ver Propuesta"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Propuesta
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mt-auto">
        <p>© {new Date().getFullYear()} Ciclic. Todos los derechos reservados. Diseñado con rigor de ingeniería.</p>
      </footer>
    </div>
  );
}