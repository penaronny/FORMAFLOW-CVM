import React, { useState, useEffect } from 'react';
import { Field, FieldType, Form } from '../types/form.js';
import { DataService } from '../services/dataService.js';
import { buildClientFormLink } from '../utils/formEncoding.js';
import { SignatureCanvas } from '../components/SignatureCanvas.js';
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
  Phone,
  Radio,
  CheckSquare,
  ToggleLeft,
  Clock,
  CalendarDays,
  Lock,
  Globe,
  Star,
  Grid,
  Table,
  UploadCloud,
  EyeOff,
  ShieldCheck,
  Search,
  Sparkles,
  Layers
} from 'lucide-react';

interface FormEditorViewProps {
  formId?: string; // If undefined, creating new form
  onNavigate: (view: string, id?: string) => void;
}

export type CategoryKey = 'text' | 'selection' | 'datetime' | 'validation' | 'rating' | 'special';

export interface FieldCategoryInfo {
  key: CategoryKey;
  name: string;
  emoji: string;
  desc: string;
  color: string;
}

export interface FieldTemplate {
  type: FieldType;
  category: CategoryKey;
  categoryName: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultLabel: string;
  defaultOptions?: string[];
  defaultMatrixRows?: string[];
  defaultMatrixCols?: string[];
  defaultRatingMax?: number;
  defaultPlaceholder?: string;
  defaultDefaultValue?: string;
  defaultAllowedFileTypes?: string;
}

export const CATEGORIES: FieldCategoryInfo[] = [
  {
    key: 'text',
    name: 'Campos de Texto y Entrada Básica',
    emoji: '📝',
    desc: 'Texto corto, párrafo largo y valores numéricos',
    color: 'blue',
  },
  {
    key: 'selection',
    name: 'Campos de Selección y Opciones',
    emoji: '🔘',
    desc: 'Radio, casillas múltiples, menús desplegables y switch',
    color: 'indigo',
  },
  {
    key: 'datetime',
    name: 'Campos de Fecha, Hora y Formato Avanzado',
    emoji: '📅',
    desc: 'Calendarios, selector horario y combinación fecha/hora',
    color: 'emerald',
  },
  {
    key: 'validation',
    name: 'Campos de Validación Específica',
    emoji: '📥',
    desc: 'Correos, teléfonos internacionales, contraseñas y enlaces web',
    color: 'amber',
  },
  {
    key: 'rating',
    name: 'Campos de Calificación y Escalas',
    emoji: '📊',
    desc: 'Escala de estrellas, matriz de opción única y cuadrícula de casillas',
    color: 'purple',
  },
  {
    key: 'special',
    name: 'Campos Especiales y de Sistema',
    emoji: '📎',
    desc: 'Firma digital interactiva en línea, subida de archivos, campos ocultos y CAPTCHA',
    color: 'rose',
  },
];

