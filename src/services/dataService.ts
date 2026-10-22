import { Form, Field, FormResponseRecord, User } from '../types/form.js';
import { generateSlug, validateFormDefinition, validateEmail, validatePassword } from '../utils/validation.js';
import { encryptAnswersMap, decryptAnswersMap } from '../utils/encryption.js';

const STORAGE_KEY_FORMS = 'formflow_forms_v2';
const STORAGE_KEY_RESPONSES = 'formflow_responses_v2';
const STORAGE_KEY_USER = 'formflow_local_user_v2';
const STORAGE_KEY_CONFIG = 'formflow_agency_config_v2';
const STORAGE_KEY_ADVISORS = 'formflow_advisors_v2';

export interface AgencyConfig {
  name: string;
  phone: string; // WhatsApp phone number e.g. +1... or +57...
}

export const defaultAgencyConfig: AgencyConfig = {
  name: 'Asesores Visa',
  phone: '',
};

export const DEFAULT_ADMIN_USER: User = {
  id: 'usr-admin-master',
  name: 'Ronny Peña (Administrador)',
  email: 'law@ronnypena.com.do',
  role: 'admin',
  created_at: '2026-01-01T00:00:00.000Z',
};

export function getAgencyConfig(): AgencyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) return { ...defaultAgencyConfig, ...JSON.parse(raw) };
  } catch {}
  return defaultAgencyConfig;
}

export function saveAgencyConfig(config: AgencyConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch {}
}

const DEFAULT_FORMS: Form[] = [
  {
    id: 'frm-visa-b1b2',
    user_id: 'usr-asesores-visa',
    title: 'Solicitud de Visa Americana B1/B2 (Turismo y Negocios)',
    description: 'Completa tus datos personales y de viaje para que nuestro equipo de Asesores Visa prepare y gestione tu trámite consular DS-160.',
    slug: 'solicitud-visa-b1b2',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    fields: [
      { id: 'f-v1', form_id: 'frm-visa-b1b2', label: 'Nombre y Apellidos (Exactamente como en el Pasaporte)', type: 'text', is_required: true, position: 0 },
      { id: 'f-v2', form_id: 'frm-visa-b1b2', label: 'Número de Pasaporte', type: 'text', is_required: true, position: 1 },
      { id: 'f-v3', form_id: 'frm-visa-b1b2', label: 'Correo Electrónico de Contacto', type: 'email', is_required: true, position: 2 },
      { id: 'f-v4', form_id: 'frm-visa-b1b2', label: 'Número de WhatsApp con código de país', type: 'text', is_required: true, position: 3 },
      { id: 'f-v5', form_id: 'frm-visa-b1b2', label: 'Tipo de Trámite', type: 'select', is_required: true, options: ['Primera vez (Entrevista consular)', 'Renovación de Visa (Exención de entrevista)', 'Urgente / Emergencia'], position: 4 },
      { id: 'f-v6', form_id: 'frm-visa-b1b2', label: '¿Ha tenido alguna visa de EE.UU. anteriormente?', type: 'select', is_required: true, options: ['No, nunca', 'Sí, vigente', 'Sí, expirada en los últimos 48 meses', 'Sí, expirada hace más de 4 años'], position: 5 },
      { id: 'f-v7', form_id: 'frm-visa-b1b2', label: 'Fecha estimada de viaje', type: 'date', is_required: false, position: 6 },
      { id: 'f-v8', form_id: 'frm-visa-b1b2', label: 'Ocupación o Profesión actual', type: 'text', is_required: true, position: 7 },
      { id: 'f-v9', form_id: 'frm-visa-b1b2', label: 'Información adicional o dudas específicas', type: 'textarea', is_required: false, position: 8 },
    ],
    response_count: 2,
  },
  {
    id: 'frm-eval-migratoria',
    user_id: 'usr-asesores-visa',
    title: 'Evaluación de Perfil Migratorio y Arraigo',
    description: 'Diagnóstico preliminar de viabilidad para solicitud de visas a Estados Unidos, Canadá y Europa.',
    slug: 'evaluacion-perfil',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    fields: [
      { id: 'f-e1', form_id: 'frm-eval-migratoria', label: 'Nombre Completo', type: 'text', is_required: true, position: 0 },
      { id: 'f-e2', form_id: 'frm-eval-migratoria', label: 'Correo Electrónico', type: 'email', is_required: true, position: 1 },
      { id: 'f-e3', form_id: 'frm-eval-migratoria', label: 'Edad', type: 'number', is_required: true, position: 2 },
      { id: 'f-e4', form_id: 'frm-eval-migratoria', label: 'Destino de Interés', type: 'select', is_required: true, options: ['Estados Unidos', 'Canadá', 'Reino Unido / Europa', 'Otro'], position: 3 },
      { id: 'f-e5', form_id: 'frm-eval-migratoria', label: 'Situación Laboral', type: 'select', is_required: true, options: ['Empleado dependiente', 'Independiente / Empresario', 'Estudiante', 'Jubilado / Pensionado'], position: 4 },
    ],
    response_count: 1,
  },
];

