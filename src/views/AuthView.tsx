import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  Globe2,
  Plane
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  
  // Login form state
  const [email, setEmail] = useState('law@ronnypena.com.do');
  const [password, setPassword] = useState('Escafowne1.');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Credenciales inválidas. Verifique su correo y contraseña.');
      }
    } catch {
      setError('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3">
              <Plane className="w-7 h-7 transform -rotate-45" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Asesores Visa</h1>
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mt-0.5">
              Portal Administrativo y Consular
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Ingresa tus credenciales autorizadas para gestionar formularios, expedientes y respuestas de clientes.
            </p>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] leading-relaxed">
              <strong>Acceso restringido:</strong> El registro público está deshabilitado. Nuevos asesores son creados exclusivamente por el Administrador.
            </span>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="auth-email">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="law@ronnypena.com.do"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="auth-password">
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña de acceso"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>
          </form>

          {/* Security & Features badges */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <Globe2 className="w-4 h-4 text-blue-600 mb-1" />
              <span className="text-[10px] font-medium text-slate-600 leading-tight">Links para Clientes</span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="text-[10px] font-medium text-slate-600 leading-tight">Encriptación AES-256</span>
            </div>
            <div className="flex flex-col items-center">
              <FileText className="w-4 h-4 text-indigo-600 mb-1" />
              <span className="text-[10px] font-medium text-slate-600 leading-tight">Exportación PDF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
