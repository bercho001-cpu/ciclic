'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/client';
import { 
  ArrowLeft, Plus, DollarSign, Calendar, AlertTriangle, 
  CheckCircle2, Clock, Trash2, Save, FileText, Check 
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  currency: string;
}

interface Installment {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  status: 'DRAFT' | 'INVOICED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  due_date?: string;
  payment_records?: PaymentRecord[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  payment_method: string;
  reference_id?: string;
  paid_at: string;
}

export default function PaymentPlanPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [paymentPlanId, setPaymentPlanId] = useState<string | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [projectTotal, setProjectTotal] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Split presets
  const [selectedPreset, setSelectedPreset] = useState<'30_40_30' | '50_50' | 'custom'>('30_40_30');

  // New payment recording modal / form state
  const [recordingPaymentFor, setRecordingPaymentFor] = useState<Installment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'Transferencia',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  const loadPaymentAndProjectDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch Project
      const { data: proj, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projError || !proj) {
        throw new Error('Proyecto no encontrado.');
      }
      setProject(proj);

      // Calculate project total from modules and tasks
      const { data: mods } = await supabase
        .from('modules')
        .select('*, tasks(*)')
        .eq('project_id', projectId);

      let totalLaborCost = 0;
      if (mods) {
        mods.forEach(mod => {
          if (mod.tasks) {
            mod.tasks.forEach((task: any) => {
              const hours = Number(task.calculated_hours) * Number(task.complexity_multiplier);
              totalLaborCost += hours * Number(task.hourly_rate_snapshot);
            });
          }
        });
      }

      const contingency = proj.contingency_percentage / 100;
      const profitMargin = proj.profit_margin_percentage / 100;
      const tax = proj.tax_percentage / 100;

      const subtotalOperativo = totalLaborCost;
      const baseWithRiesgo = subtotalOperativo + (subtotalOperativo * contingency);
      const baseImponible = baseWithRiesgo + (baseWithRiesgo * profitMargin);
      const calculatedTotal = baseImponible + (baseImponible * tax);
      setProjectTotal(Number(calculatedTotal.toFixed(2)));

