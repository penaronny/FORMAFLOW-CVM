import React, { useState, useEffect } from 'react';
import { Field, Form, FormResponseRecord } from '../types/form.js';
import { DataService, getAgencyConfig } from '../services/dataService.js';
import { decodeFormFromUrlData, formatAnswersForWhatsApp } from '../utils/formEncoding.js';
import { exportSingleResponseToPDF } from '../utils/pdfExport.js';
import { SignatureCanvas } from '../components/SignatureCanvas.js';
import { 
  CheckCircle, 
  AlertCircle, 
  Send, 
  Clock, 
  RotateCcw,
  ShieldCheck,
  Ban,
  Phone,
  Download,
  Plane,
  Eye,
  EyeOff,
  Star,
  UploadCloud,
  FileText,
  X,
  Lock,
  Globe
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

  // Password visibility map
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // File metadata map: fieldId -> { name: string, size: string }
  const [fileMeta, setFileMeta] = useState<Record<string, { name: string; size: string }>>({});

  // CAPTCHA challenge: fieldId -> { num1: number, num2: number, answer: number }
  const [captchas, setCaptchas] = useState<Record<string, { num1: number; num2: number; answer: number }>>({});

  const agencyConfig = getAgencyConfig();

  useEffect(() => {
    setLoading(true);
    setError(null);

    // 1. Check if form data is directly embedded in URL (?d=...)
    const fullHash = window.location.hash;
    const fullSearch = window.location.search;
    let encodedData: string | null = null;

    if (fullHash.includes('d=')) {
      const match = fullHash.match(/d=([A-Za-z0-9_-]+)/);
      if (match) encodedData = match[1];
    } else if (fullSearch.includes('d=')) {
      const params = new URLSearchParams(fullSearch);
      encodedData = params.get('d');
    }

    const initializeFormState = (loadedForm: Form) => {
      setForm(loadedForm);
      const initialAnswers: Record<string, string> = {};
      const newCaptchas: Record<string, { num1: number; num2: number; answer: number }> = {};

      (loadedForm.fields || []).forEach((f) => {
        if (f.type === 'hidden') {
          initialAnswers[f.id] = f.default_value || '';
        } else if (f.type === 'switch') {
          initialAnswers[f.id] = 'No';
        } else if (f.type === 'checkbox') {
          initialAnswers[f.id] = '[]';
        } else if (f.type === 'matrix_radio' || f.type === 'matrix_checkbox') {
          initialAnswers[f.id] = '{}';
        } else if (f.type === 'captcha') {
          const n1 = Math.floor(Math.random() * 8) + 2;
          const n2 = Math.floor(Math.random() * 8) + 2;
          newCaptchas[f.id] = { num1: n1, num2: n2, answer: n1 + n2 };
          initialAnswers[f.id] = '';
        } else {
          initialAnswers[f.id] = '';
        }
      });

      setCaptchas(newCaptchas);
      setAnswers(initialAnswers);
    };

    if (encodedData) {
      const decoded = decodeFormFromUrlData(encodedData);
      if (decoded) {
        initializeFormState(decoded);
        setLoading(false);
        return;
      }
    }

    // 2. Fetch via API or Local Database
    fetch(`/api/public/forms/${slug}`)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          return res.json();
        }
        throw new Error('Not found on server');
      })
      .then((data) => {
        initializeFormState(data.form);
      })
      .catch(async () => {
        // Fallback to local forms
        const allForms = await DataService.getForms();
        const matched = allForms.find((f) => f.slug === slug);
        if (matched) {
          initializeFormState(matched);
        } else {
          setError('Formulario no encontrado o el enlace ha caducado.');
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleInputChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setGeneralError(null);
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  // Checkbox multi-select handler
  const handleCheckboxToggle = (fieldId: string, option: string) => {
    let current: string[] = [];
    try {
      current = JSON.parse(answers[fieldId] || '[]');
      if (!Array.isArray(current)) current = [];
    } catch {
      current = [];
    }

    const exists = current.includes(option);
    const updated = exists ? current.filter((o) => o !== option) : [...current, option];
    handleInputChange(fieldId, JSON.stringify(updated));
  };

  // Matrix Radio handler
  const handleMatrixRadioChange = (fieldId: string, row: string, col: string) => {
    let current: Record<string, string> = {};
    try {
      current = JSON.parse(answers[fieldId] || '{}');
      if (typeof current !== 'object') current = {};
    } catch {
      current = {};
    }
    current[row] = col;
    handleInputChange(fieldId, JSON.stringify(current));
  };

  // Matrix Checkbox handler
  const handleMatrixCheckboxChange = (fieldId: string, row: string, col: string) => {
    let current: Record<string, string[]> = {};
    try {
      current = JSON.parse(answers[fieldId] || '{}');
      if (typeof current !== 'object') current = {};
    } catch {
      current = {};
    }
    const rowList = Array.isArray(current[row]) ? [...current[row]] : [];
    const exists = rowList.includes(col);
    const updatedRow = exists ? rowList.filter((c) => c !== col) : [...rowList, col];
    current[row] = updatedRow;
    handleInputChange(fieldId, JSON.stringify(current));
  };

  // File Upload handler
  const handleFileUpload = (fieldId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, [fieldId]: 'El archivo excede el tamaño máximo permitido (5MB)' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      handleInputChange(fieldId, result);
      setFileMeta((prev) => ({
        ...prev,
        [fieldId]: {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (fieldId: string) => {
    handleInputChange(fieldId, '');
    setFileMeta((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setGeneralError(null);

    // Comprehensive client-side validation
    const localErrors: Record<string, string> = {};

    (form.fields || []).forEach((f) => {
      const val = (answers[f.id] || '').trim();

      // Required checks
      if (f.is_required) {
        if (!val || val === '[]' || val === '{}') {
          if (f.type === 'signature') {
            localErrors[f.id] = `Debes firmar en el recuadro digital de "${f.label}".`;
          } else if (f.type === 'file') {
            localErrors[f.id] = `Debes adjuntar un archivo para "${f.label}".`;
          } else if (f.type === 'switch') {
            if (val !== 'Sí') {
              localErrors[f.id] = `Debes aceptar la casilla de "${f.label}".`;
            }
          } else if (f.type === 'captcha') {
            localErrors[f.id] = `Debes responder la verificación humana para "${f.label}".`;
          } else {
            localErrors[f.id] = `El campo "${f.label}" es obligatorio.`;
          }
          return;
        }
      }

      // Format validations
      if (val) {
        if (f.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val)) {
            localErrors[f.id] = 'Ingresa un correo electrónico válido.';
          }
        } else if (f.type === 'number') {
          if (isNaN(Number(val))) {
            localErrors[f.id] = 'Ingresa un número válido.';
          }
        } else if (f.type === 'phone') {
          const digits = val.replace(/[^0-9]/g, '');
          if (digits.length < 7) {
            localErrors[f.id] = 'Ingresa un número de teléfono válido (mínimo 7 dígitos).';
          }
        } else if (f.type === 'url') {
          try {
            const urlToTest = val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`;
            new URL(urlToTest);
          } catch {
            localErrors[f.id] = 'Ingresa una dirección web o URL válida.';
          }
        } else if (f.type === 'captcha') {
          const c = captchas[f.id];
          if (c && Number(val) !== c.answer) {
            localErrors[f.id] = `Respuesta de seguridad incorrecta (${c.num1} + ${c.num2} = ${c.answer}). Intenta de nuevo.`;
          }
        } else if (f.type === 'matrix_radio' && f.is_required && f.matrix_rows) {
          try {
            const matrixObj = JSON.parse(val);
            const missingRow = f.matrix_rows.find((r) => !matrixObj[r]);
            if (missingRow) {
              localErrors[f.id] = `Por favor selecciona una respuesta para la fila "${missingRow}".`;
            }
          } catch {
            localErrors[f.id] = 'Completa las respuestas de la tabla.';
          }
        }
      }
    });

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      const firstErrorField = document.getElementById(`field-input-${Object.keys(localErrors)[0]}`);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      const result = await DataService.submitPublicForm(slug, answers, form);
      if (result.success) {
        setSubmittedSuccessfully(true);
        setSubmittedAt(result.submittedAt || new Date().toISOString());
      } else {
        setGeneralError('No se pudo guardar la respuesta. Intenta de nuevo.');
      }
    } catch {
      setGeneralError('Error al enviar la respuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    const initialAnswers: Record<string, string> = {};
    (form?.fields || []).forEach((f) => {
      if (f.type === 'hidden') initialAnswers[f.id] = f.default_value || '';
      else if (f.type === 'switch') initialAnswers[f.id] = 'No';
      else if (f.type === 'checkbox') initialAnswers[f.id] = '[]';
      else if (f.type === 'matrix_radio' || f.type === 'matrix_checkbox') initialAnswers[f.id] = '{}';
      else initialAnswers[f.id] = '';
    });
    setAnswers(initialAnswers);
    setFieldErrors({});
    setFileMeta({});
    setSubmittedSuccessfully(false);
  };

  const handleDownloadReceipt = () => {
    if (!form) return;
    const tempResp: FormResponseRecord = {
      id: `COMPROBANTE-${Date.now().toString().slice(-6)}`,
      form_id: form.id,
      submitted_at: submittedAt || new Date().toISOString(),
      answers,
    };
    exportSingleResponseToPDF(form, form.fields || [], tempResp);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Cargando formulario seguro...</p>
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
            El enlace que abriste no existe o ha expirado. Por favor verifica el enlace compartido por tu asesor.
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
            El equipo de <strong>{agencyConfig.name}</strong> ha pausado la recepción de respuestas en este momento.
          </p>
          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Ponte en contacto con tu asesor para más información</span>
          </div>
        </div>
      </div>
    );
  }

  // Submitted Successfully State
  if (submittedSuccessfully) {
    const waUrl = formatAnswersForWhatsApp(form, answers, agencyConfig.phone);

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
            Hemos registrado tus datos y firma digital exitosamente para <strong className="text-slate-800">{agencyConfig.name}</strong>.
          </p>

          {submittedAt && (
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Registrado el {new Date(submittedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' })}</span>
            </div>
          )}

          {/* WhatsApp Direct Forwarding Box */}
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left">
            <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>¿Deseas notificar a tu asesor por WhatsApp?</span>
            </h3>
            <p className="text-[11px] text-emerald-700 mt-1">
              Envía la confirmación al WhatsApp de {agencyConfig.name} para agilizar tu trámite legal o consular.
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Enviar Resumen a Asesores Visa por WhatsApp</span>
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Descargar Comprobante PDF</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
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
          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Plane className="w-4 h-4 transform -rotate-45" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight text-slate-900 block leading-tight">{agencyConfig.name}</span>
              <span className="text-[10px] text-slate-400 block">Formulario Oficial para Clientes</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encriptación y Sin Registro</span>
          </div>
        </div>

        {/* Main Form Box */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Accent Bar */}
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
              <span>{form.fields?.filter((f) => f.type !== 'hidden').length || 0} preguntas</span>
            </div>

            {/* Questions Container */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {(form.fields || []).map((field, idx) => {
                const errorMsg = fieldErrors[field.id];
                const value = answers[field.id] || '';

                // 20. Hidden Field (Invisible to user)
                if (field.type === 'hidden') {
                  return <input key={field.id} type="hidden" name={field.id} value={value} />;
                }

                return (
                  <div
                    key={field.id}
                    id={`field-input-${field.id}`}
                    className={`p-5 rounded-2xl border transition-all ${
                      errorMsg
                        ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200/60'
                        : field.type === 'signature'
                        ? 'bg-indigo-50/20 border-indigo-200 shadow-2xs'
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

                    {/* 1. Texto Corto */}
                    {field.type === 'text' && (
                      <input
                        id={`input-${field.id}`}
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'Escribe tu respuesta aquí...'}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {/* 2. Texto Largo / Párrafo */}
                    {field.type === 'textarea' && (
                      <textarea
                        id={`input-${field.id}`}
                        rows={3}
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'Escribe tu respuesta detallada aquí...'}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {/* 3. Número */}
                    {field.type === 'number' && (
                      <input
                        id={`input-${field.id}`}
                        type="number"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || '0'}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {/* 4. Radio (Selección única) */}
                    {field.type === 'radio' && (
                      <div className="space-y-2 pt-1">
                        {(field.options || []).map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              value === opt
                                ? 'bg-blue-50/70 border-blue-400 text-blue-900 font-medium'
                                : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`radio-${field.id}`}
                              value={opt}
                              checked={value === opt}
                              onChange={() => handleInputChange(field.id, opt)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                            />
                            <span className="text-xs">{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* 5. Checkbox (Selección múltiple) */}
                    {field.type === 'checkbox' && (
                      <div className="space-y-2 pt-1">
                        {(() => {
                          let selectedList: string[] = [];
                          try {
                            selectedList = JSON.parse(value || '[]');
                            if (!Array.isArray(selectedList)) selectedList = [];
                          } catch {
                            selectedList = [];
                          }

                          return (field.options || []).map((opt, optIdx) => {
                            const isChecked = selectedList.includes(opt);
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-blue-50/70 border-blue-400 text-blue-900 font-medium'
                                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleCheckboxToggle(field.id, opt)}
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-xs">{opt}</span>
                              </label>
                            );
                          });
                        })()}
                      </div>
                    )}

                    {/* 6. Dropdown / Select */}
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

                    {/* 7. Sí / No Switch Toggle */}
                    {field.type === 'switch' && (
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-xs font-semibold text-slate-700">
                          {value === 'Sí' ? 'Confirmado: Sí' : 'No marcado (No)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleInputChange(field.id, value === 'Sí' ? 'No' : 'Sí')}
                          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                            value === 'Sí' ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform ${
                              value === 'Sí' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {/* 8. Fecha */}
                    {field.type === 'date' && (
                      <input
                        id={`input-${field.id}`}
                        type="date"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {/* 9. Hora */}
                    {field.type === 'time' && (
                      <input
                        id={`input-${field.id}`}
                        type="time"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {/* 10. Fecha y Hora */}
                    {field.type === 'datetime' && (
                      <input
                        id={`input-${field.id}`}
                        type="datetime-local"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {/* 11. Email */}
                    {field.type === 'email' && (
                      <input
                        id={`input-${field.id}`}
                        type="email"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || 'ejemplo@correo.com'}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {/* 12. Phone */}
                    {field.type === 'phone' && (
                      <input
                        id={`input-${field.id}`}
                        type="tel"
                        value={value}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || '+1 (809) 123-4567'}
                        className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      />
                    )}

                    {/* 13. Password */}
                    {field.type === 'password' && (
                      <div className="relative">
                        <input
                          id={`input-${field.id}`}
                          type={showPasswords[field.id] ? 'text' : 'password'}
                          value={value}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder={field.placeholder || '••••••••'}
                          className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({ ...prev, [field.id]: !prev[field.id] }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPasswords[field.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    {/* 14. URL */}
                    {field.type === 'url' && (
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id={`input-${field.id}`}
                          type="url"
                          value={value}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder={field.placeholder || 'https://www.ejemplo.com'}
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    )}

                    {/* 15. Rating Stars */}
                    {field.type === 'rating' && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center gap-2">
                          {Array.from({ length: field.rating_max || 5 }).map((_, rIdx) => {
                            const starValue = rIdx + 1;
                            const isFilled = Number(value) >= starValue;

                            return (
                              <button
                                key={rIdx}
                                type="button"
                                onClick={() => handleInputChange(field.id, String(starValue))}
                                className="p-1 hover:scale-110 transition-transform cursor-pointer"
                              >
                                <Star
                                  className={`w-7 h-7 ${
                                    isFilled
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-300 hover:text-amber-300'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        {value && (
                          <span className="text-xs font-semibold text-slate-600 block">
                            Puntuación seleccionada: {value} de {field.rating_max || 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 16. Matriz / Cuadrícula de Opción Única */}
                    {field.type === 'matrix_radio' && (
                      <div className="overflow-x-auto bg-slate-50/50 p-3 rounded-xl border border-slate-200 mt-2">
                        {(() => {
                          let matrixValues: Record<string, string> = {};
                          try {
                            matrixValues = JSON.parse(value || '{}');
                          } catch {
                            matrixValues = {};
                          }

                          return (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-200">
                                  <th className="text-left py-2 px-3 text-slate-500 font-semibold">Aspecto</th>
                                  {(field.matrix_cols || []).map((col, cIdx) => (
                                    <th key={cIdx} className="text-center py-2 px-3 text-slate-700 font-bold">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(field.matrix_rows || []).map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-blue-50/30">
                                    <td className="py-2.5 px-3 font-medium text-slate-800">{row}</td>
                                    {(field.matrix_cols || []).map((col, cIdx) => {
                                      const isSelected = matrixValues[row] === col;
                                      return (
                                        <td key={cIdx} className="text-center py-2.5 px-3">
                                          <input
                                            type="radio"
                                            name={`matrix-radio-${field.id}-${rIdx}`}
                                            checked={isSelected}
                                            onChange={() => handleMatrixRadioChange(field.id, row, col)}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                                          />
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    )}

                    {/* 17. Cuadrícula de Casillas de Verificación */}
                    {field.type === 'matrix_checkbox' && (
                      <div className="overflow-x-auto bg-slate-50/50 p-3 rounded-xl border border-slate-200 mt-2">
                        {(() => {
                          let matrixValues: Record<string, string[]> = {};
                          try {
                            matrixValues = JSON.parse(value || '{}');
                          } catch {
                            matrixValues = {};
                          }

                          return (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-200">
                                  <th className="text-left py-2 px-3 text-slate-500 font-semibold">Aspecto</th>
                                  {(field.matrix_cols || []).map((col, cIdx) => (
                                    <th key={cIdx} className="text-center py-2 px-3 text-slate-700 font-bold">{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {(field.matrix_rows || []).map((row, rIdx) => {
                                  const selectedCols = matrixValues[row] || [];
                                  return (
                                    <tr key={rIdx} className="hover:bg-blue-50/30">
                                      <td className="py-2.5 px-3 font-medium text-slate-800">{row}</td>
                                      {(field.matrix_cols || []).map((col, cIdx) => {
                                        const isSelected = selectedCols.includes(col);
                                        return (
                                          <td key={cIdx} className="text-center py-2.5 px-3">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => handleMatrixCheckboxChange(field.id, row, col)}
                                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                            />
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    )}

                    {/* 18. Subir Archivo */}
                    {field.type === 'file' && (
                      <div className="space-y-2 pt-1">
                        {value && fileMeta[field.id] ? (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>{fileMeta[field.id].name}</span>
                              <span className="text-slate-400 font-normal">({fileMeta[field.id].size})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(field.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="p-6 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-blue-50/30 transition-colors">
                            <UploadCloud className="w-7 h-7 text-blue-600 mb-2" />
                            <span className="text-xs font-bold text-slate-800">Haz clic para adjuntar archivo</span>
                            <span className="text-[11px] text-slate-400 mt-1">
                              Formatos permitidos: {field.allowed_file_types || '.pdf, .jpg, .png'} (máx. 5MB)
                            </span>
                            <input
                              type="file"
                              accept={field.allowed_file_types || '.pdf,.jpg,.jpeg,.png'}
                              onChange={(e) => handleFileUpload(field.id, e)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* 19. Firma Digital en Línea */}
                    {field.type === 'signature' && (
                      <div className="pt-2">
                        <SignatureCanvas
                          value={value}
                          onChange={(dataUrl) => handleInputChange(field.id, dataUrl)}
                          label={field.label}
                        />
                      </div>
                    )}

                    {/* 21. CAPTCHA / Verificación de Seguridad */}
                    {field.type === 'captcha' && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">Filtro de Seguridad Humana</span>
                            <span className="text-xs text-slate-500 font-medium">
                              ¿Cuánto es {captchas[field.id]?.num1 || 7} + {captchas[field.id]?.num2 || 5}?
                            </span>
                          </div>
                        </div>

                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          placeholder="Resultado..."
                          className="w-28 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
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
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{submitting ? 'Enviando respuestas...' : 'Enviar Respuestas y Firma'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Confidentiality Footer */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>Tus respuestas y firma se recopilan de manera confidencial y encriptada para {agencyConfig.name}.</p>
        </div>
      </div>
    </div>
  );
};
