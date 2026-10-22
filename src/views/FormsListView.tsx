import React, { useState, useEffect } from 'react';
import { Form, User } from '../types/form.js';
import { useAuth } from '../context/AuthContext.js';
import { DataService, getAgencyConfig, saveAgencyConfig, AgencyConfig } from '../services/dataService.js';
import { buildClientFormLink, buildWhatsAppShareMessage } from '../utils/formEncoding.js';
import { 
  PlusCircle, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  MessageSquare, 
  Trash2, 
  Power, 
  Calendar, 
  FileText, 
  Inbox, 
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  Share2,
  Phone,
  Settings,
  X,
  Sparkles,
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Lock
} from 'lucide-react';

interface FormsListViewProps {
  onNavigate: (view: string, id?: string) => void;
}

export const FormsListView: React.FC<FormsListViewProps> = ({ onNavigate }) => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Copy feedback
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deletion modal
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toggle active state in progress
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Share Modal for Client Link
  const [shareModalForm, setShareModalForm] = useState<Form | null>(null);

  // Settings Modal (WhatsApp number)
  const [showSettings, setShowSettings] = useState(false);
  const [agencyConfig, setAgencyConfig] = useState<AgencyConfig>(getAgencyConfig());

  // Admin user & Advisors modal
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.email === 'law@ronnypena.com.do';
  const [showAdvisorsModal, setShowAdvisorsModal] = useState(false);
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);
  const [newAdvName, setNewAdvName] = useState('');
  const [newAdvEmail, setNewAdvEmail] = useState('');
  const [newAdvPassword, setNewAdvPassword] = useState('');
  const [advError, setAdvError] = useState<string | null>(null);
  const [advSuccess, setAdvSuccess] = useState<string | null>(null);
  const [isSavingAdv, setIsSavingAdv] = useState(false);

  const loadAdvisors = async () => {
    try {
      setLoadingAdvisors(true);
      const list = await DataService.getAdvisors();
      setAdvisors(list);
    } catch {
      // fallback
    } finally {
      setLoadingAdvisors(false);
    }
  };

  const handleCreateAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvError(null);
    setAdvSuccess(null);
    setIsSavingAdv(true);

    try {
      const res = await DataService.createAdvisor(newAdvName, newAdvEmail, newAdvPassword);
      if (res.success && res.user) {
        setAdvSuccess(`¡Asesor ${res.user.name} registrado con éxito!`);
        setNewAdvName('');
        setNewAdvEmail('');
        setNewAdvPassword('');
        loadAdvisors();
      } else {
        setAdvError(res.error || 'No se pudo crear el asesor');
      }
    } catch (err: any) {
      setAdvError(err.message || 'Error al procesar la solicitud');
    } finally {
      setIsSavingAdv(false);
    }
  };

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DataService.getForms();
      setForms(data || []);
    } catch (err: any) {
      setError(err.message || 'No se pudieron obtener los formularios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyClientLink = (form: Form) => {
    const { directLink } = buildClientFormLink(window.location.origin, form);
    navigator.clipboard.writeText(directLink).then(() => {
      setCopiedSlug(form.slug);
      showToast('¡Enlace de cliente copiado! Puedes enviárselo por WhatsApp o correo.');
      setTimeout(() => setCopiedSlug(null), 2500);
    });
  };

  const handleToggleActive = async (form: Form) => {
    try {
      setTogglingId(form.id);
      const newActive = await DataService.toggleActive(form.id);
      setForms((prev) =>
        prev.map((f) => (f.id === form.id ? { ...f, is_active: newActive } : f))
      );
      showToast(newActive ? 'Formulario activado' : 'Formulario pausado');
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!formToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await DataService.deleteForm(formToDelete.id);
      setForms((prev) => prev.filter((f) => f.id !== formToDelete.id));
      setFormToDelete(null);
      showToast('Formulario eliminado con éxito');
    } catch (err) {
      console.error('Error deleting form:', err);
      setDeleteError('No fue posible eliminar el formulario.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveSettings = () => {
    saveAgencyConfig(agencyConfig);
    setShowSettings(false);
    showToast('Configuración guardada exitosamente');
  };

  // Filtered list
  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? form.is_active
        : !form.is_active;

    return matchesSearch && matchesStatus;
  });

  const totalResponses = forms.reduce((acc, f) => acc + (f.response_count || 0), 0);
  const activeCount = forms.filter((f) => f.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mis Formularios de Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crea formularios para visas y trámites, y compártelos con tus clientes para que los llenen sin registrarse.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setShowAdvisorsModal(true);
                loadAdvisors();
              }}
              title="Panel de creación y administración de asesores"
              className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/70 text-indigo-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Gestión de Asesores</span>
              <span className="sm:hidden">Asesores</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            title="Configurar WhatsApp y datos de Asesores Visa"
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Ajustes WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('new-form')}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Nuevo Formulario</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Formularios</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{forms.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Formularios Activos</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Power className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{activeCount}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Respuestas de Clientes</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalResponses}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título o descripción..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({forms.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Activos ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactivos ({forms.length - activeCount})
            </button>
          </div>

          <button
            type="button"
            onClick={fetchForms}
            title="Refrescar lista"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && forms.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Cargando tus formularios...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center bg-red-50 rounded-2xl border border-red-200 p-6">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h2 className="text-base font-bold text-red-800">Error al cargar datos</h2>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            type="button"
            onClick={fetchForms}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {searchTerm || statusFilter !== 'all'
              ? 'No se encontraron formularios'
              : 'Aún no tienes ningún formulario'}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Prueba modificando tus términos de búsqueda o cambiando el filtro de estado.'
              : 'Comienza creando tu primer formulario para que tus clientes puedan completarlo desde cualquier dispositivo.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('new-form')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear mi primer formulario</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => {
            const formattedDate = new Date(form.created_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            const { directLink } = buildClientFormLink(window.location.origin, form);
            const waShareUrl = `https://wa.me/?text=${buildWhatsAppShareMessage(form, directLink, agencyConfig.name)}`;

            return (
              <div
                key={form.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        form.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          form.is_active ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {form.is_active ? 'Activo para Clientes' : 'Pausado'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(form)}
                      disabled={togglingId === form.id}
                      title={form.is_active ? 'Desactivar formulario' : 'Activar formulario'}
                      className={`p-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        form.is_active
                          ? 'text-slate-500 hover:text-amber-600 border-slate-200 hover:bg-amber-50'
                          : 'text-slate-500 hover:text-emerald-600 border-slate-200 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-lg leading-snug line-clamp-2">
                    {form.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[32px]">
                    {form.description || 'Sin descripción'}
                  </p>

                  {/* Share with clients CTA button */}
                  <div className="mt-4 p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold text-blue-900">Enlace para Clientes</p>
                      <p className="text-[10px] text-blue-700">Sin necesidad de iniciar sesión</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShareModalForm(form)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartir</span>
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formattedDate}
                    </span>

                    <button
                      type="button"
                      onClick={() => onNavigate('responses', form.id)}
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-2 py-0.5 rounded-md transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{form.response_count || 0} respuestas</span>
                    </button>
                  </div>
                </div>

                {/* Card Bottom / Actions */}
                <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyClientLink(form)}
                      title="Copiar enlace universal para clientes"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                    >
                      {copiedSlug === form.slug ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={directLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Probar formulario como cliente"
                      className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={waShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enviar a cliente por WhatsApp"
                      className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onNavigate('editor', form.id)}
                      title="Editar formulario"
                      className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormToDelete(form)}
                      title="Eliminar formulario"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share with Client Modal */}
      {shareModalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enlace para Clientes</h3>
                  <p className="text-xs text-slate-500">Cualquier persona puede llenarlo sin registrarse</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalForm(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Enlace Universal Directo (Recomendado)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Funciona en cualquier celular o navegador sin depender de bases de datos externas:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={buildClientFormLink(window.location.origin, shareModalForm).directLink}
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyClientLink(shareModalForm)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                </div>
              </div>

              {/* Share directly via WhatsApp */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Enviar directamente por WhatsApp</span>
                    </h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Abre un chat con el mensaje pre-redactado listo para enviar a tu cliente.
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/?text=${buildWhatsAppShareMessage(
                      shareModalForm,
                      buildClientFormLink(window.location.origin, shareModalForm).directLink,
                      agencyConfig.name
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
                  >
                    Abrir WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShareModalForm(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agency Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Ajustes de Asesores Visa</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nombre de la Empresa o Asesoría
                </label>
                <input
                  type="text"
                  value={agencyConfig.name}
                  onChange={(e) => setAgencyConfig({ ...agencyConfig, name: e.target.value })}
                  placeholder="Ej. Asesores Visa"
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  WhatsApp para recibir formularios completados (Opcional)
                </label>
                <input
                  type="text"
                  value={agencyConfig.phone}
                  onChange={(e) => setAgencyConfig({ ...agencyConfig, phone: e.target.value })}
                  placeholder="Ej. +573001234567 o +13051234567"
                  className="w-full text-sm px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Incluye el código de país. Cuando tus clientes completen un formulario, podrán enviarte todas sus respuestas directamente a este número con un solo clic.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Guardar Ajustes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advisors Management Modal (Admin Only) */}
      {showAdvisorsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gestión de Asesores</h3>
                  <p className="text-xs text-slate-500">
                    Solo el Administrador (<span className="font-semibold text-slate-700">law@ronnypena.com.do</span>) puede registrar nuevos asesores.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdvisorsModal(false);
                  setAdvError(null);
                  setAdvSuccess(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1">
              {/* Form to create advisor */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Registrar Nuevo Asesor
                  </h4>
                </div>

                {advSuccess && (
                  <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{advSuccess}</span>
                  </div>
                )}

                {advError && (
                  <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{advError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateAdvisor} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nombre y Apellido
                      </label>
                      <input
                        type="text"
                        required
                        value={newAdvName}
                        onChange={(e) => setNewAdvName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        required
                        value={newAdvEmail}
                        onChange={(e) => setNewAdvEmail(e.target.value)}
                        placeholder="asesor@asesoresvisa.com"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Contraseña Temporal / Asignada
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newAdvPassword}
                      onChange={(e) => setNewAdvPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSavingAdv}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingAdv ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Guardar y Habilitar Asesor</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* List of current advisors */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Asesores y Usuarios Activos ({advisors.length})
                </h4>

                {loadingAdvisors ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-500" />
                    Cargando lista de asesores...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {advisors.map((adv) => {
                      const isMaster = adv.email.toLowerCase() === 'law@ronnypena.com.do' || adv.role === 'admin';
                      return (
                        <div
                          key={adv.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isMaster
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {adv.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{adv.name}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  isMaster
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {isMaster ? 'Administrador' : 'Asesor'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {adv.email}
                              </span>
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-slate-400">
                            <span>{new Date(adv.created_at).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAdvisorsModal(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {formToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">¿Eliminar formulario?</h3>
            <p className="text-sm text-slate-500 mt-2">
              Estás a punto de eliminar permanentemente el formulario <strong>"{formToDelete.title}"</strong> y
              todas sus <strong>{formToDelete.response_count || 0} respuestas</strong> asociadas.
              Esta acción no se puede deshacer.
            </p>

            {deleteError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                {isDeleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
