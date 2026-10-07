import demoData from './demoData.json';

const { activities, departmentFaculty } = demoData;

export function handleDemoFallback(url: string, params?: any) {
  if (params) { /* unused */ }
  if (url.includes('/activities/reports/generate')) {
    return { data: { success: true } }; // mock report generation
  }

  if (url.includes('/activities/recent') || url.match(/\/activities$/)) {
    return {
      success: true,
      data: {
        activities: [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        total: activities.length,
        page: 1,
        pages: 1
      }
    };
  }

  if (url.includes('/workload/analytics')) {
    let est = 0;
    let act = 0;
    let cnt = 0;
    const catMap: any = {};
    const dailyMap: any = {};
    
    activities.forEach(a => {
      est += a.estimatedMinutes;
      act += a.actualMinutes || a.estimatedMinutes;
      cnt++;
      
      if(!catMap[a.category]) catMap[a.category] = { activityCount: 0, estimatedMinutes: 0, actualMinutes: 0 };
      catMap[a.category].activityCount++;
      catMap[a.category].estimatedMinutes += a.estimatedMinutes;
      catMap[a.category].actualMinutes += (a.actualMinutes || a.estimatedMinutes);

      const d = a.date.split('T')[0];
      if(!dailyMap[d]) dailyMap[d] = { estimatedMinutes: 0, actualMinutes: 0 };
      dailyMap[d].estimatedMinutes += a.estimatedMinutes;
      dailyMap[d].actualMinutes += (a.actualMinutes || a.estimatedMinutes);
    });

    return {
      success: true,
      data: {
        overview: { activityCount: cnt, estimatedMinutes: est, actualMinutes: act, estimatedHours: est/60, actualHours: act/60 },
        categoryDistribution: Object.entries(catMap).map(([k,v]: any) => ({ category: k, ...v, percentage: (v.actualMinutes / (act||1))*100 })),
        dailyWorkload: Object.entries(dailyMap).map(([k,v]: any) => ({ date: k, ...v })).slice(-30),
        weeklyWorkload: Object.entries(dailyMap).map(([k,v]: any) => ({ week: k, ...v })).slice(-4),
        heavyDays: [],
        topContributors: [],
        completion: { activityRate: 85, workloadRate: 90 },
        deadlines: { overdueCount: 1, dueTodayCount: 2, dueNext7DaysCount: 4 },
        statusDistribution: [],
        workloadStatus: { status: 'NORMAL', utilizationPercent: 85 }
      }
    };
  }

  if (url.includes('/forecast/predict')) {
    return {
      success: true,
      data: {
        forecasts: [
          { date: new Date().toISOString().split('T')[0], predictedMinutes: 240, confidenceLevel: 'HIGH', factors: ['Recent trend'] },
          { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], predictedMinutes: 180, confidenceLevel: 'MEDIUM', factors: [] },
          { date: new Date(Date.now() + 86400000*2).toISOString().split('T')[0], predictedMinutes: 300, confidenceLevel: 'MEDIUM', factors: [] }
        ],
        summary: {
          averageDailyMinutes: 240,
          totalPredictedMinutes: 720,
          trendDirection: 'STABLE',
          riskLevel: 'MODERATE'
        },
        categoryBreakdown: [
          { category: 'TEACHING', predictedMinutes: 360, percentage: 50 },
          { category: 'RESEARCH', predictedMinutes: 180, percentage: 25 },
          { category: 'EVALUATION', predictedMinutes: 180, percentage: 25 }
        ],
        recommendations: [
          'Balance your teaching load next week.',
          'You have a lot of evaluation coming up.'
        ]
      }
    };
  }

  if (url.includes('/priorities/recommend')) {
    return {
      success: true,
      data: {
        tasks: activities.slice(0, 10).map((a, i) => ({
          id: a.id,
          activityId: a.id,
          title: a.title,
          category: a.category,
          deadline: a.deadline,
          estimatedMinutes: a.estimatedMinutes,
          priorityScore: i < 2 ? 80 : (i < 5 ? 50 : 20),
          priorityLevel: i < 2 ? 'HIGH' : (i < 5 ? 'MEDIUM' : 'LOW'),
          reasoning: 'Upcoming deadline and high effort required.'
        }))
      }
    };
  }

  if (url.includes('/department/analytics')) {
    return {
      success: true,
      data: {
        department: { id: 'd1', name: 'Computer Engineering' },
        overview: { facultyCount: 10, activeFacultyCount: 10, activityCount: 430, estimatedMinutes: 25000, actualMinutes: 25050, actualHours: 417, variancePercent: 0.2 },
        facultyBreakdown: departmentFaculty,
        overloadedFaculty: departmentFaculty.filter(f => f.workloadStatus === 'OVERLOADED' || f.workloadStatus === 'HIGH'),
        distributionStats: { averageActualMinutes: 2500, minActualMinutes: 1900, maxActualMinutes: 3500 },
        categoryDistribution: [
           { category: 'TEACHING', actualMinutes: 10000, percentage: 40 },
           { category: 'RESEARCH', actualMinutes: 5000, percentage: 20 },
           { category: 'EVALUATION', actualMinutes: 4000, percentage: 16 }
        ],
        dailyWorkload: [],
        weeklyWorkload: [],
        heavyDays: [],
        departmentWorkloadStatus: { status: 'NORMAL', utilizationPercent: 85 },
        deadlinePressure: { overdueCount: 11, dueTodayCount: 5, dueNext7DaysCount: 15 },
        topContributors: departmentFaculty.slice(0, 5)
      }
    };
  }

  if (url.includes('/simulator/evaluate')) {
    return {
      success: true,
      data: {
        baseline: { totalMinutes: 2400, utilizationPercent: 85, status: 'NORMAL' },
        simulated: { totalMinutes: 2520, utilizationPercent: 90, status: 'NORMAL' },
        difference: { totalMinutes: 120, utilizationPercent: 5 },
        riskAssessment: {
          level: 'MODERATE',
          warnings: ['This brings you close to the upper limit of optimal workload.'],
          recommendations: ['Consider delegating lower priority tasks.']
        }
      }
    };
  }

  return null;
}
