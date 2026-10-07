import api from '../../../lib/api';

export const login = async (data: any) => {
  return api.post('/auth/login', data);
};

export const register = async (data: any) => {
  return api.post('/auth/register', data);
};

export const logout = async () => {
  return api.post('/auth/logout');
};

export const getMe = async () => {
  return api.get('/auth/me');
};
