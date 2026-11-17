import { describe, expect, it } from 'vitest';
import { pluralize } from './plural';

const FORMS: [string, string, string] = ['trening', 'treningi', 'treningów'];

describe('pluralize', () => {
  it('uses the singular form for one', () => {
    expect(pluralize(1, 'pl', FORMS)).toBe('trening');
  });

  it('uses the few form for 2–4', () => {
    expect(pluralize(2, 'pl', FORMS)).toBe('treningi');
    expect(pluralize(4, 'pl', FORMS)).toBe('treningi');
  });

  it('uses the many form for 5 and above', () => {
    expect(pluralize(5, 'pl', FORMS)).toBe('treningów');
    expect(pluralize(11, 'pl', FORMS)).toBe('treningów');
  });

  it('treats 12–14 as many', () => {
    expect(pluralize(12, 'pl', FORMS)).toBe('treningów');
    expect(pluralize(13, 'pl', FORMS)).toBe('treningów');
    expect(pluralize(14, 'pl', FORMS)).toBe('treningów');
  });

  it('treats 22 and 23 as few', () => {
    expect(pluralize(22, 'pl', FORMS)).toBe('treningi');
    expect(pluralize(23, 'pl', FORMS)).toBe('treningi');
  });

  it('treats 112 as many', () => {
    expect(pluralize(112, 'pl', FORMS)).toBe('treningów');
  });

  it('ignores the sign of the count', () => {
    expect(pluralize(-1, 'pl', FORMS)).toBe('trening');
    expect(pluralize(-3, 'pl', FORMS)).toBe('treningi');
  });

  it('uses one/many for non-Polish languages', () => {
    expect(pluralize(1, 'en', FORMS)).toBe('trening');
    expect(pluralize(2, 'en', FORMS)).toBe('treningów');
    expect(pluralize(0, 'en', FORMS)).toBe('treningów');
  });
});
