import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { 
  Calendar as CalendarIcon, Clock, AlertTriangle, TrendingUp, CheckCircle, Zap, Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getWorkloadForecast } from '../api/forecastApi';
import { PageHeader, MetricCard, SectionCard, FilterBar, StatusBadge, LoadingState, ErrorState, EmptyState } from '../../../components/ui/SharedComponents';
import { cn } from '../../../lib/utils';

const ActivityCategoryLabels: Record<string, string> = {
  TEACHING: 'Teaching', LAB: 'Lab', PREPARATION: 'Preparation', EVALUATION: 'Evaluation',
  MENTORING: 'Mentoring', PROJECT_SUPERVISION: 'Project Supervision', MEETING: 'Meeting',
  ADMINISTRATION: 'Administration', RESEARCH: 'Research', OTHER: 'Other',
};

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<number>(30);
  const [appliedHorizon, setAppliedHorizon] = useState<number>(30);
  const [chartView, setChartView] = useState<'daily' | 'weekly'>('weekly');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['workloadForecast', appliedHorizon],
    queryFn: () => getWorkloadForecast({ horizon: appliedHorizon }),
  });

  const handleApply = () => setAppliedHorizon(horizon);

  const filterFields = [
    {
      label: 'Forecast Horizon',
      className: 'min-w-[160px]',
      children: (
        <select value={horizon} onChange={e => setHorizon(Number(e.target.value))} className="filter-select">
          <option value={7}>Next 7 Days</option>
          <option value={14}>Next 14 Days</option>
          <option value={30}>Next 30 Days</option>
        </select>
      ),
    },
  ];

  if (isLoading) return (
    <div className="space-y-6">
      <PageHeader title="Workload Forecast" />
      <LoadingState message="Generating deterministic forecast..." />
    </div>
  );

  if (isError) return (
    <div className="space-y-6">
      <PageHeader title="Workload Forecast" />
      <ErrorState message={(error as any)?.message || 'Failed to generate forecast'} />
    </div>
  );

  const forecast = data?.data;
  if (!forecast) return (
    <div className="space-y-6">
      <PageHeader title="Workload Forecast" />
      <EmptyState icon={<TrendingUp />} title="No Forecast Data" description="Unable to generate workload forecast." />
    </div>
  );

  const { summary, upcomingOverloadPeriods, dailyProjections, categoryProjections, insights } = forecast;

  const trendData = chartView === 'daily' || appliedHorizon <= 14
    ? dailyProjections.map((d: any) => ({
        name: new Date(d.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
        projected: Math.round(d.projectedMinutes/60*10)/10,
        scheduled: Math.round(d.scheduledMinutes/60*10)/10,
        baseline: Math.round(d.baselineMinutes/60*10)/10
      }))
    : dailyProjections.reduce((acc: any[], curr: any, idx: number) => {
        const weekIdx = Math.floor(idx / 7);
        if (!acc[weekIdx]) acc[weekIdx] = { name: `Week ${weekIdx + 1}`, projected: 0, scheduled: 0, baseline: 0 };
        acc[weekIdx].projected += curr.projectedMinutes;
        acc[weekIdx].scheduled += curr.scheduledMinutes;
        acc[weekIdx].baseline += curr.baselineMinutes;
        if (idx === dailyProjections.length - 1 || (idx + 1) % 7 === 0) {
          acc[weekIdx].projected = Math.round(acc[weekIdx].projected/60*10)/10;
          acc[weekIdx].scheduled = Math.round(acc[weekIdx].scheduled/60*10)/10;
          acc[weekIdx].baseline = Math.round(acc[weekIdx].baseline/60*10)/10;
        }
        return acc;
      }, []);

  const categoryBarData = categoryProjections.map((c: any) => ({
    name: ActivityCategoryLabels[c.category] || c.category,
    projected: Math.round(c.projectedMinutes / 60 * 10) / 10,
    scheduled: Math.round(c.scheduledMinutes / 60 * 10) / 10
  })).sort((a: any, b: any) => b.projected - a.projected).slice(0, 7);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Workload Forecast"
        subtitle="Predict future workload based on scheduled activities and historical patterns."
      />

      <FilterBar fields={filterFields} onApply={handleApply} isLoading={isLoading} />

      {insights && insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Forecast Insights</h3>
          </div>
          <ul className="space-y-2">
            {insights.map((insight: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Projected Workload"
          value={`${summary.projectedHours} hrs`}
          subtitle={`Over next ${appliedHorizon} days`}
          icon={<TrendingUp className="w-6 h-6 text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <MetricCard
          title="Scheduled Known"
          value={`${Math.round((summary.scheduledMinutes / 60)*10)/10} hrs`}
          subtitle="Already on calendar"
          icon={<CalendarIcon className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100"
        />
        <MetricCard
          title="Historical Baseline"
          value={`${Math.round((summary.baselineMinutes / 60)*10)/10} hrs`}
          subtitle="Expected run rate"
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <MetricCard
          title="Projected Status"
          value={summary.workloadStatus}
          subtitle={`${summary.projectedUtilization}% of normal capacity`}
          icon={<Activity className="w-6 h-6 text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      {upcomingOverloadPeriods.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Upcoming Workload Pressure</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingOverloadPeriods.map((period: any, idx: number) => (
              <div key={idx} className="bg-white rounded-lg border border-red-100 shadow-sm p-4">
                <p className="font-semibold text-gray-900">{period.period}</p>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-500">Projected:</span>
                  <span className="font-medium text-red-600">{period.projectedHours} hrs ({period.utilization}%)</span>
                </div>
                {period.primaryCategories.length > 0 && (
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-gray-500">Contributors:</span>
                    <span className="font-medium text-gray-900">{period.primaryCategories.join(', ')}</span>
                  </div>
                )}
                <div className="mt-3">
                  <StatusBadge status={period.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard 
          title="Workload Projection"
          headerRight={
            appliedHorizon > 7 && (
              <div className="flex bg-gray-100 p-1 rounded-md">
                <button 
                  onClick={() => setChartView('daily')}
                  className={cn("px-3 py-1 text-xs font-medium rounded", chartView === 'daily' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}
                >
                  Daily
                </button>
                <button 
                  onClick={() => setChartView('weekly')}
                  className={cn("px-3 py-1 text-xs font-medium rounded", chartView === 'weekly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700')}
                >
                  Weekly
                </button>
              </div>
            )
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
                <Line type="monotone" dataKey="projected" name="Projected (hrs)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="scheduled" name="Scheduled (hrs)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="baseline" name="Baseline (hrs)" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Category Forecast (Hours)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} width={110} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="projected" name="Projected" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                <Bar dataKey="scheduled" name="Scheduled" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
