import { Router, Response } from 'express';
import crypto from 'crypto';
import { db, verifyPassword } from './db.js';
import { authMiddleware, AuthenticatedRequest, createSession, deleteSession } from './auth.js';
import { validateEmail, validatePassword, generateSlug, validateFormDefinition, validateFormSubmission } from '../utils/validation.js';
import { Field } from '../types/form.js';

export const apiRouter = Router();

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Formato de correo electrónico inválido' });
    }

    const passValidation = validatePassword(password);
    if (!passValidation.isValid) {
      return res.status(400).json({ error: passValidation.error });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check uniqueness
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con este correo electrónico' });
    }

    const userId = `usr-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, name.trim(), normalizedEmail, passwordHash, now);

    const token = createSession(userId);
    res.cookie('formflow_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const user = { id: userId, name: name.trim(), email: normalizedEmail, created_at: now };
    return res.status(201).json({ user, token });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const row = db.prepare(`
      SELECT id, name, email, password_hash, created_at
      FROM users
      WHERE email = ?
    `).get(normalizedEmail) as { id: string; name: string; email: string; password_hash: string; created_at: string } | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = createSession(row.id);
    res.cookie('formflow_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const user = { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
    return res.json({ user, token });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

apiRouter.post('/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  const token = req.cookies?.formflow_session || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (token) {
    deleteSession(token);
  }
  res.clearCookie('formflow_session');
  return res.json({ success: true });
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// ==========================================
// FORM MANAGEMENT ROUTES (Authenticated)
// ==========================================

apiRouter.get('/forms', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const forms = db.prepare(`
      SELECT 
        f.id, f.user_id, f.title, f.description, f.slug, f.is_active, f.created_at, f.updated_at,
        COUNT(r.id) as response_count
      FROM forms f
      LEFT JOIN responses r ON r.form_id = f.id
      WHERE f.user_id = ?
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `).all(userId) as any[];

    const formatted = forms.map((f) => ({
      ...f,
      is_active: Boolean(f.is_active),
      response_count: Number(f.response_count) || 0,
    }));

    return res.json({ forms: formatted });
  } catch (err: any) {
    console.error('Error fetching forms:', err);
    return res.status(500).json({ error: 'Error al obtener formularios' });
  }
});

apiRouter.get('/forms/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const form = db.prepare(`
      SELECT f.id, f.user_id, f.title, f.description, f.slug, f.is_active, f.created_at, f.updated_at,
             COUNT(r.id) as response_count
      FROM forms f
      LEFT JOIN responses r ON r.form_id = f.id
      WHERE f.id = ? AND f.user_id = ?
      GROUP BY f.id
    `).get(id, userId) as any;

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado o no tienes permiso para acceder a él' });
    }

    const fieldsRaw = db.prepare(`
      SELECT id, form_id, label, type, is_required, options, position
      FROM fields
      WHERE form_id = ?
      ORDER BY position ASC
    `).all(id) as any[];

    const fields: Field[] = fieldsRaw.map((f) => ({
      ...f,
      is_required: Boolean(f.is_required),
      options: typeof f.options === 'string' ? JSON.parse(f.options || '[]') : f.options || [],
    }));

    return res.json({
      form: {
        ...form,
        is_active: Boolean(form.is_active),
        response_count: Number(form.response_count) || 0,
        fields,
      },
    });
  } catch (err: any) {
    console.error('Error fetching form:', err);
    return res.status(500).json({ error: 'Error al consultar formulario' });
  }
});

apiRouter.post('/forms', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description = '', fields = [] } = req.body;

    const validation = validateFormDefinition(title, fields);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }

    const formId = `frm-${crypto.randomUUID()}`;
    const slug = generateSlug(12);
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO forms (id, user_id, title, description, slug, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).run(formId, userId, title.trim(), (description || '').trim(), slug, now, now);

      const insertField = db.prepare(`
        INSERT INTO fields (id, form_id, label, type, is_required, options, position)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      fields.forEach((f: any, idx: number) => {
        const fieldId = f.id || `fld-${crypto.randomUUID()}`;
        const optionsStr = Array.isArray(f.options) ? JSON.stringify(f.options) : '[]';
        insertField.run(
          fieldId,
          formId,
          String(f.label).trim(),
          f.type,
          f.is_required ? 1 : 0,
          optionsStr,
          idx
        );
      });

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    return res.status(201).json({
      success: true,
      formId,
      slug,
      message: 'Formulario creado exitosamente',
    });
  } catch (err: any) {
    console.error('Error creating form:', err);
    return res.status(500).json({ error: 'Error al crear formulario' });
  }
});

