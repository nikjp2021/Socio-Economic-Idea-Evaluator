/**
 * One-time seed migration: imports all static JSON reference data into Neon DB.
 * POST /api/seed?key=SEE_SEED_SECRET
 * Idempotent — uses INSERT ON CONFLICT DO NOTHING.
 */

import { query, initDB } from './db.mjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadJSON(relPath) {
  return JSON.parse(readFileSync(join(ROOT, relPath), 'utf-8'));
}

function parseIntSafe(v) {
  if (!v) return null;
  const n = parseInt(String(v), 10);
  return isNaN(n) ? null : n;
}

// ─── Mentor Personas ───
async function seedPersonas() {
  const { personas } = loadJSON('case-studies/mentor-personas.json');
  let count = 0;
  for (const p of personas) {
    await query(
      `INSERT INTO mentor_personas (id, name, title, country, zone, country_tier, bio, philosophy, quote, categories, specialties, barrier_strengths, model_stages, playbook, warning)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name, p.title, p.country, p.zone, p.country_tier, p.bio, p.philosophy, p.quote,
       JSON.stringify(p.categories || []), JSON.stringify(p.specialties || []),
       JSON.stringify(p.barrier_strengths || []), JSON.stringify(p.model_stages || {}),
       JSON.stringify(p.playbook || {}), p.warning || '']
    );
    count++;
  }
  return count;
}

// ─── Case Studies (library.json + zones-library.json) ───
async function seedCaseStudies() {
  const library = loadJSON('case-studies/library.json');
  const zones = loadJSON('case-studies/zones-library.json');
  const seen = new Set();
  let count = 0;

  // From library.json
  for (const cs of library.case_studies || []) {
    if (seen.has(cs.id)) continue;
    seen.add(cs.id);
    await query(
      `INSERT INTO case_studies (id, title, organization, founders, founded, country, zone, category, problem_statement, the_model, impact, what_worked, what_didnt, key_lesson, status, applicable_to, economic_tier)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO NOTHING`,
      [cs.id, cs.title, cs.organization, JSON.stringify(cs.founders || []), parseIntSafe(cs.founded),
       cs.country, '', cs.category, cs.problem_statement, cs.the_model,
       JSON.stringify(cs.impact_numbers || {}), JSON.stringify(cs.what_worked || []),
       JSON.stringify(cs.what_didnt_work || []), cs.key_lesson, cs.status,
       JSON.stringify(cs.applicable_to || []), JSON.stringify(cs.economic_tier || [])]
    );
    count++;
  }

  // From zones-library.json
  const ZONE_KEYS = ['east_asia','southeast_asia','south_asia','central_asia','mena',
    'east_africa','west_africa','central_south_africa','latin_america','europe'];
  for (const zoneKey of ZONE_KEYS) {
    const zone = zones[zoneKey];
    if (!zone?.case_studies) continue;
    for (const cs of zone.case_studies) {
      if (seen.has(cs.id)) continue;
      seen.add(cs.id);
      await query(
        `INSERT INTO case_studies (id, title, organization, founders, founded, country, zone, category, problem_statement, the_model, impact, what_worked, what_didnt, key_lesson, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (id) DO NOTHING`,
        [cs.id, cs.title, cs.organization, JSON.stringify(cs.founder ? [cs.founder] : []),
         parseIntSafe(cs.founded), cs.country, zoneKey, cs.category,
         cs.problem || cs.problem_statement, cs.model || cs.the_model,
         typeof cs.impact === 'string' ? JSON.stringify({ summary: cs.impact }) : JSON.stringify(cs.impact || {}),
         typeof cs.what_worked === 'string' ? JSON.stringify([cs.what_worked]) : JSON.stringify(cs.what_worked || []),
         typeof cs.what_didnt === 'string' ? JSON.stringify([cs.what_didnt]) : JSON.stringify(cs.what_didnt || []),
         cs.key_lesson, cs.status || 'active']
      );
      count++;
    }
  }
  return count;
}

// ─── Figures ───
async function seedFigures() {
  const library = loadJSON('case-studies/library.json');
  const zones = loadJSON('case-studies/zones-library.json');
  const seen = new Set();
  let count = 0;

  for (const f of library.figures || []) {
    const key = (f.name + '|' + (f.organization || '')).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    await query(
      `INSERT INTO figures (name, country, role, organization, impact, quote, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [f.name, f.country || '', f.role || '', f.organization || '', f.impact || '', f.quote || '', f.source || '']
    );
    count++;
  }

  const ZONE_KEYS = ['east_asia','southeast_asia','south_asia','central_asia','mena',
    'east_africa','west_africa','central_south_africa','latin_america','europe'];
  for (const zoneKey of ZONE_KEYS) {
    const zone = zones[zoneKey];
    if (!zone?.figures) continue;
    for (const f of zone.figures) {
      const key = (f.name + '|' + (f.role || '')).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      await query(
        `INSERT INTO figures (name, role, impact, quote)
         VALUES ($1,$2,$3,$4)`,
        [f.name, f.role || '', f.impact || '', f.quote || '']
      );
      count++;
    }
  }
  return count;
}

// ─── Countries (hofstede-database.json + countries.json) ───
async function seedCountries() {
  const hofstede = loadJSON('data/hofstede-database.json');
  const deep = loadJSON('data/countries.json');
  let count = 0;

  for (const [code, c] of Object.entries(hofstede.countries || {})) {
    const deepData = deep.countries?.[code];
    const culturalProfile = deepData?.cultural_profile || {};
    const fundingSources = deepData?.funding_sources || [];
    const tier = deepData?.economic_tier || guessTier(c.income);

    await query(
      `INSERT INTO countries (code, name, region, zone, income_level, economic_tier, pdi, idv, mas, uai, lto, ivr, cultural_profile, funding_sources)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (code) DO NOTHING`,
      [code, c.name, c.region || '', c.zone || '', c.income || '', tier,
       c.pdi ?? null, c.idv ?? null, c.mas ?? null, c.uai ?? null, c.lto ?? null, c.ivr ?? null,
       JSON.stringify(culturalProfile), JSON.stringify(fundingSources)]
    );
    count++;
  }
  return count;
}

function guessTier(income) {
  if (!income) return '';
  const l = income.toLowerCase();
  if (l.includes('high')) return 'T1';
  if (l.includes('upper middle')) return 'T2';
  if (l.includes('lower middle')) return 'T3';
  if (l.includes('low')) return 'T4';
  return '';
}

// ─── SDG Data (from evaluator.py SDG_MAP + static SDG info) ───
async function seedSDGs() {
  const SDG_INFO = [
    { number: 1, name: 'No Poverty', color: '#E5243B' },
    { number: 2, name: 'Zero Hunger', color: '#DDA63A' },
    { number: 3, name: 'Good Health and Well-being', color: '#4C9F38' },
    { number: 4, name: 'Quality Education', color: '#C5192D' },
    { number: 5, name: 'Gender Equality', color: '#FF3A21' },
    { number: 6, name: 'Clean Water and Sanitation', color: '#26BDE2' },
    { number: 7, name: 'Affordable and Clean Energy', color: '#FCC30B' },
    { number: 8, name: 'Decent Work and Economic Growth', color: '#A21942' },
    { number: 9, name: 'Industry, Innovation and Infrastructure', color: '#FD6925' },
    { number: 10, name: 'Reduced Inequalities', color: '#DD1367' },
    { number: 11, name: 'Sustainable Cities and Communities', color: '#FD9D24' },
    { number: 12, name: 'Responsible Consumption and Production', color: '#BF8B2E' },
    { number: 13, name: 'Climate Action', color: '#3F7E44' },
    { number: 14, name: 'Life Below Water', color: '#0A97D9' },
    { number: 15, name: 'Life on Land', color: '#56C02B' },
    { number: 16, name: 'Peace, Justice and Strong Institutions', color: '#00689D' },
    { number: 17, name: 'Partnerships for the Goals', color: '#19486A' },
  ];

  // SDG-to-idea-type mapping from the evaluator
  const SDG_MAP = {
    health: { primary: { number: 3 }, secondary: { number: 1 }, weight: 9 },
    education: { primary: { number: 4 }, secondary: { number: 10 }, weight: 8 },
    food: { primary: { number: 2 }, secondary: { number: 3 }, weight: 8 },
    water: { primary: { number: 6 }, secondary: { number: 3 }, weight: 9 },
    safety: { primary: { number: 16 }, secondary: { number: 5 }, weight: 7 },
    work: { primary: { number: 8 }, secondary: { number: 9 }, weight: 7 },
    financial: { primary: { number: 8 }, secondary: { number: 1 }, weight: 8 },
    women: { primary: { number: 5 }, secondary: { number: 10 }, weight: 8 },
    elderly: { primary: { number: 3 }, secondary: { number: 10 }, weight: 6 },
    mental_health: { primary: { number: 3 }, secondary: { number: 4 }, weight: 7 },
    disaster: { primary: { number: 13 }, secondary: { number: 11 }, weight: 8 },
    community: { primary: { number: 11 }, secondary: { number: 16 }, weight: 6 },
    environment: { primary: { number: 13 }, secondary: { number: 15 }, weight: 9 },
    sustainability: { primary: { number: 12 }, secondary: { number: 13 }, weight: 8 },
    animals: { primary: { number: 15 }, secondary: { number: 14 }, weight: 5 },
    labor: { primary: { number: 8 }, secondary: { number: 10 }, weight: 7 },
    housing: { primary: { number: 11 }, secondary: { number: 1 }, weight: 7 },
    transport: { primary: { number: 11 }, secondary: { number: 13 }, weight: 5 },
    energy: { primary: { number: 7 }, secondary: { number: 13 }, weight: 8 },
    rights: { primary: { number: 16 }, secondary: { number: 5 }, weight: 7 },
    inclusion: { primary: { number: 10 }, secondary: { number: 16 }, weight: 7 },
    art: { primary: { number: 4 }, secondary: { number: 11 }, weight: 4 },
    sport: { primary: { number: 3 }, secondary: { number: 4 }, weight: 4 },
    peace: { primary: { number: 16 }, secondary: { number: 4 }, weight: 7 },
    governance: { primary: { number: 16 }, secondary: { number: 17 }, weight: 6 },
    technology: { primary: { number: 9 }, secondary: { number: 4 }, weight: 6 },
  };

  // Build idea_types reverse mapping: SDG number → { idea_types that map to it }
  const ideaTypesBySDG = {};
  for (const [ideaType, mapping] of Object.entries(SDG_MAP)) {
    const primaryNum = mapping.primary.number;
    const secondaryNum = mapping.secondary.number;
    if (!ideaTypesBySDG[primaryNum]) ideaTypesBySDG[primaryNum] = { primary: [], secondary: [] };
    if (!ideaTypesBySDG[secondaryNum]) ideaTypesBySDG[secondaryNum] = { primary: [], secondary: [] };
    ideaTypesBySDG[primaryNum].primary.push(ideaType);
    ideaTypesBySDG[secondaryNum].secondary.push(ideaType);
  }

  let count = 0;
  for (const sdg of SDG_INFO) {
    await query(
      `INSERT INTO sdg_data (number, name, color, targets, idea_types)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (number) DO NOTHING`,
      [sdg.number, sdg.name, sdg.color, JSON.stringify([]), JSON.stringify(ideaTypesBySDG[sdg.number] || { primary: [], secondary: [] })]
    );
    count++;
  }
  return count;
}

// ─── Idea Templates (pre-built quick evaluations) ───
async function seedIdeaTemplates() {
  const templates = [
    {
      id: 'food-stall-south-asia',
      label: 'Street food stall in South Asia',
      category: 'food', country: 'BD', zone: 'south_asia', economic_tier: 'T3',
      problem: 'Urban workers in Dhaka lack access to affordable, nutritious street food options near their workplaces.',
      goal: 'Open a small street food stall serving affordable, healthy meals to factory workers during lunch hours.',
      score: 7.2, verdict: 'GO WITH EDUCATION',
    },
    {
      id: 'education-app-sub-saharan',
      label: 'Mobile learning app for rural Africa',
      category: 'education', country: 'KE', zone: 'east_africa', economic_tier: 'T4',
      problem: 'Children in rural Kenya lack access to quality educational materials and qualified teachers.',
      goal: 'Build a simple SMS-based learning platform that delivers daily math and reading lessons to feature phones.',
      score: 6.8, verdict: 'GO WITH EDUCATION',
    },
    {
      id: 'clean-water-mena',
      label: 'Community water purification in MENA',
      category: 'water', country: 'JO', zone: 'mena', economic_tier: 'T3',
      problem: 'Rural communities in Jordan face water scarcity and rely on expensive bottled water.',
      goal: 'Install community-scale water purification units in villages, funded by a micro-payment model.',
      score: 7.5, verdict: 'GO',
    },
    {
      id: 'womens-safety-south-asia',
      label: "Women's safety network in India",
      category: 'safety', country: 'IN', zone: 'south_asia', economic_tier: 'T3',
      problem: 'Women in Indian cities face harassment during commutes and lack quick-access safety resources.',
      goal: 'Create a WhatsApp-based safety network connecting women with verified volunteers in their neighborhood.',
      score: 6.5, verdict: 'GO WITH EDUCATION',
    },
    {
      id: 'solar-energy-east-africa',
      label: 'Solar charging stations in East Africa',
      category: 'energy', country: 'UG', zone: 'east_africa', economic_tier: 'T4',
      problem: 'Rural Ugandan communities lack electricity, forcing families to use kerosene lamps and walk far to charge phones.',
      goal: 'Set up solar-powered charging stations in villages where people can charge devices and buy solar lamps on credit.',
      score: 7.8, verdict: 'GO',
    },
    {
      id: 'elderly-care-east-asia',
      label: 'Elderly companionship service in Japan',
      category: 'elderly', country: 'JP', zone: 'east_asia', economic_tier: 'T1',
      problem: 'Isolated elderly people in Japanese cities suffer from loneliness and lack regular social interaction.',
      goal: 'Train and match volunteer companions with elderly residents for weekly visits and phone calls.',
      score: 7.0, verdict: 'GO',
    },
  ];

  let count = 0;
  for (const t of templates) {
    const sampleResult = buildSampleResult(t);
    await query(
      `INSERT INTO idea_templates (id, label, category, country, zone, economic_tier, problem, goal, sample_result, score, verdict)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO NOTHING`,
      [t.id, t.label, t.category, t.country, t.zone, t.economic_tier,
       t.problem, t.goal, JSON.stringify(sampleResult), t.score, t.verdict]
    );
    count++;
  }
  return count;
}

function buildSampleResult(t) {
  return {
    idea: t.label,
    country: t.country,
    idea_type: t.category,
    economic_tier: t.economic_tier,
    verdict: {
      total_score: t.score,
      verdict: t.verdict,
      detail: `This ${t.category} idea targets a real need. The cultural context and economic conditions support testing.`,
      elevator_pitch: `"${t.goal}" — this is ready to test in ${t.zone}. Start small, measure impact, iterate.`,
      first_step: 'Identify 10 people affected by this problem. Interview them. Document what they currently do.',
    },
    _input: { problem: t.problem, goal: t.goal, country: t.country, budget: '', constraints: '' },
    _is_template: true,
    _template_id: t.id,
  };
}

// ─── Main handler ───
export default async function handler(req, res) {
  // Only allow POST with secret key
  const key = req.query.key || req.headers['x-seed-key'];
  const expectedKey = process.env.SEE_SEED_SECRET || 'see-seed-2024';

  if (req.method !== 'POST' || key !== expectedKey) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden. POST with ?key=SEE_SEED_SECRET' }));
    return;
  }

  try {
    await initDB();

    const results = {};
    results.personas = await seedPersonas();
    results.case_studies = await seedCaseStudies();
    results.figures = await seedFigures();
    results.countries = await seedCountries();
    results.sdgs = await seedSDGs();
    results.idea_templates = await seedIdeaTemplates();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, seeded: results }));
  } catch (err) {
    console.error('Seed failed:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
