import Link from 'next/link';
import { ArrowLeft, Shield, FileText } from 'lucide-react';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header/Nav */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
            <span className="text-blue-500 font-extrabold text-2xl">⚡</span> Ciclic
          </Link>
          <div className="flex gap-4 text-sm text-slate-300">
            <Link href="/about" className="hover:text-blue-400">Quiénes Somos</Link>
            <Link href="/help" className="hover:text-blue-400">Ayuda & FAQs</Link>
            <Link href="/legal" className="hover:text-blue-400 font-semibold text-blue-400">Legal</Link>
            <Link href="/contact" className="hover:text-blue-400">Soporte</Link>
            <Link href="/login" className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Términos Legales y Privacidad
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Última actualización: Agosto 2026. Por favor, lee atentamente estos términos antes de utilizar la plataforma Ciclic.
          </p>
        </div>

        <div className="space-y-8 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2>1. Descargo de Responsabilidad de Estimaciones (Disclaimer)</h2>
            </div>
            <p>
              Ciclic provee herramientas estadísticas y algoritmos matemáticos basados en el modelo <strong>PERT (Project Evaluation and Review Technique)</strong> y desgloses WBS para estimar los costos y horas de desarrollo de software.
            </p>
            <p className="border-l-2 border-amber-500/80 pl-4 py-1 text-amber-300/90 bg-amber-500/5 rounded-r-lg font-medium">
              Aviso Importante: Todas las estimaciones producidas por Ciclic son de carácter exclusivamente orientativo. El usuario (desarrollador, consultor o agencia) es el único responsable de validar las tarifas, horas y costos finales antes de presentar cualquier propuesta formal a sus clientes. Ciclic no garantiza que el costo real del proyecto coincida con la estimación generada.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2>2. Términos del Servicio</h2>
            </div>
            <p>
              Al registrarte en Ciclic, aceptas que el uso de la plataforma es bajo tu propio riesgo. El servicio se ofrece "tal cual" y "según disponibilidad". Nos reservamos el derecho de modificar o suspender cualquier aspecto del servicio en cualquier momento. No seremos responsables ante ti ni ante terceros por cualquier daño directo, indirecto, incidental o consecuente derivado del uso o la imposibilidad de uso del software.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2>3. Política de Privacidad y Protección de Datos</h2>
            </div>
            <p>
              En Ciclic nos tomamos en serio tu privacidad. La autenticación de tu cuenta y el almacenamiento de tus sesiones de usuario se administran de forma segura a través de <strong>Supabase Auth</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Datos Recopilados:</strong> Guardamos tu dirección de correo electrónico, nombre para mostrar, datos del tarifario de roles, perfiles de proyectos y registros de pago para que puedas gestionar tus cotizaciones.</li>
              <li><strong>Almacenamiento Seguro:</strong> Los datos se almacenan de manera cifrada e individualizada bajo políticas de <strong>Row Level Security (RLS)</strong> en Supabase, lo que garantiza que solo tú puedes acceder a tu información.</li>
              <li><strong>Cookies:</strong> Utilizamos únicamente cookies esenciales para mantener tu sesión activa de manera segura en tu navegador.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2>4. Propiedad Intelectual y Enlaces Públicos</h2>
            </div>
            <p>
              El usuario retiene todos los derechos sobre la información de sus proyectos y propuestas. Al habilitar un enlace público compartido para una propuesta (`/view/proposal/*`), aceptas que dicho enlace permite el acceso público de lectura a los clientes a quienes les compartas el token. Eres responsable de mantener la confidencialidad de tus enlaces y desactivar la propuesta cuando ya no sea válida.
            </p>
          </section>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Ciclic. Todos los derechos reservados. Diseñado con rigor de ingeniería.</p>
      </footer>
    </div>
  );
}