const DEFAULT_RESPONSES: Record<string, FormResponseRecord[]> = {
  'frm-visa-b1b2': [
    {
      id: 'resp-demo-1',
      form_id: 'frm-visa-b1b2',
      submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      answers: {
        'f-v1': 'Carlos Andrés Restrepo',
        'f-v2': 'PAS9843210',
        'f-v3': 'crestrepo@gmail.com',
        'f-v4': '+57 310 445 8899',
        'f-v5': 'Primera vez (Entrevista consular)',
        'f-v6': 'No, nunca',
        'f-v7': '2026-12-15',
        'f-v8': 'Ingeniero de Sistemas',
        'f-v9': 'Deseo viajar con mi esposa e hijo para vacaciones en Disney Orlando.',
      },
    },
    {
      id: 'resp-demo-2',
      form_id: 'frm-visa-b1b2',
      submitted_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      answers: {
        'f-v1': 'Marcela Viviana Silva',
        'f-v2': 'PAS1122334',
        'f-v3': 'marcela.silva@hotmail.com',
        'f-v4': '+1 786 555 0192',
        'f-v5': 'Renovación de Visa (Exención de entrevista)',
        'f-v6': 'Sí, expirada en los últimos 48 meses',
        'f-v7': '2027-01-20',
        'f-v8': 'Directora de Contabilidad',
        'f-v9': 'Mi visa anterior venció en enero y busco renovarla sin tener que ir a entrevista.',
      },
    },
  ],
  'frm-eval-migratoria': [
    {
      id: 'resp-demo-3',
      form_id: 'frm-eval-migratoria',
      submitted_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      answers: {
        'f-e1': 'Daniel Esteban Ruiz',
        'f-e2': 'daniel.ruiz@outlook.com',
        'f-e3': '32',
        'f-e4': 'Estados Unidos',
        'f-e5': 'Empleado dependiente',
      },
    },
  ],
};

let serverAvailableCache: boolean | null = null;

export async function checkServerAvailability(): Promise<boolean> {
  if (serverAvailableCache !== null) return serverAvailableCache;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/auth/me', { signal: controller.signal });
    clearTimeout(timeoutId);
    // If server responds with JSON (either 200 or 401), server is alive
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 404 || !contentType.includes('application/json')) {
      serverAvailableCache = false;
    } else {
      serverAvailableCache = true;
    }
  } catch {
    serverAvailableCache = false;
  }
  return serverAvailableCache;
}

// ==========================================
// LOCAL STORAGE ADAPTER METHODS
// ==========================================

function getLocalForms(): Form[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FORMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FORMS, JSON.stringify(DEFAULT_FORMS));
      localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(DEFAULT_RESPONSES));
      return DEFAULT_FORMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FORMS;
  }
}

function saveLocalForms(forms: Form[]) {
  try {
    localStorage.setItem(STORAGE_KEY_FORMS, JSON.stringify(forms));
  } catch (err) {
    console.error('Error saving local forms:', err);
  }
}

function getLocalResponses(formId: string): FormResponseRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESPONSES);
    const map = raw ? JSON.parse(raw) : DEFAULT_RESPONSES;
    return map[formId] || [];
  } catch {
    return DEFAULT_RESPONSES[formId] || [];
  }
}

function saveLocalResponse(formId: string, response: FormResponseRecord) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESPONSES);
    const map = raw ? JSON.parse(raw) : { ...DEFAULT_RESPONSES };
    if (!map[formId]) map[formId] = [];
    map[formId].unshift(response);
    localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(map));

    // Also update form response_count
    const forms = getLocalForms();
    const target = forms.find((f) => f.id === formId);
    if (target) {
      target.response_count = map[formId].length;
      saveLocalForms(forms);
    }
  } catch (err) {
    console.error('Error saving local response:', err);
  }
}

// ==========================================
// UNIFIED DATA SERVICE API
// ==========================================