apiRouter.put('/forms/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title, description = '', fields = [], is_active } = req.body;

    // Check ownership
    const existing = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ error: 'Formulario no encontrado o no tienes permiso' });
    }

    const validation = validateFormDefinition(title, fields);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }

    const now = new Date().toISOString();
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        UPDATE forms 
        SET title = ?, description = ?, is_active = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(title.trim(), (description || '').trim(), activeVal, now, id, userId);

      // Re-synchronize fields: delete existing and re-insert in ordered sequence
      db.prepare('DELETE FROM fields WHERE form_id = ?').run(id);

      const insertField = db.prepare(`
        INSERT INTO fields (id, form_id, label, type, is_required, options, position)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      fields.forEach((f: any, idx: number) => {
        const fieldId = f.id || `fld-${crypto.randomUUID()}`;
        const optionsStr = Array.isArray(f.options) ? JSON.stringify(f.options) : '[]';
        insertField.run(
          fieldId,
          id,
          String(f.label).trim(),
          f.type,
          f.is_required ? 1 : 0,
          optionsStr,
          idx
        );
      });

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    return res.json({ success: true, message: 'Formulario actualizado correctamente' });
  } catch (err: any) {
    console.error('Error updating form:', err);
    return res.status(500).json({ error: 'Error al actualizar formulario' });
  }
});

apiRouter.patch('/forms/:id/toggle-active', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const form = db.prepare('SELECT id, is_active FROM forms WHERE id = ? AND user_id = ?').get(id, userId) as { id: string; is_active: number } | undefined;
    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    const newActiveState = form.is_active ? 0 : 1;
    const now = new Date().toISOString();

    db.prepare('UPDATE forms SET is_active = ?, updated_at = ? WHERE id = ?').run(newActiveState, now, id);

    return res.json({ success: true, is_active: Boolean(newActiveState) });
  } catch (err: any) {
    console.error('Error toggling form:', err);
    return res.status(500).json({ error: 'Error al cambiar estado del formulario' });
  }
});

apiRouter.delete('/forms/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const form = db.prepare('SELECT id FROM forms WHERE id = ? AND user_id = ?').get(id, userId);
    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    // Cascade delete is active in SQLite schema, but deleting explicitly ensures clean cleanup
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('DELETE FROM forms WHERE id = ? AND user_id = ?').run(id, userId);
      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    return res.json({ success: true, message: 'Formulario y respuestas eliminados' });
  } catch (err: any) {
    console.error('Error deleting form:', err);
    return res.status(500).json({ error: 'Error al eliminar formulario' });
  }
});

apiRouter.get('/forms/:id/responses', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check ownership
    const form = db.prepare('SELECT id, title, slug, is_active FROM forms WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    // Get fields
    const fieldsRaw = db.prepare(`
      SELECT id, label, type, is_required, options, position
      FROM fields
      WHERE form_id = ?
      ORDER BY position ASC
    `).all(id) as any[];

    const fields: Field[] = fieldsRaw.map((f) => ({
      ...f,
      is_required: Boolean(f.is_required),
      options: typeof f.options === 'string' ? JSON.parse(f.options || '[]') : f.options || [],
    }));

    // Get responses
    const responses = db.prepare(`
      SELECT id, submitted_at
      FROM responses
      WHERE form_id = ?
      ORDER BY submitted_at DESC
    `).all(id) as { id: string; submitted_at: string }[];

    // Get answers for all these responses
    const answersRaw = db.prepare(`
      SELECT a.response_id, a.field_id, a.value
      FROM answers a
      JOIN responses r ON r.id = a.response_id
      WHERE r.form_id = ?
    `).all(id) as { response_id: string; field_id: string; value: string }[];

    const answersMap: Record<string, Record<string, string>> = {};
    for (const ans of answersRaw) {
      if (!answersMap[ans.response_id]) {
        answersMap[ans.response_id] = {};
      }
      answersMap[ans.response_id][ans.field_id] = ans.value;
    }

    const formattedResponses = responses.map((r) => ({
      id: r.id,
      submitted_at: r.submitted_at,
      answers: answersMap[r.id] || {},
    }));

    return res.json({
      form,
      fields,
      responses: formattedResponses,
    });
  } catch (err: any) {
    console.error('Error fetching responses:', err);
    return res.status(500).json({ error: 'Error al obtener respuestas' });
  }
});

// ==========================================
// PUBLIC FORM ROUTES (Unauthenticated)
// ==========================================

apiRouter.get('/public/forms/:slug', (req, res) => {
  try {
    const { slug } = req.params;

    const form = db.prepare(`
      SELECT id, title, description, slug, is_active
      FROM forms
      WHERE slug = ?
    `).get(slug) as any;

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    const fieldsRaw = db.prepare(`
      SELECT id, label, type, is_required, options, position
      FROM fields
      WHERE form_id = ?
      ORDER BY position ASC
    `).all(form.id) as any[];

    const fields = fieldsRaw.map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
      is_required: Boolean(f.is_required),
      options: typeof f.options === 'string' ? JSON.parse(f.options || '[]') : f.options || [],
      position: f.position,
    }));

    return res.json({
      form: {
        id: form.id,
        title: form.title,
        description: form.description,
        slug: form.slug,
        is_active: Boolean(form.is_active),
        fields,
      },
    });
  } catch (err: any) {
    console.error('Error fetching public form:', err);
    return res.status(500).json({ error: 'Error al cargar formulario público' });
  }
});

apiRouter.post('/public/forms/:slug/submit', (req, res) => {
  try {
    const { slug } = req.params;
    const { answers = {} } = req.body;

    const form = db.prepare(`
      SELECT id, title, is_active
      FROM forms
      WHERE slug = ?
    `).get(slug) as { id: string; title: string; is_active: number } | undefined;

    if (!form) {
      return res.status(404).json({ error: 'Formulario no encontrado' });
    }

    if (!form.is_active) {
      return res.status(403).json({ error: 'Este formulario no está disponible en este momento.' });
    }

    const fieldsRaw = db.prepare(`
      SELECT id, form_id, label, type, is_required, options, position
      FROM fields
      WHERE form_id = ?
      ORDER BY position ASC
    `).all(form.id) as any[];

    const fields: Field[] = fieldsRaw.map((f) => ({
      ...f,
      is_required: Boolean(f.is_required),
      options: typeof f.options === 'string' ? JSON.parse(f.options || '[]') : f.options || [],
    }));

    const validation = validateFormSubmission(fields, answers);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Hay errores en los datos enviados. Por favor revisa los campos señalados.',
        fieldErrors: validation.errors,
      });
    }

    const responseId = `resp-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO responses (id, form_id, submitted_at)
        VALUES (?, ?, ?)
      `).run(responseId, form.id, now);

      const insertAnswer = db.prepare(`
        INSERT INTO answers (id, response_id, field_id, value)
        VALUES (?, ?, ?, ?)
      `);

      for (const field of fields) {
        const value = answers[field.id] !== undefined && answers[field.id] !== null ? String(answers[field.id]).trim() : '';
        insertAnswer.run(`ans-${crypto.randomUUID()}`, responseId, field.id, value);
      }

      db.exec('COMMIT;');
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }

    return res.status(201).json({
      success: true,
      message: '¡Gracias por tu respuesta! Hemos registrado tus datos exitosamente.',
      submittedAt: now,
    });
  } catch (err: any) {
    console.error('Error submitting form:', err);
    return res.status(500).json({ error: 'Error al enviar la respuesta' });
  }
});
