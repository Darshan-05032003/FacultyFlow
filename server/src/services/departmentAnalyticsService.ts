import { prisma } from '../utils/prisma';
import { AppError } from '../errors/AppError';
import { ActivityStatus } from '@prisma/client';
import { 
  DEFAULT_WEEKLY_TARGET_MINUTES, calculateCompletionRate, 
  getWeeksInRange, calculateUtilization, getWorkloadStatus, getWeekKey, 
  calculateVariance, calculateVariancePercent
} from '../utils/workloadUtils';

export class DepartmentAnalyticsService {
  static async getAnalytics(userId: string, query: any) {
    // 1. Verify user is HOD and find their department
    const userProfile = await prisma.facultyProfile.findUnique({
      where: { userId },
      include: { hodOf: true }
    });

    if (!userProfile || !userProfile.hodOf) {
      throw new AppError('Unauthorized: You are not a Head of Department', 403);
    }

    const department = userProfile.hodOf;

    // 2. Get all faculty in this department
    const faculties = await prisma.facultyProfile.findMany({
      where: { departmentId: department.id, user: { isActive: true } }
    });
    
    const facultyIds = faculties.map(f => f.id);
    const activeFacultyCount = faculties.length;

    // 3. Build query for activities
    const { startDate, endDate, category, status } = query;

    const where: any = {
      facultyProfileId: { in: facultyIds },
      isArchived: false,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (category) where.category = category;
    if (status) where.status = status;

    const activities = await prisma.activity.findMany({ 
      where,
      orderBy: { date: 'asc' } 
    });

    // ------------------------------------------
    // A. DEPARTMENT OVERVIEW
    // ------------------------------------------
    let estimatedMinutes = 0;
    let actualMinutes = 0;
    
    activities.forEach(a => {
      estimatedMinutes += a.estimatedMinutes || 0;
      actualMinutes += a.actualMinutes || 0;
    });

    const overview = {
      facultyCount: activeFacultyCount, // simplified for now
      activeFacultyCount,
      activityCount: activities.length,
      estimatedMinutes,
      actualMinutes,
      estimatedHours: estimatedMinutes / 60,
      actualHours: actualMinutes / 60,
      varianceMinutes: calculateVariance(actualMinutes, estimatedMinutes),
      variancePercent: calculateVariancePercent(actualMinutes, estimatedMinutes)
    };

    // ------------------------------------------
    // B. FACULTY WORKLOAD BREAKDOWN & OVERLOADED
    // ------------------------------------------
    const weeksInRange = getWeeksInRange(startDate, endDate);
    const targetMinutesPerFaculty = DEFAULT_WEEKLY_TARGET_MINUTES * weeksInRange;

    const facultyBreakdownMap: Record<string, any> = {};
    faculties.forEach(f => {
      facultyBreakdownMap[f.id] = {
        facultyId: f.id,
        name: `${f.firstName} ${f.lastName}`,
        employeeId: f.employeeId,
        activityCount: 0,
        estimatedMinutes: 0,
        actualMinutes: 0,
        completedCount: 0,
        totalValidCount: 0,
        overdueCount: 0,
        overdueEstimatedMinutes: 0
      };
    });

    const now = new Date();
    now.setHours(0,0,0,0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23,59,59,999);
    const next7DaysEnd = new Date(todayEnd);
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);

    // Global deadline tracking
    let globalOverdueCount = 0;
    let globalDueTodayCount = 0;
    let globalDueNext7DaysCount = 0;
    let globalOverdueEstimatedMinutes = 0;

    activities.forEach(a => {
      const f = facultyBreakdownMap[a.facultyProfileId];
      if (!f) return;

      f.activityCount++;
      f.estimatedMinutes += a.estimatedMinutes || 0;
      f.actualMinutes += a.actualMinutes || 0;

      if (a.status !== ActivityStatus.CANCELLED) {
        f.totalValidCount++;
        if (a.status === ActivityStatus.COMPLETED) {
          f.completedCount++;
        }
      }

      // Deadline logic
      if (a.deadline && a.status !== ActivityStatus.COMPLETED && a.status !== ActivityStatus.CANCELLED) {
        const deadline = new Date(a.deadline);
        if (deadline < now) {
          f.overdueCount++;
          f.overdueEstimatedMinutes += a.estimatedMinutes || 0;
          globalOverdueCount++;
          globalOverdueEstimatedMinutes += a.estimatedMinutes || 0;
        } else if (deadline >= now && deadline <= todayEnd) {
          globalDueTodayCount++;
        } else if (deadline > todayEnd && deadline <= next7DaysEnd) {
          globalDueNext7DaysCount++;
        }
      }
    });

    const facultyBreakdown = Object.values(facultyBreakdownMap).map(f => {
      const utilPercent = calculateUtilization(f.actualMinutes, targetMinutesPerFaculty);
      return {
        facultyId: f.facultyId,
        name: f.name,
        employeeId: f.employeeId,
        activityCount: f.activityCount,
        estimatedMinutes: f.estimatedMinutes,
        actualMinutes: f.actualMinutes,
        actualHours: f.actualMinutes / 60,
        varianceMinutes: calculateVariance(f.actualMinutes, f.estimatedMinutes),
        completionRate: calculateCompletionRate(f.completedCount, f.totalValidCount),
        overdueCount: f.overdueCount,
        utilizationPercent: utilPercent,
        workloadStatus: getWorkloadStatus(utilPercent)
      };
    }).sort((a, b) => b.actualMinutes - a.actualMinutes);

    // Overloaded Faculty
    const overloadedFaculty = facultyBreakdown
      .filter(f => f.workloadStatus === 'HIGH' || f.workloadStatus === 'OVERLOADED')
      .sort((a, b) => {
        if (a.workloadStatus === 'OVERLOADED' && b.workloadStatus !== 'OVERLOADED') return -1;
        if (b.workloadStatus === 'OVERLOADED' && a.workloadStatus !== 'OVERLOADED') return 1;
        return b.utilizationPercent - a.utilizationPercent;
      });

    // ------------------------------------------
    // C. WORKLOAD DISTRIBUTION (Stats)
    // ------------------------------------------
    let minActual = Infinity;
    let maxActual = -Infinity;
    let sumActual = 0;

    facultyBreakdown.forEach(f => {
      if (f.actualMinutes < minActual) minActual = f.actualMinutes;
      if (f.actualMinutes > maxActual) maxActual = f.actualMinutes;
      sumActual += f.actualMinutes;
    });

    if (minActual === Infinity) minActual = 0;
    if (maxActual === -Infinity) maxActual = 0;

    const distributionStats = {
      averageActualMinutes: activeFacultyCount > 0 ? sumActual / activeFacultyCount : 0,
      minActualMinutes: minActual,
      maxActualMinutes: maxActual,
      spreadMinutes: maxActual - minActual
    };

    // ------------------------------------------
    // D. CATEGORY DISTRIBUTION
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
        : 0;
        
      return {
        category,
        ...stats,
        estimatedHours: stats.estimatedMinutes / 60,
        actualHours: stats.actualMinutes / 60,
        percentage
      };
    });

    // ------------------------------------------
    // E. PLANNED VS ACTUAL TREND
    // ------------------------------------------
    const dailyMap: Record<string, { estimatedMinutes: number, actualMinutes: number, activityCount: number }> = {};
    const weeklyMap: Record<string, { estimatedMinutes: number, actualMinutes: number, activityCount: number, start: string, end: string }> = {};

    activities.forEach(a => {
      // Daily
      const dateStr = a.date.toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { estimatedMinutes: 0, actualMinutes: 0, activityCount: 0 };
      }
      dailyMap[dateStr].activityCount++;
      dailyMap[dateStr].estimatedMinutes += a.estimatedMinutes || 0;
      dailyMap[dateStr].actualMinutes += a.actualMinutes || 0;

      // Weekly
      const weekKey = getWeekKey(a.date);
      if (!weeklyMap[weekKey]) {
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

    const dailyWorkload = Object.entries(dailyMap).map(([date, stats]) => ({
      date,
      ...stats
    })).sort((a, b) => a.date.localeCompare(b.date));

    const weeklyWorkload = Object.entries(weeklyMap).map(([week, stats]) => ({
      week,
      ...stats
    })).sort((a, b) => a.week.localeCompare(b.week));

    // ------------------------------------------
    // F. HEAVIEST DAYS
    // ------------------------------------------
    const heavyDays = [...dailyWorkload]
      .sort((a, b) => (b.actualMinutes || b.estimatedMinutes) - (a.actualMinutes || a.estimatedMinutes))
      .slice(0, 5);

    // ------------------------------------------
    // G. DEPARTMENT WORKLOAD STATUS
    // ------------------------------------------
    const departmentTargetMinutes = targetMinutesPerFaculty * activeFacultyCount;
    const departmentUtilizationPercent = calculateUtilization(actualMinutes, departmentTargetMinutes);
    
    const departmentWorkloadStatus = {
      status: getWorkloadStatus(departmentUtilizationPercent),
      actualMinutes,
      targetMinutes: departmentTargetMinutes,
      utilizationPercent: departmentUtilizationPercent
    };

    // ------------------------------------------
    // H. DEADLINE PRESSURE
    // ------------------------------------------
    const deadlinePressure = {
      overdueCount: globalOverdueCount,
      dueTodayCount: globalDueTodayCount,
      dueNext7DaysCount: globalDueNext7DaysCount,
      overdueEstimatedMinutes: globalOverdueEstimatedMinutes
    };

    // ------------------------------------------
    // I. TOP WORKLOAD CONTRIBUTORS (Faculty view is primary)
    // ------------------------------------------
    const topContributors = facultyBreakdown.slice(0, 5).map(f => ({
      id: f.facultyId,
      name: f.name,
      value: f.actualMinutes > 0 ? f.actualMinutes : f.estimatedMinutes,
      actualHours: f.actualHours
    }));

    return {
      department: {
        id: department.id,
        name: department.name
      },
      overview,
      facultyBreakdown,
      overloadedFaculty,
      distributionStats,
      categoryDistribution,
      dailyWorkload,
      weeklyWorkload,
      heavyDays,
      departmentWorkloadStatus,
      deadlinePressure,
      topContributors
    };
  }
}
