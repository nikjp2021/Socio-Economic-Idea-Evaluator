import { describe, it, expect } from 'vitest';
import { generateRoadmap } from '../../lib/roadmap-generator.mjs';

const SAMPLE_CASE = {
  id: 'c1',
  title: 'Akshaya Patra',
  organization: 'Akshaya Patra Foundation',
  category: 'food',
  country: 'IN',
  problem_statement: 'School children going hungry',
  what_worked: ['Centralized kitchen model', 'Government partnerships'],
  what_didnt: ['Initial quality complaints', 'Logistics in rural areas'],
  key_lesson: 'Scale through kitchen technology',
};

const SAMPLE_CONTEXT = {
  country: 'KE',
  scale: 'solo',
  resources: ['budget'],
};

// ─── Output Structure ───

describe('generateRoadmap output structure', () => {
  it('returns all required top-level keys', () => {
    const r = generateRoadmap(SAMPLE_CASE, SAMPLE_CONTEXT);

    expect(r).toHaveProperty('title');
    expect(r).toHaveProperty('adapted_from');
    expect(r).toHaveProperty('case_study_id');
    expect(r).toHaveProperty('country');
    expect(r).toHaveProperty('scale');
    expect(r).toHaveProperty('resources');
    expect(r).toHaveProperty('week_1');
    expect(r).toHaveProperty('week_2');
    expect(r).toHaveProperty('success_criteria');
    expect(r).toHaveProperty('lessons_from');
    expect(r).toHaveProperty('sdg_alignment');
    expect(r).toHaveProperty('milestones');
  });

  it('week_1 has day_1_2, day_3_4, day_5_7', () => {
    const r = generateRoadmap(SAMPLE_CASE, SAMPLE_CONTEXT);
    expect(r.week_1).toHaveProperty('day_1_2');
    expect(r.week_1).toHaveProperty('day_3_4');
    expect(r.week_1).toHaveProperty('day_5_7');
  });

  it('week_2 has day_8_10, day_11_12, day_13_14', () => {
    const r = generateRoadmap(SAMPLE_CASE, SAMPLE_CONTEXT);
    expect(r.week_2).toHaveProperty('day_8_10');
    expect(r.week_2).toHaveProperty('day_11_12');
    expect(r.week_2).toHaveProperty('day_13_14');
  });

  it('milestones is an array of 6 items with phase/label/description', () => {
    const r = generateRoadmap(SAMPLE_CASE, SAMPLE_CONTEXT);
    expect(r.milestones).toHaveLength(6);
    r.milestones.forEach(m => {
      expect(m).toHaveProperty('phase');
      expect(m).toHaveProperty('label');
      expect(m).toHaveProperty('description');
      expect(['research', 'pilot', 'proof']).toContain(m.phase);
    });
  });

  it('lessons_from has what_worked and what_to_avoid arrays', () => {
    const r = generateRoadmap(SAMPLE_CASE, SAMPLE_CONTEXT);
    expect(Array.isArray(r.lessons_from.what_worked)).toBe(true);
    expect(Array.isArray(r.lessons_from.what_to_avoid)).toBe(true);
  });
});

// ─── Country Adaptation ───

describe('country adaptation', () => {
  it('uses user context country over case study country', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'JP', scale: 'solo', resources: [] });
    expect(r.country).toBe('JP');
  });

  it('falls back to case study country when context has none', () => {
    const r = generateRoadmap(SAMPLE_CASE, { scale: 'solo', resources: [] });
    expect(r.country).toBe('IN');
  });

  it('falls back to IN when neither has country', () => {
    const r = generateRoadmap({ category: 'food' }, { scale: 'solo', resources: [] });
    expect(r.country).toBe('IN');
  });
});

// ─── Scale Adaptation ───

describe('scale adaptation', () => {
  it('solo scale → 3 people reach', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'IN', scale: 'solo', resources: [] });
    expect(r.week_1.day_1_2).toContain('3 people');
    expect(r.week_2.day_8_10).toContain('10 people');
  });

  it('team scale → 10 people reach', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'IN', scale: 'team', resources: [] });
    expect(r.week_1.day_1_2).toContain('10 people');
    expect(r.week_2.day_8_10).toContain('25 people');
  });

  it('org scale → 20 people reach', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'IN', scale: 'org', resources: [] });
    expect(r.week_1.day_1_2).toContain('20 people');
    expect(r.week_2.day_8_10).toContain('50 people');
  });

  it('ngo scale → 50 people reach', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'IN', scale: 'ngo', resources: [] });
    expect(r.week_1.day_1_2).toContain('50 people');
    expect(r.week_2.day_8_10).toContain('200 people');
  });
});

// ─── Resource Adaptation ───

