import { 
  PieChart, Pie, Cell, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { 
  Clock, CheckCircle, Calendar, AlertTriangle,
  Loader2, Activity, TrendingUp, ChevronRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getWorkloadAnalytics } from '../features/workload/api/analytics';
import { getWorkloadForecast } from '../features/forecast/api/forecastApi';
import { getTopPriorities } from '../features/prioritization/api/prioritizationApi';
import { getActivities } from '../features/activities/api/activities';
import { useAuth } from '../features/auth/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MetricCard, SectionCard, StatusBadge, PriorityBadge, EmptyState } from '../components/ui/SharedComponents';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

const CATEGORY_LABELS: Record<string, string> = {
  TEACHING: 'Teaching', LABORATORY: 'Lab', LAB: 'Lab',
  PREPARATION: 'Preparation', EVALUATION: 'Evaluation', MENTORING: 'Mentoring',
  SUPERVISION: 'Supervision', PROJECT_SUPERVISION: 'Project Supervision',
  MEETING: 'Meeting', DEPARTMENT_DUTY: 'Dept Duty', ADMINISTRATION: 'Administration',
  RESEARCH: 'Research', OTHER: 'Other',
};

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function toHrs(mins: number) {
  return Math.round((mins / 60) * 10) / 10;
}

export default function Dashboard() {
  const { user } = useAuth();
  const today = new Date();

  // Last 30 days analytics
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 30);
  const dateRange = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['workloadAnalytics', dateRange.startDate, dateRange.endDate],
    queryFn: () => getWorkloadAnalytics(dateRange),
  });

  const { data: forecastData } = useQuery({
    queryKey: ['workloadForecast', 7],
    queryFn: () => getWorkloadForecast({ horizon: 7 }),
  });

  const { data: prioritiesData } = useQuery({
    queryKey: ['topPriorities'],
    queryFn: () => getTopPriorities(),
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['activities', 1, 10],
    queryFn: () => getActivities({ page: 1, limit: 10 }),
  });

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const analytics = analyticsData?.data;
  const forecast = forecastData?.data;
  const priorities = prioritiesData?.data?.tasks || [];
  const activities = activitiesData?.data?.data || [];
  const totalActivities = analyticsData?.data?.overview?.activityCount || 0;

  const totalHours = analytics ? toHrs(analytics.overview.estimatedMinutes) : 0;
  const pendingCount = priorities.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length;
  const upcomingDeadlines = analytics ? (analytics.deadlines?.dueTodayCount || 0) + (analytics.deadlines?.dueNext7DaysCount || 0) : 0;

  // Category pie data
  const pieData = analytics?.categoryDistribution?.map((c: any) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: Math.round(toHrs(c.actualMinutes || c.estimatedMinutes) * 10) / 10,
  })).filter((c: any) => c.value > 0) || [];

  // Weekly trend data 
  const weeklyData = analytics?.weeklyWorkload?.slice(-6).map((w: any) => ({
    name: `Wk ${w.week?.slice(-2) || ''}`,
    planned: toHrs(w.estimatedMinutes),
    actual: toHrs(w.actualMinutes),
  })) || [];

  // upcoming tasks from priorities
  const upcomingTasks = priorities
    .filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')
    .slice(0, 5);

  // recent activities
  const recentActivities = activities.slice(0, 5);

  const firstName = user?.name?.split(' ')[0] || 'Faculty';

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName}!</h1>
          <p className="text-sm text-gray-500 mt-1">Here is an overview of your workload and upcoming tasks.</p>
        </div>
        <p className="text-sm text-gray-500 font-medium">{formatDate(today)}</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Workload"
          value={`${totalHours} hrs`}
          subtitle="Last 30 days"
          icon={<Clock className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <MetricCard
          title="Total Activities"
          value={totalActivities}
          subtitle={`${Math.round(analytics?.completion?.activityRate || 0)}% completion rate`}
          icon={<Activity className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100"
        />
        <MetricCard
          title="Pending Tasks"
          value={pendingCount}
          subtitle="Require attention"
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          iconBg="bg-orange-100"
        />
        <MetricCard
          title="Upcoming Deadlines"
          value={upcomingDeadlines}
          subtitle={`${analytics?.deadlines?.overdueCount || 0} overdue`}
          icon={<Calendar className="w-6 h-6 text-red-500" />}
          iconBg="bg-red-100"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution Donut */}
        <SectionCard title="Workload Distribution">
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="40%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: any) => [`${val} hrs`, 'Hours']} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={<Activity className="w-6 h-6" />} title="No workload data yet" description="Add activities to see distribution" />
          )}
        </SectionCard>

        {/* Upcoming Tasks & Deadlines */}
        <SectionCard
          title="Upcoming Tasks & Deadlines"
          headerRight={
            <Link to="/priorities" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          }
          noPadding
        >
          {upcomingTasks.length > 0 ? (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingTasks.map((task: any, idx: number) => (
                  <tr key={task.id || idx}>
                    <td className="font-medium text-gray-900 max-w-[160px]">
                      <span className="line-clamp-1">{task.title}</span>
                    </td>
                    <td className="text-gray-500 whitespace-nowrap">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td><PriorityBadge priority={task.priorityLevel || 'LOW'} /></td>
                    <td>
                      {task.isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <StatusBadge status={task.status || 'PLANNED'} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5">
              <EmptyState icon={<CheckCircle className="w-6 h-6" />} title="No pending tasks" description="All caught up!" />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Workload Trend */}
        <SectionCard title="Weekly Workload Trend">
          {weeklyData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend verticalAlign="top" height={30} iconSize={8} formatter={(v) => <span className="text-xs">{v}</span>} />
                  <Line type="monotone" dataKey="actual" name="Actual (hrs)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
                  <Line type="monotone" dataKey="planned" name="Planned (hrs)" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={<TrendingUp className="w-6 h-6" />} title="No trend data yet" />
          )}
        </SectionCard>

        {/* Recent Activities */}
        <SectionCard
          title="Recent Activities"
          headerRight={
            <Link to="/activities" className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          }
          noPadding
        >
          {recentActivities.length > 0 ? (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Category</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((act: any, idx: number) => (
                  <tr key={act.id || idx}>
                    <td className="font-medium text-gray-900 max-w-[160px]">
                      <span className="line-clamp-1">{act.title}</span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-500">{CATEGORY_LABELS[act.category] || act.category}</span>
                    </td>
                    <td className="text-gray-700 font-medium">
                      {act.actualMinutes ? toHrs(act.actualMinutes) : toHrs(act.estimatedMinutes || 0)}h
                    </td>
                    <td><StatusBadge status={act.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={<Activity className="w-6 h-6" />}
                title="No activities yet"
                description="Start by adding your first activity"
                action={
                  <Link to="/activities" className="btn-primary text-xs">
                    Add Activity
                  </Link>
                }
              />
            </div>
          )}
        </SectionCard>
      </div>

      {/* Forecast widget (if data exists) */}
      {forecast && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-blue-600 rounded-xl p-5 text-white">
            <p className="text-blue-200 text-sm font-medium mb-1">Next 7 Days Forecast</p>
            <p className="text-3xl font-bold">{forecast.summary?.projectedHours} hrs</p>
            <p className="text-blue-200 text-sm mt-1">Projected workload</p>
            <Link to="/forecast" className="mt-4 inline-flex items-center gap-1 text-sm text-blue-200 hover:text-white transition-colors">
              View Details <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-card p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link to="/activities" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-center">
                <Activity className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-semibold text-blue-700">Add Activity</span>
              </Link>
              <Link to="/workload" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Analysis</span>
              </Link>
              <Link to="/reports" className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors text-center">
                <Calendar className="w-6 h-6 text-purple-600" />
                <span className="text-xs font-semibold text-purple-700">Reports</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
