import api from './api.js';

export async function getAddresses() {
  const res = await api.get('/addresses');
  return res.data.data.addresses;
}

export async function createAddress(payload) {
  const res = await api.post('/addresses', payload);
  return res.data.data.address;
}

export async function updateAddress(id, payload) {
  const res = await api.put(`/addresses/${id}`, payload);
  return res.data.data.address;
}

export async function setDefaultAddress(id) {
  const res = await api.patch(`/addresses/${id}/default`);
  return res.data.data.address;
}

export async function deleteAddress(id) {
  const res = await api.delete(`/addresses/${id}`);
  return res.data;
}