describe('resource adaptation', () => {
  it('phone resource → WhatsApp tech recommendation', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'IN', scale: 'solo', resources: ['phone'] });
    expect(r.week_1.day_5_7).toContain('WhatsApp');
  });

  it('no phone → hand-written tech recommendation', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'IN', scale: 'solo', resources: [] });
    expect(r.week_1.day_5_7).toContain('Write it down by hand');
  });

  it('funding resource implies phone → WhatsApp', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'IN', scale: 'solo', resources: ['funding'] });
    expect(r.week_1.day_5_7).toContain('WhatsApp');
  });

  it('community resource → community partners mention in week 2', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'IN', scale: 'solo', resources: ['community'] });
    expect(r.week_2.day_11_12).toContain('community partners');
  });

  it('no community resource → no community partners mention', () => {
    const r = generateRoadmap(SAMPLE_CASE, { country: 'IN', scale: 'solo', resources: [] });
    expect(r.week_2.day_11_12).not.toContain('community partners');
  });
});

// ─── Category Adaptation ───

describe('category adaptation', () => {
  const categories = ['food', 'education', 'health', 'water', 'women', 'elderly', 'environment', 'financial', 'community'];

  categories.forEach(cat => {
    it(`category "${cat}" produces a category-specific first step`, () => {
      const cs = { ...SAMPLE_CASE, category: cat };
      const r = generateRoadmap(cs, SAMPLE_CONTEXT);
      expect(r.week_1.day_1_2.length).toBeGreaterThan(20);
      expect(r.sdg_alignment).toBe(cat);
    });
  });

  it('unknown category falls back to community', () => {
    const cs = { ...SAMPLE_CASE, category: 'nonexistent' };
    const r = generateRoadmap(cs, SAMPLE_CONTEXT);
    expect(r.week_1.day_1_2).toContain('neighborhood');
  });
});

// ─── Lessons Extraction ───

describe('lessons extraction', () => {
  it('extracts up to 3 what_worked items', () => {
    const cs = { ...SAMPLE_CASE, what_worked: ['A', 'B', 'C', 'D'] };
    const r = generateRoadmap(cs, SAMPLE_CONTEXT);
    expect(r.lessons_from.what_worked).toEqual(['A', 'B', 'C']);
  });

  it('extracts up to 3 what_to_avoid items', () => {
    const cs = { ...SAMPLE_CASE, what_didnt: ['X', 'Y'] };
    const r = generateRoadmap(cs, SAMPLE_CONTEXT);
    expect(r.lessons_from.what_to_avoid).toEqual(['X', 'Y']);
  });

  it('handles missing what_worked gracefully', () => {
    const cs = { ...SAMPLE_CASE, what_worked: undefined, what_didnt: undefined };
    const r = generateRoadmap(cs, SAMPLE_CONTEXT);
    expect(r.lessons_from.what_worked).toEqual([]);
    expect(r.lessons_from.what_to_avoid).toEqual([]);
  });

  it('uses key_lesson as fallback when what_worked is empty', () => {
    const cs = { ...SAMPLE_CASE, what_worked: [], key_lesson: 'Start small' };
    const r = generateRoadmap(cs, SAMPLE_CONTEXT);
    expect(r.week_1.day_3_4).toContain('Start small');
  });
});

// ─── Title Adaptation ───

describe('title adaptation', () => {
  it('uses case study title', () => {
    const r = generateRoadmap(SAMPLE_CASE, SAMPLE_CONTEXT);
    expect(r.title).toBe('Your version of Akshaya Patra');
    expect(r.adapted_from).toBe('Akshaya Patra');
  });

  it('falls back to organization name', () => {
    const cs = { ...SAMPLE_CASE, title: undefined };
    const r = generateRoadmap(cs, SAMPLE_CONTEXT);
    expect(r.title).toBe('Your version of Akshaya Patra Foundation');
  });

  it('falls back to generic when neither exists', () => {
    const r = generateRoadmap({ category: 'food' }, SAMPLE_CONTEXT);
    expect(r.title).toBe('Your version of Social Impact Project');
  });
});

// ─── Edge Cases ───

describe('edge cases', () => {
  it('handles empty case study gracefully', () => {
    const r = generateRoadmap({}, {});
    expect(r.title).toBe('Your version of Social Impact Project');
    expect(r.country).toBe('IN');
    expect(r.scale).toBe('solo');
    expect(r.milestones).toHaveLength(6);
  });

  it('handles null userContext gracefully', () => {
    const r = generateRoadmap(SAMPLE_CASE, {});
    expect(r.country).toBe('IN');
    expect(r.scale).toBe('solo');
  });

  it('case_study_id is null when not provided', () => {
    const r = generateRoadmap({ category: 'food' }, SAMPLE_CONTEXT);
    expect(r.case_study_id).toBeNull();
  });

  it('case_study_id is preserved when provided', () => {
    const r = generateRoadmap(SAMPLE_CASE, SAMPLE_CONTEXT);
    expect(r.case_study_id).toBe('c1');
  });
});
