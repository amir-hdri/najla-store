import { expect, it } from 'vitest';
import { normalizeDigits, normalizePhone, PHONE_RE } from './input';

it('accepts Persian and Arabic digits while preserving phone punctuation', () => {
  expect(normalizeDigits('+۹۸ (۹۱۲) ٣٤٥-۶۷۸۹')).toBe('+98 (912) 345-6789');
  expect(normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
  expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
});

it('normalizes formatted Persian phone numbers to the server contract', () => {
  expect(normalizePhone('+۹۸ (۹۱۲) ۱۲۳-۴۵۶۷')).toBe('+989121234567');
  expect(PHONE_RE.test(normalizePhone('۰۹۱۲ ۱۲۳ ۴۵۶۷'))).toBe(true);
  expect(PHONE_RE.test(normalizePhone('0912x34567'))).toBe(false);
});
