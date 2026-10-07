import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Clock, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getWorkloadAnalytics } from '../api/analytics';
import { PageHeader, MetricCard, SectionCard, FilterBar, StatusBadge, LoadingState, ErrorState } from '../../../components/ui/SharedComponents';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

const CATEGORY_LABELS: Record<string, string> = {
  TEACHING: 'Teaching', LABORATORY: 'Lab', LAB: 'Lab',
  PREPARATION: 'Preparation', EVALUATION: 'Evaluation', MENTORING: 'Mentoring',
  SUPERVISION: 'Supervision', PROJECT_SUPERVISION: 'Project Supervision',
  MEETING: 'Meeting', DEPARTMENT_DUTY: 'Dept Duty', ADMINISTRATION: 'Administrative',
  RESEARCH: 'Research', OTHER: 'Other',
};

const PERIODS = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom' },
];

function toHrs(mins: number) { return Math.round((mins / 60) * 10) / 10; }

function getPeriodDates(period: string) {
  const now = new Date();
  const start = new Date();
  if (period === 'this-month') {
    start.setDate(1);
  } else if (period === 'last-month') {
    start.setMonth(start.getMonth() - 1, 1);
    now.setDate(0);
  } else if (period === 'last-3-months') {
    start.setMonth(start.getMonth() - 3, 1);
  }
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
}

