import axios from 'axios';
import { handleDemoFallback } from '../demo/demoDataService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

function wrapDemoResponse(demoData: any) {
  if (demoData && typeof demoData === 'object' && 'data' in demoData) {
    return demoData;
  }
  return { success: true, data: demoData };
}

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      const respData = response.data;
      const isEmpty =
        !respData ||
        respData.data === null ||
        respData.data === undefined ||
        (Array.isArray(respData.data) && respData.data.length === 0) ||
        (respData.data && Array.isArray(respData.data.activities) && respData.data.activities.length === 0);

      if (isEmpty) {
        const demoData = handleDemoFallback(response.config.url || '', response.config.params);
        if (demoData) {
          console.warn('DEMO_MODE: Intercepted empty response, serving demo data for', response.config.url);
          return wrapDemoResponse(demoData);
        }
      }
    }
    return response.data;
  },
  (error) => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      const demoData = handleDemoFallback(error.config?.url || '', error.config?.params);
      if (demoData) {
        console.warn('DEMO_MODE: Intercepted failed response, serving demo data for', error.config?.url);
        return Promise.resolve(wrapDemoResponse(demoData));
      }
    }
    return Promise.reject(error.response?.data || { success: false, error: { message: 'An unexpected error occurred' } });
  }
);

export default api;
