import axios from 'axios';
import { DemoService, withDemoFallback } from '../../../demo/demoDataService';

export type SimulatorActionType = 'ADD_ACTIVITY' | 'MOVE_ACTIVITY' | 'CHANGE_DURATION' | 'REMOVE_ACTIVITY';

export interface SimulatorAction {
  type: SimulatorActionType;
  title?: string;
  date?: string;
  estimatedMinutes?: number;
  category?: string;
  activityId?: string;
  newDate?: string;
}

export interface SimulatorMetrics {
  workloadMinutes: number;
  utilizationPercent: number;
  workloadStatus: string;
  overloadDays: number;
}

export interface SimulatorResponse {
  baseline: SimulatorMetrics;
  scenario: SimulatorMetrics;
  impact: {
    workloadMinutesDelta: number;
    utilizationDelta: number;
    overloadDaysDelta: number;
  };
}

export const simulateWorkload = async (scenario: SimulatorAction): Promise<SimulatorResponse> => {
  return withDemoFallback(async () => {
    const response = await axios.post('/api/v1/workload/simulate', { scenario });
    return response.data.data;
  }, () => {
    const base = DemoService.getSimulatorBaseline().baseline;
    const addedMinutes = scenario.estimatedMinutes || 0;
    const scen = { ...base, totalMinutes: base.totalMinutes + addedMinutes };
    return {
      baseline: base,
      scenario: scen,
      impact: {
        workloadMinutesDelta: addedMinutes,
        utilizationDelta: Math.round((addedMinutes / base.targetMinutes) * 100) || 0,
        overloadDaysDelta: addedMinutes > 120 ? 1 : 0
      }
    };
  });
};
