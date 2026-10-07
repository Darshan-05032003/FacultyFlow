import { prisma } from '../utils/prisma';
import { AppError } from '../errors/AppError';
import { ActivityStatus, Activity } from '@prisma/client';

export type SimulationAction = 
  | { type: 'ADD_ACTIVITY'; title: string; date: string; estimatedMinutes: number; category: string }
  | { type: 'MOVE_ACTIVITY'; activityId: string; newDate: string }
  | { type: 'CHANGE_DURATION'; activityId: string; estimatedMinutes: number }
  | { type: 'REMOVE_ACTIVITY'; activityId: string };

export class WhatIfSimulatorService {
  static async simulate(userId: string, action: SimulationAction, horizon: number = 30) {
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId }
    });

    if (!facultyProfile) {
      throw new AppError('Faculty profile not found', 404);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + horizon);

    // Fetch baseline activities in horizon
    const activities = await prisma.activity.findMany({
      where: {
        facultyProfileId: facultyProfile.id,
        isArchived: false,
        date: {
          gte: today,
          lte: endDate
        }
      }
    });

    const baseline = this.calculateMetrics(activities, horizon);
    
    // Create Scenario Activities
    let scenarioActivities = [...activities.map(a => ({ ...a }))];

    if (action.type === 'ADD_ACTIVITY') {
      scenarioActivities.push({
        id: 'simulated_new_id',
        title: action.title,
        category: action.category as any,
        date: new Date(action.date),
        estimatedMinutes: action.estimatedMinutes,
        actualMinutes: null,
        status: ActivityStatus.PLANNED,
        facultyProfileId: facultyProfile.id,
        description: '',
        deadline: null,
        courseId: null,
        isRecurring: false,
        recurrenceType: null as any,
        recurrenceEndDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: false
      });
    } else if (action.type === 'MOVE_ACTIVITY') {
      const idx = scenarioActivities.findIndex(a => a.id === action.activityId);
      if (idx !== -1) {
        scenarioActivities[idx].date = new Date(action.newDate);
      }
    } else if (action.type === 'CHANGE_DURATION') {
      const idx = scenarioActivities.findIndex(a => a.id === action.activityId);
      if (idx !== -1) {
        scenarioActivities[idx].estimatedMinutes = action.estimatedMinutes;
      }
    } else if (action.type === 'REMOVE_ACTIVITY') {
      scenarioActivities = scenarioActivities.filter(a => a.id !== action.activityId);
    }

    const scenario = this.calculateMetrics(scenarioActivities, horizon);

    return {
      baseline,
      scenario,
      impact: {
        workloadMinutesDelta: scenario.workloadMinutes - baseline.workloadMinutes,
        utilizationDelta: scenario.utilizationPercent - baseline.utilizationPercent,
        overloadDaysDelta: scenario.overloadDays - baseline.overloadDays,
      }
    };
  }

  private static calculateMetrics(activities: Activity[], horizon: number) {
    let totalMinutes = 0;
    const dailyMap: Record<string, number> = {};

    activities.forEach(act => {
      // Ignore completed/cancelled
      if (act.status === ActivityStatus.COMPLETED || act.status === ActivityStatus.CANCELLED) return;
      
      const mins = act.estimatedMinutes || 0;
      totalMinutes += mins;

      const dateStr = act.date.toISOString().split('T')[0];
      if (!dailyMap[dateStr]) dailyMap[dateStr] = 0;
      dailyMap[dateStr] += mins;
    });

    const targetDailyMinutes = 480; // 8 hours
    const totalTargetMinutes = targetDailyMinutes * horizon;
    let overloadDays = 0;

    for (const mins of Object.values(dailyMap)) {
      if (mins > targetDailyMinutes) {
        overloadDays++;
      }
    }

    const utilizationPercent = totalTargetMinutes > 0 ? Math.round((totalMinutes / totalTargetMinutes) * 100) : 0;
    
    let workloadStatus = 'NORMAL';
    if (utilizationPercent > 110) workloadStatus = 'OVERLOADED';
    else if (utilizationPercent > 90) workloadStatus = 'HIGH';
    else if (utilizationPercent < 50) workloadStatus = 'LOW';

    return {
      workloadMinutes: totalMinutes,
      utilizationPercent,
      workloadStatus,
      overloadDays
    };
  }
}
