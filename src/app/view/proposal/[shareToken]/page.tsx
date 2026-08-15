'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/client';
import { Download } from 'lucide-react';

interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name?: string;
  description?: string;
  project_type: string;
  currency: string;
  contingency_percentage: number;
  profit_margin_percentage: number;
  tax_percentage: number;
}

interface Module {
  id: string;
  name: string;
  tasks?: Array<{
    id: string;
    title: string;
    calculated_hours: number;
    complexity_multiplier: number;
  }>;
}

interface Installment {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  due_date?: string;
}

interface Profile {
  display_name: string;
  tax_id?: string;
  contact_email?: string;
  website_url?: string;
  logo_url?: string;
}

export default function PublicProposalPage() {
  const params = useParams();
  const supabase = createClient();
  const shareToken = params.shareToken as string;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPublicProposal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Project by share_token
      const { data: proj, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (projError || !proj) {
        throw new Error('La cotización no existe o el enlace público ha expirado.');
      }
      setProject(proj);

      // 2. Fetch Creator Profile for Branding
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', proj.user_id)
        .single();
      setProfile(prof);

      // 3. Fetch Modules & Tasks
      const { data: mods } = await supabase
        .from('modules')
        .select('*, tasks(*)')
        .eq('project_id', proj.id);
      if (mods) setModules(mods);

      // 4. Fetch Payment Plan & Installments
      const { data: plan } = await supabase
        .from('payment_plans')
        .select('id')
        .eq('project_id', proj.id)
        .single();

      if (plan) {
        const { data: insts } = await supabase
          .from('installments')
          .select('*')
          .eq('payment_plan_id', plan.id)
          .order('due_date', { ascending: true });
        if (insts) setInstallments(insts);
      }

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al cargar la propuesta.');
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, shareToken]);

  useEffect(() => {
    if (shareToken) {
      loadPublicProposal();
    }
  }, [shareToken, loadPublicProposal]);

  const getCalculatedTotal = () => {
    let totalLaborCost = 0;
    modules.forEach(mod => {
      if (mod.tasks) {
        mod.tasks.forEach(t => {
          totalLaborCost += Number(t.calculated_hours) * Number(t.complexity_multiplier) * 60; // default average snapshot for calculation
        });
      }
    });

    if (!project) return 0;
    const contingency = project.contingency_percentage / 100;
    const profitMargin = project.profit_margin_percentage / 100;
    const tax = project.tax_percentage / 100;

    const subtotalOperativo = totalLaborCost;
    const baseWithRiesgo = subtotalOperativo + (subtotalOperativo * contingency);
    const baseImponible = baseWithRiesgo + (baseWithRiesgo * profitMargin);
    return baseImponible + (baseImponible * tax);
  };

  const projectTotal = getCalculatedTotal();

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl">⚡</div>
          <span className="text-sm text-slate-400 font-medium">Cargando propuesta comercial...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">!</div>
          <h2 className="text-xl font-bold text-white">Error de Enlace</h2>
          <p className="text-slate-400 text-xs leading-normal">{error || 'La propuesta especificada no existe.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Floating Header for Public client (no login required) */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 no-print">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <span className="text-blue-500 font-extrabold text-xl">⚡</span> Ciclic Propuesta
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/10"
          >
            <Download className="w-3.5 h-3.5" /> Descargar PDF / Imprimir
          </button>
        </div>
      </header>

      {/* Sheet view */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 md:py-16 bg-slate-900/10 md:my-6 rounded-2xl border border-slate-900 shadow-2xl print:bg-white print:border-0 print:shadow-none print:my-0 print:px-0">
        <div className="space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-slate-800 print:border-slate-200">
            <div className="space-y-3">
              {profile?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logo_url} alt="Logo" className="h-10 object-contain print:text-black" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base">⚡</div>
              )}
              <div className="space-y-1">
                <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest print:text-slate-500">PROPUESTA DE SOFTWARE</h2>
                <h1 className="text-3xl font-extrabold text-white print:text-black">{project.name}</h1>
                <p className="text-xs text-slate-500 print:text-slate-400 font-medium">Oferta Comercial Valida por 15 Días</p>
              </div>
            </div>

            {/* Provider info */}
            <div className="text-xs text-slate-400 md:text-right space-y-1 print:text-slate-600">
              <p className="font-bold text-white print:text-black">{profile?.display_name || 'Desarrollador Independiente'}</p>
              {profile?.tax_id && <p>ID Fiscal: {profile.tax_id}</p>}
              {profile?.contact_email && <p>Email: {profile.contact_email}</p>}
              {profile?.website_url && <p>Web: {profile.website_url}</p>}
            </div>
          </div>

          {/* Client & description */}
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="md:col-span-2 space-y-2">
              <h3 className="font-bold text-white print:text-black border-b border-slate-850 pb-1 print:border-slate-200 uppercase text-xs tracking-wider">Alcance y Descripción</h3>
              <p className="text-slate-400 text-xs leading-relaxed print:text-slate-650">{project.description || 'Descripción del proyecto de software modular y desglosado.'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-white print:text-black border-b border-slate-850 pb-1 print:border-slate-200 uppercase text-xs tracking-wider">Cliente</h3>
              <p className="font-bold text-slate-300 text-xs print:text-black">{project.client_name || 'No especificado'}</p>
              <p className="text-slate-500 text-[11px] print:text-slate-400">Fecha de Emisión: {new Date().toLocaleDateString('es-AR')}</p>
            </div>
          </div>

          {/* Modules WBS */}
          <div className="space-y-4">
            <h3 className="font-bold text-white print:text-black border-b border-slate-850 pb-2 print:border-slate-200 uppercase text-xs tracking-wider">Desglose de Componentes (WBS)</h3>
            <div className="space-y-3">
              {modules.map((mod) => (
                <div key={mod.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-850/60 print:bg-white print:border-slate-200">
                  <h4 className="font-bold text-slate-200 text-sm print:text-black flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {mod.name}
                  </h4>
                  {mod.tasks && mod.tasks.length > 0 && (
                    <ul className="mt-2 pl-4 list-disc text-xs text-slate-400 space-y-1 print:text-slate-600">
                      {mod.tasks.map(t => (
                        <li key={t.id}>{t.title}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          {installments.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-white print:text-black border-b border-slate-850 pb-2 print:border-slate-200 uppercase text-xs tracking-wider">Plan de Pagos e Hitos</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {installments.map((inst, idx) => (
                  <div key={inst.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 print:bg-white print:border-slate-200 flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-white print:text-black">{inst.name}</p>
                      <p className="text-[10px] text-slate-500">Porcentaje: {inst.percentage}% {inst.due_date && ` - Due: ${inst.due_date}`}</p>
                    </div>
                    <span className="font-extrabold text-blue-400 print:text-black text-sm">
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(inst.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proposal Summary Total */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-xs text-slate-500 leading-normal max-w-sm print:text-slate-400">
              Esta propuesta se rige bajo los términos de Ciclic. Los precios no incluyen hardware de terceros o licencias no descritas.
            </p>
            <div className="p-6 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-right print:bg-white print:border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block print:text-slate-500">PRESUPUESTO TOTAL PROPUESTO</span>
              <span className="text-3xl font-black text-blue-400 print:text-black">
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(projectTotal || installments.reduce((acc, i) => acc + Number(i.amount), 0))}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mt-auto no-print">
        <p>© {new Date().getFullYear()} Ciclic. Todos los derechos reservados. Diseñado con rigor de ingeniería.</p>
      </footer>
    </div>
  );
}