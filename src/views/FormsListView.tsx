import React, { useState, useEffect } from 'react';
import { Form } from '../types/form';
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
  FileSpreadsheet
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
  
  // Copy link feedback
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Deletion modal
  const [formToDelete, setFormToDelete] = useState<Form | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toggle active state in progress
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/forms');
      if (!res.ok) {
        throw new Error('Error al cargar formularios');
      }
      const data = await res.json();
      setForms(data.forms || []);
    } catch (err: any) {
      setError(err.message || 'No se pudieron obtener los formularios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/#f/${slug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2500);
    });
  };

  const handleToggleActive = async (form: Form) => {
    try {
      setTogglingId(form.id);
      const res = await fetch(`/api/forms/${form.id}/toggle-active`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const data = await res.json();
        setForms((prev) =>
          prev.map((f) => (f.id === form.id ? { ...f, is_active: data.is_active } : f))
        );
      }
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
      const res = await fetch(`/api/forms/${formToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setForms((prev) => prev.filter((f) => f.id !== formToDelete.id));
        setFormToDelete(null);
      } else {
        setDeleteError('No fue posible eliminar el formulario. Intenta nuevamente.');
      }
    } catch (err) {
      console.error('Error deleting form:', err);
      setDeleteError('Error de red al intentar eliminar.');
    } finally {
      setIsDeleting(false);
    }
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
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mis Formularios</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crea, administra y consulta las respuestas de los formularios de tu organización.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('new-form')}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Nuevo Formulario</span>
        </button>
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Respuestas</span>
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
              : 'Comienza a recopilar información interna creando tu primer formulario dinámico.'}
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

            return (
              <div
                key={form.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
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
                      {form.is_active ? 'Activo' : 'Inactivo'}
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

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formattedDate}
                    </span>

                    <button
                      type="button"
                      onClick={() => onNavigate('responses', form.id)}
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 px-2 py-0.5 rounded-md transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{form.response_count || 0} respuestas</span>
                    </button>
                  </div>
                </div>

                {/* Card Bottom / Actions */}
                <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(form.slug)}
                      title="Copiar enlace único para compartir"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
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
                      href={`/#f/${form.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir formulario público"
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onNavigate('editor', form.id)}
                      title="Editar formulario"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormToDelete(form)}
                      title="Eliminar formulario"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
