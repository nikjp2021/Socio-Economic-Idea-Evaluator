# SEE Test Plan

Comprehensive test suite for the Socio-Economic Evaluator platform.

## Test Summary

| Suite | Framework | Tests | Status |
|---|---|---|---|
| JS API Tests | Vitest 4.1.9 | 71 | ✅ All passing |
| Python Evaluator | pytest 9.1.0 | 75 | ✅ All passing |
| **Total** | | **146** | |

## Running Tests

```bash
# JS API tests
npm test

# Python evaluator tests
.venv/bin/python -m pytest tests/python/ -v

# Both
npm test && .venv/bin/python -m pytest tests/python/ -v
```

---

## JS API Tests (Vitest)

Configuration: `vitest.config.js`
Helpers: `tests/api/_helpers/req.mjs`, `tests/api/_mocks/db.mjs`

### auth.test.mjs — 23 tests

| Category | Tests | Covers |
|---|---|---|
| Input validation | 4 | Missing fields, short password, invalid email, bad role |
| Guest access | 2 | Guest token creation, guest flag in response |
| Registration | 4 | New user, duplicate email, hashed password, DB error |
| Login | 4 | Valid credentials, wrong password, unknown email, DB error |
| GET dispatch | 2 | Session lookup, missing session |
| Edge cases | 4 | CORS headers, invalid JSON body, unknown method, OPTIONS preflight |
| Duplicate registration | 3 | Same email re-register, different emails, field trimming |

### evaluations.test.mjs — 25 tests

| Category | Tests | Covers |
|---|---|---|
| Save evaluation | 4 | Auth required, successful save, missing fields, DB error |
| Get evaluations | 3 | Returns list, empty list, auth required |
| Delete evaluation | 3 | Successful delete, not found, auth required |
| Export | 4 | CSV format, JSON format, auth required, default CSV |
| Stats | 3 | Aggregate stats, empty table, auth required |
| Auth gating | 4 | Bearer token, guest header, missing auth, expired token |
| Edge cases | 4 | CORS headers, null body, unknown method, OPTIONS preflight |

### reference.test.mjs — 15 tests

| Category | Tests | Covers |
|---|---|---|
| Personas | 2 | Get all, filter by zone |
| Case Studies | 4 | Get all, filter by category/country/zone |
| Countries | 4 | Get all, single by code, unknown code (404), filter by zone |
| SDGs | 1 | Get all |
| Templates | 1 | Get all |
| Figures | 1 | Get all |
| Stats | 1 | Platform statistics aggregation |
| Edge cases | 1 | OPTIONS preflight |

### eval.test.mjs — 8 tests

| Category | Tests | Covers |
|---|---|---|
| Input validation | 3 | Empty idea, too short, too long |
| Static demo | 1 | Known coffee shop demo → 200 with verdict |
| Gemini integration | 3 | Novel idea via mock, rate limit (429), generic error (500) |
| Edge cases | 1 | OPTIONS preflight |

---

## Python Evaluator Tests (pytest)

File: `tests/python/test_evaluator.py`

### Detection & Parsing

| Class | Tests | Covers |
|---|---|---|
| TestDetectCountry | 9 | India, Kenya, Japan, Bangladesh, Brazil, USA, unknown, case insensitivity, first-wins |
| TestDetectIdeaType | 12 | All 10 types + unknown default + priority order |
| TestDetectEconomicTier | 5 | T1, T2, T4 override, rural override, smartphone override |
| TestExtractField | 2 | Structured field, missing field fallback |
| TestExtractConstraints | 5 | Zero budget, dollar budget, solo team, weekend time, no constraints |
| TestParseIdea | 3 | Basic parse, parse with budget, return dict keys |

### Data & Mapping

| Class | Tests | Covers |
|---|---|---|
| TestGetZone | 6 | East Africa, South Asia, East Asia, Latin America, MENA, unknown default |
| TestLoadCountryData | 3 | India (full data), Kenya, unknown country (defaults) |
| TestMapToSDGs | 6 | Education/SDG4, Health/SDG3, Food/SDG2, Water/SDG6, Women/SDG5, unknown type |
| TestAssessFadRisk | 3 | Food LOW, education LOW, unknown type |
| TestCalculateImpactScore | 3 | High impact, low tier reach, interpretation levels |

### Analysis Pipeline

| Class | Tests | Covers |
|---|---|---|
| TestRunThreeTests | 3 | Required keys, score range, pass field structure |
| TestRunCulturalAnalysis | 3 | Required keys, score range, Hofstede dimensions |
| TestRunEducationAnalysis | 3 | Required keys, delta non-negative, barriers list |
| TestRunBootstrapperScore | 3 | Required keys, score range, sub-score dicts |
| TestMatchMentorPersonas | 1 | Returns ≤3 personas |

### Integration

| Class | Tests | Covers |
|---|---|---|
| TestEvaluate | 5 | India, Kenya, Japan full evaluations + score/country assertions |

---

## Architecture Notes

### Mock DB Layer (`tests/api/_mocks/db.mjs`)
- `setMockResults(impl)` — accepts array or function (receives SQL string, returns rows)
- `resetMock()` — clears mock state between tests
- `query()` — returns mock results, used by all API handlers

### Mock Request Builder (`tests/api/_helpers/req.mjs`)
- `buildReq(url, opts)` — creates EventEmitter-based request with `method`, `headers`, `query`
- Uses `setTimeout` to emit body events (for POST endpoints)

### Two Handler Patterns
1. **Web API** (auth, evaluations): Uses `new Response()` — mock needs minimal `req`/`res`
2. **Node.js** (reference, eval): Uses `req.query` + `res.setHeader`/`writeHead`/`end` — mock needs full res object with these methods

### Gemini Mock (eval.test.mjs)
- Class-based mock (`class MockGoogleGenAI`) to handle `new GoogleGenAI()` constructor calls
- `mockGenerateContent` exposed for per-test control via `mockResolvedValue`/`mockRejectedValue`
- Environment variable `GOOGLE_GENAI_API_KEY` set in beforeEach, deleted in afterEach
