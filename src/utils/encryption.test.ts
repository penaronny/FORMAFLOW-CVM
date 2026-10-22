import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptSensitiveText,
  decryptSensitiveText,
  encryptAnswersMap,
  decryptAnswersMap,
} from './encryption.js';

test('encryptSensitiveText produces secure ciphertext and decryptSensitiveText recovers original string', async () => {
  const secretPassport = 'PAS-RD-987410294';
  const encrypted = await encryptSensitiveText(secretPassport);

  // Check format
  assert.ok(encrypted.startsWith('enc:v1:'));
  assert.notEqual(encrypted, secretPassport);
  // Ensure passport number is not readable in ciphertext
  assert.equal(encrypted.includes(secretPassport), false);

  // Decrypt
  const decrypted = await decryptSensitiveText(encrypted);
  assert.equal(decrypted, secretPassport);
});

test('encryptAnswersMap and decryptAnswersMap properly protect sensitive map of client answers', async () => {
  const rawAnswers = {
    'field-passport': 'A55442211',
    'field-income': '$5,000 USD mensuales',
    'field-reason': 'Trámite de visa de turismo para toda la familia',
  };

  const encryptedAnswers = await encryptAnswersMap(rawAnswers);

  // Raw values must be unreadable
  for (const [key, val] of Object.entries(encryptedAnswers)) {
    assert.ok(val.startsWith('enc:v1:'));
    assert.equal(val.includes(rawAnswers[key as keyof typeof rawAnswers]), false);
  }

  // Decrypt should restore all values perfectly
  const decrypted = await decryptAnswersMap(encryptedAnswers);
  assert.deepEqual(decrypted, rawAnswers);
});

test('decryptSensitiveText gracefully returns original text if not encrypted (backward compatibility)', async () => {
  const legacyText = 'Respuesta antigua sin cifrar';
  const result = await decryptSensitiveText(legacyText);
  assert.equal(result, legacyText);
});
