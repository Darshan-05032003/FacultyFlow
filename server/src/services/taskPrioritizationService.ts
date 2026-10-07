import { prisma } from '../utils/prisma';
import { AppError } from '../errors/AppError';
import { ActivityStatus, Activity } from '@prisma/client';
import { calculatePriorityScore, PriorityLevel } from '../utils/priorityUtils';
import { WorkloadForecastService } from './workloadForecastService';

export class TaskPrioritizationService {
  static async getPriorities(userId: string, query: any) {
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId }
    });

    if (!facultyProfile) {
      throw new AppError('Faculty profile not found', 404);
    }

    const today = new Date();
    
    // Default to a 30-day view for prioritization
    const horizon = query.horizon ? parseInt(query.horizon, 10) : 30;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + horizon);
    
    // Fetch active activities
    const activities = await prisma.activity.findMany({
      where: {
        facultyProfileId: facultyProfile.id,
        isArchived: false,
        status: {
          notIn: [ActivityStatus.COMPLETED, ActivityStatus.CANCELLED]
        },
        OR: [
          { deadline: { lte: endDate } },
          { date: { lte: endDate } }
        ]
      },
      orderBy: { deadline: 'asc' }
    });

    // Fetch forecast data once for up to the horizon to determine forecast pressure
    const forecast = await WorkloadForecastService.getForecast(userId, { horizon });
    const dailyForecastMap = new Map<string, any>();
    forecast.dailyForecast.forEach((df: any) => {
      dailyForecastMap.set(df.date, df);
    });

    // Calculate priority for each active activity
    const prioritizedTasks = activities.map(activity => {
      // Find the forecast for the day the activity is scheduled
      let forecastStatusForDate: 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOADED' = 'NORMAL';
      if (activity.date) {
        const dateStr = activity.date.toISOString().split('T')[0];
        const df = dailyForecastMap.get(dateStr);
        if (df) {
          forecastStatusForDate = df.workloadStatus;
        }
      }

      const priorityRes = calculatePriorityScore(activity, forecastStatusForDate, today);

      return {
        id: activity.id,
        title: activity.title,
        category: activity.category,
        status: activity.status,
        scheduledDate: activity.date.toISOString().split('T')[0],
        deadline: activity.deadline ? activity.deadline.toISOString().split('T')[0] : null,
        estimatedMinutes: activity.estimatedMinutes || activity.actualMinutes || 0,
        priorityScore: priorityRes.score,
        priorityLevel: priorityRes.level,
        isOverdue: priorityRes.isOverdue,
        daysUntilDeadline: priorityRes.daysUntilDeadline,
        reasons: priorityRes.reasons,
        workloadPressure: forecastStatusForDate,
      };
    });

    // Sort: 1. Score DESC, 2. Deadline Proximity ASC, 3. Date ASC
    prioritizedTasks.sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      if (a.daysUntilDeadline !== null && b.daysUntilDeadline !== null) {
        if (a.daysUntilDeadline !== b.daysUntilDeadline) {
          return a.daysUntilDeadline - b.daysUntilDeadline;
        }
      }
      if (a.daysUntilDeadline === null && b.daysUntilDeadline !== null) return 1;
      if (a.daysUntilDeadline !== null && b.daysUntilDeadline === null) return -1;
      
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });

    // Generate Counts
    const summary = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      OVERDUE: 0,
      DUE_SOON: 0,
    };

    prioritizedTasks.forEach(pt => {
      summary[pt.priorityLevel]++;
      if (pt.isOverdue) summary.OVERDUE++;
      if (pt.daysUntilDeadline !== null && pt.daysUntilDeadline >= 0 && pt.daysUntilDeadline <= 7) {
        summary.DUE_SOON++;
      }
    });

    // Generate Insights
    const insights: string[] = [];
    if (summary.CRITICAL > 0) {
      insights.push(`You have ${summary.CRITICAL} CRITICAL task${summary.CRITICAL > 1 ? 's' : ''} requiring immediate attention.`);
    }
    if (summary.OVERDUE > 0) {
      insights.push(`${summary.OVERDUE} task${summary.OVERDUE > 1 ? 's are' : ' is'} currently overdue.`);
    }
    if (summary.DUE_SOON > 0) {
      insights.push(`${summary.DUE_SOON} task${summary.DUE_SOON > 1 ? 's are' : ' is'} due within the next 7 days.`);
    }
    
    // Conflict Detection
    const dateGroups: Record<string, { count: number, totalMinutes: number, tasks: any[] }> = {};
    prioritizedTasks.forEach(pt => {
      if (pt.priorityLevel === 'CRITICAL' || pt.priorityLevel === 'HIGH') {
        const key = pt.deadline || pt.scheduledDate;
        if (!dateGroups[key]) dateGroups[key] = { count: 0, totalMinutes: 0, tasks: [] };
        dateGroups[key].count++;
        dateGroups[key].totalMinutes += pt.estimatedMinutes;
        dateGroups[key].tasks.push(pt);
      }
    });

    const conflicts = [];
    for (const [date, group] of Object.entries(dateGroups)) {
      if (group.count >= 2 && group.totalMinutes >= 240) { // More than 2 high priority and > 4 hours
        conflicts.push({
          date,
          taskCount: group.count,
          estimatedMinutes: group.totalMinutes,
          targetMinutes: 480, // Default 8 hour day assumption for conflict check
          utilizationPercent: Math.round((group.totalMinutes / 480) * 100),
          status: 'CONFLICT'
        });
      }
    }

    if (conflicts.length > 0) {
      insights.push(`Detected ${conflicts.length} upcoming workload conflict${conflicts.length > 1 ? 's' : ''} with multiple high-priority tasks.`);
    }

    // Apply filtering if provided
    let results = prioritizedTasks;
    if (query.category) results = results.filter(r => r.category === query.category);
    if (query.priorityLevel) results = results.filter(r => r.priorityLevel === query.priorityLevel);
    if (query.isOverdue === 'true') results = results.filter(r => r.isOverdue);
    if (query.dueSoon === 'true') results = results.filter(r => r.daysUntilDeadline !== null && r.daysUntilDeadline >= 0 && r.daysUntilDeadline <= 7);

    // Pagination/Limit
    const limit = query.limit ? parseInt(query.limit, 10) : undefined;
    if (limit) {
      results = results.slice(0, limit);
    }

    return {
      summary,
      insights,
      conflicts,
      tasks: results
    };
  }
}
