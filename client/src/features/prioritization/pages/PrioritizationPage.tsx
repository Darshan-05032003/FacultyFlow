import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, Clock, Calendar, CheckCircle, 
  Loader2, ArrowRight, Zap, Target
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { getPriorities } from '../api/prioritizationApi';
import { Link } from 'react-router-dom';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300',
  MEDIUM: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  HIGH: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
  CRITICAL: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
};

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-background rounded-xl border shadow-sm p-5", className)}>
      {children}
    </div>
  );
}

export default function PrioritizationPage() {
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterDueSoon, setFilterDueSoon] = useState<boolean>(false);
  const [filterOverdue, setFilterOverdue] = useState<boolean>(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['priorities', filterPriority, filterDueSoon, filterOverdue],
    queryFn: () => getPriorities({
      horizon: 30,
      priorityLevel: filterPriority || undefined,
      dueSoon: filterDueSoon || undefined,
      isOverdue: filterOverdue || undefined
    }),
  });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isError || !data?.data) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-red-500">
        Failed to load prioritization data.
      </div>
    );
  }

  const { summary, insights, conflicts, tasks } = data.data;

  // Split tasks into sections for the UI
  const overdueTasks = tasks.filter((t: any) => t.isOverdue);
  const nextRecommended = tasks.filter((t: any) => !t.isOverdue).slice(0, 4); // top 4 not overdue

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Priority Tasks</h1>
        <p className="text-muted-foreground mt-1">
          Tasks ranked using deadlines, workload, and projected workload pressure.
        </p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">CRITICAL</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.CRITICAL}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">HIGH</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{summary.HIGH}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">MEDIUM</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summary.MEDIUM}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">LOW</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{summary.LOW}</p>
        </div>
        
        <div className="md:col-span-2 bg-background border rounded-lg p-3 flex flex-col justify-center">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500"/> Overdue</span>
            <span className="font-bold text-red-600">{summary.OVERDUE}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3 text-orange-500"/> Due Soon</span>
            <span className="font-bold">{summary.DUE_SOON}</span>
          </div>
        </div>
      </div>

      {/* Insights & Conflicts */}
      {(insights.length > 0 || conflicts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Deterministic Insights
              </h3>
              <ul className="space-y-1.5">
                {insights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {conflicts.length > 0 && (
            <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" /> Workload Conflicts
              </h3>
              <div className="space-y-2">
                {conflicts.map((c: any, idx: number) => (
                  <div key={idx} className="text-sm bg-white dark:bg-gray-800 p-2 rounded border border-red-100 dark:border-red-900/50">
                    <span className="font-medium">{c.date}: </span> 
                    {c.taskCount} high-priority tasks ({Math.round(c.estimatedMinutes / 60)} hrs total).
                    <span className="text-xs text-red-600 block mt-1">Exceeds {Math.round(c.targetMinutes/60)}hr daily target.</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Overdue Section */}
      {overdueTasks.length > 0 && !filterPriority && !filterDueSoon && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Overdue
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueTasks.map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Next Tasks */}
      {!filterPriority && !filterOverdue && !filterDueSoon && nextRecommended.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Recommended Next Tasks
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Based on deadlines and workload.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nextRecommended.map((task: any) => (
              <TaskCard key={task.id} task={task} detailed />
            ))}
          </div>
        </div>
      )}

      {/* All Prioritized Tasks */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-semibold">All Prioritized Tasks</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-sm border rounded-md px-2 py-1.5 bg-background"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
            
            <button 
              onClick={() => { setFilterDueSoon(!filterDueSoon); setFilterOverdue(false); }}
              className={cn("text-sm border rounded-md px-3 py-1.5 transition-colors", filterDueSoon ? "bg-primary text-primary-foreground" : "bg-background")}
            >
              Due Soon
            </button>
            <button 
              onClick={() => { setFilterOverdue(!filterOverdue); setFilterDueSoon(false); }}
              className={cn("text-sm border rounded-md px-3 py-1.5 transition-colors", filterOverdue ? "bg-red-600 text-white border-red-600" : "bg-background")}
            >
              Overdue
            </button>
          </div>
        </div>

        <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
          {tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">System Priority</th>
                    <th className="px-4 py-3">Deadline</th>
                    <th className="px-4 py-3">Workload</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks.map((task: any) => (
                    <tr key={task.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{task.title}</div>
                        <div className="text-xs text-muted-foreground">{task.category}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded text-xs font-bold inline-block", PRIORITY_COLORS[task.priorityLevel])}>
                          {task.priorityLevel} · {task.priorityScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {task.isOverdue ? (
                          <span className="text-red-600 font-medium">Overdue</span>
                        ) : task.deadline ? (
                          <span>{task.deadline}</span>
                        ) : (
                          <span className="text-muted-foreground">No deadline</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {Math.round(task.estimatedMinutes / 60 * 10) / 10} hrs
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/activities`} className="text-primary hover:underline text-xs font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No active tasks match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, detailed = false }: { task: any, detailed?: boolean }) {
  return (
    <div className={cn(
      "bg-background rounded-xl border shadow-sm p-5 flex flex-col h-full",
      task.priorityLevel === 'CRITICAL' ? "border-red-200 dark:border-red-900/50" : ""
    )}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold line-clamp-2" title={task.title}>{task.title}</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={cn("px-2 py-0.5 rounded text-xs font-bold", PRIORITY_COLORS[task.priorityLevel])}>
          {task.priorityLevel} · {task.priorityScore}
        </span>
        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-medium">
          {task.category}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-grow">
        <div className="flex justify-between">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Due</span>
          <span className={task.isOverdue ? "text-red-600 font-medium" : "text-gray-900 dark:text-gray-100"}>
            {task.deadline || 'None'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Est. Workload</span>
          <span className="text-gray-900 dark:text-gray-100">{Math.round(task.estimatedMinutes / 60 * 10) / 10} hrs</span>
        </div>
      </div>

      {detailed && task.reasons.length > 0 && (
        <div className="mb-4 bg-muted/50 p-3 rounded-md border border-muted">
          <p className="text-xs font-semibold mb-1.5">Why this is prioritized:</p>
          <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
            {task.reasons.map((r: string, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-muted">
        <Link 
          to="/activities" 
          className="text-sm font-medium text-primary hover:underline flex items-center justify-center gap-2"
        >
          View Activity <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
