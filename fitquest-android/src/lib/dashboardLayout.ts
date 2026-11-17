export const DASHBOARD_SECTION_IDS = [
  'streak',
  'vitals',
  'heatmap',
  'achievements',
  'equipment',
  'muscles',
] as const;

export type DashboardSectionId = typeof DASHBOARD_SECTION_IDS[number];

export interface DashboardLayout {
  order: DashboardSectionId[];
  hidden: DashboardSectionId[];
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  order: [...DASHBOARD_SECTION_IDS],
  hidden: [],
};

const isSectionId = (value: unknown): value is DashboardSectionId =>
  typeof value === 'string' && (DASHBOARD_SECTION_IDS as readonly string[]).includes(value);

export const normalizeDashboardLayout = (value: unknown): DashboardLayout => {
  if (!value || typeof value !== 'object') {
    return { order: [...DEFAULT_DASHBOARD_LAYOUT.order], hidden: [] };
  }

  const raw = value as { order?: unknown; hidden?: unknown };
  const seen = new Set<DashboardSectionId>();
  const order: DashboardSectionId[] = [];

  if (Array.isArray(raw.order)) {
    for (const entry of raw.order) {
      if (isSectionId(entry) && !seen.has(entry)) {
        seen.add(entry);
        order.push(entry);
      }
    }
  }

  for (const id of DASHBOARD_SECTION_IDS) {
    if (!seen.has(id)) order.push(id);
  }

  const hidden = Array.isArray(raw.hidden)
    ? Array.from(new Set(raw.hidden.filter(isSectionId)))
    : [];

  return { order, hidden };
};

export const getVisibleSections = (layout: DashboardLayout): DashboardSectionId[] =>
  layout.order.filter(id => !layout.hidden.includes(id));

export const FULL_WIDTH_SECTIONS = ['equipment', 'muscles'] as const;

const isFullWidthSection = (id: DashboardSectionId): boolean =>
  (FULL_WIDTH_SECTIONS as readonly string[]).includes(id);

/**
 * Returns sections that must span both desktop columns. Half-width sections are
 * paired in order; a half section left alone before a full-width section (or at
 * the end) is widened so the grid never shows an empty cell.
 */
export const getWideSections = (layout: DashboardLayout): Set<DashboardSectionId> => {
  const visible = getVisibleSections(layout);
  const wide = new Set<DashboardSectionId>();
  let pendingHalf: DashboardSectionId | null = null;

  for (const id of visible) {
    if (isFullWidthSection(id)) {
      if (pendingHalf) {
        wide.add(pendingHalf);
        pendingHalf = null;
      }
      wide.add(id);
      continue;
    }

    if (!pendingHalf) {
      pendingHalf = id;
    } else {
      pendingHalf = null;
    }
  }

  if (pendingHalf) wide.add(pendingHalf);
  return wide;
};

export const getSectionOrder = (layout: DashboardLayout, id: DashboardSectionId): number => {
  const index = getVisibleSections(layout).indexOf(id);
  return index === -1 ? DASHBOARD_SECTION_IDS.length + 1 : index + 1;
};

export const moveSection = (
  layout: DashboardLayout,
  id: DashboardSectionId,
  direction: -1 | 1
): DashboardLayout => {
  const order = [...layout.order];
  const index = order.indexOf(id);
  const nextIndex = index + direction;
  if (index === -1 || nextIndex < 0 || nextIndex >= order.length) return layout;
  [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
  return { ...layout, order };
};

export const toggleSection = (layout: DashboardLayout, id: DashboardSectionId): DashboardLayout => {
  const hidden = layout.hidden.includes(id)
    ? layout.hidden.filter(entry => entry !== id)
    : [...layout.hidden, id];
  return { ...layout, hidden };
};
