import React, { useState, useEffect } from 'react';
import { Field, Form, FormResponseRecord } from '../types/form.js';
import { DataService } from '../services/dataService.js';
import { buildClientFormLink } from '../utils/formEncoding.js';
import { exportResponsesToPDF, exportSingleResponseToPDF } from '../utils/pdfExport.js';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  Download, 
  FileText,
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  Filter, 
  Eye, 
  X, 
  AlertCircle,
  Inbox,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

interface ResponsesViewProps {
  formId: string;
  onNavigate: (view: string, id?: string) => void;
}

export const ResponsesView: React.FC<ResponsesViewProps> = ({ formId, onNavigate }) => {
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [responses, setResponses] = useState<FormResponseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected response for detailed modal
  const [selectedResponse, setSelectedResponse] = useState<FormResponseRecord | null>(null);

  // Link copy state
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DataService.getResponses(formId);
      setForm(data.form);
      setFields(data.fields || []);
      setResponses(data.responses || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las respuestas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [formId]);

  const handleCopyLink = () => {
    if (!form?.slug) return;
    const { directLink } = buildClientFormLink(window.location.origin, {
      ...form,
      fields,
    });
    navigator.clipboard.writeText(directLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Filter logic
  const filteredResponses = responses.filter((resp) => {
    // 1. Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const anyAnswerMatches = Object.values(resp.answers).some((val) =>
        String(val).toLowerCase().includes(q)
      );
      if (!anyAnswerMatches && !resp.id.toLowerCase().includes(q)) {
        return false;
      }
    }

    // 2. Date filters
    const subDate = new Date(resp.submitted_at);
    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`);
      if (subDate < from) return false;
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`);
      if (subDate > to) return false;
    }

    return true;
  });

  // Export to PDF
  const handleExportPDF = () => {
    if (!form || fields.length === 0 || responses.length === 0) return;
    exportResponsesToPDF(form, fields, filteredResponses);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  if (loading && !form) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Cargando base de datos de respuestas...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-red-900">No se pudo acceder a las respuestas</h2>
          <p className="text-sm text-red-600 mt-1 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => onNavigate('forms')}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl"
          >
            Volver a Mis Formularios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('forms')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Mis Formularios</span>
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {form.title}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                form.is_active
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {form.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <p className="text-xs text-slate-500">
              Respuestas almacenadas en base de datos centralizada
            </p>
            <span className="text-slate-300">•</span>
            <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Protección y Encriptación AES-256 en Reposo</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar Enlace</span>
              </>
            )}
          </button>

          <a
            href={`/#f/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Abrir Formulario</span>
          </a>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={responses.length === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Stats and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs mb-6 space-y-4">
        {/* Metric banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Respuestas</span>
              <p className="text-2xl font-bold text-slate-900">{responses.length}</p>
            </div>
            {searchTerm || dateFrom || dateTo ? (
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Filtradas</span>
                <p className="text-2xl font-bold text-blue-600">{filteredResponses.length}</p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={fetchResponses}
            title="Actualizar respuestas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
        </div>

        {/* Filters Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar texto en cualquier respuesta..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Date from */}
          <div className="md:col-span-3 flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 shrink-0">Desde:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            />
          </div>

          {/* Date to */}
          <div className="md:col-span-3 flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 shrink-0">Hasta:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            />
          </div>

          {/* Clear */}
          <div className="md:col-span-1 flex justify-end">
            {(searchTerm || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responses Table */}
      {filteredResponses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
            <Inbox className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {responses.length === 0
              ? 'Aún no se han recibido respuestas'
              : 'Ninguna respuesta coincide con los filtros'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {responses.length === 0
              ? 'Comparte el enlace de tu formulario con los colaboradores para empezar a recopilar datos.'
              : 'Intenta restablecer las fechas o la palabra de búsqueda.'}
          </p>
          {responses.length === 0 && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar enlace para compartir</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[160px]">Fecha de Envío</th>
                  {fields.map((field) => (
                    <th key={field.id} className="py-3 px-4 whitespace-nowrap max-w-xs truncate">
                      {field.label}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResponses.map((resp, idx) => {
                  const dateStr = new Date(resp.submitted_at).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={resp.id}
                      onClick={() => setSelectedResponse(resp)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </td>
                      {fields.map((field) => {
                        const val = resp.answers[field.id] || '—';
                        return (
                          <td
                            key={field.id}
                            className="py-3.5 px-4 text-slate-600 max-w-xs truncate"
                            title={String(val)}
                          >
                            {val}
                          </td>
                        );
                      })}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedResponse(resp);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detalle de la Respuesta</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registrada el {new Date(selectedResponse.submitted_at).toLocaleString('es-ES')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
              {fields.map((field) => {
                const answerVal = selectedResponse.answers[field.id];
                return (
                  <div key={field.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {field.label}
                    </span>
                    <p className="text-sm text-slate-900 whitespace-pre-wrap font-medium">
                      {answerVal !== undefined && answerVal !== '' ? answerVal : <span className="text-slate-400 italic">Sin respuesta</span>}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => exportSingleResponseToPDF(form, fields, selectedResponse)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Descargar Ficha en PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
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
