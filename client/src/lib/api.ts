import axios from 'axios';
import { handleDemoFallback } from '../demo/demoDataService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.VITE_DEMO_MODE === 'true' && (!response.data || !response.data.data || (Array.isArray(response.data.data) && response.data.data.length === 0) || (response.data.data.activities && response.data.data.activities.length === 0))) {
      const demoData = handleDemoFallback(response.config.url || '', response.config.params);
      if (demoData) {
        console.warn('DEMO_MODE: Intercepted empty response, serving demo data for', response.config.url);
        return demoData.data || demoData;
      }
    }
    return response.data;
  },
  (error) => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      const demoData = handleDemoFallback(error.config?.url || '', error.config?.params);
      if (demoData) {
        console.warn('DEMO_MODE: Intercepted failed response, serving demo data for', error.config?.url);
        return Promise.resolve(demoData.data || demoData);
      }
    }
    return Promise.reject(error.response?.data || { success: false, error: { message: 'An unexpected error occurred' } });
  }
);

export default api;
