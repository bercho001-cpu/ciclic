import Link from 'next/link';
import { ArrowLeft, Target, Shield, HelpCircle, BookOpen } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header/Nav */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
            <span className="text-blue-500 font-extrabold text-2xl">⚡</span> Ciclic
          </Link>
          <div className="flex gap-4 text-sm text-slate-300">
            <Link href="/about" className="hover:text-blue-400 font-semibold text-blue-400">Quiénes Somos</Link>
            <Link href="/help" className="hover:text-blue-400">Ayuda & FAQs</Link>
            <Link href="/legal" className="hover:text-blue-400">Legal</Link>
            <Link href="/contact" className="hover:text-blue-400">Soporte</Link>
            <Link href="/login" className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Sobre Ciclic
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Nuestra misión es empoderar a desarrolladores independientes y agencias de software a cotizar con precisión de ingeniería, eliminar la incertidumbre en los presupuestos y asegurar un flujo de caja saludable.
          </p>
        </section>

        {/* Pillars / Features Grid */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Estimación con Rigor Científico (PERT)</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dejamos atrás las estimaciones a "ojo de buen cubero". Ciclic implementa el modelo estadístico de tres puntos PERT (Optimista, Probable y Pesimista) para calcular una media ponderada realista que absorbe desvíos técnicos típicos en el desarrollo de software.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Estructuración Modular WBS</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Dividir para reinar. Nuestra plataforma promueve la descomposición jerárquica del alcance mediante una Estructura de Desglose de Trabajo (WBS) en módulos reutilizables y tareas concretas, permitiendo a los clientes entender exactamente por qué pagan.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Previsibilidad de Flujo de Caja</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generamos planes de pago inteligentes y equilibrados (con algoritmos que resuelven las discrepancias de redondeo al centavo), para que siempre sepas cuánto y cuándo vas a cobrar, integrando un panel de control financiero en tiempo real.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Branding & Transparencia Comercial</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Genera propuestas pulidas con tu logo, términos fiscales y de pago, listas para compartir mediante un enlace web público seguro para tus clientes o descargar como PDF optimizado para impresión.
            </p>
          </div>
        </section>

        {/* Vision Section */}
        <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Nuestra Historia y Visión</h2>
          <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed text-sm">
            Ciclic nació del dolor compartido de miles de desarrolladores independientes y agencias: el "scope creep" no remunerado, los presupuestos quemados antes de tiempo, y la dificultad para comunicar de manera objetiva el costo del software a clientes no técnicos. 
            Creemos que la ingeniería de software merece un enfoque comercial igualmente estructurado y profesional.
          </p>
        </section>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 mt-auto">
        <p>© {new Date().getFullYear()} Ciclic. Todos los derechos reservados. Diseñado con rigor de ingeniería.</p>
      </footer>
    </div>
  );
}