export function WorkloadAnalysisPage() {
  const [period, setPeriod] = useState('this-month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [appliedFilters, setAppliedFilters] = useState(() => getPeriodDates('this-month'));

  const handleApply = () => {
    if (period === 'custom') {
      setAppliedFilters({ startDate: customStart, endDate: customEnd });
    } else {
      setAppliedFilters(getPeriodDates(period));
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['workloadAnalytics', appliedFilters.startDate, appliedFilters.endDate, filterCategory],
    queryFn: () => getWorkloadAnalytics({ ...appliedFilters, category: filterCategory || undefined }),
  });

  const analytics = data?.data;

  // Metrics
  const actualHours = analytics ? toHrs(analytics.overview.actualMinutes) : 0;
  const completedCount = analytics?.completion?.completedCount || 0;
  const totalCount = analytics?.overview?.activityCount || 0;
  const pendingCount = totalCount - completedCount;
  const avgDaily = analytics?.overview?.activityCount > 0 ? (actualHours / 30).toFixed(1) : 0;

  // Category pie data
  const pieData = analytics?.categoryDistribution?.map((c: any) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: Math.round(toHrs(c.actualMinutes || c.estimatedMinutes) * 10) / 10,
  })).filter((c: any) => c.value > 0) || [];

  // Weekly trend
  const weeklyData = analytics?.weeklyWorkload?.slice(-5).map((w: any) => ({
    name: w.week?.slice(-5) || '',
    actual: toHrs(w.actualMinutes),
    planned: toHrs(w.estimatedMinutes),
  })) || [];

  // Planned vs Actual bar
  const pvActualData = analytics?.categoryDistribution?.map((c: any) => ({
    name: (CATEGORY_LABELS[c.category] || c.category).slice(0, 10),
    planned: toHrs(c.estimatedMinutes),
    actual: toHrs(c.actualMinutes),
  })).filter((c: any) => c.planned > 0 || c.actual > 0) || [];

  // Category table
  const categoryTable = analytics?.categoryDistribution?.map((c: any) => {
    const planned = toHrs(c.estimatedMinutes);
    const actual = toHrs(c.actualMinutes);
    const variance = actual - planned;
    const status = variance > 1 ? 'OVERLOADED' : variance < -1 ? 'UNDERLOADED' : 'NORMAL';
    return {
      name: CATEGORY_LABELS[c.category] || c.category,
      planned, actual, variance, status,
    };
  }) || [];

  const filterFields = [
    {
      label: 'Period',
      className: 'min-w-[160px]',
      children: (
        <select value={period} onChange={e => setPeriod(e.target.value)} className="filter-select">
          {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      ),
    },
    {
      label: 'From Date',
      className: 'min-w-[140px]',
      children: (
        <input type="date" value={period === 'custom' ? customStart : appliedFilters.startDate}
          onChange={e => { setPeriod('custom'); setCustomStart(e.target.value); }}
          className="filter-input" />
      ),
    },
    {
      label: 'To Date',
      className: 'min-w-[140px]',
      children: (
        <input type="date" value={period === 'custom' ? customEnd : appliedFilters.endDate}
          onChange={e => { setPeriod('custom'); setCustomEnd(e.target.value); }}
          className="filter-input" />
      ),
    },
    {
      label: 'Category',
      className: 'min-w-[160px]',
      children: (
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="filter-select">
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workload Analysis"
        subtitle="Analyze your workload distribution, trends and plan vs actual comparison."
      />

      {/* Filter Bar */}
      <FilterBar fields={filterFields} onApply={handleApply} isLoading={isLoading} />

      {/* Metric Cards */}
      {isLoading ? (
        <LoadingState message="Loading analytics..." />
      ) : isError ? (
        <ErrorState message="Failed to load workload analytics." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Workload"
              value={`${actualHours} hrs`}
              icon={<Clock className="w-6 h-6 text-blue-600" />}
              iconBg="bg-blue-100"
              trend={analytics?.overview?.variancePercent != null ? {
                value: `${Math.abs(Math.round(analytics.overview.variancePercent))}% from planned`,
                positive: analytics.overview.variancePercent <= 0,
              } : undefined}
            />
            <MetricCard
              title="Completed Activities"
              value={completedCount}
              subtitle={`${Math.round(analytics?.completion?.activityRate || 0)}% completion rate`}
              icon={<CheckCircle className="w-6 h-6 text-green-600" />}
              iconBg="bg-green-100"
            />
            <MetricCard
              title="Pending Activities"
              value={pendingCount}
              subtitle={`${pendingCount > 0 ? Math.round((pendingCount / (totalCount || 1)) * 100) : 0}% pending`}
              icon={<AlertTriangle className="w-6 h-6 text-orange-500" />}
              iconBg="bg-orange-100"
            />
            <MetricCard
              title="Average Daily Workload"
              value={`${avgDaily} hrs`}
              icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
              iconBg="bg-purple-100"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workload by Category Donut */}
            <SectionCard title="Workload by Category">
              {pieData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="40%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2} dataKey="value">
                        {pieData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(v: any) => [`${v} hrs`]} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={8}
                        formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">No data for this period</div>
              )}
            </SectionCard>

            {/* Weekly Trend */}
            <SectionCard title="Weekly Workload Trend"
              headerRight={
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />Actual Hours</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-400 inline-block rounded border-dashed" />Planned Hours</span>
                </div>
              }
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="actual" name="Actual Hours" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="planned" name="Planned Hours" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Planned vs Actual Bar Chart */}
            <SectionCard title="Planned vs Actual Workload"
              headerRight={
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />Planned</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Actual</span>
                </div>
              }
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pvActualData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <RechartsTooltip formatter={(v: any) => [`${v} hrs`]} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="planned" name="Planned" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="actual" name="Actual" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            {/* Category Detailed Analysis Table */}
            <SectionCard title="Category-wise Detailed Analysis" noPadding>
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right">Planned Hours</th>
                      <th className="text-right">Actual Hours</th>
                      <th className="text-right">Variance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryTable.length > 0 ? categoryTable.map((row: any, i: number) => (
                      <tr key={i}>
                        <td className="font-medium text-gray-800">{row.name}</td>
                        <td className="text-right text-gray-600">{row.planned}</td>
                        <td className="text-right text-gray-600">{row.actual}</td>
                        <td className={`text-right font-semibold ${row.variance > 0 ? 'text-red-600' : row.variance < 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                          {row.variance > 0 ? '+' : ''}{row.variance.toFixed(1)}
                        </td>
                        <td><StatusBadge status={row.status} /></td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="text-center text-gray-400 py-8">No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}

export default WorkloadAnalysisPage;
