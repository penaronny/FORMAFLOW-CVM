import React, { useState, useEffect } from 'react';
import { Field, FieldType, Form } from '../types/form.js';
import { DataService, getAgencyConfig } from '../services/dataService.js';
import { buildClientFormLink, buildWhatsAppShareMessage } from '../utils/formEncoding.js';
import { 
  ArrowLeft, 
  Save, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  X, 
  Type, 
  AlignLeft, 
  Mail, 
  Hash, 
  Calendar, 
  ListFilter, 
  Eye, 
  PenTool,
  AlertCircle,
  Share2,
  Phone
} from 'lucide-react';

interface FormEditorViewProps {
  formId?: string; // If undefined, creating new form
  onNavigate: (view: string, id?: string) => void;
}

const FIELD_TEMPLATES: Array<{
  type: FieldType;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultLabel: string;
  defaultOptions?: string[];
}> = [
  {
    type: 'text',
    title: 'Texto Corto',
    desc: 'Nombres, pasaportes, datos breves',
    icon: Type,
    defaultLabel: 'Texto de una línea',
  },
  {
    type: 'textarea',
    title: 'Texto Largo',
    desc: 'Motivo de viaje, antecedentes, comentarios',
    icon: AlignLeft,
    defaultLabel: 'Explicación detallada',
  },
  {
    type: 'email',
    title: 'Correo Electrónico',
    desc: 'Validación de email del cliente',
    icon: Mail,
    defaultLabel: 'Correo Electrónico',
  },
  {
    type: 'number',
    title: 'Número',
    desc: 'Edad, ingresos, cantidades',
    icon: Hash,
    defaultLabel: 'Valor numérico',
  },
  {
    type: 'date',
    title: 'Fecha',
    desc: 'Fecha de nacimiento, fecha de viaje',
    icon: Calendar,
    defaultLabel: 'Fecha requerida',
  },
  {
    type: 'select',
    title: 'Selección Única',
    desc: 'Menú desplegable de opciones fijas',
    icon: ListFilter,
    defaultLabel: 'Selecciona una opción',
    defaultOptions: ['Opción 1', 'Opción 2', 'Opción 3'],
  },
];

