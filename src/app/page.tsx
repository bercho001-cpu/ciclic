export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          🚀 Ciclic Engine v0.1.0
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Calculador y Gestor Inteligente de Costos de Software
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Estimaciones precisas WBS/PERT, presupuestos modulares, planes de pago fraccionados y control integral de flujo de caja.
        </p>
      </div>
    </main>
  );
}
