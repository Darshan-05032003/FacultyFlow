import api from '../../../lib/api';

export interface DepartmentWorkloadFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
}

export const getDepartmentAnalytics = async (filters: DepartmentWorkloadFilters) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);

  const res = await api.get(`/departments/analytics?${params.toString()}`);
  return res;
};
