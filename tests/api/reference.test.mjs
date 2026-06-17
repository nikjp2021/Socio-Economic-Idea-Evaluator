import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildReq } from './_helpers/req.mjs';
import { resetMock, setMockResults } from './_mocks/db.mjs';

vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));

const { default: refHandler } = await import('../../api/reference.mjs');

const HOST = 'localhost:3000';

function refReq(data, params = {}) {
  const req = buildReq(`/api/reference`, {
    method: 'GET',
    headers: { host: HOST },
  });
  // reference.mjs uses req.query, not URL parsing
  req.query = { data, ...params };
  return req;
}

function callRef(req) {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) { res.headers[k] = v; },
    writeHead(s, h) { res.statusCode = s; if (h) Object.assign(res.headers, h); },
    end(d) { res.body = d; },
  };
  return refHandler(req, res).then(() => ({
    status: res.statusCode,
    body: JSON.parse(res.body || '{}'),
  }));
}

const TEST_PERSONA = {
  id: 'p1',
  name: 'Wangari Maathai',
  title: 'Founder, Green Belt Movement',
  country: 'KE',
  zone: 'Sub-Saharan Africa',
  bio: 'Nobel laureate',
  specialties: ['environment', 'community'],
};

const TEST_CASE = {
  id: 'c1',
  title: 'Akshaya Patra',
  organization: 'Akshaya Patra Foundation',
  country: 'IN',
  zone: 'South Asia',
  category: 'food',
  problem_statement: 'School children going hungry',
  key_lesson: 'Scale through kitchen technology',
};

const TEST_COUNTRY = {
  code: 'KE',
  name: 'Kenya',
  region: 'Eastern Africa',
  zone: 'Sub-Saharan Africa',
  economic_tier: 'T3',
  pdi: 70,
  idv: 25,
  mas: 60,
  uai: 50,
  lto: 18,
  ivr: 42,
};

const TEST_SDG = {
  number: 2,
  name: 'Zero Hunger',
  color: '#DDA63A',
  targets: ['2.1', '2.2'],
};

const TEST_TEMPLATE = {
  id: 't1',
  label: 'Community garden for food security',
  category: 'agriculture',
  country: 'KE',
  score: 7.5,
  verdict: 'GO',
};

// ─── Personas ───

describe('GET /api/reference?data=personas', () => {
  beforeEach(() => resetMock());

  it('returns all mentor personas', async () => {
    setMockResults(() => [TEST_PERSONA]);
    const res = await callRef(refReq('personas'));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].name).toBe('Wangari Maathai');
  });

  it('filters by zone', async () => {
    setMockResults((sql) => {
      if (sql.includes('zone')) return [TEST_PERSONA];
      return [];
    });
    const res = await callRef(refReq('personas', { zone: 'Sub-Saharan Africa' }));

    expect(res.status).toBe(200);
  });
});

// ─── Case Studies ───

describe('GET /api/reference?data=cases', () => {
  beforeEach(() => resetMock());

  it('returns case studies', async () => {
    setMockResults(() => [TEST_CASE]);
    const res = await callRef(refReq('cases'));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].title).toBe('Akshaya Patra');
  });

  it('filters by category', async () => {
    setMockResults((sql) => {
      if (sql.includes('category')) return [TEST_CASE];
      return [];
    });
    const res = await callRef(refReq('cases', { category: 'food' }));

    expect(res.status).toBe(200);
  });

  it('filters by country', async () => {
    setMockResults((sql) => {
      if (sql.includes('country')) return [TEST_CASE];
      return [];
    });
    const res = await callRef(refReq('cases', { country: 'IN' }));

    expect(res.status).toBe(200);
  });

  it('filters by zone', async () => {
    setMockResults((sql) => {
      if (sql.includes('zone')) return [TEST_CASE];
      return [];
    });
    const res = await callRef(refReq('cases', { zone: 'South Asia' }));

    expect(res.status).toBe(200);
  });
});

// ─── Countries ───

describe('GET /api/reference?data=countries', () => {
  beforeEach(() => resetMock());

  it('returns all countries', async () => {
    setMockResults(() => [TEST_COUNTRY]);
    const res = await callRef(refReq('countries'));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns single country by code', async () => {
    setMockResults(() => [TEST_COUNTRY]);
    const res = await callRef(refReq('countries', { code: 'KE' }));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.code).toBe('KE');
    expect(res.body.data.name).toBe('Kenya');
  });

  it('returns null for unknown country code', async () => {
    setMockResults(() => []);
    const res = await callRef(refReq('countries', { code: 'XX' }));

    expect(res.status).toBe(404);
  });

  it('filters by zone', async () => {
    setMockResults(() => [TEST_COUNTRY]);
    const res = await callRef(refReq('countries', { zone: 'Sub-Saharan Africa' }));

    expect(res.status).toBe(200);
  });
});

// ─── SDGs ───

describe('GET /api/reference?data=sdgs', () => {
  beforeEach(() => resetMock());

  it('returns all SDGs', async () => {
    setMockResults(() => [TEST_SDG]);
    const res = await callRef(refReq('sdgs'));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].number).toBe(2);
  });
});

// ─── Templates ───

describe('GET /api/reference?data=templates', () => {
  beforeEach(() => resetMock());

  it('returns idea templates', async () => {
    setMockResults(() => [TEST_TEMPLATE]);
    const res = await callRef(refReq('templates'));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].label).toBe('Community garden for food security');
  });
});

// ─── Figures ───

describe('GET /api/reference?data=figures', () => {
  beforeEach(() => resetMock());

  it('returns figures', async () => {
    setMockResults(() => [{ id: 1, name: 'Muhammad Yunus', country: 'BD', role: 'Founder, Grameen Bank' }]);
    const res = await callRef(refReq('figures'));

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── Stats ───

describe('GET /api/reference?data=stats', () => {
  beforeEach(() => resetMock());

  it('returns platform statistics', async () => {
    setMockResults((sql) => {
      if (sql.includes('COUNT(*)') && sql.includes('evaluations')) return [{ total: '150' }];
      if (sql.includes('COUNT(*)') && sql.includes('users')) return [{ total: '45' }];
      if (sql.includes('AVG')) return [{ avg: '6.8' }];
      if (sql.includes('marketplace')) return [{ total: '30' }];
      return [{ total: '0' }];
    });
    const res = await callRef(refReq('stats'));

    expect(res.status).toBe(200);
  });
});

// ─── Edge Cases ───

describe('reference edge cases', () => {
  beforeEach(() => resetMock());

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/reference', {
      method: 'OPTIONS',
      headers: { host: HOST },
    });
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(k, v) { res.headers[k] = v; },
      writeHead(s) { res.statusCode = s; },
      end() {},
    };
    await refHandler(req, res);

    expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
  });
});
