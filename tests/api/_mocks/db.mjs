/**
 * Mock database layer for testing API handlers.
 *
 * Usage in tests:
 *   import { setMockResults, resetMock, getQueries } from './_mocks/db.mjs';
 *   setMockResults([{ rows: [...] }]);  // sequential results
 *   // or
 *   setMockResults((sql, params) => [...]);  // function-based
 */

let _mockImpl = null;
let _queries = [];

export function setMockResults(impl) {
  _mockImpl = impl;
}

export function resetMock() {
  _mockImpl = null;
  _queries = [];
}

export function getQueries() {
  return _queries;
}

/**
 * Mock query function. Matches against the set mock implementation.
 * If impl is an array, returns results sequentially.
 * If impl is a function, calls it with (sql, params).
 */
export async function query(text, params = []) {
  _queries.push({ text, params });

  if (!_mockImpl) return [];

  if (typeof _mockImpl === 'function') {
    return _mockImpl(text, params);
  }

  if (Array.isArray(_mockImpl)) {
    const result = _mockImpl.shift();
    return result || [];
  }

  return [];
}

export async function initDB() {
  // no-op in tests
}

/**
 * Mock neon() returns a tagged template literal that delegates to query().
 */
export function neon() {
  return async function sql(strings, ...values) {
    // Reconstruct parameterized SQL from template literal
    let text = '';
    const params = [];
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) {
        params.push(values[i]);
        text += `$${params.length}`;
      }
    }
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return query(text, params);
  };
}
