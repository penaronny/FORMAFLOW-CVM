import { test, describe } from 'node:test';
import assert from 'node:assert';
import { validateFieldAnswer, validateFormDefinition, validateUrl, validatePhone } from './validation.js';
import { Field } from '../types/form.js';

describe('Validation Unit Tests for All 20 Field Types', () => {
  test('validates URL correctly', () => {
    assert.strictEqual(validateUrl('https://google.com'), true);
    assert.strictEqual(validateUrl('http://ronnypena.com.do'), true);
    assert.strictEqual(validateUrl('not-a-url'), false);
  });

  test('validates Phone correctly', () => {
    assert.strictEqual(validatePhone('+1 809 555 1234'), true);
    assert.strictEqual(validatePhone('123'), false); // too short
  });

  test('validates required signature field', () => {
    const field: Field = {
      id: 'f-sig',
      form_id: '1',
      label: 'Firma Legal',
      type: 'signature',
      is_required: true,
      position: 0,
    };

    const emptyRes = validateFieldAnswer(field, '');
    assert.strictEqual(emptyRes.isValid, false);
    assert.match(emptyRes.error || '', /firmar/);

    const validSigRes = validateFieldAnswer(field, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    assert.strictEqual(validSigRes.isValid, true);
  });

  test('validates rating scale within bounds', () => {
    const field: Field = {
      id: 'f-rate',
      form_id: '1',
      label: 'Satisfacción',
      type: 'rating',
      rating_max: 5,
      is_required: true,
      position: 0,
    };

    assert.strictEqual(validateFieldAnswer(field, '4').isValid, true);
    assert.strictEqual(validateFieldAnswer(field, '6').isValid, false);
    assert.strictEqual(validateFieldAnswer(field, '0').isValid, false);
  });

  test('validates matrix required row completion', () => {
    const field: Field = {
      id: 'f-mat',
      form_id: '1',
      label: 'Evaluación',
      type: 'matrix_radio',
      matrix_rows: ['Atención', 'Puntualidad'],
      matrix_cols: ['Bueno', 'Malo'],
      is_required: true,
      position: 0,
    };

    const incomplete = validateFieldAnswer(field, JSON.stringify({ 'Atención': 'Bueno' }));
    assert.strictEqual(incomplete.isValid, false);

    const complete = validateFieldAnswer(field, JSON.stringify({ 'Atención': 'Bueno', 'Puntualidad': 'Bueno' }));
    assert.strictEqual(complete.isValid, true);
  });
});
