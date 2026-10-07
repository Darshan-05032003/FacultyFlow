import api from '../../../lib/api';
import { DemoService, withDemoFallback } from '../../../demo/demoDataService';

export interface ForecastFilters {
  horizon?: number;
}

export const getWorkloadForecast = async (filters: ForecastFilters) => {
  return withDemoFallback(async () => {
    const params = new URLSearchParams();
    if (filters.horizon) params.append('horizon', filters.horizon.toString());

    const res = await api.get(`/workload/forecast?${params.toString()}`);
    return res.data;
  }, DemoService.getForecast);
};