      // Fetch existing Payment Plan
      const { data: plan } = await supabase
        .from('payment_plans')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (plan) {
        setPaymentPlanId(plan.id);

        // Fetch installments
        const { data: insts } = await supabase
          .from('installments')
          .select('*, payment_records(*)')
          .eq('payment_plan_id', plan.id)
          .order('due_date', { ascending: true });

        if (insts) {
          setInstallments(insts);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cargar los pagos y presupuesto.' });
    } finally {
      setLoading(false);
    }
  }, [supabase, projectId, router]);

  useEffect(() => {
    if (projectId) {
      loadPaymentAndProjectDetails();
    }
  }, [projectId, loadPaymentAndProjectDetails]);

  // Generate Payment Schedule (Penny Allocation!)
  const handleGeneratePlan = async () => {
    if (!project || projectTotal <= 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Define percentages
      let percentages: number[] = [];
      let names: string[] = [];

      if (selectedPreset === '30_40_30') {
        percentages = [30, 40, 30];
        names = ['Anticipo Inicial', 'Hito Intermedio (Beta/MVP)', 'Entrega y Traspaso Final'];
      } else if (selectedPreset === '50_50') {
        percentages = [50, 50];
        names = ['Anticipo de Firma', 'Entrega en Producción'];
      } else {
        percentages = [100];
        names = ['Pago Único'];
      }

      // Calculate Split with Penny Allocation
      const totalCents = Math.round(projectTotal * 100);
      let remainingCents = totalCents;
      const generatedAmounts: number[] = [];

      percentages.forEach((pct, i) => {
        if (i === percentages.length - 1) {
          // Assign remaining penny residual to last item
          generatedAmounts.push(remainingCents / 100);
        } else {
          const splitAmountCents = Math.round((totalCents * pct) / 100);
          generatedAmounts.push(splitAmountCents / 100);
          remainingCents -= splitAmountCents;
        }
      });

      // Insert Plan or Upsert
      let activePlanId = paymentPlanId;

      if (!activePlanId) {
        const { data: newPlan, error: planError } = await supabase
          .from('payment_plans')
          .insert({
            project_id: projectId,
            user_id: user.id,
            status: 'PENDING'
          })
          .select()
          .single();

        if (planError) throw planError;
        activePlanId = newPlan.id;
        setPaymentPlanId(newPlan.id);
      } else {
        // Clear previous installments if changing plan
        await supabase.from('installments').delete().eq('payment_plan_id', activePlanId);
      }

      // Insert Installments
      const today = new Date();
      const insertInsts = generatedAmounts.map((amt, index) => {
        const dueDate = new Date();
        dueDate.setDate(today.getDate() + (index * 30)); // 30 day intervals roughly
        
        return {
          payment_plan_id: activePlanId,
          name: names[index],
          percentage: percentages[index],
          amount: amt,
          status: 'DRAFT',
          due_date: dueDate.toISOString().split('T')[0]
        };
      });

      const { data: createdInsts, error: instError } = await supabase
        .from('installments')
        .insert(insertInsts)
        .select();

      if (instError) throw instError;

      if (createdInsts) {
        setInstallments(createdInsts);
        setMessage({ type: 'success', text: '¡Plan de cuotas generado con precisión al centavo!' });
      }

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al generar el cronograma de cuotas.' });
    }
  };

  // Record a payment record (matches Receipt / Payment receipts RF-5.2)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingPaymentFor || !paymentPlanId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Insert Payment Record
      const { data: record, error: recError } = await supabase
        .from('payment_records')
        .insert({
          installment_id: recordingPaymentFor.id,
          amount: Number(paymentForm.amount),
          payment_method: paymentForm.method,
          reference_id: paymentForm.reference || null,
          paid_at: paymentForm.date
        })
        .select()
        .single();

      if (recError) throw recError;

      // 2. Fetch payments for this installment to calculate new status
      const { data: recs } = await supabase
        .from('payment_records')
        .select('amount')
        .eq('installment_id', recordingPaymentFor.id);

      let totalCollected = 0;
      if (recs) {
        recs.forEach(r => { totalCollected += Number(r.amount) || 0; });
      }

      let newStatus: Installment['status'] = 'PARTIALLY_PAID';
      if (totalCollected >= Number(recordingPaymentFor.amount)) {
        newStatus = 'PAID';
      }

      // 3. Update Installment Status in DB
      await supabase
        .from('installments')
        .update({ status: newStatus })
        .eq('id', recordingPaymentFor.id);

      // Refresh list
      await loadPaymentAndProjectDetails();

      setRecordingPaymentFor(null);
      setPaymentForm({ amount: 0, method: 'Transferencia', reference: '', date: new Date().toISOString().split('T')[0] });
      setMessage({ type: 'success', text: '¡Pago registrado y estado de cuota actualizado!' });

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al registrar el cobro.' });
    }
  };

  // Metrics
  const getCollectionsMetrics = () => {
    let collected = 0;
    let pending = 0;

    installments.forEach(inst => {
      let instPaid = 0;
      if (inst.payment_records) {
        inst.payment_records.forEach(r => { instPaid += Number(r.amount) || 0; });
      }
      collected += instPaid;
      pending += (Number(inst.amount) - instPaid);
    });

    return {
      collected,
      pending
    };
  };

  const metrics = getCollectionsMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl">⚡</div>
          <span className="text-sm text-slate-400 font-medium">Cargando cronograma financiero...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center gap-4">
        <p className="text-slate-400">Proyecto no encontrado.</p>
        <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold">Volver al Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
              <span className="text-blue-500 font-extrabold text-xl">⚡</span> Ciclic
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-xs text-slate-400 max-w-[200px] truncate">{project.name}</span>
          </div>
          <Link 
            href={`/projects/${projectId}`}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs transition-all"
          >
            Volver a WBS
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        {message && (
          <div className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{message.text}</div>
          </div>
        )}

        {/* Dashboard overview */}
        <div className="grid sm:grid-cols-3 gap-6">
          {/* Total Budget Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Presupuesto Acordado</span>
            <p className="text-2xl font-extrabold text-white">
              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(projectTotal)}
            </p>
            <span className="text-[10px] text-slate-400 block mt-2">Basado en el desglose WBS de mano de obra e impuestos</span>
          </div>

          {/* Collected Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Cobrado (En Mano)</span>
            <p className="text-2xl font-extrabold text-green-400">
              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(metrics.collected)}
            </p>
            <span className="text-[10px] text-slate-400 block mt-2">Monto verificado con comprobantes de pago</span>
          </div>

          {/* Pending Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Pendiente de Cobro</span>
            <p className="text-2xl font-extrabold text-amber-400">
              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(metrics.pending)}
            </p>
            <span className="text-[10px] text-slate-400 block mt-2">Cuotas pendientes o en facturación</span>
          </div>
        </div>

        {/* Create Plan form if empty */}
        {installments.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center max-w-xl mx-auto space-y-6">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white">Generar Esquema de Pagos en Cuotas</h2>
              <p className="text-xs text-slate-400">
                Divide el presupuesto en cuotas fraccionadas. El algoritmo mitigará discrepancias de redondeo al centavo automáticamente.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <button
                onClick={() => setSelectedPreset('30_40_30')}
                className={`p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedPreset === '30_40_30'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Preset 30 / 40 / 30
                <span className="block text-[9px] font-medium text-slate-400 mt-1">Recomendado</span>
              </button>
              <button
                onClick={() => setSelectedPreset('50_50')}
                className={`p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedPreset === '50_50'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Split 50 / 50
                <span className="block text-[9px] font-medium text-slate-400 mt-1">Sencillo</span>
              </button>
            </div>

            <button
              onClick={handleGeneratePlan}
              className="w-full max-w-sm py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Generar Cuotas
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Installments List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-white text-base">Hitos y Plan de Pagos Activo</h3>
              <div className="space-y-3">
                {installments.map((inst, idx) => (
                  <div key={inst.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-white text-sm">{inst.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {inst.percentage}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-[11px] text-slate-500 pl-8">
                        <span>Vence: <strong className="text-slate-400">{inst.due_date || 'Sin fecha'}</strong></span>
                        <span className="flex items-center gap-1">
                          Estado: 
                          <strong className={`uppercase ${
                            inst.status === 'PAID' ? 'text-green-400' : 'text-amber-400'
                          }`}>{inst.status}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pl-8 sm:pl-0">
                      <span className="font-extrabold text-white text-base">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(inst.amount)}
                      </span>
                      {inst.status !== 'PAID' && (
                        <button
                          onClick={() => { setRecordingPaymentFor(inst); setPaymentForm(prev => ({ ...prev, amount: Number(inst.amount) })); }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          Registrar Cobro
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Payment history / recording form */}
            <div className="space-y-6">
              {recordingPaymentFor ? (
                <form onSubmit={handleRecordPayment} className="glass-panel p-6 rounded-2xl border border-blue-500/40 space-y-4">
                  <div className="border-b border-slate-850 pb-2">
                    <h3 className="font-bold text-white text-sm">Registrar Cobro</h3>
                    <p className="text-[10px] text-slate-400">Registrando pago recibido para: <strong>{recordingPaymentFor.name}</strong></p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400">Monto Percibido ({project.currency}) *</label>
                    <input
                      type="number"
                      required
                      min={0.01}
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400">Método de Pago</label>
                    <select
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200"
                    >
                      <option value="Transferencia">Transferencia Bancaria</option>
                      <option value="Stripe">Stripe / Tarjeta</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Crypto">Criptomonedas</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400">Referencia / ID Transacción</label>
                    <input
                      type="text"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-white"
                      placeholder="ej: TXN-998822"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400">Fecha de Cobro *</label>
                    <input
                      type="date"
                      required
                      value={paymentForm.date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRecordingPaymentFor(null)}
                      className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors"
                    >
                      Guardar Comprobante
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4">
                  <h3 className="font-bold text-white text-sm border-b border-slate-850 pb-2">Historial de Pagos</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    Haz clic en "Registrar Cobro" en cualquiera de las cuotas activas para registrar y asociar los comprobantes de transferencia.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mt-auto">
        <p>© {new Date().getFullYear()} Ciclic. Todos los derechos reservados. Diseñado con rigor de ingeniería.</p>
      </footer>
    </div>
  );
}