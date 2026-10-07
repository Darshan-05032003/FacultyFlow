import demoData from './demoData.json';

const { activities, departmentFaculty } = demoData;

export function handleDemoFallback(url: string, _params?: any) {
  if (url.includes('/activities/reports/generate')) {
    return { success: true, data: { success: true } };
  }

  // Workload Priorities (handles both /workload/priorities and /priorities)
  if (url.includes('/workload/priorities') || url.includes('/priorities')) {
    const priorityTasks = activities.slice(0, 15).map((a, i) => {
      let level = 'LOW';
      let score = 20;
      let isOverdue = false;
      let daysUntilDeadline = 14;

      if (i === 0) {
        level = 'CRITICAL';
        score = 85;
        isOverdue = true;
        daysUntilDeadline = -1;
      } else if (i <= 2) {
        level = 'HIGH';
        score = 70;
        daysUntilDeadline = 1;
      } else if (i <= 7) {
        level = 'MEDIUM';
        score = 45;
        daysUntilDeadline = 4;
      }

      return {
        id: a.id,
        activityId: a.id,
        title: a.title,
        category: a.category,
        status: isOverdue ? 'IN_PROGRESS' : (i % 2 === 0 ? 'PLANNED' : 'IN_PROGRESS'),
        scheduledDate: a.date ? a.date.split('T')[0] : '2026-10-08',
        deadline: isOverdue ? '2026-10-07' : '2026-10-15',
        estimatedMinutes: a.estimatedMinutes || 90,
        actualMinutes: a.actualMinutes || null,
        priorityScore: score,
        priorityLevel: level,
        isOverdue,
        daysUntilDeadline,
        reasons: isOverdue ? ['Overdue by 1 day(s)', 'Significant effort required'] : ['Approaching milestone', 'Required for syllabus delivery'],
        workloadPressure: i <= 2 ? 'HIGH' : 'NORMAL'
      };
    });

    return {
      success: true,
      data: {
        summary: {
          CRITICAL: 1,
          HIGH: 2,
          MEDIUM: 5,
          LOW: 7,
          OVERDUE: 1,
          DUE_SOON: 7
        },
        insights: [
          '1 critical task requires immediate attention due to an overdue deadline.',
          '2 high-priority items require focus within the next 24-48 hours.',
          'Workload remains balanced across academic and administrative obligations.'
        ],
        conflicts: [],
        tasks: priorityTasks
      }
    };
  }

  // Workload Forecast
  if (url.includes('/workload/forecast') || url.includes('/forecast')) {
    const today = new Date();
    const dailyForecast = Array.from({ length: 30 }, (_, idx) => {
      const d = new Date(today);
      d.setDate(d.getDate() + idx);
      const dayStr = d.toISOString().split('T')[0];
      const sched = idx % 2 === 0 ? 120 : 60;
      const base = 90;
      return {
        date: dayStr,
        scheduledMinutes: sched,
        baselineMinutes: base,
        projectedMinutes: sched + base,
        projectedHours: Math.round(((sched + base) / 60) * 10) / 10,
        workloadStatus: idx === 3 ? 'HIGH' : 'NORMAL'
      };
    });

    return {
      success: true,
      data: {
        forecastRange: {
          startDate: today.toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 29 * 86400000).toISOString().split('T')[0],
          horizonDays: 30
        },
        confidence: {
          level: 'HIGH',
          historicalWeeks: 4,
          explanation: 'High confidence based on past 4 weeks of consistent activity tracking.'
        },
        summary: {
          scheduledMinutes: 2100,
          baselineMinutes: 2700,
          projectedMinutes: 4800,
          projectedHours: 80.0,
          projectedUtilization: 68,
          workloadStatus: 'NORMAL'
        },
        dailyForecast,
        categoryForecast: [
          { category: 'TEACHING', projectedMinutes: 1800, scheduledMinutes: 1200 },
          { category: 'PREPARATION', projectedMinutes: 1000, scheduledMinutes: 700 },
          { category: 'EVALUATION', projectedMinutes: 900, scheduledMinutes: 600 },
          { category: 'RESEARCH', projectedMinutes: 700, scheduledMinutes: 400 },
          { category: 'LABORATORY', projectedMinutes: 400, scheduledMinutes: 300 }
        ],
        upcomingOverloadPeriods: [],
        insights: [
          'Workload is anticipated to peak slightly around Week 2 during mid-term reviews.',
          'Teaching load remains within the recommended 16 hours/week guideline.',
          'Sufficient buffer available for research and departmental collaboration.'
        ]
      }
    };
  }

  // Activities Summary
  if (url.includes('/activities/summary')) {
    return {
      success: true,
      data: {
        totalEstimatedMinutes: 4200,
        totalActualMinutes: 3850,
        activityCount: activities.length,
        categories: {
          TEACHING: 1800,
          PREPARATION: 900,
          EVALUATION: 600,
          RESEARCH: 500,
          MEETING: 250,
          ADMINISTRATION: 150
        }
      }
    };
  }

  // Activities list
  if (url.includes('/activities')) {
    return {
      success: true,
      data: [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }

  // Workload Analytics
  if (url.includes('/workload/analytics') || url.includes('/analytics')) {
    let est = 0;
    let act = 0;
    let cnt = 0;
    const catMap: any = {};
    const dailyMap: any = {};
    
    activities.forEach(a => {
      est += a.estimatedMinutes;
      act += a.actualMinutes || a.estimatedMinutes;
      cnt++;
      
      if (!catMap[a.category]) catMap[a.category] = { activityCount: 0, estimatedMinutes: 0, actualMinutes: 0 };
      catMap[a.category].activityCount++;
      catMap[a.category].estimatedMinutes += a.estimatedMinutes;
      catMap[a.category].actualMinutes += (a.actualMinutes || a.estimatedMinutes);

      const d = a.date.split('T')[0];
      if (!dailyMap[d]) dailyMap[d] = { estimatedMinutes: 0, actualMinutes: 0 };
      dailyMap[d].estimatedMinutes += a.estimatedMinutes;
      dailyMap[d].actualMinutes += (a.actualMinutes || a.estimatedMinutes);
    });

    return {
      success: true,
      data: {
        overview: { activityCount: cnt, estimatedMinutes: est, actualMinutes: act, estimatedHours: Math.round(est / 60), actualHours: Math.round(act / 60), variancePercent: -5.2 },
        categoryDistribution: Object.entries(catMap).map(([k, v]: any) => ({ category: k, ...v, percentage: (v.actualMinutes / (act || 1)) * 100 })),
        dailyWorkload: Object.entries(dailyMap).map(([k, v]: any) => ({ date: k, ...v })).slice(-30),
        weeklyWorkload: Object.entries(dailyMap).map(([k, v]: any) => ({ week: k, ...v })).slice(-6),
        heavyDays: [],
        topContributors: [],
        completion: { activityRate: 88, workloadRate: 92, completedCount: Math.round(cnt * 0.75) },
        deadlines: { overdueCount: 1, dueTodayCount: 2, dueNext7DaysCount: 7 },
        statusDistribution: [
          { status: 'COMPLETED', count: Math.round(cnt * 0.75) },
          { status: 'IN_PROGRESS', count: 3 },
          { status: 'PLANNED', count: Math.round(cnt * 0.2) }
        ],
        workloadStatus: { status: 'NORMAL', utilizationPercent: 78 }
      }
    };
  }

  // Department Analytics (HOD)
  if (url.includes('/departments/analytics') || url.includes('/department/analytics')) {
    return {
      success: true,
      data: {
        department: { id: '1fc517b3-627c-4a05-befb-01b5279edf7d', name: 'Computer Engineering', code: 'CE' },
        overview: {
          facultyCount: departmentFaculty.length || 10,
          activeFacultyCount: departmentFaculty.length || 10,
          activityCount: 430,
          estimatedMinutes: 25000,
          actualMinutes: 24200,
          estimatedHours: 416.7,
          actualHours: 403.3,
          varianceMinutes: -800,
          variancePercent: -3.2
        },
        facultyBreakdown: departmentFaculty,
        overloadedFaculty: departmentFaculty.filter(f => f.workloadStatus === 'OVERLOADED' || f.workloadStatus === 'HIGH'),
        distributionStats: { averageActualMinutes: 2420, minActualMinutes: 1900, maxActualMinutes: 3500 },
        categoryDistribution: [
          { category: 'TEACHING', estimatedMinutes: 10000, actualMinutes: 9800, percentage: 40 },
          { category: 'PREPARATION', estimatedMinutes: 5000, actualMinutes: 4900, percentage: 20 },
          { category: 'EVALUATION', estimatedMinutes: 4000, actualMinutes: 3900, percentage: 16 },
          { category: 'RESEARCH', estimatedMinutes: 3500, actualMinutes: 3400, percentage: 14 },
          { category: 'ADMINISTRATION', estimatedMinutes: 2500, actualMinutes: 2200, percentage: 10 }
        ],
        dailyWorkload: [],
        weeklyWorkload: [
          { week: 'Wk 38', estimatedMinutes: 6000, actualMinutes: 5800 },
          { week: 'Wk 39', estimatedMinutes: 6200, actualMinutes: 6000 },
          { week: 'Wk 40', estimatedMinutes: 6400, actualMinutes: 6200 },
          { week: 'Wk 41', estimatedMinutes: 6400, actualMinutes: 6200 }
        ],
        heavyDays: [],
        departmentWorkloadStatus: { status: 'NORMAL', utilizationPercent: 82 },
        deadlinePressure: { overdueCount: 2, dueTodayCount: 5, dueNext7DaysCount: 15 },
        topContributors: departmentFaculty.slice(0, 5)
      }
    };
  }

  // What-If Simulator
  if (url.includes('/workload/simulate') || url.includes('/simulator')) {
    return {
      success: true,
      data: {
        baseline: { workloadMinutes: 2400, utilizationPercent: 65, workloadStatus: 'NORMAL', overloadDays: 0 },
        scenario: { workloadMinutes: 2520, utilizationPercent: 70, workloadStatus: 'NORMAL', overloadDays: 0 },
        impact: { workloadMinutesDelta: 120, utilizationDelta: 5, overloadDaysDelta: 0 }
      }
    };
  }

  // AI Assistant
  if (url.includes('/ai/assistant')) {
    return {
      success: true,
      data: {
        isFallback: false,
        answer: 'Your current workload is healthy and well-distributed. You have 1 overdue task (Midterm Paper Evaluation) that should be addressed today.',
        keyFactors: ['1 Overdue evaluation task', 'Teaching load is balanced at ~14 hours/week', 'High confidence projection for the upcoming cycle'],
        suggestedActions: [
          'Complete Midterm Paper Evaluation to resolve overdue status',
          'Review Unit 4 Lecture Notes before the next scheduled class',
          'Coordinate with project students during mentoring hours'
        ]
      }
    };
  }

  return null;
}
