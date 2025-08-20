// Config de API
const API_BASE = '/api';

const api = {
  async get(path, opts = {}) {
    return fetch(API_BASE + path, withAuth({ method: 'GET', ...opts }));
  },
  async post(path, body, opts = {}) {
    return fetch(API_BASE + path, withAuth({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      body: JSON.stringify(body)
    }));
  },
  async put(path, body, opts = {}) {
    return fetch(API_BASE + path, withAuth({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      body: JSON.stringify(body)
    }));
  },
  async del(path, opts = {}) {
    return fetch(API_BASE + path, withAuth({ method: 'DELETE', ...opts }));
  },
};

function withAuth(opts) {
  const token = localStorage.getItem('token');
  const headers = { ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return { ...opts, headers };
}
