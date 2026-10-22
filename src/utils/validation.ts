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
      if (f.type === 'select') {
        const validOptions = (f.options || []).filter((opt) => opt && opt.trim().length > 0);
        if (validOptions.length < 1) {
          errors.push(`El campo de selección "${f.label || `#${index + 1}`}" debe tener al menos una opción`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateFieldAnswer(
  field: Field,
  rawValue: string | undefined
): { isValid: boolean; error?: string } {
  const value = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';

  // Required check
  if (field.is_required && !value) {
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

    case 'select':
      if (field.options && field.options.length > 0) {
        if (!field.options.includes(value)) {
          return { isValid: false, error: `Opción no válida seleccionada para "${field.label}".` };
        }
      }
      break;

    case 'text':
    case 'textarea':
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
