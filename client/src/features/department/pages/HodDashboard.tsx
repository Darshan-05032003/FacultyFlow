import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { 
  Users, Clock, AlertTriangle, Calendar as CalendarIcon, 
  Loader2, Activity, TrendingUp, Filter
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getDepartmentAnalytics } from '../api/departmentAnalytics';

const ActivityCategoryLabels: Record<string, string> = {
  TEACHING: 'Teaching',
  LAB: 'Lab',
  PREPARATION: 'Preparation',
  EVALUATION: 'Evaluation',
  MENTORING: 'Mentoring',
  PROJECT_SUPERVISION: 'Project Supervision',
  MEETING: 'Meeting',
  ADMINISTRATION: 'Administration',
  RESEARCH: 'Research',
  OTHER: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  LOW: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  NORMAL: 'text-green-600 dark:text-green-400 bg-green-500/10',
  HIGH: 'text-orange-600 dark:text-orange-400 bg-orange-500/10',
  OVERLOADED: 'text-red-600 dark:text-red-400 bg-red-500/10',
};

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-background rounded-xl border shadow-sm p-6", className)}>
      {children}
    </div>
  );
}

export default function HodDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const [trendView, setTrendView] = useState<'daily' | 'weekly'>('weekly');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['departmentAnalytics', dateRange.startDate, dateRange.endDate],
    queryFn: () => getDepartmentAnalytics(dateRange),
    retry: false
  });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isError) {
    const message = (error as any)?.response?.data?.message || 'Failed to load department analytics. Are you sure you are a Head of Department?';
    return (
      <div className="flex h-[50vh] items-center justify-center text-red-500">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-semibold">{message}</p>
        </div>
      </div>
    );
  }

  const analytics = data?.data;

  if (!analytics || analytics.overview.facultyCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Users className="w-16 h-16 text-muted-foreground/50" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No department data</h2>
        <p className="text-muted-foreground">Your department currently has no active faculty or workload data.</p>
      </div>
    );
  }

  const { 
    department, overview, facultyBreakdown, overloadedFaculty, 
    categoryDistribution, dailyWorkload, weeklyWorkload,
    departmentWorkloadStatus, deadlinePressure 
  } = analytics;

  const totalHours = Math.round(overview.estimatedHours * 10) / 10;
  const completedHours = Math.round(overview.actualHours * 10) / 10;
  const variance = Math.round(overview.varianceMinutes / 60 * 10) / 10;
  const varianceSign = variance > 0 ? '+' : '';

  const trendData = trendView === 'daily' 
    ? dailyWorkload.map((d: any) => ({ name: d.date, planned: Math.round(d.estimatedMinutes/60*10)/10, actual: Math.round(d.actualMinutes/60*10)/10 }))
    : weeklyWorkload.map((w: any) => ({ name: w.week, planned: Math.round(w.estimatedMinutes/60*10)/10, actual: Math.round(w.actualMinutes/60*10)/10 }));

  const categoryBarData = categoryDistribution.map((c: any) => ({
    name: ActivityCategoryLabels[c.category] || c.category,
    hours: Math.round(c.actualHours * 10) / 10 || Math.round(c.estimatedHours * 10) / 10
  })).filter((c: any) => c.hours > 0).sort((a: any, b: any) => b.hours - a.hours);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HOD Dashboard: {department.name}</h1>
          <p className="text-muted-foreground mt-1">Department-wide workload visibility and analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-gray-800 border rounded-md px-3 py-1.5 shadow-sm text-sm">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <input 
              type="date" 
              value={dateRange.startDate}
              onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-transparent border-none outline-none dark:text-white"
            />
            <span className="mx-2 text-gray-400">to</span>
            <input 
              type="date" 
              value={dateRange.endDate}
              onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-transparent border-none outline-none dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Faculty</p>
            <h3 className="text-2xl font-bold">{overview.activeFacultyCount}</h3>
            <p className="text-xs text-muted-foreground">Active members</p>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Dept Actual Workload</p>
            <h3 className="text-2xl font-bold">{completedHours} hrs</h3>
            <p className="text-xs text-muted-foreground">Planned: {totalHours} hrs</p>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4 text-orange-500" /> Variance</p>
            <h3 className="text-2xl font-bold">{varianceSign}{variance} hrs</h3>
            <p className="text-xs text-muted-foreground">{Math.round(overview.variancePercent)}% difference</p>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-blue-500" /> Pressure</p>
            <h3 className="text-2xl font-bold">{deadlinePressure.dueTodayCount + deadlinePressure.dueNext7DaysCount}</h3>
            <p className="text-xs text-red-500">{deadlinePressure.overdueCount} overdue dept tasks</p>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Activity className="w-4 h-4" /> Dept Status</p>
            <h3 className={cn("text-lg font-bold mt-1 px-2 py-0.5 rounded-md inline-block w-max", STATUS_COLORS[departmentWorkloadStatus.status])}>
              {departmentWorkloadStatus.status}
            </h3>
            <p className="text-xs text-muted-foreground">{Math.round(departmentWorkloadStatus.utilizationPercent)}% capacity</p>
          </div>
        </Card>
      </div>

      {overloadedFaculty.length > 0 && (
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Faculty Requiring Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overloadedFaculty.map((f: any) => (
              <div key={f.facultyId} className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                <p className="font-semibold">{f.name}</p>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-muted-foreground">Workload:</span>
                  <span className="font-medium">{Math.round(f.actualHours * 10)/10} hrs</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-sm">
                  <span className="text-muted-foreground">Utilization:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{Math.round(f.utilizationPercent)}%</span>
                </div>
                {f.overdueCount > 0 && (
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-muted-foreground">Overdue:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">{f.overdueCount} tasks</span>
                  </div>
                )}
                <div className={cn("mt-3 text-xs font-bold px-2 py-1 rounded w-max", STATUS_COLORS[f.workloadStatus])}>
                  {f.workloadStatus}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Faculty Workload Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Faculty Workload Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Faculty Member</th>
                <th className="px-4 py-3">Activities</th>
                <th className="px-4 py-3">Planned (hrs)</th>
                <th className="px-4 py-3">Actual (hrs)</th>
                <th className="px-4 py-3">Variance</th>
                <th className="px-4 py-3">Completion</th>
                <th className="px-4 py-3">Utilization</th>
                <th className="px-4 py-3 rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {facultyBreakdown.map((f: any) => (
                <tr key={f.facultyId} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    {f.name}
                    {f.employeeId && <span className="block text-xs text-muted-foreground">{f.employeeId}</span>}
                  </td>
                  <td className="px-4 py-3">{f.activityCount}</td>
                  <td className="px-4 py-3">{Math.round((f.estimatedMinutes/60) * 10)/10}</td>
                  <td className="px-4 py-3 font-semibold">{Math.round(f.actualHours * 10)/10}</td>
                  <td className="px-4 py-3">
                    <span className={f.varianceMinutes > 0 ? 'text-orange-500' : 'text-green-500'}>
                      {f.varianceMinutes > 0 ? '+' : ''}{Math.round((f.varianceMinutes/60) * 10)/10}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, f.completionRate)}%` }} />
                      </div>
                      <span className="text-xs">{Math.round(f.completionRate)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{Math.round(f.utilizationPercent)}%</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-md", STATUS_COLORS[f.workloadStatus])}>
                      {f.workloadStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Department Trend</h3>
            <div className="flex bg-muted p-1 rounded-md">
              <button 
                onClick={() => setTrendView('daily')}
                className={cn("px-3 py-1 text-xs font-medium rounded-sm", trendView === 'daily' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
              >
                Daily
              </button>
              <button 
                onClick={() => setTrendView('weekly')}
                className={cn("px-3 py-1 text-xs font-medium rounded-sm", trendView === 'weekly' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
              >
                Weekly
              </button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="planned" name="Planned (hrs)" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="actual" name="Actual (hrs)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-6">Category Distribution (Hours)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={100} />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
