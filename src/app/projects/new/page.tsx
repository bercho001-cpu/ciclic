'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/client';
import { 
  ArrowLeft, Save, Briefcase, FileText, 
  Settings, AlertTriangle, CheckCircle2 
} from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<'WEB_APP' | 'MOBILE_APP' | 'FULLSTACK' | 'API_BACKEND' | 'LANDING_PAGE' | 'MVP'>('WEB_APP');
  const [currency, setCurrency] = useState('USD');
  const [contingencyPercentage, setContingencyPercentage] = useState(15);
  const [profitMarginPercentage, setProfitMarginPercentage] = useState(20);
  const [taxPercentage, setTaxPercentage] = useState(0);

  // Fetch default currency from user profile
  const fetchDefaultCurrency = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('default_currency')
        .eq('id', user.id)
        .single();
      
      if (profile?.default_currency) {
        setCurrency(profile.default_currency);
      }
    } catch (err) {
      console.error('Error fetching default currency:', err);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchDefaultCurrency();
  }, [fetchDefaultCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado.');

      // Get active rate card for currency
      const { data: cards } = await supabase
        .from('rate_cards')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      const rateCardId = cards?.id || null;

      // Insert Project
      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          rate_card_id: rateCardId,
          name,
          client_name: clientName || null,
          description: description || null,
          project_type: projectType,
          status: 'DRAFT',
          currency,
          contingency_percentage: Number(contingencyPercentage),
          profit_margin_percentage: Number(profitMarginPercentage),
          tax_percentage: Number(taxPercentage)
        })
        .select()
        .single();

      if (createError) throw createError;

      if (project) {
        router.push(`/projects/${project.id}`);
      }
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al registrar el proyecto.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Nav */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white">
            <span className="text-blue-500 font-extrabold text-2xl">⚡</span> Ciclic
          </Link>
          <Link href="/dashboard" className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors">
            Volver al Dashboard
          </Link>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-white">Nueva Estimación de Software</h1>
            <p className="text-xs text-slate-400">Configura la información básica y el motor financiero de tu proyecto.</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-400" /> 1. Información General
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Proyecto *</label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="ej: Pasarela de Pagos Stripe, Red Social de Nicho"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="client" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Cliente / Empresa</label>
              <input
                type="text"
                id="client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="ej: Acme Corp"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="type" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de Proyecto</label>
              <select
                id="type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="WEB_APP">Aplicación Web (SaaS, Admin Panel)</option>
                <option value="MOBILE_APP">App Móvil (iOS, Android, Flutter)</option>
                <option value="FULLSTACK">Fullstack (Web + Mobile App)</option>
                <option value="API_BACKEND">API & Backend Service</option>
                <option value="LANDING_PAGE">Landing Page Corporativa</option>
                <option value="MVP">MVP Rápido (Prueba de concepto)</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label htmlFor="description" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción Breve</label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Describe el alcance o metas principales..."
              />
            </div>
          </div>

          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center gap-2 pt-4">
            <Settings className="w-4 h-4 text-blue-400" /> 2. Motor Financiero e Impuestos
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="currency" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Moneda del Proyecto</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="ARS">ARS ($)</option>
                <option value="MXN">MXN ($)</option>
                <option value="COP">COP ($)</option>
                <option value="BRL">BRL (R$)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="contingency" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Margen de Contingencia / Riesgo (%)</label>
              <input
                type="number"
                id="contingency"
                required
                min={0}
                max={100}
                value={contingencyPercentage}
                onChange={(e) => setContingencyPercentage(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="profit" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Margen de Rentabilidad / Ganancia (%)</label>
              <input
                type="number"
                id="profit"
                required
                min={0}
                max={200}
                value={profitMarginPercentage}
                onChange={(e) => setProfitMarginPercentage(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="tax" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Impuestos / Tasa Fiscal (IVA/VAT) (%)</label>
              <input
                type="number"
                id="tax"
                required
                min={0}
                max={100}
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {loading ? 'Creando estimación...' : 'Continuar al Desglose WBS'}
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mt-auto">
        <p>© {new Date().getFullYear()} Ciclic. Todos los derechos reservados. Diseñado con rigor de ingeniería.</p>
      </footer>
    </div>
  );
}