import { EventEmitter } from 'node:events';

/**
 * Build a mock Vercel-style request object.
 * The API handlers use readBody() which listens to 'data' and 'end' events.
 *
 * @param {string} url - Full URL (e.g. '/api/auth?action=register')
 * @param {object} opts - { method, headers, body }
 * @returns {EventEmitter & { url, headers, method }}
 */
export function buildReq(url, opts = {}) {
  const req = new EventEmitter();
  req.url = url || '/api/auth';
  req.method = opts.method || 'GET';
  req.headers = opts.headers || {};

  // If body is provided, emit after a small delay so readBody() has time to attach listeners
  if (opts.body !== undefined) {
    const data = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    setTimeout(() => {
      req.emit('data', Buffer.from(data));
      req.emit('end');
    }, 5);
  }

  return req;
}

/**
 * Build a mock Vercel-style response object.
 * Captures writeHead and end calls for assertion.
 *
 * @returns {{ statusCode, headers, body, writeHead, end }}
 */
export function buildRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    writeHead(status, headers) {
      res.statusCode = status;
      Object.assign(res.headers, headers);
    },
    end(data) {
      res.body = data;
    },
  };
  return res;
}
