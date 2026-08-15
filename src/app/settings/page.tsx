'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/client';
import { 
  User, Shield, Settings, Save, Plus, Trash2, 
  DollarSign, Briefcase, AlertTriangle, Building, 
  Mail, Globe, FileText, ChevronRight, CheckCircle2 
} from 'lucide-react';

interface Profile {
  id: string;
  display_name: string;
  default_currency: string;
  tax_id?: string;
  logo_url?: string;
  default_payment_terms_days: number;
  contact_email?: string;
  website_url?: string;
}

interface RateCard {
  id: string;
  name: string;
  currency: string;
  is_default: boolean;
}

interface Role {
  id: string;
  rate_card_id: string;
  role_name: string;
  hourly_cost: number;
  hourly_bill_rate: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'rates'>('profile');
  
  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Profile fields
  const [profile, setProfile] = useState<Profile>({
    id: '',
    display_name: '',
    default_currency: 'USD',
    tax_id: '',
    logo_url: '',
    default_payment_terms_days: 30,
    contact_email: '',
    website_url: ''
  });

  // Rates fields
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [selectedRateCard, setSelectedRateCard] = useState<RateCard | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  // Role Form State
  const [newRole, setNewRole] = useState({
    role_name: '',
    hourly_cost: 0,
    hourly_bill_rate: 0
  });

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // 1. Fetch Profile
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        setProfile({
          id: prof.id,
          display_name: prof.display_name || '',
          default_currency: prof.default_currency || 'USD',
          tax_id: prof.tax_id || '',
          logo_url: prof.logo_url || '',
          default_payment_terms_days: prof.default_payment_terms_days || 30,
          contact_email: prof.contact_email || '',
          website_url: prof.website_url || ''
        });
      }

      // 2. Fetch Rate Cards
      const { data: cards } = await supabase
        .from('rate_cards')
        .select('*')
        .eq('user_id', user.id);

      if (cards && cards.length > 0) {
        setRateCards(cards);
        // Find default or select first
        const defaultCard = cards.find(c => c.is_default) || cards[0];
        setSelectedRateCard(defaultCard);
        
        // Fetch roles for this card
        const { data: fetchedRoles } = await supabase
          .from('roles')
          .select('*')
          .eq('rate_card_id', defaultCard.id);
          
        if (fetchedRoles) {
          setRoles(fetchedRoles);
        }
      } else {
        // Create default rate card if none exists
        const { data: newCard, error: cardCreateError } = await supabase
          .from('rate_cards')
          .insert({
            user_id: user.id,
            name: 'Tarifario Principal',
            currency: prof?.default_currency || 'USD',
            is_default: true
          })
          .select()
          .single();

        if (newCard) {
          setRateCards([newCard]);
          setSelectedRateCard(newCard);
          
          // Seed typical roles for a software engineer/agency
          const typicalRoles = [
            { rate_card_id: newCard.id, user_id: user.id, role_name: 'Frontend Developer', hourly_cost: 30, hourly_bill_rate: 60 },
            { rate_card_id: newCard.id, user_id: user.id, role_name: 'Backend Developer', hourly_cost: 35, hourly_bill_rate: 70 },
            { rate_card_id: newCard.id, user_id: user.id, role_name: 'UI/UX Designer', hourly_cost: 25, hourly_bill_rate: 50 },
            { rate_card_id: newCard.id, user_id: user.id, role_name: 'Project Manager / Lead', hourly_cost: 40, hourly_bill_rate: 80 }
          ];

          await supabase.from('roles').insert(typicalRoles);
          
          // Refetch roles
          const { data: fetchedRoles } = await supabase
            .from('roles')
            .select('*')
            .eq('rate_card_id', newCard.id);
          if (fetchedRoles) {
            setRoles(fetchedRoles);
          }
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cargar las configuraciones.' });
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          display_name: profile.display_name,
          default_currency: profile.default_currency,
          tax_id: profile.tax_id || null,
          logo_url: profile.logo_url || null,
          default_payment_terms_days: Number(profile.default_payment_terms_days),
          contact_email: profile.contact_email || null,
          website_url: profile.website_url || null
        });

      if (error) throw error;
      setMessage({ type: 'success', text: '¡Perfil y Branding guardados con éxito!' });
    } catch (err: unknown) {
      console.error(err);
      setMessage({ type: 'error', text: 'Hubo un error al guardar tu perfil de configuración.' });
    } finally {
      setSaving(false);
    }
  };

  // Add a Role
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRateCard || !userId) return;

    if (!newRole.role_name) {
      setMessage({ type: 'error', text: 'El nombre del rol es requerido.' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('roles')
        .insert({
          rate_card_id: selectedRateCard.id,
          user_id: userId,
          role_name: newRole.role_name,
          hourly_cost: Number(newRole.hourly_cost),
          hourly_bill_rate: Number(newRole.hourly_bill_rate)
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setRoles([...roles, data]);
        setNewRole({ role_name: '', hourly_cost: 0, hourly_bill_rate: 0 });
        setMessage({ type: 'success', text: 'Rol agregado con éxito.' });
      }
    } catch (err: unknown) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al agregar el rol.' });
    }
  };

  // Delete a Role
  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setRoles(roles.filter(r => r.id !== roleId));
      setMessage({ type: 'success', text: 'Rol eliminado con éxito.' });
    } catch (err: unknown) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al eliminar el rol.' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl">⚡</div>
          <span className="text-sm text-slate-400 font-medium">Cargando configuraciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white">
              <span className="text-blue-500 font-extrabold text-2xl">⚡</span> Ciclic
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm text-slate-300">
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link href="/settings" className="text-blue-400 font-semibold transition-colors">Configuraciones</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-400" /> Ajustes de Cuenta
            </h1>
            <p className="text-xs text-slate-400">
              Personaliza el emisor para tus presupuestos de software y configura tus tarifas por hora globales.
            </p>
          </div>
        </div>

        {/* Global Notifications */}
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

        <div className="grid md:grid-cols-4 gap-8">
          {/* Settings Nav Tabs */}
          <div className="md:col-span-1 flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" /> Perfil & Branding
            </button>
            <button
              onClick={() => setActiveTab('rates')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all ${
                activeTab === 'rates'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                  : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Tarifas & Roles
            </button>
          </div>

          {/* Tab Contents */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
                <h2 className="text-lg font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-400" /> Datos Comerciales y Emisor
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre del Emisor / Agencia *</label>
                    <input
                      type="text"
                      required
                      value={profile.display_name}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="ej: DevStudio, Carlos Gómez"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Identificación Fiscal (Tax ID / RFC / CUIT)</label>
                    <input
                      type="text"
                      value={profile.tax_id}
                      onChange={(e) => setProfile({ ...profile, tax_id: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="ej: NIT-1234567, CUIT-20-44..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Moneda por Defecto</label>
                    <select
                      value={profile.default_currency}
                      onChange={(e) => setProfile({ ...profile, default_currency: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="USD">USD ($ - Dólar Estadounidense)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="ARS">ARS ($ - Peso Argentino)</option>
                      <option value="MXN">MXN ($ - Peso Mexicano)</option>
                      <option value="COP">COP ($ - Peso Colombiano)</option>
                      <option value="BRL">BRL (R$ - Real Brasileño)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Plazo de Pago por Defecto (Días)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={profile.default_payment_terms_days}
                      onChange={(e) => setProfile({ ...profile, default_payment_terms_days: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="30 días"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Email de Contacto Comercial</label>
                    <input
                      type="email"
                      value={profile.contact_email}
                      onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="info@devstudio.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Sitio Web (URL)</label>
                    <input
                      type="url"
                      value={profile.website_url}
                      onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="https://devstudio.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Logo Comercial (URL del Logo)</label>
                  <input
                    type="url"
                    value={profile.logo_url}
                    onChange={(e) => setProfile({ ...profile, logo_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="https://ruta-al-logo.png"
                  />
                  {profile.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={profile.logo_url} 
                      alt="Logo Preview" 
                      className="h-10 mt-2 object-contain rounded border border-slate-800 p-1 bg-white/5" 
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Configuración Comercial'}
                </button>
              </form>
            )}

            {activeTab === 'rates' && selectedRateCard && (
              <div className="space-y-6">
                {/* Tarifario Head */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                  <h2 className="text-lg font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-400" /> Tarifas de Roles del Proyecto ({selectedRateCard.name})
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Define las horas base y tarifas de venta para cada rol. Al cotizar un proyecto, se congelarán los valores actuales del tarifario seleccionado como un snapshot histórico para evitar desvíos retroactivos.
                  </p>
                </div>

                {/* Grid layout */}
                <div className="grid md:grid-cols-5 gap-6">
                  {/* Left Column: Form to Add Role */}
                  <form onSubmit={handleAddRole} className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="font-bold text-white text-sm flex items-center gap-1">
                      <Plus className="w-4 h-4 text-blue-400" /> Nuevo Rol & Tarifa
                    </h3>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-400 uppercase">Nombre del Rol</label>
                      <input
                        type="text"
                        required
                        value={newRole.role_name}
                        onChange={(e) => setNewRole({ ...newRole, role_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="ej: Lead Frontend Developer"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-400 uppercase">Costo por Hora (Interno) ({profile.default_currency})</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        value={newRole.hourly_cost}
                        onChange={(e) => setNewRole({ ...newRole, hourly_cost: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-400 uppercase">Tarifa de Venta (Al Cliente) ({profile.default_currency})</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        value={newRole.hourly_bill_rate}
                        onChange={(e) => setNewRole({ ...newRole, hourly_bill_rate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Rol
                    </button>
                  </form>

                  {/* Right Column: List of Roles */}
                  <div className="md:col-span-3 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="font-bold text-white text-sm">Catálogo de Roles Registrados</h3>
                    {roles.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No hay roles registrados en este tarifario.</p>
                    ) : (
                      <div className="divide-y divide-slate-900 max-h-[300px] overflow-y-auto pr-1">
                        {roles.map((role) => (
                          <div key={role.id} className="py-3 flex items-center justify-between text-sm group">
                            <div className="space-y-1">
                              <p className="font-semibold text-white">{role.role_name}</p>
                              <div className="flex gap-4 text-xs text-slate-400">
                                <span>Costo: <strong className="text-slate-300">{role.hourly_cost} {profile.default_currency}/h</strong></span>
                                <span>Venta: <strong className="text-blue-400">{role.hourly_bill_rate} {profile.default_currency}/h</strong></span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-500/10 hover:text-red-400 text-slate-500 border border-slate-800/80 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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