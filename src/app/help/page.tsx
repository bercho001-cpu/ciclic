import Link from 'next/link';
import { ArrowLeft, HelpCircle, BookOpen, Target, DollarSign } from 'lucide-react';

export default function HelpPage() {
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
            <Link href="/help" className="hover:text-blue-400 font-semibold text-blue-400">Ayuda & FAQs</Link>
            <Link href="/legal" className="hover:text-blue-400">Legal</Link>
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
            Centro de Ayuda y FAQs
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            ¿Cómo estimar correctamente? Encuentra respuestas a las preguntas más frecuentes sobre el método PERT, la estructura WBS y el cálculo financiero de Ciclic.
          </p>
        </div>

        <div className="space-y-6">
          {/* FAQ 1 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3 text-white font-bold text-base">
              <Target className="w-5 h-5 text-blue-400 shrink-0" />
              <h3>¿Qué es el método de estimación PERT de tres puntos?</h3>
            </div>
            <p className="text-slate-300 text-sm pl-8 leading-relaxed">
              PERT (Project Evaluation and Review Technique) es una fórmula estadística que reduce el sesgo optimista típico de los desarrolladores al estimar tiempos de entrega. En lugar de dar un único número, defines tres escenarios:
            </p>
            <ul className="list-disc pl-14 text-slate-400 text-sm space-y-1">
              <li><strong>Optimista (O):</strong> El tiempo requerido si todo sale perfecto, sin interrupciones ni imprevistos técnicos.</li>
              <li><strong>Más Probable (M):</strong> El tiempo estándar en condiciones normales de desarrollo.</li>
              <li><strong>Pesimista (P):</strong> El tiempo si se presentan dificultades técnicas complejas o retrasos imprevistos.</li>
            </ul>
            <p className="text-slate-300 text-sm pl-8 leading-relaxed">
              La fórmula de estimación de horas es una media ponderada:
            </p>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center font-mono text-sm text-blue-400 max-w-sm mx-auto my-2">
              Horas = (Optimista + 4 * Probable + Pesimista) / 6
            </div>
          </div>

          {/* FAQ 2 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3 text-white font-bold text-base">
              <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
              <h3>¿Qué es una estructura WBS (Estructura de Desglose de Trabajo)?</h3>
            </div>
            <p className="text-slate-300 text-sm pl-8 leading-relaxed">
              WBS (Work Breakdown Structure) consiste en dividir jerárquicamente un proyecto de software en componentes más pequeños y manejables llamados <strong>Módulos</strong>, y estos a su vez en <strong>Tareas</strong> individuales.
              Esto permite:
            </p>
            <ul className="list-disc pl-14 text-slate-400 text-sm space-y-1">
              <li>Evitar olvidar requerimientos ocultos (ej. recuperaciones de contraseña, políticas de privacidad).</li>
              <li>Asignar un rol con una tarifa horaria específica para cada tarea.</li>
              <li>Explicar con total transparencia al cliente final el origen del presupuesto.</li>
            </ul>
          </div>

          {/* FAQ 3 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3 text-white font-bold text-base">
              <DollarSign className="w-5 h-5 text-blue-400 shrink-0" />
              <h3>¿Cómo funciona el motor financiero en cascada?</h3>
            </div>
            <p className="text-slate-300 text-sm pl-8 leading-relaxed">
              Ciclic calcula el costo final al cliente de forma secuencial y en cascada:
            </p>
            <ol className="list-decimal pl-14 text-slate-400 text-sm space-y-2">
              <li><strong>Mano de Obra:</strong> Sumatoria de las horas PERT estimadas de cada tarea multiplicadas por la tarifa por hora de su rol correspondiente.</li>
              <li><strong>Costos Externos (Terceros):</strong> Licencias, servidores, APIs de pago, etc.</li>
              <li><strong>Subtotal Operativo:</strong> Mano de Obra + Costos Externos.</li>
              <li><strong>Contingencia / Riesgo:</strong> Buffer porcentual (ej. 15%) sobre el subtotal operativo para absorber imprevistos.</li>
              <li><strong>Margen de Ganancia:</strong> Markup de rentabilidad (ej. 20%) aplicado sobre la base operativa con contingencia.</li>
              <li><strong>Impuestos:</strong> Tasa impositiva (ej. IVA) aplicada sobre la base imponible final.</li>
            </ol>
          </div>

          {/* FAQ 4 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3 text-white font-bold text-base">
              <HelpCircle className="w-5 h-5 text-blue-400 shrink-0" />
              <h3>¿Qué es el problema del "centavo residual" y cómo lo soluciona Ciclic?</h3>
            </div>
            <p className="text-slate-300 text-sm pl-8 leading-relaxed">
              Al dividir un presupuesto total en cuotas (por ejemplo, tres cuotas del 33.33%), la suma matemática de los montos redondeados suele diferir del total general por uno o dos centavos (ej: $10,000 / 3 = $3,333.33, lo que sumado da $9,999.99, faltando $0.01).
              Ciclic incorpora un <strong>algoritmo de ajuste de centavos (Penny Allocation)</strong> que detecta este residuo y lo asigna automáticamente a la última cuota para asegurar coincidencia perfecta al centavo con el Total Presupuestado.
            </p>
          </div>
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