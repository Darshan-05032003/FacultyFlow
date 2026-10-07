import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { 
  Users, Clock, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDepartmentAnalytics } from '../api/departmentAnalytics';
import { PageHeader, MetricCard, SectionCard, FilterBar, StatusBadge, LoadingState, ErrorState, EmptyState } from '../../../components/ui/SharedComponents';
import { cn } from '../../../lib/utils';

const ActivityCategoryLabels: Record<string, string> = {
  TEACHING: 'Teaching', LAB: 'Lab', PREPARATION: 'Preparation', EVALUATION: 'Evaluation',
  MENTORING: 'Mentoring', PROJECT_SUPERVISION: 'Project Supervision', MEETING: 'Meeting',
  ADMINISTRATION: 'Administration', RESEARCH: 'Research', OTHER: 'Other',
};

const PERIODS = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-3-months', label: 'Last 3 Months' },
  { value: 'custom', label: 'Custom' },
];

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

export default function HodDashboard() {
  const [period, setPeriod] = useState('this-month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [appliedFilters, setAppliedFilters] = useState(() => getPeriodDates('this-month'));
  const [trendView, setTrendView] = useState<'daily' | 'weekly'>('weekly');

  const handleApply = () => {
    if (period === 'custom') {
      setAppliedFilters({ startDate: customStart, endDate: customEnd });
    } else {
      setAppliedFilters(getPeriodDates(period));
    }
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['departmentAnalytics', appliedFilters.startDate, appliedFilters.endDate],
    queryFn: () => getDepartmentAnalytics(appliedFilters),
    retry: false
  });

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
  ];

  if (isLoading) return (
    <div className="space-y-6">
      <PageHeader title="Department Overview" />
      <LoadingState message="Loading department analytics..." />
    </div>
  );

  if (isError) {
    const message = (error as any)?.response?.data?.message || 'Failed to load department analytics. Are you sure you are a Head of Department?';
    return (
      <div className="space-y-6">
        <PageHeader title="Department Overview" />
        <ErrorState message={message} />
      </div>
    );
  }

  const analytics = data?.data;

  if (!analytics || analytics.overview.facultyCount === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Department Overview" />
        <EmptyState icon={<Users />} title="No department data" description="Your department currently has no active faculty or workload data." />
      </div>
    );
  }

  const { 
    department, overview, facultyBreakdown, overloadedFaculty, 
    categoryDistribution, dailyWorkload, weeklyWorkload
  } = analytics;

  const totalHours = Math.round(overview.estimatedHours * 10) / 10;

  const trendData = trendView === 'daily' 
    ? dailyWorkload.map((d: any) => ({ name: new Date(d.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}), planned: Math.round(d.estimatedMinutes/60*10)/10, actual: Math.round(d.actualMinutes/60*10)/10 }))
    : weeklyWorkload.map((w: any) => ({ name: w.week?.slice(-5), planned: Math.round(w.estimatedMinutes/60*10)/10, actual: Math.round(w.actualMinutes/60*10)/10 }));

  const categoryBarData = categoryDistribution.map((c: any) => ({
    name: ActivityCategoryLabels[c.category] || c.category,
    hours: Math.round((c.actualMinutes || c.estimatedMinutes) / 60 * 10) / 10
  }));

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`${department.name} Overview`}
        subtitle="Department workload, faculty status, and performance metrics."
      />

      <FilterBar fields={filterFields} onApply={handleApply} isLoading={isLoading} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Faculty"
          value={overview.facultyCount}
          subtitle="Active members"
          icon={<Users className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <MetricCard
          title="Total Planned Hours"
          value={totalHours}
          subtitle="Department capacity"
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <MetricCard
          title="Avg Completion Rate"
          value={`${Math.round(overview.averageCompletionRate)}%`}
          subtitle="Overall performance"
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100"
        />
        <MetricCard
          title="Overloaded Faculty"
          value={overloadedFaculty.length}
          subtitle="Requires attention"
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100"
        />
      </div>

      {overloadedFaculty.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Faculty Requiring Attention</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overloadedFaculty.map((f: any) => (
              <div key={f.facultyId} className="bg-white rounded-lg border border-red-100 shadow-sm p-4">
                <p className="font-semibold text-gray-900">{f.name}</p>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-500">Workload:</span>
                  <span className="font-medium text-gray-900">{Math.round(f.actualHours * 10)/10} hrs</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-sm">
                  <span className="text-gray-500">Utilization:</span>
                  <span className="font-medium text-red-600">{Math.round(f.utilizationPercent)}%</span>
                </div>
                {f.overdueCount > 0 && (
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-gray-500">Overdue:</span>
                    <span className="font-medium text-red-600">{f.overdueCount} tasks</span>
                  </div>
                )}
                <div className="mt-3">
                  <StatusBadge status={f.workloadStatus} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faculty Workload Table */}
      <SectionCard title="Faculty Workload Breakdown" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Faculty Member</th>
                <th className="text-right">Activities</th>
                <th className="text-right">Planned (hrs)</th>
                <th className="text-right">Actual (hrs)</th>
                <th className="text-right">Variance</th>
                <th>Completion</th>
                <th className="text-right">Utilization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {facultyBreakdown.map((f: any) => (
                <tr key={f.facultyId}>
                  <td className="font-medium text-gray-900">
                    <span className="line-clamp-1">{f.name}</span>
                    {f.employeeId && <span className="block text-xs text-gray-500 font-normal">{f.employeeId}</span>}
                  </td>
                  <td className="text-right text-gray-600">{f.activityCount}</td>
                  <td className="text-right text-gray-600">{Math.round((f.estimatedMinutes/60) * 10)/10}</td>
                  <td className="text-right font-medium text-gray-900">{Math.round(f.actualHours * 10)/10}</td>
                  <td className={`text-right font-semibold ${f.varianceMinutes > 0 ? 'text-red-600' : f.varianceMinutes < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {f.varianceMinutes > 0 ? '+' : ''}{Math.round((f.varianceMinutes/60) * 10)/10}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, f.completionRate)}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{Math.round(f.completionRate)}%</span>
                    </div>
                  </td>
                  <td className="text-right text-gray-600">{Math.round(f.utilizationPercent)}%</td>
                  <td>
                    <StatusBadge status={f.workloadStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard 
          title="Department Trend"
          headerRight={
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button 
                onClick={() => setTrendView('daily')}
                className={cn("px-3 py-1 text-xs font-medium rounded", trendView === 'daily' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}
              >
                Daily
              </button>
              <button 
                onClick={() => setTrendView('weekly')}
                className={cn("px-3 py-1 text-xs font-medium rounded", trendView === 'weekly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}
              >
                Weekly
              </button>
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="actual" name="Actual (hrs)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="planned" name="Planned (hrs)" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Category Distribution (Hours)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} width={110} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
