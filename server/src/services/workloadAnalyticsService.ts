import { prisma } from '../utils/prisma';
import { AppError } from '../errors/AppError';
import { ActivityStatus } from '@prisma/client';
import { 
  DEFAULT_WEEKLY_TARGET_MINUTES, calculateCompletionRate, 
  getWeeksInRange, calculateUtilization, getWorkloadStatus, getWeekKey 
} from '../utils/workloadUtils';

export class WorkloadAnalyticsService {
  static async getAnalytics(userId: string, query: any) {
    const faculty = await prisma.facultyProfile.findUnique({
      where: { userId },
    });

    if (!faculty) throw new AppError('Faculty profile not found', 404);

    const { startDate, endDate, category, status, courseId } = query;

    const where: any = {
      facultyProfileId: faculty.id,
      isArchived: false,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (category) where.category = category;
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;

    const activities = await prisma.activity.findMany({ 
      where,
      orderBy: { date: 'asc' } 
    });

    // ------------------------------------------
    // A & B: OVERVIEW (Total Workload, Planned vs Actual)
    // ------------------------------------------
    let estimatedMinutes = 0;
    let actualMinutes = 0;
    let activityCount = activities.length;

    activities.forEach(a => {
      estimatedMinutes += a.estimatedMinutes || 0;
      actualMinutes += a.actualMinutes || 0;
    });

    const varianceMinutes = actualMinutes - estimatedMinutes;
    const variancePercent = estimatedMinutes > 0 ? (varianceMinutes / estimatedMinutes) * 100 : 0;

    const overview = {
      activityCount,
      estimatedMinutes,
      actualMinutes,
      estimatedHours: estimatedMinutes / 60,
      actualHours: actualMinutes / 60,
      varianceMinutes,
      variancePercent
    };

    // ------------------------------------------
    // C: CATEGORY DISTRIBUTION
    // ------------------------------------------
    const categoryMap: Record<string, { activityCount: number, estimatedMinutes: number, actualMinutes: number }> = {};
    activities.forEach(a => {
      if (!categoryMap[a.category]) {
        categoryMap[a.category] = { activityCount: 0, estimatedMinutes: 0, actualMinutes: 0 };
      }
      categoryMap[a.category].activityCount++;
      categoryMap[a.category].estimatedMinutes += a.estimatedMinutes || 0;
      categoryMap[a.category].actualMinutes += a.actualMinutes || 0;
    });

    const categoryDistribution = Object.entries(categoryMap).map(([category, stats]) => {
      const percentage = actualMinutes > 0 
        ? (stats.actualMinutes / actualMinutes) * 100 
        : (estimatedMinutes > 0 ? (stats.estimatedMinutes / estimatedMinutes) * 100 : 0);
        
      return {
        category,
        ...stats,
        estimatedHours: stats.estimatedMinutes / 60,
        actualHours: stats.actualMinutes / 60,
        percentage
      };
    });

    // ------------------------------------------
    // D: STATUS DISTRIBUTION
    // ------------------------------------------
    const statusMap: Record<string, { count: number, actualMinutes: number, estimatedMinutes: number }> = {};
    activities.forEach(a => {
      if (!statusMap[a.status]) {
        statusMap[a.status] = { count: 0, actualMinutes: 0, estimatedMinutes: 0 };
      }
      statusMap[a.status].count++;
      statusMap[a.status].actualMinutes += a.actualMinutes || 0;
      statusMap[a.status].estimatedMinutes += a.estimatedMinutes || 0;
    });
    
    const statusDistribution = Object.entries(statusMap).map(([status, stats]) => ({
      status,
      ...stats
    }));

    // ------------------------------------------
    // E: DAILY WORKLOAD
    // ------------------------------------------
    const dailyMap: Record<string, { estimatedMinutes: number, actualMinutes: number, activityCount: number }> = {};
    activities.forEach(a => {
      const dateStr = a.date.toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { estimatedMinutes: 0, actualMinutes: 0, activityCount: 0 };
      }
      dailyMap[dateStr].activityCount++;
      dailyMap[dateStr].estimatedMinutes += a.estimatedMinutes || 0;
      dailyMap[dateStr].actualMinutes += a.actualMinutes || 0;
    });

    const dailyWorkload = Object.entries(dailyMap).map(([date, stats]) => ({
      date,
      ...stats
    })).sort((a, b) => a.date.localeCompare(b.date));

    // ------------------------------------------
    // F: WEEKLY WORKLOAD
    // ------------------------------------------
    const weeklyMap: Record<string, { estimatedMinutes: number, actualMinutes: number, activityCount: number, start: string, end: string }> = {};

    activities.forEach(a => {
      const weekKey = getWeekKey(a.date);
      if (!weeklyMap[weekKey]) {
        // Find Monday and Sunday of this week for start/end
        const d = new Date(a.date);
        const day = d.getDay() || 7; 
        const monday = new Date(d);
        monday.setDate(d.getDate() - day + 1);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        weeklyMap[weekKey] = { 
          estimatedMinutes: 0, 
          actualMinutes: 0, 
          activityCount: 0,
          start: monday.toISOString().split('T')[0],
          end: sunday.toISOString().split('T')[0]
        };
      }
      weeklyMap[weekKey].activityCount++;
      weeklyMap[weekKey].estimatedMinutes += a.estimatedMinutes || 0;
      weeklyMap[weekKey].actualMinutes += a.actualMinutes || 0;
    });

    const weeklyWorkload = Object.entries(weeklyMap).map(([week, stats]) => ({
      week,
      ...stats
    })).sort((a, b) => a.week.localeCompare(b.week));

    // ------------------------------------------
    // G: HEAVIEST DAYS
    // ------------------------------------------
    const heavyDays = [...dailyWorkload]
      .sort((a, b) => {
        const aVal = a.actualMinutes || a.estimatedMinutes;
        const bVal = b.actualMinutes || b.estimatedMinutes;
        return bVal - aVal;
      })
      .slice(0, 5);

    // ------------------------------------------
    // H: TOP WORKLOAD CONTRIBUTORS
    // ------------------------------------------
    const topContributors = [...activities]
      .map(a => ({
        id: a.id,
        title: a.title,
        date: a.date.toISOString().split('T')[0],
        category: a.category,
        actualMinutes: a.actualMinutes || 0,
        estimatedMinutes: a.estimatedMinutes || 0,
        value: (a.actualMinutes || 0) > 0 ? a.actualMinutes : a.estimatedMinutes
      }))
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 10);

