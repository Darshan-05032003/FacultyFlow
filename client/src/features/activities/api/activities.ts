import api from '../../../lib/api';
import { DemoService, withDemoFallback } from '../../../demo/demoDataService';

export const getActivities = async (filters: any) => {
  return withDemoFallback(async () => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);

    return api.get(`/activities?${params.toString()}`);
  }, DemoService.getActivities);
};

export const createActivity = async (data: any) => {
  return api.post('/activities', data);
};

export const updateActivity = async ({ id, data }: { id: string; data: any }) => {
  return api.patch(`/activities/${id}`, data);
};

export const updateActivityStatus = async ({ id, status }: { id: string; status: string }) => {
  return api.patch(`/activities/${id}/status`, { status });
};

export const deleteActivity = async (id: string) => {
  return api.delete(`/activities/${id}`);
};

export const getActivitySummary = async () => {
  return api.get('/activities/summary');
};
