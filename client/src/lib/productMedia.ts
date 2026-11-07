/**
 * NAJLA Product Media Resolver
 * Real photography is used strictly for:
 * 1. خرمای پیارم (piarom)
 * 2. خرما ربی (rabbi)
 * 3. خرمای زاهدی (zahedi)
 * All other products retain their original art illustrations.
 */

export const PRODUCT_PHOTOS: Record<string, string> = {
  piarom: '/images/products/najla-piarom.webp',
  rabbi: '/images/products/najla-rabbi.webp',
  zahedi: '/images/products/najla-zahedi.webp',
};

export function photoFor(slug?: string): string | undefined {
  if (!slug) return undefined;
  return PRODUCT_PHOTOS[slug];
}
