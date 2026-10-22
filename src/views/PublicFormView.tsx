import React, { useState, useEffect } from 'react';
import { Field, Form } from '../types/form';
import { 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Clock, 
  RotateCcw,
  ShieldCheck,
  Ban
} from 'lucide-react';

interface PublicFormViewProps {
  slug: string;
}

export const PublicFormView: React.FC<PublicFormViewProps> = ({ slug }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form input answers state: field_id -> string value
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/public/forms/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Formulario no encontrado o URL inválida');
        }
        return res.json();
      })
      .then((data) => {
        setForm(data.form);
        // Pre-fill answer keys
        const initialAnswers: Record<string, string> = {};
        (data.form.fields || []).forEach((f: Field) => {
          initialAnswers[f.id] = '';
        });
        setAnswers(initialAnswers);
      })
      .catch((err) => {
        setError(err.message || 'Error al cargar el formulario');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleInputChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setGeneralError(null);
    // Clear error for this field as user types
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setGeneralError(null);

    // Client-side quick check
    const localErrors: Record<string, string> = {};
    (form.fields || []).forEach((f) => {
      const val = (answers[f.id] || '').trim();
      if (f.is_required && !val) {
        localErrors[f.id] = `El campo "${f.label}" es obligatorio.`;
      } else if (val) {
        if (f.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            localErrors[f.id] = 'Ingresa un correo electrónico válido.';
          }
        } else if (f.type === 'number') {
          if (isNaN(Number(val))) {
            localErrors[f.id] = 'Ingresa un número válido.';
          }
        }
      }
    });

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      // Scroll to first error
      const firstErrorField = document.getElementById(`field-input-${Object.keys(localErrors)[0]}`);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      const res = await fetch(`/api/public/forms/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        } else {
          setGeneralError(data.error || 'Ocurrió un error al enviar el formulario');
        }
        return;
      }

      setSubmittedSuccessfully(true);
      setSubmittedAt(data.submittedAt || new Date().toISOString());
    } catch {
      setGeneralError('Error de conexión con el servidor. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    const initialAnswers: Record<string, string> = {};
    (form?.fields || []).forEach((f) => {
      initialAnswers[f.id] = '';
    });
    setAnswers(initialAnswers);
    setFieldErrors({});
    setSubmittedSuccessfully(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Formulario no encontrado</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            El enlace que abriste no existe o ha expirado. Por favor verifica la URL compartida.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            Ir a la página principal
          </a>
        </div>
      </div>
    );
  }

  // Inactive Form State
  if (!form.is_active) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Ban className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Este formulario no está disponible</h2>
          <p className="text-sm text-slate-600 mt-2">
            El creador de <strong>"{form.title}"</strong> ha pausado la recepción de respuestas en este momento.
          </p>
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Ponte en contacto con el administrador para más información</span>
          </div>
        </div>
      </div>
    );
  }

  // Submitted Successfully State
  if (submittedSuccessfully) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-2xl text-center">
          <div className="w-18 h-18 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ¡Gracias por tu respuesta!
          </h2>

          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Hemos registrado tus datos exitosamente en la base de datos centralizada de{' '}
            <strong className="text-slate-800">{form.title}</strong>.
          </p>

          {submittedAt && (
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Registrado el {new Date(submittedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' })}</span>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Enviar otra respuesta</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal Form Answering State
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Company Branding Banner */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">FormFlow Empresa</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Formulario Oficial Interno</span>
          </div>
        </div>

        {/* Main Form Box */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Form Header Accent Bar */}
          <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />

          <div className="p-6 sm:p-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {form.title}
            </h1>

            {form.description && (
              <p className="text-sm text-slate-600 mt-3 whitespace-pre-line leading-relaxed">
                {form.description}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Los campos marcados con <span className="text-red-500 font-bold">*</span> son obligatorios</span>
              <span>{form.fields?.length || 0} preguntas</span>
            </div>

            {/* Questions Container */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {(form.fields || []).map((field, idx) => {
                const errorMsg = fieldErrors[field.id];
                const value = answers[field.id] || '';

                return (
                  <div
                    key={field.id}
                    id={`field-input-${field.id}`}
                    className={`p-5 rounded-2xl border transition-all ${
                      errorMsg
                        ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200/60'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <label
                      htmlFor={`input-${field.id}`}
                      className="block text-sm font-bold text-slate-800 mb-2 leading-snug"
                    >
                      <span className="text-slate-400 font-semibold mr-1.5">{idx + 1}.</span>
                      {field.label}
                      {field.is_required && (
                        <span className="text-red-500 ml-1" title="Campo obligatorio">*</span>
                      )}
                    </label>

                    {/* Field input based on type */}
                    {field.type === 'text' && (
                      <input
                        id={`input-${field.id}`}
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        id={`input-${field.id}`}
                        rows={3}
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder="Escribe tu respuesta detallada aquí..."
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {field.type === 'email' && (
                      <input
                        id={`input-${field.id}`}
                        type="email"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder="nombre@empresa.com"
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        id={`input-${field.id}`}
                        type="number"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder="Ingresa un número..."
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {field.type === 'date' && (
                      <input
                        id={`input-${field.id}`}
                        type="date"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {field.type === 'select' && (
                      <select
                        id={`input-${field.id}`}
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-slate-800"
                      >
                        <option value="">-- Selecciona una opción --</option>
                        {(field.options || []).map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Error message */}
                    {errorMsg && (
                      <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errorMsg}</span>
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Submit CTA */}
              <div className="pt-4 space-y-3">
                {generalError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{generalError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Enviando respuestas...' : 'Enviar Respuestas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Confidentiality Footer */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>Tus respuestas se almacenan de forma segura en los servidores de la empresa.</p>
        </div>
      </div>
    </div>
  );
};