export const FIELD_TEMPLATES: FieldTemplate[] = [
  // ==========================================
  // 1. 📝 Campos de Texto y Entrada Básica
  // ==========================================
  {
    type: 'text',
    category: 'text',
    categoryName: 'Texto Básico',
    title: 'Texto corto / Línea única',
    desc: 'Ideal para nombres, pasaportes o respuestas breves',
    icon: Type,
    defaultLabel: 'Nombre completo o dato breve',
    defaultPlaceholder: 'Escribe tu respuesta aquí...',
  },
  {
    type: 'textarea',
    category: 'text',
    categoryName: 'Texto Básico',
    title: 'Texto largo / Párrafo',
    desc: 'Para comentarios, sugerencias o explicaciones detalladas',
    icon: AlignLeft,
    defaultLabel: 'Explicación detallada o comentarios',
    defaultPlaceholder: 'Escribe detalladamente aquí...',
  },
  {
    type: 'number',
    category: 'text',
    categoryName: 'Texto Básico',
    title: 'Número',
    desc: 'Restringe la entrada solo a valores numéricos (edades, cantidades)',
    icon: Hash,
    defaultLabel: 'Cantidad o valor numérico',
    defaultPlaceholder: '0',
  },

  // ==========================================
  // 2. 🔘 Campos de Selección y Opciones
  // ==========================================
  {
    type: 'radio',
    category: 'selection',
    categoryName: 'Selección',
    title: 'Selección única / Botón de radio',
    desc: 'Permite al usuario elegir solo una opción visible de varias',
    icon: Radio,
    defaultLabel: 'Selecciona una única opción',
    defaultOptions: ['Opción 1', 'Opción 2', 'Opción 3'],
  },
  {
    type: 'checkbox',
    category: 'selection',
    categoryName: 'Selección',
    title: 'Selección múltiple / Casilla de verificación',
    desc: 'Permite elegir una o varias opciones al mismo tiempo',
    icon: CheckSquare,
    defaultLabel: 'Selecciona las opciones que apliquen',
    defaultOptions: ['Opción A', 'Opción B', 'Opción C'],
  },
  {
    type: 'select',
    category: 'selection',
    categoryName: 'Selección',
    title: 'Lista desplegable / Menú de selección (Dropdown)',
    desc: 'Permite elegir una opción de una lista oculta que ahorra espacio',
    icon: ListFilter,
    defaultLabel: 'Selecciona una opción del menú',
    defaultOptions: ['Primera Vez (Entrevista Consular)', 'Renovación de Visa', 'Trámite Urgente'],
  },
  {
    type: 'switch',
    category: 'selection',
    categoryName: 'Selección',
    title: 'Sí / No (Toggle / Switch)',
    desc: 'Interruptor binario para encendido/apagado o aceptación de términos',
    icon: ToggleLeft,
    defaultLabel: '¿Aceptas los términos y la política de privacidad?',
  },

  // ==========================================
  // 3. 📅 Campos de Fecha, Hora y Formato Avanzado
  // ==========================================
  {
    type: 'date',
    category: 'datetime',
    categoryName: 'Fecha/Hora',
    title: 'Fecha (Date)',
    desc: 'Abre un calendario interactivo para seleccionar día, mes y año',
    icon: Calendar,
    defaultLabel: 'Fecha estimada de viaje o nacimiento',
  },
  {
    type: 'time',
    category: 'datetime',
    categoryName: 'Fecha/Hora',
    title: 'Hora (Time)',
    desc: 'Permite ingresar horas y minutos con selector AM/PM',
    icon: Clock,
    defaultLabel: 'Hora preferida para la consulta o cita',
  },
  {
    type: 'datetime',
    category: 'datetime',
    categoryName: 'Fecha/Hora',
    title: 'Fecha y Hora (Date & Time)',
    desc: 'Combina ambos campos en una sola entrada integrada',
    icon: CalendarDays,
    defaultLabel: 'Fecha y hora programada',
  },

  // ==========================================
  // 4. 📥 Campos de Validación Específica
  // ==========================================
  {
    type: 'email',
    category: 'validation',
    categoryName: 'Validación',
    title: 'Correo electrónico (Email)',
    desc: 'Valida automáticamente estructura correcta ejemplo@dominio.com',
    icon: Mail,
    defaultLabel: 'Correo Electrónico de Contacto',
    defaultPlaceholder: 'cliente@ejemplo.com',
  },
  {
    type: 'phone',
    category: 'validation',
    categoryName: 'Validación',
    title: 'Teléfono (Phone)',
    desc: 'Formatea y valida números telefónicos con código de país',
    icon: Phone,
    defaultLabel: 'Número de Teléfono / WhatsApp',
    defaultPlaceholder: '+1 (809) 000-0000',
  },
  {
    type: 'password',
    category: 'validation',
    categoryName: 'Validación',
    title: 'Contraseña (Password)',
    desc: 'Oculta caracteres introducidos mediante puntos por seguridad',
    icon: Lock,
    defaultLabel: 'Contraseña de seguridad',
    defaultPlaceholder: '••••••••',
  },
  {
    type: 'url',
    category: 'validation',
    categoryName: 'Validación',
    title: 'Sitio Web / URL',
    desc: 'Valida que el texto ingresado sea un enlace web válido (https://...)',
    icon: Globe,
    defaultLabel: 'Sitio Web o Portafolio',
    defaultPlaceholder: 'https://www.ejemplo.com',
  },

  // ==========================================
  // 5. 📊 Campos de Calificación y Escalas
  // ==========================================
  {
    type: 'rating',
    category: 'rating',
    categoryName: 'Calificación',
    title: 'Escala lineal / Calificación (Star rating)',
    desc: 'Permite puntuar con estrellas del 1 al 5 o del 1 al 10',
    icon: Star,
    defaultLabel: '¿Cómo calificarías tu experiencia con nuestro servicio?',
    defaultRatingMax: 5,
  },
  {
    type: 'matrix_radio',
    category: 'rating',
    categoryName: 'Calificación',
    title: 'Matriz / Cuadrícula de opción múltiple',
    desc: 'Tabla donde las filas son preguntas y las columnas opciones de respuesta única',
    icon: Grid,
    defaultLabel: 'Evaluación por aspectos del servicio',
    defaultMatrixRows: ['Atención al cliente', 'Rapidez en el trámite', 'Claridad de las instrucciones'],
    defaultMatrixCols: ['Excelente', 'Bueno', 'Regular', 'Malo'],
  },
  {
    type: 'matrix_checkbox',
    category: 'rating',
    categoryName: 'Calificación',
    title: 'Cuadrícula de casillas de verificación',
    desc: 'Igual a la matriz, pero permite seleccionar múltiples opciones por fila',
    icon: Table,
    defaultLabel: 'Disponibilidad horaria por jornada',
    defaultMatrixRows: ['Lunes a Miércoles', 'Jueves y Viernes', 'Sábados'],
    defaultMatrixCols: ['Mañana (8am - 12pm)', 'Tarde (1pm - 5pm)', 'Noche (6pm - 8pm)'],
  },

  // ==========================================
  // 6. 📎 Campos Especiales y de Sistema
  // ==========================================
  {
    type: 'file',
    category: 'special',
    categoryName: 'Especiales',
    title: 'Subir archivo (File upload)',
    desc: 'Permite al usuario adjuntar documentos, imágenes o PDFs',
    icon: UploadCloud,
    defaultLabel: 'Adjuntar copia de pasaporte o comprobante',
    defaultAllowedFileTypes: '.pdf, .png, .jpg, .jpeg',
  },
  {
    type: 'signature',
    category: 'special',
    categoryName: 'Especiales',
    title: 'Firma digital en línea (Signature)',
    desc: 'Recuadro interactivo para firmar a mano alzada con mouse o pantalla táctil',
    icon: PenTool,
    defaultLabel: 'Firma Digital Manuscrita del Solicitante',
  },
  {
    type: 'hidden',
    category: 'special',
    categoryName: 'Especiales',
    title: 'Oculto (Hidden field)',
    desc: 'Recopila datos de fondo que el usuario no ve (tracking, ID de campaña)',
    icon: EyeOff,
    defaultLabel: 'Código de Campaña / Tracking',
    defaultDefaultValue: 'ORIGEN-VISA-2026',
  },
  {
    type: 'captcha',
    category: 'special',
    categoryName: 'Especiales',
    title: 'CAPTCHA / ReCAPTCHA (Verificación)',
    desc: 'Filtro de seguridad para verificar humanos y bloquear bots',
    icon: ShieldCheck,
    defaultLabel: 'Verificación Humana de Seguridad',
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

  // Field picker modal state
  const [pickerModalOpen, setPickerModalOpen] = useState(false);

  // Search input for sidebar palette
  const [searchFilter, setSearchFilter] = useState('');
  // Active selected category filter tab ('all' or category key)
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');

  // Input buffers for options, matrix rows, and matrix cols
  const [newOptionBuffers, setNewOptionBuffers] = useState<Record<string, string>>({});
  const [newRowBuffers, setNewRowBuffers] = useState<Record<string, string>>({});
  const [newColBuffers, setNewColBuffers] = useState<Record<string, string>>({});

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
      // Default starting state for a comprehensive visa form with signature
      setTitle('Solicitud de Trámite Consular y Visa Americana B1/B2');
      setDescription('Por favor completa todos los campos requeridos y estampa tu firma digital al final para procesar tu solicitud con Asesores Visa.');
      setFields([
        {
          id: `fld-${Date.now()}-1`,
          form_id: '',
          label: 'Nombre y Apellidos completos (según Pasaporte)',
          type: 'text',
          is_required: true,
          position: 0,
          placeholder: 'Ej. Juan Carlos Pérez Rodríguez',
        },
        {
          id: `fld-${Date.now()}-2`,
          form_id: '',
          label: 'Correo Electrónico de Contacto',
          type: 'email',
          is_required: true,
          position: 1,
          placeholder: 'juan.perez@ejemplo.com',
        },
        {
          id: `fld-${Date.now()}-3`,
          form_id: '',
          label: 'Número de Teléfono / WhatsApp',
          type: 'phone',
          is_required: true,
          position: 2,
          placeholder: '+1 (809) 555-1234',
        },
        {
          id: `fld-${Date.now()}-4`,
          form_id: '',
          label: 'Tipo de Trámite Consular',
          type: 'select',
          is_required: true,
          options: ['Primera Vez (Entrevista Consular)', 'Renovación de Visa', 'Trámite de Emergencia'],
          position: 3,
        },
        {
          id: `fld-${Date.now()}-5`,
          form_id: '',
          label: 'Firma Digital del Solicitante (en línea)',
          type: 'signature',
          is_required: true,
          position: 4,
        },
      ]);
    }
  }, [formId]);

  const addField = (template: FieldTemplate) => {
    const newField: Field = {
      id: `fld-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      form_id: formId || '',
      label: template.defaultLabel,
      type: template.type,
      is_required: false,
      options: template.defaultOptions ? [...template.defaultOptions] : [],
      matrix_rows: template.defaultMatrixRows ? [...template.defaultMatrixRows] : undefined,
      matrix_cols: template.defaultMatrixCols ? [...template.defaultMatrixCols] : undefined,
      rating_max: template.defaultRatingMax,
      placeholder: template.defaultPlaceholder,
      default_value: template.defaultDefaultValue,
      allowed_file_types: template.defaultAllowedFileTypes,
      position: fields.length,
    };
    setFields((prev) => [...prev, newField]);
    setValidationErrors([]);
    setPickerModalOpen(false);
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

  // Option handlers
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
    updateField(fieldIndex, { options: currentOptions.filter((_, i) => i !== optionIndex) });
  };

  // Matrix rows handlers
  const handleAddMatrixRow = (fieldIndex: number, fieldId: string) => {
    const val = (newRowBuffers[fieldId] || '').trim();
    if (!val) return;
    const currentRows = fields[fieldIndex].matrix_rows || [];
    if (currentRows.includes(val)) return;
    updateField(fieldIndex, { matrix_rows: [...currentRows, val] });
    setNewRowBuffers((prev) => ({ ...prev, [fieldId]: '' }));
  };

  const handleRemoveMatrixRow = (fieldIndex: number, rowIndex: number) => {
    const currentRows = fields[fieldIndex].matrix_rows || [];
    updateField(fieldIndex, { matrix_rows: currentRows.filter((_, i) => i !== rowIndex) });
  };

  // Matrix cols handlers
  const handleAddMatrixCol = (fieldIndex: number, fieldId: string) => {
    const val = (newColBuffers[fieldId] || '').trim();
    if (!val) return;
    const currentCols = fields[fieldIndex].matrix_cols || [];
    if (currentCols.includes(val)) return;
    updateField(fieldIndex, { matrix_cols: [...currentCols, val] });
    setNewColBuffers((prev) => ({ ...prev, [fieldId]: '' }));
  };

  const handleRemoveMatrixCol = (fieldIndex: number, colIndex: number) => {
    const currentCols = fields[fieldIndex].matrix_cols || [];
    updateField(fieldIndex, { matrix_cols: currentCols.filter((_, i) => i !== colIndex) });
  };

  const handleSave = async () => {
    setValidationErrors([]);

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
      if ((f.type === 'select' || f.type === 'radio' || f.type === 'checkbox') && (!f.options || f.options.length === 0)) {
        errors.push(`El campo "${f.label || `#${idx + 1}`}" debe tener al menos una opción disponible`);
      }
      if ((f.type === 'matrix_radio' || f.type === 'matrix_checkbox')) {
        if (!f.matrix_rows || f.matrix_rows.length === 0) {
          errors.push(`La matriz "${f.label || `#${idx + 1}`}" debe tener al menos una fila`);
        }
        if (!f.matrix_cols || f.matrix_cols.length === 0) {
          errors.push(`La matriz "${f.label || `#${idx + 1}`}" debe tener al menos una columna`);
        }
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

  // Build client form link
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

  // Filter templates for sidebar
  const visibleTemplates = FIELD_TEMPLATES.filter((tmpl) => {
    if (selectedCategoryTab !== 'all' && tmpl.category !== selectedCategoryTab) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return tmpl.title.toLowerCase().includes(q) || tmpl.desc.toLowerCase().includes(q) || tmpl.categoryName.toLowerCase().includes(q);
    }
    return true;
  });

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
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
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
            <button
              type="button"
              onClick={() => setPickerModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Explorar los 20 Campos</span>
            </button>

            {slug && (
              <>
                <button
                  type="button"
                  onClick={handleCopyClientLink}
                  title="Copiar enlace universal para clientes (no requiere registro)"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">¡Enlace Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-blue-600" />
                      <span>Copiar Enlace</span>
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
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors border cursor-pointer ${
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
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
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
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shrink-0 cursor-pointer"
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  Vista Previa del Cliente (Sin Login)
                </span>
                <span className="text-xs text-slate-400">{fields.length} campos</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-3">{title || 'Sin Título'}</h2>
              <p className="text-sm text-slate-500 mt-2 whitespace-pre-line">{description || 'Sin descripción'}</p>
            </div>

            <div className="space-y-6">
              {fields.map((f, i) => {
                if (f.type === 'hidden') {
                  return (
                    <div key={f.id || i} className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Campo Oculto ({f.label}): {f.default_value || 'Sin valor'}</span>
                      </span>
                      <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">Invisible para el cliente</span>
                    </div>
                  );
                }

                return (
                  <div key={f.id || i} className="space-y-2 p-4 bg-slate-50/50 rounded-2xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-800">
                      <span className="text-slate-400 font-normal mr-1">{i + 1}.</span>
                      {f.label} {f.is_required && <span className="text-red-500">*</span>}
                    </label>

                    {/* Short Text */}
                    {f.type === 'text' && (
                      <input
                        type="text"
                        disabled
                        placeholder={f.placeholder || 'Respuesta de texto corto...'}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl"
                      />
                    )}

                    {/* Long Text */}
                    {f.type === 'textarea' && (
                      <textarea
                        disabled
                        rows={3}
                        placeholder={f.placeholder || 'Escribe una respuesta detallada...'}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl"
                      />
                    )}

                    {/* Number */}
                    {f.type === 'number' && (
                      <input
                        type="number"
                        disabled
                        placeholder={f.placeholder || '0'}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl"
                      />
                    )}

                    {/* Email */}
                    {f.type === 'email' && (
                      <input
                        type="email"
                        disabled
                        placeholder={f.placeholder || 'ejemplo@cliente.com'}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl"
                      />
                    )}

                    {/* Phone */}
                    {f.type === 'phone' && (
                      <input
                        type="tel"
                        disabled
                        placeholder={f.placeholder || '+1 (809) 000-0000'}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl"
                      />
                    )}

                    {/* Password */}
                    {f.type === 'password' && (
                      <input
                        type="password"
                        disabled
                        value="contraseñasecreta"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl"
                      />
                    )}

                    {/* URL */}
                    {f.type === 'url' && (
                      <input
                        type="url"
                        disabled
                        placeholder={f.placeholder || 'https://www.ejemplo.com'}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl"
                      />
                    )}

                    {/* Date */}
                    {f.type === 'date' && (
                      <input
                        type="date"
                        disabled
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-500"
                      />
                    )}

                    {/* Time */}
                    {f.type === 'time' && (
                      <input
                        type="time"
                        disabled
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-500"
                      />
                    )}

                    {/* DateTime */}
                    {f.type === 'datetime' && (
                      <input
                        type="datetime-local"
                        disabled
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-500"
                      />
                    )}

                    {/* Select */}
                    {f.type === 'select' && (
                      <select
                        disabled
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-700"
                      >
                        <option value="">Selecciona una opción...</option>
                        {(f.options || []).map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Radio Button */}
                    {f.type === 'radio' && (
                      <div className="space-y-2 pt-1">
                        {(f.options || []).map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-center gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                            <input type="radio" disabled name={`preview-radio-${f.id}`} className="text-blue-600" />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Checkbox */}
                    {f.type === 'checkbox' && (
                      <div className="space-y-2 pt-1">
                        {(f.options || []).map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-center gap-2.5 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200">
                            <input type="checkbox" disabled className="text-blue-600 rounded" />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Switch Toggle */}
                    {f.type === 'switch' && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-xs font-medium text-slate-700">Estado de confirmación (Sí/No)</span>
                        <div className="w-11 h-6 bg-blue-600 rounded-full relative">
                          <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-xs" />
                        </div>
                      </div>
                    )}

                    {/* Rating Stars */}
                    {f.type === 'rating' && (
                      <div className="flex items-center gap-1.5 p-3 bg-white rounded-xl border border-slate-200">
                        {Array.from({ length: f.rating_max || 5 }).map((_, rIdx) => (
                          <Star key={rIdx} className="w-6 h-6 text-amber-400 fill-amber-400" />
                        ))}
                        <span className="text-xs text-slate-500 ml-2 font-medium">Escala de 1 a {f.rating_max || 5}</span>
                      </div>
                    )}

                    {/* Matrix Radio */}
                    {f.type === 'matrix_radio' && (
                      <div className="overflow-x-auto bg-white p-3 rounded-xl border border-slate-200">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="text-left py-2 px-2 text-slate-400 font-semibold">Aspecto</th>
                              {(f.matrix_cols || []).map((c, cIdx) => (
                                <th key={cIdx} className="text-center py-2 px-2 text-slate-600 font-semibold">{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(f.matrix_rows || []).map((r, rIdx) => (
                              <tr key={rIdx} className="border-b border-slate-50">
                                <td className="py-2.5 px-2 font-medium text-slate-700">{r}</td>
                                {(f.matrix_cols || []).map((_, cIdx) => (
                                  <td key={cIdx} className="text-center py-2.5 px-2">
                                    <input type="radio" disabled name={`preview-mat-${f.id}-${rIdx}`} className="text-blue-600" />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Matrix Checkbox */}
                    {f.type === 'matrix_checkbox' && (
                      <div className="overflow-x-auto bg-white p-3 rounded-xl border border-slate-200">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="text-left py-2 px-2 text-slate-400 font-semibold">Aspecto</th>
                              {(f.matrix_cols || []).map((c, cIdx) => (
                                <th key={cIdx} className="text-center py-2 px-2 text-slate-600 font-semibold">{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(f.matrix_rows || []).map((r, rIdx) => (
                              <tr key={rIdx} className="border-b border-slate-50">
                                <td className="py-2.5 px-2 font-medium text-slate-700">{r}</td>
                                {(f.matrix_cols || []).map((_, cIdx) => (
                                  <td key={cIdx} className="text-center py-2.5 px-2">
                                    <input type="checkbox" disabled className="text-blue-600 rounded" />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* File Upload */}
                    {f.type === 'file' && (
                      <div className="p-6 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-center">
                        <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-700">Subir archivo o documento</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Formatos permitidos: {f.allowed_file_types || '.pdf, .png, .jpg'}</p>
                      </div>
                    )}

                    {/* Signature */}
                    {f.type === 'signature' && (
                      <div className="bg-white p-3 rounded-2xl border border-slate-200">
                        <SignatureCanvas
                          label={f.label}
                          disabled={true}
                          onChange={() => {}}
                        />
                      </div>
                    )}

                    {/* Captcha */}
                    {f.type === 'captcha' && (
                      <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-6 h-6 text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Verificación Humana</p>
                            <p className="text-[11px] text-slate-400">¿Cuánto es 8 + 4? (12)</p>
                          </div>
                        </div>
                        <input
                          type="text"
                          disabled
                          placeholder="Tu respuesta..."
                          className="w-24 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-center"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button
                type="button"
                disabled
                className="w-full py-3.5 bg-blue-600 text-white font-bold text-sm rounded-xl opacity-75 cursor-not-allowed shadow-md"
              >
                Enviar Respuestas
              </button>
            </div>
          </div>
        ) : (
          /* Editor Layout: Left Palette + Center Canvas */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar Palette */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs sticky top-36 max-h-[85vh] flex flex-col">
              <div className="pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Catálogo de Campos</span>
                  </h3>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    20 tipos
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-1">
                  Organizados en 6 categorías lógicas. Haz clic en cualquiera para agregarlo:
                </p>

                {/* Search Bar */}
                <div className="relative mt-2.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Buscar campo (ej. firma, fecha, matriz)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Horizontal Scroll/Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('all')}
                  className={`px-2 py-1 rounded-lg font-bold shrink-0 cursor-pointer transition-colors ${
                    selectedCategoryTab === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({FIELD_TEMPLATES.length})
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategoryTab(cat.key)}
                    className={`px-2 py-1 rounded-lg font-semibold shrink-0 cursor-pointer flex items-center gap-1 transition-colors ${
                      selectedCategoryTab === cat.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name.split(' ')[2] || cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Template Items Scroll Area */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-4">
                {CATEGORIES.filter((c) => selectedCategoryTab === 'all' || selectedCategoryTab === c.key).map((category) => {
                  const catTemplates = visibleTemplates.filter((t) => t.category === category.key);
                  if (catTemplates.length === 0) return null;

                  return (
                    <div key={category.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-100">
                        <span className="flex items-center gap-1.5">
                          <span>{category.emoji}</span>
                          <span className="truncate">{category.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {catTemplates.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 pl-1">
                        {catTemplates.map((tmpl) => {
                          const Icon = tmpl.icon;
                          const isSig = tmpl.type === 'signature';

                          return (
                            <button
                              key={tmpl.type}
                              type="button"
                              onClick={() => addField(tmpl)}
                              className={`w-full flex items-center gap-2.5 p-2 text-left rounded-xl border transition-all group cursor-pointer ${
                                isSig
                                  ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100/70'
                                  : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                                isSig
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 group-hover:bg-blue-600 text-slate-600 group-hover:text-white'
                              }`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-bold truncate ${
                                    isSig ? 'text-indigo-950 font-extrabold' : 'text-slate-800 group-hover:text-blue-900'
                                  }`}>
                                    {tmpl.title}
                                  </span>
                                  <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
                                </div>
                                <p className="text-[10px] text-slate-400 truncate">{tmpl.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status active/inactive switch */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Formulario Activo</p>
                    <p className="text-[10px] text-slate-400">
                      {isActive ? 'Abierto para respuestas' : 'Pausado'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                      isActive ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-5' : 'translate-x-1'
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Preguntas y Campos Configurados ({fields.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPickerModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Campo</span>
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 text-center space-y-3">
                    <p className="text-sm font-bold text-slate-800">No hay campos en el formulario todavía</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Explora los 20 campos disponibles organizados por categorías (texto, selección, fecha/hora, validación, escalas y firma digital).
                    </p>
                    <button
                      type="button"
                      onClick={() => setPickerModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Abrir Catálogo de 20 Campos</span>
                    </button>
                  </div>
                ) : (
                  fields.map((field, idx) => {
                    const template = FIELD_TEMPLATES.find((t) => t.type === field.type) || FIELD_TEMPLATES[0];
                    const Icon = template.icon;
                    const isSig = field.type === 'signature';

                    return (
                      <div
                        key={field.id || idx}
                        className={`bg-white rounded-3xl border p-6 shadow-xs transition-colors ${
                          isSig ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Field Header */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${
                              isSig ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              <Icon className="w-3.5 h-3.5 text-blue-600" />
                              <span>{template.title}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({template.categoryName})</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Reorder Up */}
                            <button
                              type="button"
                              onClick={() => moveField(idx, 'up')}
                              disabled={idx === 0}
                              aria-label={`Mover campo #${idx + 1} hacia arriba`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>

                            {/* Reorder Down */}
                            <button
                              type="button"
                              onClick={() => moveField(idx, 'down')}
                              disabled={idx === fields.length - 1}
                              aria-label={`Mover campo #${idx + 1} hacia abajo`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Delete Field */}
                            <button
                              type="button"
                              onClick={() => removeField(idx)}
                              aria-label={`Eliminar campo ${field.label || idx + 1}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Label & Required setting */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                          <div className="sm:col-span-8">
                            <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor={`field-label-${idx}`}>
                              Etiqueta o Pregunta a Solicitar
                            </label>
                            <input
                              id={`field-label-${idx}`}
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(idx, { label: e.target.value })}
                              placeholder="Ej. Nombre completo, firma, pasaporte..."
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

                        {/* Placeholder configuration for text/number/email/phone/url */}
                        {['text', 'textarea', 'number', 'email', 'phone', 'url'].includes(field.type) && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">
                              Texto de ayuda (Placeholder opcional)
                            </label>
                            <input
                              type="text"
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                              placeholder="Texto gris tenue dentro de la casilla..."
                              className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                            />
                          </div>
                        )}

                        {/* Hidden Field Value */}
                        {field.type === 'hidden' && (
                          <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Valor Oculto por Defecto (se guardará automáticamente):
                            </label>
                            <input
                              type="text"
                              value={field.default_value || ''}
                              onChange={(e) => updateField(idx, { default_value: e.target.value })}
                              placeholder="Ej. ID_CAMPAÑA_2026"
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                            />
                          </div>
                        )}

                        {/* File Upload Formats */}
                        {field.type === 'file' && (
                          <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Extensiones permitidas (separadas por coma):
                            </label>
                            <input
                              type="text"
                              value={field.allowed_file_types || '.pdf, .png, .jpg, .jpeg'}
                              onChange={(e) => updateField(idx, { allowed_file_types: e.target.value })}
                              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl"
                            />
                          </div>
                        )}

                        {/* Rating scale configuration */}
                        {field.type === 'rating' && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 bg-slate-50/70 p-3 rounded-xl">
                            <span className="text-xs font-bold text-slate-700">Rango de Calificación:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateField(idx, { rating_max: 5 })}
                                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                                  (field.rating_max || 5) === 5 ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'
                                }`}
                              >
                                1 a 5 Estrellas
                              </button>
                              <button
                                type="button"
                                onClick={() => updateField(idx, { rating_max: 10 })}
                                className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                                  field.rating_max === 10 ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'
                                }`}
                              >
                                1 a 10 Estrellas
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Select, Radio, Checkbox Options Manager */}
                        {['select', 'radio', 'checkbox'].includes(field.type) && (
                          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl">
                            <label className="block text-xs font-bold text-slate-700 mb-2">
                              Opciones configuradas ({field.options?.length || 0}):
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
                                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
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
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                              >
                                Añadir Opción
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Matrix Rows & Columns Manager */}
                        {['matrix_radio', 'matrix_checkbox'].includes(field.type) && (
                          <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl space-y-4">
                            {/* Rows */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                Filas (Preguntas a evaluar):
                              </label>
                              <div className="space-y-1.5 mb-2">
                                {(field.matrix_rows || []).map((row, rIdx) => (
                                  <div key={rIdx} className="flex items-center gap-2">
                                    <span className="text-xs text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-lg flex-1">
                                      {row}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMatrixRow(idx, rIdx)}
                                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newRowBuffers[field.id] || ''}
                                  onChange={(e) => setNewRowBuffers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                                  placeholder="Nueva fila..."
                                  className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddMatrixRow(idx, field.id)}
                                  className="px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg font-medium cursor-pointer"
                                >
                                  + Fila
                                </button>
                              </div>
                            </div>

                            {/* Cols */}
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">
                                Columnas (Opciones de respuesta):
                              </label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {(field.matrix_cols || []).map((col, cIdx) => (
                                  <span key={cIdx} className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                                    <span>{col}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMatrixCol(idx, cIdx)}
                                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={newColBuffers[field.id] || ''}
                                  onChange={(e) => setNewColBuffers((prev) => ({ ...prev, [field.id]: e.target.value }))}
                                  placeholder="Nueva columna..."
                                  className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddMatrixCol(idx, field.id)}
                                  className="px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg font-medium cursor-pointer"
                                >
                                  + Columna
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Digital Signature info banner */}
                        {field.type === 'signature' && (
                          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                            <PenTool className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>
                              Este campo renderiza un lienzo táctil HTML5 de alta fidelidad para que el cliente firme a mano alzada en línea desde su celular o ratón.
                            </span>
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

      {/* 20 FIELD TYPES EXPLORER MODAL */}
      {pickerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span>Catálogo Completo: 20 Campos en 6 Categorías</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Selecciona cualquier campo para incorporarlo de inmediato a tu formulario.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 flex-1 space-y-6 pr-1">
              {CATEGORIES.map((cat) => {
                const catFields = FIELD_TEMPLATES.filter((t) => t.category === cat.key);

                return (
                  <div key={cat.key} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                      <span className="text-base">{cat.emoji}</span>
                      <h4 className="text-sm font-bold text-slate-800">{cat.name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">({catFields.length} campos)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {catFields.map((field) => {
                        const Icon = field.icon;
                        const isSig = field.type === 'signature';

                        return (
                          <button
                            key={field.type}
                            type="button"
                            onClick={() => addField(field)}
                            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer ${
                              isSig
                                ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-300 hover:border-indigo-500 ring-2 ring-indigo-500/10'
                                : 'bg-slate-50/70 border-slate-200 hover:bg-blue-50/40 hover:border-blue-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isSig ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-blue-600'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200">
                                + Añadir
                              </span>
                            </div>

                            <div>
                              <p className={`text-xs font-bold leading-snug ${isSig ? 'text-indigo-950 font-extrabold' : 'text-slate-800'}`}>
                                {field.title}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                                {field.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPickerModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
