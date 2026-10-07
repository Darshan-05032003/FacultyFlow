import { demoActivities, demoDepartmentAnalytics, demoForecast, demoPriorities, demoSimulatorBaseline } from './demoData';

export const isDemoMode = () => {
  return import.meta.env.VITE_DEMO_MODE === 'true';
};

export async function withDemoFallback<T>(apiCall: () => Promise<T>, demoDataGetter: () => any): Promise<T> {
  try {
    const res = await apiCall();
    if (isDemoMode()) {
      // If the API returns something empty/falsy, fallback to demo data
      // For arrays, if length is 0
      // For objects, if keys length is 0 or if there are explicit 0 metrics
      
      // Specifically for facultyflow wrappers where res is { success: true, data: ... }
      // But the api interceptor unwraps `data`, so `res` is just the payload.
      // Wait, let's check `api.ts`. It says `response => response.data`. 
      // So `res` is the `data` object from the server.
      
      let isEmpty = false;
      if (Array.isArray(res) && res.length === 0) isEmpty = true;
      if (res && typeof res === 'object' && !Array.isArray(res)) {
        // Analytics overview
        if ('overview' in res && (res as any).overview?.activityCount === 0) {
          isEmpty = true;
        }
        // Forecast
        if ('forecasts' in res && ((res as any).forecasts?.length === 0 || !(res as any).forecasts)) {
          isEmpty = true;
        }
        // Priorities
        if ('tasks' in res && ((res as any).tasks?.length === 0 || !(res as any).tasks)) {
          isEmpty = true;
        }
        // Department
        if ('departmentWorkloadStatus' in res && (res as any).overview?.activityCount === 0) {
          isEmpty = true;
        }
      }

      if (isEmpty) {
        console.log("Using DEMO fallback due to empty API response.");
        return demoDataGetter() as T;
      }
    }
    return res;
  } catch (error) {
    if (isDemoMode()) {
      console.log("Using DEMO fallback due to API error.", error);
      return demoDataGetter() as T;
    }
    throw error;
  }
}

export const DemoService = {
  getActivities: () => {
    return { data: demoActivities };
  },
  getAnalytics: () => {
    return demoDepartmentAnalytics.faculty; // We will store pre-computed analytics in demoData
  },
  getDepartmentAnalytics: () => {
    return demoDepartmentAnalytics.hod;
  },
  getForecast: () => {
    return demoForecast;
  },
  getPriorities: () => {
    return demoPriorities;
  },
  getSimulatorBaseline: () => {
    return demoSimulatorBaseline;
  }
};
