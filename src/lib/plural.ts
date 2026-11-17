/**
 * Polish plural rules: 1 → one, 2–4 → few (except 12–14), everything else → many.
 * Other languages fall back to one/many, which fits English and the current locales.
 */
export const pluralize = (
  count: number,
  lang: string,
  forms: [one: string, few: string, many: string]
): string => {
  const value = Math.abs(count);

  if (lang === 'pl') {
    if (value === 1) return forms[0];
    const mod10 = value % 10;
    const mod100 = value % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
    return forms[2];
  }

  return value === 1 ? forms[0] : forms[2];
};
