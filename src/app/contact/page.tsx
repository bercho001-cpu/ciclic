'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setFormDataSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setFormDataSubmitted(true);
    }
  };

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
            <Link href="/legal" className="hover:text-blue-400">Legal</Link>
            <Link href="/contact" className="hover:text-blue-400 font-semibold text-blue-400">Soporte</Link>
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
            Contacto y Soporte
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            ¿Tienes alguna consulta, comentario o has detectado un error? Ponte en contacto con nosotros completando el formulario.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Side Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" /> Canales directos
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Respondemos de lunes a viernes en horario de oficina (GMT-3).
              </p>
              <div className="space-y-3 text-sm text-slate-300">
                <p className="flex items-center gap-2">
                  <span className="text-slate-500">Email:</span>
                  <a href="mailto:support@ciclic.app" className="text-blue-400 hover:underline">support@ciclic.app</a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-slate-500">Reporte de bugs:</span>
                  <span className="text-slate-300">Usa el comando /reportbug</span>
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" /> Feedback de usuarios
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tus sugerencias son el motor de nuestra evolución modular. Constantemente incorporamos nuevas plantillas de módulos basadas en requerimientos de nuestra comunidad.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3 p-8 rounded-2xl bg-slate-900 border border-slate-800">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">¡Mensaje enviado con éxito!</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  Hemos recibido tu consulta de soporte de manera exitosa. Un miembro de nuestro equipo de ingeniería te responderá a la brevedad.
                </p>
                <button
                  onClick={() => { setFormDataSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-white font-medium transition-colors mt-2"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Asunto</label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="¿De qué trata tu consulta?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Mensaje *</label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="Cuéntanos más detalladamente..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  Enviar Mensaje
                </button>
              </form>
            )}
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