export const FormEditorView: React.FC<FormEditorViewProps> = ({ formId, onNavigate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New option buffer for select fields: map of field index/id -> string
  const [newOptionBuffers, setNewOptionBuffers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (formId) {
      setLoading(true);
      setLoadError(null);
      DataService.getFormById(formId)
        .then((f) => {
          if (!f) throw new Error('Formulario no encontrado');
          setTitle(f.title);
          setDescription(f.description || '');
          setFields(f.fields || []);
          setSlug(f.slug);
          setIsActive(f.is_active);
        })
        .catch((err) => {
          console.error(err);
          setLoadError('No se pudo cargar el formulario solicitado');
        })
        .finally(() => setLoading(false));
    } else {
      // Default starting state for a new visa form
      setTitle('Solicitud de Información Consular para Clientes');
      setDescription('Por favor completa todos los campos requeridos para que Asesores Visa tramite tu solicitud de forma ágil y segura.');
      setFields([
        {
          id: `fld-${Date.now()}-1`,
          form_id: '',
          label: 'Nombre y Apellidos completos (según Pasaporte)',
          type: 'text',
          is_required: true,
          position: 0,
        },
        {
          id: `fld-${Date.now()}-2`,
          form_id: '',
          label: 'Número de Pasaporte',
          type: 'text',
          is_required: true,
          position: 1,
        },
        {
          id: `fld-${Date.now()}-3`,
          form_id: '',
          label: 'Correo Electrónico',
          type: 'email',
          is_required: true,
          position: 2,
        },
      ]);
    }
  }, [formId]);

  const addField = (template: typeof FIELD_TEMPLATES[0]) => {
    const newField: Field = {
      id: `fld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      form_id: formId || '',
      label: template.defaultLabel,
      type: template.type,
      is_required: false,
      options: template.defaultOptions ? [...template.defaultOptions] : [],
      position: fields.length,
    };
    setFields((prev) => [...prev, newField]);
    setValidationErrors([]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    setFields((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated.map((f, i) => ({ ...f, position: i }));
    });
  };

  const updateField = (index: number, changes: Partial<Field>) => {
    setFields((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...changes };
      return updated;
    });
  };

  const handleAddOption = (fieldIndex: number, fieldId: string) => {
    const val = (newOptionBuffers[fieldId] || '').trim();
    if (!val) return;

    const currentOptions = fields[fieldIndex].options || [];
    if (currentOptions.includes(val)) return;

    updateField(fieldIndex, { options: [...currentOptions, val] });
    setNewOptionBuffers((prev) => ({ ...prev, [fieldId]: '' }));
  };

  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    const currentOptions = fields[fieldIndex].options || [];
    const updated = currentOptions.filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options: updated });
  };

  const handleSave = async () => {
    setValidationErrors([]);

    // Client side validation checks
    const errors: string[] = [];
    if (!title.trim()) {
      errors.push('El título del formulario no puede estar vacío');
    }
    if (fields.length === 0) {
      errors.push('Debes agregar al menos un campo al formulario');
    }
    fields.forEach((f, idx) => {
      if (!f.label.trim()) {
        errors.push(`El campo #${idx + 1} requiere una etiqueta`);
      }
      if (f.type === 'select' && (!f.options || f.options.length === 0)) {
        errors.push(`El campo de selección "${f.label || `#${idx + 1}`}" debe tener al menos una opción`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Form> = {
        title: title.trim(),
        description: description.trim(),
        fields: fields.map((f, idx) => ({
          ...f,
          position: idx,
        })),
        is_active: isActive,
      };

      const result = await DataService.saveForm(formId, payload);
      if (!result.success) {
        setValidationErrors([result.error || 'Error al guardar el formulario']);
        return;
      }

      if (result.slug) {
        setSlug(result.slug);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);

      if (!formId && result.formId) {
        onNavigate('editor', result.formId);
      }
    } catch {
      setValidationErrors(['Error al guardar el formulario']);
    } finally {
      setSaving(false);
    }
  };

  // Build current client link
  const currentFormObj: Form = {
    id: formId || 'temp',
    user_id: '',
    title: title.trim(),
    description: description.trim(),
    slug: slug || 'formulario',
    is_active: isActive,
    created_at: '',
    updated_at: '',
    fields,
  };
  const { directLink } = buildClientFormLink(window.location.origin, currentFormObj);

  const handleCopyClientLink = () => {
    navigator.clipboard.writeText(directLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top action bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('forms')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Mis Formularios</span>
            </button>

            {slug && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <span>Slug:</span>
                <code className="text-slate-600 font-mono font-medium">{slug}</code>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {slug && (
              <>
                <button
                  type="button"
                  onClick={handleCopyClientLink}
                  title="Copiar enlace universal para clientes (no requiere registro)"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">¡Enlace Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-blue-600" />
                      <span>Copiar Enlace para Clientes</span>
                    </>
                  )}
                </button>

                <a
                  href={directLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Ver Formulario</span>
                </a>
              </>
            )}

            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors border ${
                previewMode
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {previewMode ? <PenTool className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{previewMode ? 'Modo Editor' : 'Vista Previa'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Guardar Formulario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Success feedback banner */}
      {saveSuccess && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                ¡Formulario guardado exitosamente! El enlace para tus clientes está listo.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyClientLink}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Enlace para Clientes</span>
            </button>
          </div>
        </div>
      )}

      {/* Load error banner */}
      {loadError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{loadError}</span>
          </div>
        </div>
      )}

      {/* Validation alert banner */}
      {validationErrors.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Por favor corrige los siguientes requisitos antes de guardar:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {previewMode ? (
          /* Live Interactive Preview */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-md border border-slate-200 p-8">
            <div className="border-b border-slate-100 pb-6 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Vista Previa del Cliente (Sin Login)
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-3">{title || 'Sin Título'}</h2>
              <p className="text-sm text-slate-500 mt-2 whitespace-pre-line">{description || 'Sin descripción'}</p>
            </div>

            <div className="space-y-6">
              {fields.map((f, i) => (
                <div key={f.id || i} className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-800">
                    {f.label} {f.is_required && <span className="text-red-500">*</span>}
                  </label>
                  {f.type === 'text' && (
                    <input
                      type="text"
                      disabled
                      placeholder="Respuesta de texto corto..."
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  )}
                  {f.type === 'textarea' && (
                    <textarea
                      disabled
                      rows={3}
                      placeholder="Escribe una respuesta detallada..."
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  )}
                  {f.type === 'email' && (
                    <input
                      type="email"
                      disabled
                      placeholder="ejemplo@cliente.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  )}
                  {f.type === 'number' && (
                    <input
                      type="number"
                      disabled
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  )}
                  {f.type === 'date' && (
                    <input
                      type="date"
                      disabled
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-400"
                    />
                  )}
                  {f.type === 'select' && (
                    <select
                      disabled
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                    >
                      <option value="">Selecciona una opción...</option>
                      {(f.options || []).map((opt, optIdx) => (
                        <option key={optIdx} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button
                type="button"
                disabled
                className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-xl opacity-75 cursor-not-allowed"
              >
                Enviar Respuestas
              </button>
            </div>
          </div>
        ) : (
          /* Editor Layout: Left Palette + Center Canvas */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar Palette */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs sticky top-36">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center justify-between">
                <span>Agregar Campo</span>
                <span className="text-[11px] font-medium text-slate-400">Clic para añadir</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Selecciona las preguntas necesarias para el trámite de visa:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {FIELD_TEMPLATES.map((tmpl) => {
                  const Icon = tmpl.icon;
                  return (
                    <button
                      key={tmpl.type}
                      type="button"
                      onClick={() => addField(tmpl)}
                      className="flex items-center gap-3 p-3 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-600 text-slate-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                            {tmpl.title}
                          </span>
                          <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{tmpl.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Status active/inactive switch */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Estado de Publicación</p>
                    <p className="text-[11px] text-slate-500">
                      {isActive ? 'Abierto para clientes' : 'Pausado (no recibe respuestas)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isActive ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Center Canvas */}
            <div className="lg:col-span-8 space-y-6">
              {/* Form Metadata Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="form-title">
                    Título del Formulario <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="form-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Solicitud de Visa Americana B1/B2"
                    className="w-full text-lg font-bold text-slate-900 px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1" htmlFor="form-desc">
                    Instrucciones para el Cliente
                  </label>
                  <textarea
                    id="form-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Instrucciones que leerá el cliente al abrir el formulario..."
                    className="w-full text-sm text-slate-700 px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Fields List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">
                    Preguntas del Formulario ({fields.length})
                  </h3>
                  <span className="text-xs text-slate-500">
                    Usa las flechas para reordenar las preguntas
                  </span>
                </div>

                {fields.length === 0 ? (
                  <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center">
                    <p className="text-sm font-semibold text-slate-700">Sin preguntas aún</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Haz clic en cualquiera de los tipos del panel izquierdo para añadir tu primera pregunta.
                    </p>
                  </div>
                ) : (
                  fields.map((field, idx) => {
                    const template = FIELD_TEMPLATES.find((t) => t.type === field.type) || FIELD_TEMPLATES[0];
                    const Icon = template.icon;

                    return (
                      <div
                        key={field.id || idx}
                        className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-colors"
                      >
                        {/* Field Header */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              <Icon className="w-3.5 h-3.5 text-blue-600" />
                              {template.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Reorder Up */}
                            <button
                              type="button"
                              onClick={() => moveField(idx, 'up')}
                              disabled={idx === 0}
                              aria-label={`Mover campo #${idx + 1} hacia arriba`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>

                            {/* Reorder Down */}
                            <button
                              type="button"
                              onClick={() => moveField(idx, 'down')}
                              disabled={idx === fields.length - 1}
                              aria-label={`Mover campo #${idx + 1} hacia abajo`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Delete Field */}
                            <button
                              type="button"
                              onClick={() => removeField(idx)}
                              aria-label={`Eliminar campo ${field.label || idx + 1}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Label & Required setting */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                          <div className="sm:col-span-8">
                            <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor={`field-label-${idx}`}>
                              Pregunta o Dato a Solicitar
                            </label>
                            <input
                              id={`field-label-${idx}`}
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(idx, { label: e.target.value })}
                              placeholder="Ej. Número de Pasaporte"
                              className="w-full text-sm font-medium text-slate-900 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                            />
                          </div>

                          <div className="sm:col-span-4 flex items-center sm:justify-end pt-2 sm:pt-4">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={field.is_required}
                                onChange={(e) => updateField(idx, { is_required: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-slate-700">Obligatorio</span>
                            </label>
                          </div>
                        </div>

                        {/* Select Options Manager */}
                        {field.type === 'select' && (
                          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl">
                            <label className="block text-xs font-bold text-slate-700 mb-2">
                              Opciones del menú desplegable:
                            </label>

                            <div className="space-y-2 mb-3">
                              {(field.options || []).map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                                  <span className="text-xs font-medium text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex-1">
                                    {opt}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(idx, optIdx)}
                                    aria-label={`Eliminar opción ${opt}`}
                                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add Option Input */}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newOptionBuffers[field.id] || ''}
                                onChange={(e) =>
                                  setNewOptionBuffers((prev) => ({
                                    ...prev,
                                    [field.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddOption(idx, field.id);
                                  }
                                }}
                                placeholder="Escribe una opción y pulsa Añadir..."
                                className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddOption(idx, field.id)}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors"
                              >
                                Añadir Opción
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
