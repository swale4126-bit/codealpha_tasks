import api from './api.js';

export async function registerRequest(payload) {
  const res = await api.post('/auth/register', payload);
  return res.data.data;
}

export async function loginRequest(payload) {
  const res = await api.post('/auth/login', payload);
  return res.data.data;
}

export async function getMeRequest() {
  const res = await api.get('/auth/me');
  return res.data.data.user;
}

export async function updateProfileRequest(payload) {
  const res = await api.patch('/auth/profile', payload);
  return res.data.data.user;
}

export async function updatePasswordRequest(payload) {
  const res = await api.patch('/auth/password', payload);
  return res.data;
}
