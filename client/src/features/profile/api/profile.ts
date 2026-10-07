import api from '../../../lib/api';

export const getMyProfile = async () => {
  return api.get('/faculty/profile');
};

export const updateMyProfile = async (data: any) => {
  return api.patch('/faculty/profile', data);
};

export const getMyDepartment = async () => {
  return api.get('/faculty/profile/department');
};
