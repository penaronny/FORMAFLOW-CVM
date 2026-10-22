import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeFormToUrlData, decodeFormFromUrlData, buildClientFormLink, formatAnswersForWhatsApp } from './formEncoding.js';
import { Form } from '../types/form.js';

test('encodeFormToUrlData and decodeFormFromUrlData roundtrip accurately', () => {
  const originalForm: Form = {
    id: 'test-form-1',
    user_id: 'user-1',
    title: 'Solicitud de Visa Americana B1/B2 (Asesores Visa)',
    description: 'Cuestionario confidencial para trámite consular en la embajada.',
    slug: 'visa-b1-b2',
    is_active: true,
    created_at: '2026-10-22T00:00:00Z',
    updated_at: '2026-10-22T00:00:00Z',
    fields: [
      { id: 'f1', form_id: 'test-form-1', label: 'Nombre y Apellidos según Pasaporte', type: 'text', is_required: true, position: 0 },
      { id: 'f2', form_id: 'test-form-1', label: 'Número de Pasaporte', type: 'text', is_required: true, position: 1 },
      { id: 'f3', form_id: 'test-form-1', label: 'Correo Electrónico', type: 'email', is_required: true, position: 2 },
      { id: 'f4', form_id: 'test-form-1', label: 'Tipo de Trámite', type: 'select', is_required: true, options: ['Primera Vez', 'Renovación'], position: 3 },
    ],
  };

  const encoded = encodeFormToUrlData(originalForm);
  assert.equal(typeof encoded, 'string');
  assert.ok(encoded.length > 20);

  const decoded = decodeFormFromUrlData(encoded);
  assert.ok(decoded !== null);
  assert.equal(decoded!.title, originalForm.title);
  assert.equal(decoded!.description, originalForm.description);
  assert.equal(decoded!.slug, originalForm.slug);
  assert.equal(decoded!.fields?.length, 4);
  assert.equal(decoded!.fields![0].label, 'Nombre y Apellidos según Pasaporte');
  assert.equal(decoded!.fields![3].type, 'select');
  assert.deepEqual(decoded!.fields![3].options, ['Primera Vez', 'Renovación']);
});

test('buildClientFormLink produces direct link with portable data', () => {
  const form: Form = {
    id: 'f-1',
    user_id: 'u-1',
    title: 'Registro',
    description: '',
    slug: 'reg-cliente',
    is_active: true,
    created_at: '',
    updated_at: '',
    fields: [{ id: 'f1', form_id: 'f-1', label: 'Nombre', type: 'text', is_required: true, position: 0 }],
  };

  const links = buildClientFormLink('https://www.asesoresvisa.com', form);
  assert.ok(links.directLink.includes('https://www.asesoresvisa.com/#f/reg-cliente?d='));
  assert.equal(links.shortLink, 'https://www.asesoresvisa.com/#f/reg-cliente');
});

test('formatAnswersForWhatsApp generates proper WhatsApp URL with answers', () => {
  const form: Form = {
    id: 'f-1',
    user_id: 'u-1',
    title: 'Visado Turista',
    description: '',
    slug: 'visado',
    is_active: true,
    created_at: '',
    updated_at: '',
    fields: [
      { id: 'f1', form_id: 'f-1', label: 'Nombre', type: 'text', is_required: true, position: 0 },
      { id: 'f2', form_id: 'f-1', label: 'Pasaporte', type: 'text', is_required: true, position: 1 },
    ],
  };

  const answers = { f1: 'María Ramos', f2: 'P98765432' };
  const waUrl = formatAnswersForWhatsApp(form, answers, '+573001234567');
  assert.ok(waUrl.startsWith('https://wa.me/573001234567?text='));
  assert.ok(waUrl.includes(encodeURIComponent('María Ramos')));
  assert.ok(waUrl.includes(encodeURIComponent('P98765432')));
});
