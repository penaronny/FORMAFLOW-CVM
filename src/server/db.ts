import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'formflow.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      slug TEXT UNIQUE NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fields (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      is_required INTEGER NOT NULL DEFAULT 0,
      options TEXT DEFAULT '[]',
      position INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
      field_id TEXT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
      value TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
    CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
    CREATE INDEX IF NOT EXISTS idx_fields_form_id ON fields(form_id);
    CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
    CREATE INDEX IF NOT EXISTS idx_answers_response_id ON answers(response_id);
  `);

  seedDemoData();
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

function seedDemoData() {
  const userCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@empresa.com') as { id: string } | undefined;
  if (userCheck) return; // already seeded

  const userId = 'usr-demo-001';
  const now = new Date().toISOString();
  const passwordHash = hashPassword('Password123!');

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUser.run(userId, 'Carlos Mendoza (RRHH)', 'demo@empresa.com', passwordHash, now);

  // Form 1: Clima Laboral
  const form1Id = 'frm-clima-001';
  const form1Slug = 'clima-laboral-2026';
  db.prepare(`
    INSERT INTO forms (id, user_id, title, description, slug, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    form1Id,
    userId,
    'Encuesta de Clima Laboral y Bienestar 2026',
    'Tu opinión es fundamental para mejorar nuestro ambiente de trabajo, beneficios y cultura corporativa. Respuestas confidenciales.',
    form1Slug,
    new Date(Date.now() - 86400000 * 5).toISOString(),
    now
  );

  const form1Fields = [
    { id: 'f1-1', label: 'Nombre completo (Opcional)', type: 'text', is_required: 0, options: '[]', position: 0 },
    { id: 'f1-2', label: 'Correo corporativo', type: 'email', is_required: 1, options: '[]', position: 1 },
    { id: 'f1-3', label: 'Departamento / Área', type: 'select', is_required: 1, options: JSON.stringify(['Tecnología', 'Operaciones', 'Ventas y Marketing', 'Finanzas', 'Recursos Humanos']), position: 2 },
    { id: 'f1-4', label: 'Nivel de satisfacción general (1 a 10)', type: 'number', is_required: 1, options: '[]', position: 3 },
    { id: 'f1-5', label: 'Fecha de ingreso a la compañía', type: 'date', is_required: 0, options: '[]', position: 4 },
    { id: 'f1-6', label: 'Sugerencias o comentarios para la gerencia', type: 'textarea', is_required: 0, options: '[]', position: 5 },
  ];

  const insertField = db.prepare(`
    INSERT INTO fields (id, form_id, label, type, is_required, options, position)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const f of form1Fields) {
    insertField.run(f.id, form1Id, f.label, f.type, f.is_required, f.options, f.position);
  }

  // Pre-seed responses for Form 1
  const demoSubmissions = [
    {
      id: 'resp-1',
      submitted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      answers: {
        'f1-1': 'Laura Valenzuela',
        'f1-2': 'lvalenzuela@empresa.com',
        'f1-3': 'Tecnología',
        'f1-4': '9',
        'f1-5': '2023-04-15',
        'f1-6': 'Excelente ambiente de equipo. Estaría genial tener más jornadas de formación en inteligencia artificial.',
      },
    },
    {
      id: 'resp-2',
      submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      answers: {
        'f1-1': 'Esteban Gómez',
        'f1-2': 'egomez@empresa.com',
        'f1-3': 'Operaciones',
        'f1-4': '8',
        'f1-5': '2022-09-01',
        'f1-6': 'Revisar la política de trabajo híbrido para los viernes.',
      },
    },
    {
      id: 'resp-3',
      submitted_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      answers: {
        'f1-1': 'Mariana Duque',
        'f1-2': 'mduque@empresa.com',
        'f1-3': 'Ventas y Marketing',
        'f1-4': '10',
        'f1-5': '2024-01-10',
        'f1-6': 'Muy satisfecha con el liderazgo y las herramientas de trabajo actuales.',
      },
    },
  ];

  const insertResp = db.prepare('INSERT INTO responses (id, form_id, submitted_at) VALUES (?, ?, ?)');
  const insertAns = db.prepare('INSERT INTO answers (id, response_id, field_id, value) VALUES (?, ?, ?, ?)');

  for (const sub of demoSubmissions) {
    insertResp.run(sub.id, form1Id, sub.submitted_at);
    for (const [fId, val] of Object.entries(sub.answers)) {
      insertAns.run(`ans-${crypto.randomUUID().slice(0, 8)}`, sub.id, fId, val);
    }
  }

  // Form 2: Solicitud de Equipamiento IT
  const form2Id = 'frm-it-002';
  const form2Slug = 'solicitud-it-ergonomia';
  db.prepare(`
    INSERT INTO forms (id, user_id, title, description, slug, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    form2Id,
    userId,
    'Solicitud de Equipamiento IT y Ergonomía',
    'Canal oficial para solicitar periféricos, monitores secundarios, teclados ergonómicos o soporte de laptop para tu puesto.',
    form2Slug,
    new Date(Date.now() - 86400000 * 2).toISOString(),
    now
  );

  const form2Fields = [
    { id: 'f2-1', label: 'Nombre del solicitante', type: 'text', is_required: 1, options: '[]', position: 0 },
    { id: 'f2-2', label: 'Correo electrónico', type: 'email', is_required: 1, options: '[]', position: 1 },
    { id: 'f2-3', label: 'Tipo de equipamiento requerido', type: 'select', is_required: 1, options: JSON.stringify(['Monitor 27"', 'Silla Ergonómica', 'Teclado y Mouse Inalámbrico', 'Base Elevadora para Laptop', 'Adaptador / Hub USB-C']), position: 2 },
    { id: 'f2-4', label: 'Justificación del requerimiento', type: 'textarea', is_required: 1, options: '[]', position: 3 },
  ];

  for (const f of form2Fields) {
    insertField.run(f.id, form2Id, f.label, f.type, f.is_required, f.options, f.position);
  }

  // One response for form 2
  const f2RespId = 'resp-it-1';
  insertResp.run(f2RespId, form2Id, new Date(Date.now() - 3600000 * 4).toISOString());
  insertAns.run(`ans-${crypto.randomUUID().slice(0, 8)}`, f2RespId, 'f2-1', 'Andrés Restrepo');
  insertAns.run(`ans-${crypto.randomUUID().slice(0, 8)}`, f2RespId, 'f2-2', 'arestrepo@empresa.com');
  insertAns.run(`ans-${crypto.randomUUID().slice(0, 8)}`, f2RespId, 'f2-3', 'Monitor 27"');
  insertAns.run(`ans-${crypto.randomUUID().slice(0, 8)}`, f2RespId, 'f2-4', 'Requiero segundo monitor para tareas de desarrollo y depuración simultánea.');
}
