import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildReq } from './_helpers/req.mjs';
import { resetMock, setMockResults } from './_mocks/db.mjs';

// Mock the DB module
vi.mock('../../api/db.mjs', () => import('./_mocks/db.mjs'));

// Mock the Google GenAI SDK
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      constructor() {
        this.models = {
          generateContent: (...args) => mockGenerateContent(...args),
        };
      }
    },
  };
});

const { default: evalEndpoint } = await import('../../api/eval.mjs');

const HOST = 'localhost:3000';

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(k, v) { res.headers[k] = v; },
    writeHead(s, h) { res.statusCode = s; if (h) Object.assign(res.headers, h); },
    end(d) { res.body = d; },
  };
  return res;
}

function evalReq(idea, headers = {}) {
  const req = buildReq(`/api/eval`, {
    method: 'GET',
    headers: { host: HOST, ...headers },
  });
  // eval.mjs uses req.query, not URL parsing
  req.query = { idea };
  return req;
}

function callEval(req) {
  const res = makeRes();
  return evalEndpoint(req, res).then(() => ({
    status: res.statusCode,
    body: JSON.parse(res.body || '{}'),
  }));
}

// ─── Input Validation ───

describe('GET /api/eval input validation', () => {
  beforeEach(() => {
    resetMock();
    mockGenerateContent.mockReset();
  });

  it('rejects empty idea', async () => {
    const req = evalReq('');
    const res = await callEval(req);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/describe your idea/i);
  });

  it('rejects idea shorter than 10 characters', async () => {
    const req = evalReq('short');
    const res = await callEval(req);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/10 characters/i);
  });

  it('rejects idea longer than 5000 characters', async () => {
    const longIdea = 'x'.repeat(5001);
    const req = evalReq(longIdea);
    const res = await callEval(req);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too long/i);
  });
});

// ─── Static Demo Path ───

describe('static demo evaluation', () => {
  beforeEach(() => {
    resetMock();
    mockGenerateContent.mockReset();
  });

  it('returns static result for known demo input', async () => {
    setMockResults(() => []); // DB save is non-fatal
    const req = evalReq('I want to open local coffee shops near london bridge to help the community');
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.verdict).toBeTruthy();
    expect(res.body.verdict.verdict).toBe('GO');
    expect(res.body.country).toBe('GB');
    expect(res.body.case_study).toBeTruthy();
  });
});

// ─── Gemini Integration ───

describe('Gemini evaluation', () => {
  beforeEach(() => {
    resetMock();
    mockGenerateContent.mockReset();
    process.env.GOOGLE_GENAI_API_KEY = 'AIzaSyFakeKeyForTesting1234567890abcdef';
  });

  afterEach(() => {
    delete process.env.GOOGLE_GENAI_API_KEY;
  });

  it('returns Gemini result for novel idea', async () => {
    setMockResults(() => []); // DB save mock

    const geminiResult = {
      _input: { problem: 'Rural youth lack coding skills', goal: 'Teach web development', country: 'India', budget: '$500', constraints: 'Rural area' },
      country: 'IN',
      country_name: 'India',
      idea_type: 'education',
      economic_tier: 'T2',
      verdict: { total_score: 7, verdict: 'GO', detail: 'Strong potential', elevator_pitch: 'Test pitch', first_step: 'Start small', proof_of_work: { week_1: {}, week_2: {}, success_criteria: '' } },
      sdg_tags: [4],
      mentor_council: [],
    };

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(geminiResult),
    });

    const req = evalReq('Free coding workshops for rural youth in India to learn web development');
    const res = await callEval(req);

    expect(res.status).toBe(200);
    expect(res.body.verdict.total_score).toBe(7);
  });

  it('handles Gemini API rate limit gracefully', async () => {
    mockGenerateContent.mockRejectedValue(new Error('API quota exceeded'));

    const req = evalReq('Free coding workshops for rural youth in India to learn web development');
    const res = await callEval(req);

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/busy|try again/i);
  });

  it('handles Gemini generic error gracefully', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Internal server error'));

    const req = evalReq('Free coding workshops for rural youth in India to learn web development');
    const res = await callEval(req);

    expect(res.status).toBe(500);
    expect(res.body.error).toBeTruthy();
  });
});

// ─── Edge Cases ───

describe('eval edge cases', () => {
  beforeEach(() => {
    resetMock();
    mockGenerateContent.mockReset();
  });

  it('handles OPTIONS preflight', async () => {
    const req = buildReq('/api/eval', {
      method: 'OPTIONS',
      headers: { host: HOST },
    });
    const res = makeRes();
    await evalEndpoint(req, res);

    expect(res.statusCode).toBe(204);
  });
});