export const DataService = {
  // Check whether we are using backend or standalone mode
  async isServerOnline(): Promise<boolean> {
    return checkServerAvailability();
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const online = await checkServerAvailability();
    if (online) {
      const token = localStorage.getItem('formflow_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      try {
        const res = await fetch('/api/auth/me', { headers });
        if (res.ok) {
          const data = await res.json();
          return data.user;
        }
      } catch {}
    }

    // Local storage fallback
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return null;
  },

  // Login
  async login(email: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const online = await checkServerAvailability();
    if (online) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok) {
            localStorage.setItem('formflow_token', data.token);
            return { success: true, user: data.user };
          }
          return { success: false, error: data.error || 'Credenciales inválidas' };
        }
      } catch {}
    }

    // Standalone fallback: validate against master admin or registered advisors
    const normalizedEmail = email.trim().toLowerCase();
    
    // Master admin account
    if (normalizedEmail === 'law@ronnypena.com.do' && pass === 'Escafowne1.') {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(DEFAULT_ADMIN_USER));
      return { success: true, user: DEFAULT_ADMIN_USER };
    }

    // Check advisors in local storage
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADVISORS);
      if (raw) {
        const advisors: any[] = JSON.parse(raw);
        const match = advisors.find((a) => a.email.toLowerCase() === normalizedEmail && a.storedPass === pass);
        if (match) {
          const user: User = {
            id: match.id,
            name: match.name,
            email: match.email,
            role: match.role || 'advisor',
            created_at: match.created_at,
          };
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
          return { success: true, user };
        }
      }
    } catch {}

    return {
      success: false,
      error: 'Credenciales inválidas. Compruebe el correo y contraseña o contacte al administrador.',
    };
  },

  // Register is locked down (only admin can create users)
  async register(_name: string, _email: string, _pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
    return {
      success: false,
      error: 'El registro público está desactivado. Solo el administrador puede crear nuevos usuarios.',
    };
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('formflow_token');
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  // Fetch all forms
  async getForms(): Promise<Form[]> {
    const online = await checkServerAvailability();
    if (online) {
      try {
        const token = localStorage.getItem('formflow_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/forms', { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.forms)) return data.forms;
        }
      } catch {}
    }

    // Local storage
    return getLocalForms();
  },

  // Get single form by ID
  async getFormById(id: string): Promise<Form | null> {
    const online = await checkServerAvailability();
    if (online) {
      try {
        const token = localStorage.getItem('formflow_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/forms/${id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          return data.form;
        }
      } catch {}
    }

    const forms = getLocalForms();
    return forms.find((f) => f.id === id) || null;
  },

  // Save (create or update) form
  async saveForm(formId: string | undefined, payload: Partial<Form>): Promise<{ success: boolean; formId?: string; slug?: string; error?: string }> {
    const online = await checkServerAvailability();
    if (online) {
      try {
        const token = localStorage.getItem('formflow_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const url = formId ? `/api/forms/${formId}` : '/api/forms';
        const method = formId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(payload),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok) {
            return { success: true, formId: data.formId || formId, slug: data.slug };
          }
          return { success: false, error: data.error };
        }
      } catch {}
    }

    // Local Storage save
    const forms = getLocalForms();
    const now = new Date().toISOString();

    if (formId) {
      const idx = forms.findIndex((f) => f.id === formId);
      if (idx !== -1) {
        forms[idx] = {
          ...forms[idx],
          title: payload.title || forms[idx].title,
          description: payload.description || '',
          is_active: payload.is_active !== undefined ? payload.is_active : forms[idx].is_active,
          fields: payload.fields || forms[idx].fields,
          updated_at: now,
        };
        saveLocalForms(forms);
        return { success: true, formId, slug: forms[idx].slug };
      }
    }

    // New form
    const newId = `frm-${Date.now()}`;
    const slug = generateSlug(12);
    const newForm: Form = {
      id: newId,
      user_id: 'usr-local',
      title: payload.title || 'Nuevo Formulario',
      description: payload.description || '',
      slug,
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      created_at: now,
      updated_at: now,
      fields: payload.fields || [],
      response_count: 0,
    };
    forms.unshift(newForm);
    saveLocalForms(forms);
    return { success: true, formId: newId, slug };
  },

  // Toggle active state
  async toggleActive(formId: string): Promise<boolean> {
    const online = await checkServerAvailability();
    if (online) {
      try {
        const token = localStorage.getItem('formflow_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/forms/${formId}/toggle-active`, { method: 'PATCH', headers });
        if (res.ok) {
          const data = await res.json();
          return data.is_active;
        }
      } catch {}
    }

    const forms = getLocalForms();
    const target = forms.find((f) => f.id === formId);
    if (target) {
      target.is_active = !target.is_active;
      saveLocalForms(forms);
      return target.is_active;
    }
    return true;
  },

  // Delete form
  async deleteForm(formId: string): Promise<boolean> {
    const online = await checkServerAvailability();
    if (online) {
      try {
        const token = localStorage.getItem('formflow_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/forms/${formId}`, { method: 'DELETE', headers });
        if (res.ok) return true;
      } catch {}
    }

    const forms = getLocalForms().filter((f) => f.id !== formId);
    saveLocalForms(forms);

    // Also remove responses
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RESPONSES);
      if (raw) {
        const map = JSON.parse(raw);
        delete map[formId];
        localStorage.setItem(STORAGE_KEY_RESPONSES, JSON.stringify(map));
      }
    } catch {}

    return true;
  },

  // Get responses for a form (with AES-256 decryption)
  async getResponses(formId: string): Promise<{ form: Form | null; fields: Field[]; responses: FormResponseRecord[] }> {
    const online = await checkServerAvailability();
    if (online) {
      try {
        const token = localStorage.getItem('formflow_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/forms/${formId}/responses`, { headers });
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }

    const form = await this.getFormById(formId);
    const rawResponses = getLocalResponses(formId);

    // Decrypt all answers stored in localStorage
    const decryptedResponses = await Promise.all(
      rawResponses.map(async (r) => ({
        ...r,
        answers: await decryptAnswersMap(r.answers || {}),
      }))
    );

    return {
      form,
      fields: form?.fields || [],
      responses: decryptedResponses,
    };
  },

  // Submit public form response (with AES-256-GCM encryption at rest)
  async submitPublicForm(slug: string, answers: Record<string, string>, localFormRef?: Form | null): Promise<{ success: boolean; message: string; submittedAt: string }> {
    const now = new Date().toISOString();
    const online = await checkServerAvailability();

    if (online) {
      try {
        const res = await fetch(`/api/public/forms/${slug}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok) {
            return { success: true, message: data.message, submittedAt: data.submittedAt || now };
          }
        }
      } catch {}
    }

    // If local or offline, encrypt answers before saving to localStorage
    const forms = getLocalForms();
    const target = localFormRef || forms.find((f) => f.slug === slug);
    if (target) {
      const encryptedAnswers = await encryptAnswersMap(answers);
      const newResponse: FormResponseRecord = {
        id: `resp-${Date.now()}`,
        form_id: target.id,
        submitted_at: now,
        answers: encryptedAnswers,
      };
      saveLocalResponse(target.id, newResponse);
    }

    return {
      success: true,
      message: '¡Gracias por tu respuesta! Hemos registrado tus datos de manera segura y confidencial.',
      submittedAt: now,
    };
  },

  // Admin: Get list of advisors
  async getAdvisors(): Promise<User[]> {
    const online = await checkServerAvailability();
    if (online) {
      try {
        const token = localStorage.getItem('formflow_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/admin/users', { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.users)) return data.users;
        }
      } catch {}
    }

    // Local storage fallback for standalone mode
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADVISORS);
      const advisors: any[] = raw ? JSON.parse(raw) : [];
      return [
        DEFAULT_ADMIN_USER,
        ...advisors.map((a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          role: a.role || 'advisor',
          created_at: a.created_at,
        })),
      ];
    } catch {
      return [DEFAULT_ADMIN_USER];
    }
  },

  // Admin: Create a new advisor
  async createAdvisor(name: string, email: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const online = await checkServerAvailability();
    if (online) {
      try {
        const token = localStorage.getItem('formflow_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name, email, password: pass, role: 'advisor' }),
        });
        const data = await res.json();
        if (res.ok) {
          return { success: true, user: data.user };
        }
        return { success: false, error: data.error };
      } catch {}
    }

    // Standalone fallback
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim()) return { success: false, error: 'El nombre es obligatorio' };
    if (!validateEmail(normalizedEmail)) return { success: false, error: 'Correo electrónico no válido' };
    const passValidation = validatePassword(pass);
    if (!passValidation.isValid) return { success: false, error: passValidation.error };

    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADVISORS);
      const advisors: any[] = raw ? JSON.parse(raw) : [];
      if (advisors.some((a) => a.email.toLowerCase() === normalizedEmail) || normalizedEmail === DEFAULT_ADMIN_USER.email) {
        return { success: false, error: 'Ya existe un usuario con este correo electrónico' };
      }

      const newAdvisor = {
        id: `usr-adv-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        role: 'advisor' as const,
        created_at: new Date().toISOString(),
        storedPass: pass,
      };

      advisors.unshift(newAdvisor);
      localStorage.setItem(STORAGE_KEY_ADVISORS, JSON.stringify(advisors));

      return {
        success: true,
        user: {
          id: newAdvisor.id,
          name: newAdvisor.name,
          email: newAdvisor.email,
          role: newAdvisor.role,
          created_at: newAdvisor.created_at,
        },
      };
    } catch {
      return { success: false, error: 'Error al registrar asesor localmente' };
    }
  },
};
