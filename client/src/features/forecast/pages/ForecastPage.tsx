import { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, Clock, AlertTriangle, Calendar as CalendarIcon, 
  Loader2, Activity, Zap, CheckCircle, HelpCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getWorkloadForecast } from '../api/forecastApi';

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

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<number>(14);
  const [chartView, setChartView] = useState<'daily' | 'weekly'>('daily');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['workloadForecast', horizon],
    queryFn: () => getWorkloadForecast({ horizon }),
    retry: false
  });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isError) {
    const message = (error as any)?.response?.data?.message || 'Failed to load forecast data.';
    return (
      <div className="flex h-[50vh] items-center justify-center text-red-500">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-semibold">{message}</p>
        </div>
      </div>
    );
  }

  const forecast = data?.data;

  if (!forecast) {
    return null;
  }

  const { 
    confidence, summary, dailyForecast, weeklyForecast, 
    categoryForecast, upcomingOverloadPeriods, insights 
  } = forecast;

  const trendData = chartView === 'daily' 
    ? dailyForecast.map((d: any) => ({ name: d.date, projected: Math.round(d.projectedMinutes/60*10)/10, scheduled: Math.round(d.scheduledMinutes/60*10)/10, baseline: Math.round(d.baselineMinutes/60*10)/10 }))
    : weeklyForecast.map((w: any) => ({ name: w.week, projected: Math.round(w.projectedMinutes/60*10)/10, scheduled: Math.round(w.scheduledMinutes/60*10)/10, baseline: Math.round(w.baselineMinutes/60*10)/10 }));

  const categoryBarData = categoryForecast.map((c: any) => ({
    name: c.category,
    projected: c.projectedHours,
    scheduled: Math.round(c.scheduledMinutes/60*10)/10
  })).filter((c: any) => c.projected > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workload Forecast</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            This forecast combines scheduled activities with historical workload patterns.
          </p>
          <p className="text-xs mt-2 text-muted-foreground">
            Confidence: <span className={cn("font-medium", confidence.level === 'HIGH' ? 'text-green-600' : confidence.level === 'MEDIUM' ? 'text-orange-500' : 'text-red-500')}>{confidence.level}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-md border">
            {[7, 14, 30].map(h => (
              <button 
                key={h}
                onClick={() => setHorizon(h)}
                className={cn("px-4 py-1.5 text-sm font-medium rounded-sm", horizon === h ? 'bg-background shadow-sm' : 'text-muted-foreground')}
              >
                {h} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Forecast Insights
          </h3>
          <ul className="space-y-2">
            {insights.map((insight: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Projected Workload</p>
            <h3 className="text-2xl font-bold">{summary.projectedHours} hrs</h3>
            <p className="text-xs text-muted-foreground">Over next {horizon} days</p>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-blue-500" /> Scheduled Known</p>
            <h3 className="text-2xl font-bold">{Math.round((summary.scheduledMinutes / 60)*10)/10} hrs</h3>
            <p className="text-xs text-muted-foreground">Already on calendar</p>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> Historical Baseline</p>
            <h3 className="text-2xl font-bold">{Math.round((summary.baselineMinutes / 60)*10)/10} hrs</h3>
            <p className="text-xs text-muted-foreground">Expected run rate</p>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Activity className="w-4 h-4" /> Projected Status</p>
            <h3 className={cn("text-lg font-bold mt-1 px-2 py-0.5 rounded-md inline-block w-max", STATUS_COLORS[summary.workloadStatus])}>
              {summary.workloadStatus}
            </h3>
            <p className="text-xs text-muted-foreground">{summary.projectedUtilization}% of normal capacity</p>
          </div>
        </Card>
      </div>

      {upcomingOverloadPeriods.length > 0 && (
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Upcoming Workload Pressure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingOverloadPeriods.map((period: any, idx: number) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg border shadow-sm">
                <p className="font-semibold">{period.period}</p>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-muted-foreground">Projected:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{period.projectedHours} hrs ({period.utilization}%)</span>
                </div>
                {period.primaryCategories.length > 0 && (
                  <div className="flex justify-between items-center mt-1 text-sm">
                    <span className="text-muted-foreground">Contributors:</span>
                    <span className="font-medium">{period.primaryCategories.join(', ')}</span>
                  </div>
                )}
                <div className={cn("mt-3 text-xs font-bold px-2 py-1 rounded w-max", STATUS_COLORS[period.status])}>
                  {period.status}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Workload Projection
              <span className="group relative cursor-help">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                <span className="pointer-events-none absolute left-1/2 -top-10 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-gray-50 opacity-0 shadow transition-opacity group-hover:opacity-100 w-max z-50">
                  Projected = max(Scheduled, Baseline)
                </span>
              </span>
            </h3>
            {horizon > 7 && (
              <div className="flex bg-muted p-1 rounded-md">
                <button 
                  onClick={() => setChartView('daily')}
                  className={cn("px-3 py-1 text-xs font-medium rounded-sm", chartView === 'daily' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
                >
                  Daily
                </button>
                <button 
                  onClick={() => setChartView('weekly')}
                  className={cn("px-3 py-1 text-xs font-medium rounded-sm", chartView === 'weekly' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
                >
                  Weekly
                </button>
              </div>
            )}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="projected" name="Projected (hrs)" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="scheduled" name="Scheduled (hrs)" stroke="hsl(var(--orange-500))" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="baseline" name="Baseline (hrs)" stroke="hsl(var(--blue-500))" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-6">Category Forecast (Hours)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={100} />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="projected" name="Projected" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={15} />
                <Bar dataKey="scheduled" name="Scheduled" fill="hsl(var(--orange-500))" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
