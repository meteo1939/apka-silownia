import { describe, expect, it } from 'vitest';
import {
  DASHBOARD_SECTION_IDS,
  DEFAULT_DASHBOARD_LAYOUT,
  getSectionOrder,
  getVisibleSections,
  getWideSections,
  moveSection,
  normalizeDashboardLayout,
  toggleSection,
} from './dashboardLayout';

describe('dashboardLayout', () => {
  it('falls back to the default layout for invalid payloads', () => {
    expect(normalizeDashboardLayout(null)).toEqual(DEFAULT_DASHBOARD_LAYOUT);
    expect(normalizeDashboardLayout('nope')).toEqual(DEFAULT_DASHBOARD_LAYOUT);
    expect(normalizeDashboardLayout({})).toEqual(DEFAULT_DASHBOARD_LAYOUT);
  });

  it('drops unknown and duplicate entries while filling missing sections', () => {
    const layout = normalizeDashboardLayout({
      order: ['heatmap', 'heatmap', 'unknown', 'streak'],
      hidden: ['muscles', 'muscles', 'unknown'],
    });

    expect(layout.order).toEqual(['heatmap', 'streak', ...DASHBOARD_SECTION_IDS.filter(id => id !== 'heatmap' && id !== 'streak')]);
    expect(layout.hidden).toEqual(['muscles']);
  });

  it('reports only visible sections in order', () => {
    const layout = normalizeDashboardLayout({ hidden: ['vitals', 'equipment'] });
    expect(getVisibleSections(layout)).toEqual([
      'streak',
      'heatmap',
      'achievements',
      'muscles',
    ]);
  });

  it('computes visible section order and ignores hidden sections', () => {
    const layout = normalizeDashboardLayout({ hidden: ['streak'] });
    expect(getSectionOrder(layout, 'vitals')).toBe(1);
    expect(getSectionOrder(layout, 'streak')).toBe(DASHBOARD_SECTION_IDS.length + 1);
  });

  it('moves sections without leaving the bounds', () => {
    const moved = moveSection(DEFAULT_DASHBOARD_LAYOUT, 'streak', 1);
    expect(moved.order.slice(0, 2)).toEqual(['vitals', 'streak']);
    expect(moveSection(DEFAULT_DASHBOARD_LAYOUT, 'streak', -1)).toBe(DEFAULT_DASHBOARD_LAYOUT);
    expect(moveSection(DEFAULT_DASHBOARD_LAYOUT, 'muscles', 1)).toBe(DEFAULT_DASHBOARD_LAYOUT);
  });

  it('toggles sections on and off without duplicates', () => {
    const hidden = toggleSection(DEFAULT_DASHBOARD_LAYOUT, 'heatmap');
    expect(hidden.hidden).toEqual(['heatmap']);
    expect(toggleSection(hidden, 'heatmap').hidden).toEqual([]);
  });

  it('widens a half-width section when it would be left alone', () => {
    const defaultWide = getWideSections(DEFAULT_DASHBOARD_LAYOUT);
    expect([...defaultWide]).toEqual(['equipment', 'muscles']);

    const withoutVitals = normalizeDashboardLayout({ hidden: ['vitals'] });
    expect(getWideSections(withoutVitals).has('achievements')).toBe(true);
  });

  it('widens a half-width section that precedes a full-width section', () => {
    const custom = normalizeDashboardLayout({
      order: ['streak', 'equipment', 'vitals', 'heatmap', 'achievements', 'muscles'],
    });
    expect(getWideSections(custom).has('streak')).toBe(true);
    expect(getWideSections(custom).has('equipment')).toBe(true);
  });
});
