'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/infrastructure/supabase/client';
import { Key, Mail, AlertTriangle, Shield, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptedDisclaimer) {
      setError('Debes aceptar el descargo de responsabilidad obligatorio para continuar.');
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // Success: redirect to login or show notice (or let session be established)
      // Since email verification might be active, let's redirect them to login with a success parameter or message
      router.push('/login?registered=true');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado al registrar la cuenta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6 glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-white mb-1">
            <span className="text-blue-500 font-extrabold text-3xl">⚡</span> Ciclic
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white">Crear una Cuenta</h2>
          <p className="text-slate-400 text-xs">
            Comienza a cotizar tus proyectos de software con precisión matemática.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Correo Electrónico
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          {/* Mandatory Disclaimer Box */}
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex gap-2.5 items-start">
              <input
                type="checkbox"
                id="disclaimer"
                required
                checked={acceptedDisclaimer}
                onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                className="mt-1 cursor-pointer accent-blue-500 w-4 h-4 rounded border-slate-800 bg-slate-950"
              />
              <label htmlFor="disclaimer" className="text-[11px] text-slate-300 leading-normal cursor-pointer select-none">
                <span className="font-bold text-slate-100">Acepto el Descargo de Responsabilidad Obligatorio:</span> Entiendo que todas las estimaciones de costo, tarifas y horas generadas en Ciclic son de carácter orientativo y referencial. La validación, veracidad y responsabilidad legal de las cotizaciones finales ante clientes recae exclusivamente sobre mí como profesional o agencia emisor/a.
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:text-slate-400 text-white font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="pt-1 text-center space-y-3">
          <p className="text-xs text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-blue-400 hover:underline font-medium">
              Inicia sesión aquí
            </Link>
          </p>

          <div className="border-t border-slate-900 pt-3 flex justify-between text-[10px] text-slate-500">
            <Link href="/about" className="hover:text-slate-400">
              Sobre Ciclic
            </Link>
            <Link href="/legal" className="hover:text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Privacidad & Términos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}