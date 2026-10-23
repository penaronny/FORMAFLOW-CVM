import { Form, Field } from '../types/form.js';

interface CompactForm {
  i?: string;
  t: string;
  d?: string;
  s: string;
  a?: number; // is_active
  f: Array<{
    i: string;
    l: string;
    y: string; // type
    r: number; // is_required 0 or 1
    o?: string[]; // options
    mr?: string[]; // matrix_rows
    mc?: string[]; // matrix_cols
    rm?: number; // rating_max
    ph?: string; // placeholder
    dv?: string; // default_value
    at?: string; // allowed_file_types
  }>;
}

export function encodeFormToUrlData(form: Form): string {
  try {
    const compact: CompactForm = {
      i: form.id,
      t: form.title,
      d: form.description || '',
      s: form.slug,
      a: form.is_active ? 1 : 0,
      f: (form.fields || []).map((field) => ({
        i: field.id,
        l: field.label,
        y: field.type,
        r: field.is_required ? 1 : 0,
        o: field.options && field.options.length > 0 ? field.options : undefined,
        mr: field.matrix_rows && field.matrix_rows.length > 0 ? field.matrix_rows : undefined,
        mc: field.matrix_cols && field.matrix_cols.length > 0 ? field.matrix_cols : undefined,
        rm: field.rating_max,
        ph: field.placeholder,
        dv: field.default_value,
        at: field.allowed_file_types,
      })),
    };

    const json = JSON.stringify(compact);
    // URL-safe base64 encoding with UTF-8 support
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(bin);
    // Convert to URL-safe base64
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Error encoding form data:', err);
    return '';
  }
}

export function decodeFormFromUrlData(encoded: string): Form | null {
  try {
    if (!encoded) return null;
    // Restore base64 padding and characters
    let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
      b64 += '=';
    }
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const compact: CompactForm = JSON.parse(json);

    if (!compact || !compact.t || !Array.isArray(compact.f)) {
      return null;
    }

    const fields: Field[] = compact.f.map((f, idx) => ({
      id: f.i || `fld-${idx}`,
      form_id: compact.i || '',
      label: f.l,
      type: f.y as any,
      is_required: Boolean(f.r),
      options: f.o || [],
      matrix_rows: f.mr,
      matrix_cols: f.mc,
      rating_max: f.rm,
      placeholder: f.ph,
      default_value: f.dv,
      allowed_file_types: f.at,
      position: idx,
    }));

    const form: Form = {
      id: compact.i || `frm-${compact.s}`,
      user_id: 'client-view',
      title: compact.t,
      description: compact.d || '',
      slug: compact.s || 'formulario',
      is_active: compact.a !== undefined ? Boolean(compact.a) : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      fields,
    };

    return form;
  } catch (err) {
    console.error('Error decoding form data:', err);
    return null;
  }
}

export function buildClientFormLink(origin: string, form: Form): { directLink: string; shortLink: string } {
  const encoded = encodeFormToUrlData(form);
  const shortLink = `${origin}/#f/${form.slug}`;
  const directLink = encoded ? `${origin}/#f/${form.slug}?d=${encoded}` : shortLink;
  return { directLink, shortLink };
}

export function buildWhatsAppShareMessage(form: Form, clientLink: string, companyName = 'Asesores Visa'): string {
  const text = `Hola! 👋 Te comparto el siguiente formulario de *${companyName}*:\n\n📋 *${form.title}*\n${form.description ? `${form.description}\n\n` : '\n'}Puedes completarlo directamente desde tu celular o computadora en este enlace (no requiere registro):\n🔗 ${clientLink}`;
  return encodeURIComponent(text);
}

export function formatAnswersForWhatsApp(form: Form, answers: Record<string, string>, companyPhone = ''): string {
  let message = `Hola *Asesores Visa*! 👋\nAcabo de completar el formulario:\n📋 *${form.title}*\n\n*Respuestas enviadas:*\n`;
  (form.fields || []).forEach((field, idx) => {
    const val = answers[field.id] || '(No especificado)';
    message += `*${idx + 1}. ${field.label}*: ${val}\n`;
  });
  message += `\n_Enviado el ${new Date().toLocaleString('es-ES')}_`;

  const cleanPhone = companyPhone.replace(/[^0-9]/g, '');
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