    // ------------------------------------------
    // I: COMPLETION RATE
    // ------------------------------------------
    const nonCancelled = activities.filter(a => a.status !== ActivityStatus.CANCELLED);
    const completed = nonCancelled.filter(a => a.status === ActivityStatus.COMPLETED);
    const activityRate = calculateCompletionRate(completed.length, nonCancelled.length);
    
    let completedMinutes = 0;
    let totalValidMinutes = 0;
    nonCancelled.forEach(a => {
      totalValidMinutes += (a.estimatedMinutes || 0);
      if (a.status === ActivityStatus.COMPLETED) {
        completedMinutes += (a.actualMinutes || a.estimatedMinutes || 0);
      }
    });
    const workloadRate = calculateCompletionRate(completedMinutes, totalValidMinutes);

    const completion = {
      activityRate,
      workloadRate
    };

    // ------------------------------------------
    // J: DEADLINE PRESSURE
    // ------------------------------------------
    let overdueCount = 0;
    let dueTodayCount = 0;
    let dueNext7DaysCount = 0;
    let overdueEstimatedMinutes = 0;

    const now = new Date();
    now.setHours(0,0,0,0); // start of today

    const todayEnd = new Date(now);
    todayEnd.setHours(23,59,59,999);

    const next7DaysEnd = new Date(todayEnd);
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);

    activities.forEach(a => {
      if (!a.deadline) return;
      if (a.status === ActivityStatus.COMPLETED || a.status === ActivityStatus.CANCELLED) return;

      const deadline = new Date(a.deadline);
      
      if (deadline < now) {
        overdueCount++;
        overdueEstimatedMinutes += a.estimatedMinutes || 0;
      } else if (deadline >= now && deadline <= todayEnd) {
        dueTodayCount++;
      } else if (deadline > todayEnd && deadline <= next7DaysEnd) {
        dueNext7DaysCount++;
      }
    });

    const deadlines = {
      overdueCount,
      dueTodayCount,
      dueNext7DaysCount,
      overdueEstimatedMinutes
    };

    // ------------------------------------------
    // WORKLOAD STATUS
    // ------------------------------------------
    const weeksInRange = getWeeksInRange(startDate, endDate);
    const targetMinutes = DEFAULT_WEEKLY_TARGET_MINUTES * weeksInRange;
    const utilizationPercent = calculateUtilization(actualMinutes, targetMinutes);
    const wStatus = getWorkloadStatus(utilizationPercent);

    const workloadStatus = {
      status: wStatus,
      actualMinutes,
      targetMinutes,
      utilizationPercent
    };

    return {
      overview,
      categoryDistribution,
      statusDistribution,
      dailyWorkload,
      weeklyWorkload,
      completion,
      deadlines,
      heavyDays,
      topContributors,
      workloadStatus
    };
  }
}
