import { Field } from '../types/form.js';

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  // Standard RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'La contraseña es obligatoria' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }
  return { isValid: true };
}

export function generateSlug(length = 12): string {
  // Safe characters: alphanumeric without lookalike characters
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  // Generate at least 10 chars
  const targetLength = Math.max(10, length);
  for (let i = 0; i < targetLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function validateFormDefinition(
  title: string,
  fields: Array<Partial<Field>>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!title || !title.trim()) {
    errors.push('El título del formulario es obligatorio');
  }

  if (!fields || fields.length === 0) {
    errors.push('El formulario debe tener al menos un campo');
  } else {
    fields.forEach((f, index) => {
      if (!f.label || !f.label.trim()) {
        errors.push(`El campo #${index + 1} debe tener una etiqueta válida`);
      }
      if (f.type === 'select' || f.type === 'radio' || f.type === 'checkbox') {
        const validOptions = (f.options || []).filter((opt) => opt && opt.trim().length > 0);
        if (validOptions.length < 1) {
          errors.push(`El campo "${f.label || `#${index + 1}`}" debe tener al menos una opción para elegir`);
        }
      }
      if (f.type === 'matrix_radio' || f.type === 'matrix_checkbox') {
        const validRows = (f.matrix_rows || []).filter((r) => r && r.trim().length > 0);
        const validCols = (f.matrix_cols || []).filter((c) => c && c.trim().length > 0);
        if (validRows.length < 1 || validCols.length < 1) {
          errors.push(`El campo de matriz "${f.label || `#${index + 1}`}" debe tener al menos una fila y una columna`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(trimmed);
    }
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function validateFieldAnswer(
  field: Field,
  rawValue: string | undefined
): { isValid: boolean; error?: string } {
  const value = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';

  // Required check
  if (field.is_required && !value) {
    if (field.type === 'signature') {
      return { isValid: false, error: `Debes firmar en el recuadro digital de "${field.label}".` };
    }
    if (field.type === 'file') {
      return { isValid: false, error: `Debes adjuntar un archivo para "${field.label}".` };
    }
    if (field.type === 'captcha') {
      return { isValid: false, error: `Debes completar la verificación humana para "${field.label}".` };
    }
    return { isValid: false, error: `El campo "${field.label}" es obligatorio.` };
  }

  // If not required and empty, it is valid
  if (!value) {
    return { isValid: true };
  }

  // Type-specific validations
  switch (field.type) {
    case 'email':
      if (!validateEmail(value)) {
        return { isValid: false, error: `Ingresa un correo electrónico válido para "${field.label}".` };
      }
      break;

    case 'phone':
      if (!validatePhone(value)) {
        return { isValid: false, error: `Ingresa un número telefónico válido (mínimo 7 dígitos) para "${field.label}".` };
      }
      break;

    case 'url':
      if (!validateUrl(value)) {
        return { isValid: false, error: `Ingresa un enlace o URL válido (ej. https://sitio.com) para "${field.label}".` };
      }
      break;

    case 'number':
      if (isNaN(Number(value))) {
        return { isValid: false, error: `El valor de "${field.label}" debe ser numérico.` };
      }
      break;

    case 'date':
      if (isNaN(Date.parse(value))) {
        return { isValid: false, error: `Ingresa una fecha válida para "${field.label}".` };
      }
      break;

    case 'time':
      if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)) {
        return { isValid: false, error: `Ingresa una hora válida (HH:MM) para "${field.label}".` };
      }
      break;

    case 'datetime':
      if (isNaN(Date.parse(value))) {
        return { isValid: false, error: `Ingresa una fecha y hora válida para "${field.label}".` };
      }
      break;

    case 'rating': {
      const num = Number(value);
      const max = field.rating_max || 5;
      if (isNaN(num) || num < 1 || num > max) {
        return { isValid: false, error: `Selecciona una calificación entre 1 y ${max} para "${field.label}".` };
      }
      break;
    }

    case 'select':
    case 'radio':
      if (field.options && field.options.length > 0) {
        if (!field.options.includes(value)) {
          return { isValid: false, error: `Opción no válida seleccionada para "${field.label}".` };
        }
      }
      break;

    case 'checkbox':
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && field.is_required && parsed.length === 0) {
          return { isValid: false, error: `Debes marcar al menos una opción para "${field.label}".` };
        }
      } catch {
        // Simple string
      }
      break;

    case 'matrix_radio':
      if (field.is_required && field.matrix_rows && field.matrix_rows.length > 0) {
        try {
          const parsed = JSON.parse(value);
          const unanswered = field.matrix_rows.find((r) => !parsed[r]);
          if (unanswered) {
            return { isValid: false, error: `Por favor responde todas las filas de la matriz "${field.label}".` };
          }
        } catch {
          return { isValid: false, error: `Respuesta incompleta para "${field.label}".` };
        }
      }
      break;

    case 'signature':
      if (field.is_required && (!value.startsWith('data:image/') || value.length < 100)) {
        return { isValid: false, error: `Por favor estampa tu firma digital en el recuadro para "${field.label}".` };
      }
      break;

    case 'captcha':
      // Value format: "passed" or "user_ans|expected_ans"
      if (value !== 'passed' && value !== 'ok' && value !== 'true') {
        const parts = value.split('|');
        if (parts.length === 2 && parts[0].trim() !== parts[1].trim()) {
          return { isValid: false, error: `La respuesta de verificación de seguridad para "${field.label}" es incorrecta.` };
        }
      }
      break;

    case 'text':
    case 'textarea':
    case 'password':
    case 'switch':
    case 'file':
    case 'hidden':
    default:
      break;
  }

  return { isValid: true };
}

export function validateFormSubmission(
  fields: Field[],
  answers: Record<string, string>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const val = answers[field.id];
    const validation = validateFieldAnswer(field, val);
    if (!validation.isValid && validation.error) {
      errors[field.id] = validation.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
