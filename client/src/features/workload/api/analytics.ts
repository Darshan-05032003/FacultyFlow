import api from '../../../lib/api';

export interface WorkloadFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  courseId?: string;
}

export const getWorkloadAnalytics = async (filters: WorkloadFilters) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.category) params.append('category', filters.category);
  if (filters.status) params.append('status', filters.status);
  if (filters.courseId) params.append('courseId', filters.courseId);

  const res = await api.get(`/workload/analytics?${params.toString()}`);
  return res;
};
