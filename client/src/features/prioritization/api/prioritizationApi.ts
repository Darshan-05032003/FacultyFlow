import api from '../../../lib/api';
import { DemoService, withDemoFallback } from '../../../demo/demoDataService';

export interface PrioritizationFilters {
  horizon?: number;
  category?: string;
  priorityLevel?: string;
  isOverdue?: boolean;
  dueSoon?: boolean;
  limit?: number;
}

export const getPriorities = async (filters?: PrioritizationFilters) => {
  return withDemoFallback(async () => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.horizon) params.append('horizon', filters.horizon.toString());
      if (filters.category) params.append('category', filters.category);
      if (filters.priorityLevel) params.append('priorityLevel', filters.priorityLevel);
      if (filters.isOverdue) params.append('isOverdue', 'true');
      if (filters.dueSoon) params.append('dueSoon', 'true');
      if (filters.limit) params.append('limit', filters.limit.toString());
    }

    const res = await api.get(`/workload/priorities?${params.toString()}`);
    return res.data;
  }, DemoService.getPriorities);
};

export const getTopPriorities = async () => {
  return withDemoFallback(async () => {
    const res = await api.get('/workload/priorities/top');
    return res.data;
  }, () => DemoService.getPriorities().tasks.slice(0, 3));
};
