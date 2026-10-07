import { prisma } from '../utils/prisma';
import { AppError } from '../errors/AppError';
import { ActivityStatus } from '@prisma/client';
import { 
  DEFAULT_WEEKLY_TARGET_MINUTES, 
  getWorkloadStatus, 
  calculateUtilization,
  getWeekKey
} from '../utils/workloadUtils';

export class WorkloadForecastService {
  static async getForecast(userId: string, query: any) {
    const facultyProfile = await prisma.facultyProfile.findUnique({
      where: { userId }
    });

    if (!facultyProfile) {
      throw new AppError('Faculty profile not found', 404);
    }

    // 1. Determine Forecast Horizon
    const horizonDays = query.horizon ? parseInt(query.horizon, 10) : 14;
    const validHorizons = [7, 14, 30];
    if (!validHorizons.includes(horizonDays)) {
      throw new AppError('Invalid horizon. Supported horizons: 7, 14, 30', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const forecastStart = new Date(today);
    const forecastEnd = new Date(today);
    forecastEnd.setDate(forecastEnd.getDate() + horizonDays - 1);
    forecastEnd.setHours(23, 59, 59, 999);

    // 2. Fetch Historical Data (Last 4 Weeks = 28 days)
    const historicalWeeksToLookBack = 4;
    const historicalDays = historicalWeeksToLookBack * 7;
    const historicalStart = new Date(today);
    historicalStart.setDate(historicalStart.getDate() - historicalDays);

    const historicalActivities = await prisma.activity.findMany({
      where: {
        facultyProfileId: facultyProfile.id,
        isArchived: false,
        status: ActivityStatus.COMPLETED,
        date: {
          gte: historicalStart,
          lt: today
        }
      }
    });

    // Determine data availability for confidence
    // Find the earliest activity date in the historical window
    let earliestHistoricalDate = today;
    historicalActivities.forEach(a => {
      if (a.date < earliestHistoricalDate) earliestHistoricalDate = a.date;
    });
    const msHistorical = today.getTime() - earliestHistoricalDate.getTime();
    const actualHistoricalWeeks = Math.max(0, Math.round(msHistorical / (7 * 86400000)));

    let confidenceLevel = 'LOW';
    if (actualHistoricalWeeks >= 4) {
      confidenceLevel = 'HIGH';
    } else if (actualHistoricalWeeks >= 2) {
      confidenceLevel = 'MEDIUM';
    }

    let confidenceExplanation = `High confidence based on ${actualHistoricalWeeks} weeks of historical workload.`;
    if (confidenceLevel === 'LOW') {
      confidenceExplanation = `Historical data is limited (${actualHistoricalWeeks} weeks available), so forecast confidence is low.`;
    } else if (confidenceLevel === 'MEDIUM') {
      confidenceExplanation = `Forecast confidence is medium because only ${actualHistoricalWeeks} historical weeks are available.`;
    }

    // Calculate Historical Baseline Per Category (Daily Average)
    const categoryHistoricalMinutes: Record<string, number> = {};
    historicalActivities.forEach(a => {
      const cat = a.category;
      if (!categoryHistoricalMinutes[cat]) categoryHistoricalMinutes[cat] = 0;
      categoryHistoricalMinutes[cat] += (a.actualMinutes || a.estimatedMinutes || 0);
    });

    const categoryDailyBaseline: Record<string, number> = {};
    for (const [cat, totalMinutes] of Object.entries(categoryHistoricalMinutes)) {
      // average daily minutes over the historical period observed (up to 28 days)
      const denominator = Math.max(1, actualHistoricalWeeks * 7);
      categoryDailyBaseline[cat] = totalMinutes / denominator;
    }

    // 3. Fetch Scheduled Future Data
    const futureActivities = await prisma.activity.findMany({
      where: {
        facultyProfileId: facultyProfile.id,
        isArchived: false,
        status: { not: ActivityStatus.CANCELLED },
        date: {
          gte: forecastStart,
          lte: forecastEnd
        }
      },
      orderBy: { date: 'asc' }
    });

    // 4. Compute Daily Forecast
    const dailyForecast: any[] = [];
    const weeklyForecastMap: Record<string, any> = {};
    const categoryForecastMap: Record<string, any> = {};

    let totalScheduledMinutes = 0;
    let totalBaselineMinutes = 0;
    let totalProjectedMinutes = 0;

    for (let i = 0; i < horizonDays; i++) {
      const currentDate = new Date(forecastStart);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const weekKey = getWeekKey(currentDate);

      // Scheduled for this day
      const dayActivities = futureActivities.filter(a => a.date.toISOString().split('T')[0] === dateStr);
      let dayScheduledMinutes = 0;
      const dayCategoryScheduled: Record<string, number> = {};

      dayActivities.forEach(a => {
        const cat = a.category;
        const mins = a.estimatedMinutes || a.actualMinutes || 0;
        dayScheduledMinutes += mins;
        if (!dayCategoryScheduled[cat]) dayCategoryScheduled[cat] = 0;
        dayCategoryScheduled[cat] += mins;
      });

      // Baseline for this day
      let dayBaselineMinutes = 0;
      for (const cat of Object.keys(categoryDailyBaseline)) {
        dayBaselineMinutes += categoryDailyBaseline[cat];
      }

      // Projected for this day (to avoid double counting, we take the max of scheduled vs baseline per category)
      let dayProjectedMinutes = 0;
      const allCategories = Array.from(new Set([...Object.keys(categoryDailyBaseline), ...Object.keys(dayCategoryScheduled)]));
      
      allCategories.forEach(cat => {
        const sched = dayCategoryScheduled[cat] || 0;
        const base = categoryDailyBaseline[cat] || 0;
        const proj = Math.max(sched, base);
        
        dayProjectedMinutes += proj;

        // Aggregate to category forecast
        if (!categoryForecastMap[cat]) {
          categoryForecastMap[cat] = { scheduled: 0, baseline: 0, projected: 0 };
        }
        categoryForecastMap[cat].scheduled += sched;
        categoryForecastMap[cat].baseline += base;
        categoryForecastMap[cat].projected += proj;
      });

      const dailyTarget = DEFAULT_WEEKLY_TARGET_MINUTES / 5; // approx 8 hours
      const dailyUtilization = calculateUtilization(dayProjectedMinutes, dailyTarget);

      dailyForecast.push({
        date: dateStr,
        scheduledMinutes: Math.round(dayScheduledMinutes),
        baselineMinutes: Math.round(dayBaselineMinutes),
        projectedMinutes: Math.round(dayProjectedMinutes),
        projectedHours: Math.round(dayProjectedMinutes / 6) / 10, // div by 60, round 1 dec
        workloadStatus: getWorkloadStatus(dailyUtilization)
      });

      totalScheduledMinutes += dayScheduledMinutes;
      totalBaselineMinutes += dayBaselineMinutes;
      totalProjectedMinutes += dayProjectedMinutes;

      // Aggregate Weekly
      if (!weeklyForecastMap[weekKey]) {
        weeklyForecastMap[weekKey] = {
          week: weekKey,
          scheduledMinutes: 0,
          baselineMinutes: 0,
          projectedMinutes: 0
        };
      }
      weeklyForecastMap[weekKey].scheduledMinutes += dayScheduledMinutes;
      weeklyForecastMap[weekKey].baselineMinutes += dayBaselineMinutes;
      weeklyForecastMap[weekKey].projectedMinutes += dayProjectedMinutes;
    }

    // Format Weekly Forecast
    const weeklyForecast = Object.values(weeklyForecastMap).map((w: any) => {
      const util = calculateUtilization(w.projectedMinutes, DEFAULT_WEEKLY_TARGET_MINUTES);
      return {
        week: w.week,
        scheduledMinutes: Math.round(w.scheduledMinutes),
        baselineMinutes: Math.round(w.baselineMinutes),
        projectedMinutes: Math.round(w.projectedMinutes),
        projectedHours: Math.round(w.projectedMinutes / 6) / 10,
        workloadStatus: getWorkloadStatus(util)
      };
    }).sort((a, b) => a.week.localeCompare(b.week));

    // Format Category Forecast
    const categoryForecast = Object.entries(categoryForecastMap).map(([category, stats]: [string, any]) => {
      const percentage = totalProjectedMinutes > 0 ? (stats.projected / totalProjectedMinutes) * 100 : 0;
      return {
        category,
        scheduledMinutes: Math.round(stats.scheduled),
        baselineMinutes: Math.round(stats.baseline),
        projectedMinutes: Math.round(stats.projected),
        projectedHours: Math.round(stats.projected / 6) / 10,
        percentage: Math.round(percentage)
      };
    }).sort((a, b) => b.projectedMinutes - a.projectedMinutes);

    // 5. Calculate Overload Periods
    const upcomingOverloadPeriods = dailyForecast
      .filter(d => d.workloadStatus === 'HIGH' || d.workloadStatus === 'OVERLOADED')
      .map(d => {
        // Find main contributors for this day
        const dayActivities = futureActivities.filter(a => a.date.toISOString().split('T')[0] === d.date);
        const categories = Array.from(new Set(dayActivities.map(a => a.category)));
        return {
          period: d.date,
          projectedMinutes: d.projectedMinutes,
          projectedHours: d.projectedHours,
          targetMinutes: DEFAULT_WEEKLY_TARGET_MINUTES / 5,
          utilization: Math.round(calculateUtilization(d.projectedMinutes, DEFAULT_WEEKLY_TARGET_MINUTES / 5)),
          status: d.workloadStatus,
          primaryCategories: categories.slice(0, 2)
        };
      });

    // 6. Generate Deterministic Insights
    const insights: string[] = [];
    
    // Confidence insight
    insights.push(confidenceExplanation);
    
    // Scheduled vs Baseline
    const scheduledRatio = totalProjectedMinutes > 0 ? (totalScheduledMinutes / totalProjectedMinutes) * 100 : 0;
    insights.push(`Scheduled activities account for ${Math.round(scheduledRatio)}% of projected workload.`);
    
    // Top category
    if (categoryForecast.length > 0) {
      insights.push(`'${categoryForecast[0].category}' is expected to account for the largest share (${categoryForecast[0].percentage}%) of projected workload.`);
    }

    // Overload insight
    if (upcomingOverloadPeriods.length > 0) {
      const highDays = upcomingOverloadPeriods.length;
      insights.push(`The upcoming period contains ${highDays} projected high-workload ${highDays === 1 ? 'day' : 'days'}.`);
    } else {
      insights.push('No days are projected to exceed your normal workload capacity.');
    }

    // Historical comparison
    if (actualHistoricalWeeks > 0) {
      const historicalWeeklyAvg = totalBaselineMinutes / (horizonDays / 7);
      const projectedWeeklyAvg = totalProjectedMinutes / (horizonDays / 7);
      const diff = projectedWeeklyAvg - historicalWeeklyAvg;
      const diffPercent = historicalWeeklyAvg > 0 ? Math.abs(diff / historicalWeeklyAvg) * 100 : 0;
      
      if (diff > 0) {
        insights.push(`Projected workload is ${Math.round(diffPercent)}% above your historical weekly baseline.`);
      } else if (diff < 0) {
        insights.push(`Projected workload is ${Math.round(diffPercent)}% below your historical weekly baseline.`);
      } else {
        insights.push(`Projected workload aligns perfectly with your historical weekly baseline.`);
      }
    }

    const forecastTargetMinutes = (DEFAULT_WEEKLY_TARGET_MINUTES / 7) * horizonDays;
    const projectedUtilization = calculateUtilization(totalProjectedMinutes, forecastTargetMinutes);

    return {
      forecastRange: {
        startDate: forecastStart.toISOString().split('T')[0],
        endDate: forecastEnd.toISOString().split('T')[0],
        horizonDays
      },
      confidence: {
        level: confidenceLevel,
        historicalWeeks: actualHistoricalWeeks,
        explanation: confidenceExplanation
      },
      summary: {
        scheduledMinutes: Math.round(totalScheduledMinutes),
        baselineMinutes: Math.round(totalBaselineMinutes),
        projectedMinutes: Math.round(totalProjectedMinutes),
        projectedHours: Math.round(totalProjectedMinutes / 6) / 10,
        projectedUtilization: Math.round(projectedUtilization),
        workloadStatus: getWorkloadStatus(projectedUtilization)
      },
      dailyForecast,
      weeklyForecast,
      categoryForecast,
      upcomingOverloadPeriods,
      insights
    };
  }
}
