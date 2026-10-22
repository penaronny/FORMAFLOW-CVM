import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  validatePassword,
  generateSlug,
  validateFormDefinition,
  validateFieldAnswer,
  validateFormSubmission,
} from './validation.js';
import { Field } from '../types/form.js';

test('validateEmail validates RFC compliant emails correctly', () => {
  assert.equal(validateEmail('test@empresa.com'), true);
  assert.equal(validateEmail('carlos.mendoza+rh@sub.empresa.co'), true);
  assert.equal(validateEmail('invalid-email'), false);
  assert.equal(validateEmail('user@'), false);
  assert.equal(validateEmail('@domain.com'), false);
  assert.equal(validateEmail(''), false);
});

test('validatePassword enforces at least 8 characters', () => {
  assert.equal(validatePassword('12345678').isValid, true);
  assert.equal(validatePassword('short').isValid, false);
  assert.equal(validatePassword('').isValid, false);
});

test('generateSlug produces unguessable strings of at least 10 chars', () => {
  const slug1 = generateSlug(12);
  const slug2 = generateSlug(12);
  assert.equal(typeof slug1, 'string');
  assert.ok(slug1.length >= 10);
  assert.notEqual(slug1, slug2);
  // Ensure only URL safe characters
  assert.match(slug1, /^[a-zA-Z0-9]+$/);
});

test('validateFormDefinition requires title and at least one valid field', () => {
  const invalid1 = validateFormDefinition('', []);
  assert.equal(invalid1.isValid, false);
  assert.ok(invalid1.errors.length >= 2);

  const invalid2 = validateFormDefinition('Mi Formulario', [
    { label: '', type: 'text' },
  ]);
  assert.equal(invalid2.isValid, false);

  const invalidSelect = validateFormDefinition('Encuesta', [
    { label: 'Departamento', type: 'select', options: [] },
  ]);
  assert.equal(invalidSelect.isValid, false);

  const valid = validateFormDefinition('Encuesta Clima', [
    { label: 'Nombre', type: 'text' },
    { label: 'Depto', type: 'select', options: ['IT', 'RRHH'] },
  ]);
  assert.equal(valid.isValid, true);
});

test('validateFieldAnswer checks required state and type specifics', () => {
  const reqField: Field = {
    id: 'f1',
    form_id: 'form1',
    label: 'Correo',
    type: 'email',
    is_required: true,
    position: 0,
  };

  // Missing required
  assert.equal(validateFieldAnswer(reqField, '').isValid, false);
  assert.equal(validateFieldAnswer(reqField, undefined).isValid, false);

  // Invalid email
  assert.equal(validateFieldAnswer(reqField, 'not-an-email').isValid, false);

  // Valid email
  assert.equal(validateFieldAnswer(reqField, 'ana@empresa.com').isValid, true);

  // Number field
  const numField: Field = {
    id: 'f2',
    form_id: 'form1',
    label: 'Edad',
    type: 'number',
    is_required: false,
    position: 1,
  };
  assert.equal(validateFieldAnswer(numField, '').isValid, true); // optional
  assert.equal(validateFieldAnswer(numField, 'abc').isValid, false);
  assert.equal(validateFieldAnswer(numField, '34').isValid, true);

  // Select field
  const selectField: Field = {
    id: 'f3',
    form_id: 'form1',
    label: 'Sede',
    type: 'select',
    options: ['Bogotá', 'Madrid', 'Ciudad de México'],
    is_required: true,
    position: 2,
  };
  assert.equal(validateFieldAnswer(selectField, 'Buenos Aires').isValid, false);
  assert.equal(validateFieldAnswer(selectField, 'Madrid').isValid, true);
});

test('validateFormSubmission returns comprehensive field errors', () => {
  const fields: Field[] = [
    { id: '1', form_id: 'f', label: 'Nombre', type: 'text', is_required: true, position: 0 },
    { id: '2', form_id: 'f', label: 'Correo', type: 'email', is_required: true, position: 1 },
    { id: '3', form_id: 'f', label: 'Nota', type: 'number', is_required: false, position: 2 },
  ];

  const submission1 = validateFormSubmission(fields, {
    '1': '',
    '2': 'correo-invalido',
  });
  assert.equal(submission1.isValid, false);
  assert.ok(submission1.errors['1']);
  assert.ok(submission1.errors['2']);
  assert.equal(submission1.errors['3'], undefined);

  const submission2 = validateFormSubmission(fields, {
    '1': 'Juan Perez',
    '2': 'juan@empresa.com',
    '3': '9',
  });
  assert.equal(submission2.isValid, true);
  assert.equal(Object.keys(submission2.errors).length, 0);
});
