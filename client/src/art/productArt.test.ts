import { describe, expect, it } from 'vitest';
import { categoryArt, artFor, productArt } from './productArt';

const PRODUCT_SLUGS = [
  'medjool', 'deglet', 'pitted', 'sayer', 'apricot', 'fig', 'cranberry', 'mango',
  'persimmon', 'pomegranate', 'dates-fresh', 'almonds', 'pistachio', 'cashew',
  'mixed-nuts', 'gift-box', 'gift-family', 'royal-bundle', 'ajwa', 'sukkari',
  'mabroom', 'zahedi', 'khalas', 'mazafati', 'date-syrup', 'stuffed-dates', 'choco-dates',
] as const;

const CATEGORY_KEYS = [
  'premium', 'classic', 'craft', 'dates', 'dried', 'fresh', 'nuts', 'gifts',
] as const;

describe('productArt', () => {
  it('exposes every seeded product slug', () => {
    expect(Object.keys(productArt).sort()).toEqual([...PRODUCT_SLUGS].sort());
    for (const slug of PRODUCT_SLUGS) {
      expect(productArt[slug], slug).toMatch(/^<svg[\s\S]*<\/svg>$/);
    }
  });

  it('exposes every category art key', () => {
    expect(Object.keys(categoryArt).sort()).toEqual([...CATEGORY_KEYS].sort());
    for (const key of CATEGORY_KEYS) {
      expect(categoryArt[key], key).toMatch(/^<svg[\s\S]*<\/svg>$/);
    }
  });

  it('artFor falls back from product to category art', () => {
    expect(artFor('medjool')).toBe(productArt['medjool']);
    expect(artFor('premium')).toBe(categoryArt['premium']);
    expect(artFor('nope')).toBeUndefined();
  });
});
