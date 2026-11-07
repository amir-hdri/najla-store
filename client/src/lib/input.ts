export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (char) =>
    String(char.charCodeAt(0) - (char <= '٩' ? 0x660 : 0x6f0)),
  );
}

export function normalizePhone(value: string): string {
  return normalizeDigits(value).replace(/[\s()-]/g, '');
}

export const PHONE_RE = /^\+?[0-9]{7,15}$/;
