'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/client';
import { 
  ArrowLeft, Plus, Trash2, Save, Calendar, FileText, 
  AlertTriangle, Check, Edit, User, DollarSign, Settings 
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  client_name?: string;
  description?: string;
  project_type: string;
  status: 'DRAFT' | 'ESTIMATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  currency: string;
  contingency_percentage: number;
  profit_margin_percentage: number;
  tax_percentage: number;
}

interface Module {
  id: string;
  name: string;
  description?: string;
  tasks?: Task[];
}

interface Task {
  id: string;
  module_id: string;
  role_id?: string;
  hourly_rate_snapshot: number;
  title: string;
  description?: string;
  optimistic_hours: number;
  probable_hours: number;
  pessimistic_hours: number;
  calculated_hours: number;
  complexity_multiplier: number;
}

interface Role {
  id: string;
  role_name: string;
  hourly_bill_rate: number;
}

export default function ProjectEstimatorPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [newModuleName, setNewModuleName] = useState('');
  const [activeModuleForTask, setActiveModuleIdForTask] = useState<string | null>(null);

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    role_id: '',
    optimistic: 4,
    probable: 8,
    pessimistic: 16,
    multiplier: 1.0
  });

  const loadProjectData = useCallback(async () => {
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

      // Fetch Roles from the user's rate cards to populate selection
      const { data: userRoles } = await supabase
        .from('roles')
        .select('id, role_name, hourly_bill_rate')
        .eq('user_id', user.id);
      
      if (userRoles) {
        setRoles(userRoles);
        if (userRoles.length > 0) {
          setTaskForm(prev => ({ ...prev, role_id: userRoles[0].id }));
        }
      }

      // Fetch Modules & Tasks
      const { data: mods } = await supabase
        .from('modules')
        .select('*, tasks(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (mods) {
        setModules(mods);
        if (mods.length > 0) {
          setActiveModuleIdForTask(mods[0].id);
        }
      }

    } catch (err: unknown) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cargar los datos del proyecto.' });
    } finally {
      setLoading(false);
    }
  }, [supabase, projectId, router]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

  // Create Module
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newModuleName) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newMod, error } = await supabase
        .from('modules')
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: newModuleName,
        })
        .select()
        .single();

      if (error) throw error;

      if (newMod) {
        const modWithTasks = { ...newMod, tasks: [] };
        setModules([...modules, modWithTasks]);
        setNewModuleName('');
        if (!activeModuleForTask) {
          setActiveModuleIdForTask(newMod.id);
        }
        setMessage({ type: 'success', text: 'Módulo agregado correctamente.' });
      }
    } catch (err: unknown) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al agregar el módulo.' });
    }
  };

  // Delete Module
  const handleDeleteModule = async (moduleId: string) => {
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      setModules(modules.filter(m => m.id !== moduleId));
      if (activeModuleForTask === moduleId) {
        setActiveModuleIdForTask(modules.find(m => m.id !== moduleId)?.id || null);
      }
      setMessage({ type: 'success', text: 'Módulo eliminado.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al eliminar el módulo.' });
    }
  };

  // Create Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !activeModuleForTask || !taskForm.title) return;

    // Validation
    if (taskForm.optimistic > taskForm.probable || taskForm.probable > taskForm.pessimistic) {
      setMessage({ type: 'error', text: 'Invariante fallido: Optimista ≤ Probable ≤ Pesimista' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find selected role rate
      const selectedRole = roles.find(r => r.id === taskForm.role_id);
      const rate = selectedRole ? selectedRole.hourly_bill_rate : 0;

      // Calculate PERT Hours
      const calculated = (Number(taskForm.optimistic) + 4 * Number(taskForm.probable) + Number(taskForm.pessimistic)) / 6;

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
          module_id: activeModuleForTask,
          user_id: user.id,
          role_id: taskForm.role_id || null,
          hourly_rate_snapshot: rate,
          title: taskForm.title,
          optimistic_hours: Number(taskForm.optimistic),
          probable_hours: Number(taskForm.probable),
          pessimistic_hours: Number(taskForm.pessimistic),
          calculated_hours: Number(calculated.toFixed(2)),
          complexity_multiplier: Number(taskForm.multiplier)
        })
        .select()
        .single();

      if (error) throw error;

      if (newTask) {
        // Append to states
        setModules(modules.map(mod => {
          if (mod.id === activeModuleForTask) {
            return {
              ...mod,
              tasks: [...(mod.tasks || []), newTask]
            };
          }
          return mod;
        }));

        setTaskForm(prev => ({
          ...prev,
          title: '',
          optimistic: 4,
          probable: 8,
          pessimistic: 16
        }));
        setMessage({ type: 'success', text: 'Tarea agregada.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al agregar la tarea.' });
    }
  };

  // Delete Task
  const handleDeleteTask = async (moduleId: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setModules(modules.map(mod => {
        if (mod.id === moduleId) {
          return {
            ...mod,
            tasks: (mod.tasks || []).filter(t => t.id !== taskId)
          };
        }
        return mod;
      }));
      setMessage({ type: 'success', text: 'Tarea eliminada.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al eliminar la tarea.' });
    }
  };

  // Financial calculations in cascade
  const getFinancialTotals = () => {
    let totalLaborHours = 0;
    let totalLaborCost = 0;

    modules.forEach(mod => {
      if (mod.tasks) {
        mod.tasks.forEach(task => {
          const hours = Number(task.calculated_hours) * Number(task.complexity_multiplier);
          totalLaborHours += hours;
          totalLaborCost += hours * Number(task.hourly_rate_snapshot);
        });
      }
    });

    if (!project) return { hours: 0, labor: 0, total: 0, subtotal: 0, risk: 0, profit: 0, tax: 0 };

    const contingency = project.contingency_percentage / 100;
    const profitMargin = project.profit_margin_percentage / 100;
    const tax = project.tax_percentage / 100;

    // Cascade formulas
    const subtotalOperativo = totalLaborCost; // No other external costs modeled in this simplified view yet
    const montoContingencia = subtotalOperativo * contingency;
    const baseOperativaConRiesgo = subtotalOperativo + montoContingencia;
    const montoGanancia = baseOperativaConRiesgo * profitMargin;
    const baseImponible = baseOperativaConRiesgo + montoGanancia;
    const montoImpuestos = baseImponible * tax;
    const precioFinal = baseImponible + montoImpuestos;

    return {
      hours: totalLaborHours,
      labor: totalLaborCost,
      subtotal: subtotalOperativo,
      risk: montoContingencia,
      profit: montoGanancia,
      tax: montoImpuestos,
      total: precioFinal
    };
  };

  const totals = getFinancialTotals();

  // Save the complete budget (freeze/estimate status update)
  const handleFreezeEstimate = async () => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'ESTIMATED' })
        .eq('id', projectId);

      if (error) throw error;
      setProject({ ...project, status: 'ESTIMATED' });
      setMessage({ type: 'success', text: '¡Proyecto cotizado y tarifas congeladas con éxito!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al congelar presupuesto.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl">⚡</div>
          <span className="text-sm text-slate-400 font-medium">Cargando estimador WBS/PERT...</span>
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
          <div className="flex gap-2">
            <Link 
              href={`/projects/${projectId}/payments`}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs transition-colors"
            >
              Hitos de Pago
            </Link>
            <Link 
              href={`/projects/${projectId}/proposal`}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Ver Propuesta
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {message && (
          <div className={`p-4 rounded-xl text-sm flex items-start gap-3 border mb-6 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{message.text}</div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left / Middle: Breakdown WBS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details Panel */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">WBS ESTIMATOR</span>
                <span className="text-xs text-slate-500">{project.project_type}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">{project.name}</h1>
              {project.description && <p className="text-xs text-slate-400">{project.description}</p>}
            </div>

            {/* Modules / Library Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Estructura de Módulos (WBS)</h3>
                
                {/* Form to Add Module */}
                <form onSubmit={handleAddModule} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    placeholder="Nuevo módulo (ej: Pagos)"
                    className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button type="submit" className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Módulo
                  </button>
                </form>
              </div>

              {/* Modules List */}
              {modules.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-950/25 space-y-2">
                  <p className="text-xs text-slate-500 font-medium">Aún no has agregado módulos a la cotización.</p>
                  <p className="text-[10px] text-slate-600">Agrega un módulo arriba para desglosar tus requerimientos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((mod) => (
                    <div 
                      key={mod.id} 
                      className={`p-5 rounded-2xl border transition-all ${
                        activeModuleForTask === mod.id 
                          ? 'bg-slate-900 border-blue-500/40' 
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => setActiveModuleIdForTask(mod.id)}
                    >
                      <div className="flex justify-between items-center pb-3 border-b border-slate-850/60 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <h4 className="font-bold text-white text-sm">{mod.name}</h4>
                          <span className="text-[10px] text-slate-500">({mod.tasks?.length || 0} tareas)</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }}
                          className="p-1 rounded bg-slate-950 text-slate-600 hover:text-red-400 border border-slate-850 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Tasks of this Module */}
                      <div className="space-y-2">
                        {(!mod.tasks || mod.tasks.length === 0) ? (
                          <p className="text-[11px] text-slate-500 py-2">Haz clic para seleccionar este módulo e introduce tareas en el formulario lateral.</p>
                        ) : (
                          <div className="space-y-2">
                            {mod.tasks.map((task) => (
                              <div key={task.id} className="p-3 rounded-lg bg-slate-950 border border-slate-850/80 flex items-center justify-between text-xs group">
                                <div className="space-y-1">
                                  <p className="font-semibold text-white">{task.title}</p>
                                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                    <span className="text-blue-400">{roles.find(r => r.id === task.role_id)?.role_name || 'Sin rol'}</span>
                                    <span>PERT: <strong className="text-slate-400">{task.calculated_hours}h</strong> (O:{task.optimistic_hours} P:{task.probable_hours} Pes:{task.pessimistic_hours})</span>
                                    {Number(task.complexity_multiplier) !== 1 && (
                                      <span className="text-amber-500 font-bold">Mult: {task.complexity_multiplier}x</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-200">{Number(task.calculated_hours * task.complexity_multiplier).toFixed(2)}h</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(mod.id, task.id); }}
                                    className="p-1 rounded bg-slate-900 text-slate-600 hover:text-red-400 border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <Trash2 className="w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Forms & Live Calculations */}
          <div className="space-y-6">
            {/* Task Add Form (if we have active module) */}
            {activeModuleForTask && (
              <form onSubmit={handleAddTask} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Agregar Tarea PERT</h3>
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-bold uppercase">
                    {modules.find(m => m.id === activeModuleForTask)?.name}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400">Nombre de la Funcionalidad / Tarea</label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs placeholder-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="ej: Integración de checkout de Stripe"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400">Rol Responsable (Tarifa)</label>
                  <select
                    value={taskForm.role_id}
                    onChange={(e) => setTaskForm({ ...taskForm, role_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.role_name} ({r.hourly_bill_rate} {project.currency}/h)</option>
                    ))}
                  </select>
                </div>

                {/* Hours inputs PERT */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Optimista</label>
                    <input
                      type="number"
                      min={0.1}
                      step="0.1"
                      required
                      value={taskForm.optimistic}
                      onChange={(e) => setTaskForm({ ...taskForm, optimistic: Number(e.target.value) })}
                      className="w-full text-center px-2 py-1.5 rounded bg-slate-950 border border-slate-850 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Probable</label>
                    <input
                      type="number"
                      min={0.1}
                      step="0.1"
                      required
                      value={taskForm.probable}
                      onChange={(e) => setTaskForm({ ...taskForm, probable: Number(e.target.value) })}
                      className="w-full text-center px-2 py-1.5 rounded bg-slate-950 border border-slate-850 text-xs text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">Pesimista</label>
                    <input
                      type="number"
                      min={0.1}
                      step="0.1"
                      required
                      value={taskForm.pessimistic}
                      onChange={(e) => setTaskForm({ ...taskForm, pessimistic: Number(e.target.value) })}
                      className="w-full text-center px-2 py-1.5 rounded bg-slate-950 border border-slate-850 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400">Multiplicador de Complejidad</label>
                  <select
                    value={taskForm.multiplier}
                    onChange={(e) => setTaskForm({ ...taskForm, multiplier: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="1.0">1.0x Estándar</option>
                    <option value="1.25">1.25x Complejidad Media</option>
                    <option value="1.5">1.5x Alta Complejidad</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Agregar Tarea WBS
                </button>
              </form>
            )}

            {/* Financial Panel */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-bold text-white text-sm border-b border-slate-850 pb-2 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-blue-400" /> Liquidación Financiera
              </h3>

              <div className="space-y-2 text-xs divide-y divide-slate-900">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Total Horas PERT:</span>
                  <span className="font-semibold text-slate-200">{totals.hours.toFixed(2)} hs</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Costo Mano de Obra:</span>
                  <span className="font-semibold text-slate-200">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(totals.labor)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Contingencia ({project.contingency_percentage}%):</span>
                  <span className="font-semibold text-slate-400">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(totals.risk)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Rentabilidad ({project.profit_margin_percentage}%):</span>
                  <span className="font-semibold text-slate-400">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(totals.profit)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Impuestos ({project.tax_percentage}%):</span>
                  <span className="font-semibold text-slate-400">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(totals.tax)}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm font-extrabold border-t border-slate-800 text-white">
                  <span className="text-blue-400 font-bold">Presupuesto Final:</span>
                  <span className="text-blue-400 font-extrabold">
                    {new Intl.NumberFormat('es-AR', { style: 'currency', currency: project.currency }).format(totals.total)}
                  </span>
                </div>
              </div>

              {project.status === 'DRAFT' && totals.total > 0 && (
                <button
                  onClick={handleFreezeEstimate}
                  className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Congelar Presupuesto
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mt-auto">
        <p>© {new Date().getFullYear()} Ciclic. Todos los derechos reservados. Diseñado con rigor de ingeniería.</p>
      </footer>
    </div>
  );
}