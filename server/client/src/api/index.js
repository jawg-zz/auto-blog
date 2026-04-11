import axios from 'axios';

const API_URL = '/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: (url) => client.get(url),
  post: (url, data) => client.post(url, data),
  put: (url, data) => client.put(url, data),
  delete: (url) => client.delete(url),

  auth: {
    login: (email, password) => client.post('/auth/login', { email, password }),
    register: (data) => client.post('/auth/register', data),
    me: () => client.get('/auth/me')
  },

  sources: {
    list: () => client.get('/sources'),
    get: (id) => client.get(`/sources/${id}`),
    create: (data) => client.post('/sources', data),
    update: (id, data) => client.put(`/sources/${id}`, data),
    delete: (id) => client.delete(`/sources/${id}`),
    test: (id) => client.post(`/sources/${id}/test`)
  },

  posts: {
    list: (params) => client.get('/posts', { params }),
    get: (id) => client.get(`/posts/${id}`),
    create: (data) => client.post('/posts', data),
    update: (id, data) => client.put(`/posts/${id}`, data),
    delete: (id) => client.delete(`/posts/${id}`),
    publish: (id, platformIds) => client.post(`/posts/${id}/publish`, { platformIds }),
    retry: (id) => client.post(`/posts/${id}/retry`),
    bulkDelete: (ids) => client.post('/posts/bulk-delete', { ids }),
    bulkPublish: (ids, platformIds) => client.post('/posts/bulk-publish', { ids, platformIds })
  },

  categories: {
    list: () => client.get('/categories'),
    get: (id) => client.get(`/categories/${id}`),
    create: (data) => client.post('/categories', data),
    update: (id, data) => client.put(`/categories/${id}`, data),
    delete: (id) => client.delete(`/categories/${id}`)
  },

  tags: {
    list: () => client.get('/tags'),
    get: (id) => client.get(`/tags/${id}`),
    create: (data) => client.post('/tags', data),
    update: (id, data) => client.put(`/tags/${id}`, data),
    delete: (id) => client.delete(`/tags/${id}`)
  },

  platforms: {
    list: () => client.get('/platforms'),
    get: (id) => client.get(`/platforms/${id}`),
    create: (data) => client.post('/platforms', data),
    update: (id, data) => client.put(`/platforms/${id}`, data),
    delete: (id) => client.delete(`/platforms/${id}`),
    test: (id) => client.post(`/platforms/${id}/test`)
  },

  schedules: {
    list: () => client.get('/schedules'),
    get: (id) => client.get(`/schedules/${id}`),
    create: (data) => client.post('/schedules', data),
    update: (id, data) => client.put(`/schedules/${id}`, data),
    delete: (id) => client.delete(`/schedules/${id}`),
    trigger: (id) => client.post(`/schedules/${id}/trigger`)
  },

  dashboard: {
    stats: () => client.get('/dashboard/stats')
  },

  ai: {
    generate: (prompt, options) => client.post('/ai/generate', { prompt, options }),
    summarize: (content, maxLength) => client.post('/ai/summarize', { content, maxLength }),
    repurpose: (content, targetPlatform) => client.post('/ai/repurpose', { content, targetPlatform })
  }
};

export default client;
