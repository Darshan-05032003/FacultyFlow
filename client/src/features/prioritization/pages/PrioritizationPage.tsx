import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Target, AlertTriangle, CheckCircle, Zap, Calendar, Clock, ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPriorities } from '../api/prioritizationApi';
import { PageHeader, SectionCard, PriorityBadge, LoadingState, ErrorState, EmptyState } from '../../../components/ui/SharedComponents';
import { cn } from '../../../lib/utils';

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

  if (isLoading) return (
    <div className="space-y-6">
      <PageHeader title="Priority Tasks" />
      <LoadingState message="Calculating deterministic task priorities..." />
    </div>
  );

  const priorityPayload = (data as any)?.data || (data && 'summary' in (data as any) ? data : null);

  if (isError || !priorityPayload) {
    return (
      <div className="space-y-6">
        <PageHeader title="Priority Tasks" />
        <ErrorState message="Failed to load prioritization data." />
      </div>
    );
  }

  const { 
    summary = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, OVERDUE: 0, DUE_SOON: 0 }, 
    insights = [], 
    conflicts = [], 
    tasks = [] 
  } = priorityPayload;

  // Split tasks into sections for the UI
  const overdueTasks = (tasks || []).filter((t: any) => t.isOverdue);
  const nextRecommended = (tasks || []).filter((t: any) => !t.isOverdue).slice(0, 4); // top 4 not overdue

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Priority Tasks"
        subtitle="Tasks ranked using deadlines, workload, and projected workload pressure."
      />

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-red-600 mb-1">CRITICAL</p>
          <p className="text-3xl font-bold text-red-700">{summary.CRITICAL}</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-orange-600 mb-1">HIGH</p>
          <p className="text-3xl font-bold text-orange-700">{summary.HIGH}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-blue-600 mb-1">MEDIUM</p>
          <p className="text-3xl font-bold text-blue-700">{summary.MEDIUM}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-gray-500 mb-1">LOW</p>
          <p className="text-3xl font-bold text-gray-700">{summary.LOW}</p>
        </div>
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-300">Total Active</p>
            <p className="text-2xl font-bold text-white mt-1">{tasks.length} Tasks</p>
          </div>
          <Target className="w-8 h-8 text-blue-400 opacity-80" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights & Conflicts (Side panel) */}
        <div className="lg:col-span-1 space-y-6">
          {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-800">Deadline Conflicts</h3>
              </div>
              <div className="space-y-3">
                {conflicts.map((conflict: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-red-100 text-sm">
                    <p className="font-semibold text-gray-900 mb-1">{conflict.date}</p>
                    <p className="text-red-600 font-medium mb-1">{conflict.tasksCount} tasks due ({Math.round(conflict.totalEstimatedMinutes / 60)} hrs work)</p>
                    <p className="text-gray-500 text-xs">Consider rescheduling non-critical tasks.</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Priority Insights</h3>
              </div>
              <ul className="space-y-3">
                {insights.map((insight: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tasks View */}
        <div className="lg:col-span-2 space-y-8">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && !filterPriority && !filterDueSoon && (
            <div>
              <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Overdue Tasks
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {overdueTasks.map((task: any) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Recommended Next Tasks */}
          {!filterPriority && !filterOverdue && !filterDueSoon && nextRecommended.length > 0 && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Target className="w-5 h-5 text-blue-600" /> Recommended Next Tasks
                </h2>
                <p className="text-sm text-gray-500 mt-1">Based on deadlines and projected workload.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nextRecommended.map((task: any) => (
                  <TaskCard key={task.id} task={task} detailed />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All Prioritized Tasks */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">All Active Tasks</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={filterPriority} 
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-sm border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
            
            <button 
              onClick={() => { setFilterDueSoon(!filterDueSoon); setFilterOverdue(false); }}
              className={cn("text-sm border rounded-lg px-4 py-2 transition-colors font-medium shadow-sm", filterDueSoon ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")}
            >
              Due Soon
            </button>
            <button 
              onClick={() => { setFilterOverdue(!filterOverdue); setFilterDueSoon(false); }}
              className={cn("text-sm border rounded-lg px-4 py-2 transition-colors font-medium shadow-sm", filterOverdue ? "bg-red-600 text-white border-red-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")}
            >
              Overdue
            </button>
          </div>
        </div>

        <SectionCard noPadding>
          {tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Deadline</th>
                    <th className="text-right">Workload</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task: any) => (
                    <tr key={task.id}>
                      <td>
                        <div className="font-medium text-gray-900">{task.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{task.category}</div>
                      </td>
                      <td>
                        <PriorityBadge priority={task.priorityLevel} />
                      </td>
                      <td>
                        {task.isOverdue ? (
                          <span className="text-red-600 font-medium text-sm">Overdue</span>
                        ) : task.deadline ? (
                          <span className="text-gray-900 text-sm">{task.deadline}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">No deadline</span>
                        )}
                      </td>
                      <td className="text-right text-gray-600 text-sm font-medium">
                        {Math.round(task.estimatedMinutes / 60 * 10) / 10} hrs
                      </td>
                      <td className="text-right">
                        <Link to={`/activities`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<CheckCircle />} title="No tasks found" description="No active tasks match your current filters." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function TaskCard({ task, detailed = false }: { task: any, detailed?: boolean }) {
  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm p-5 flex flex-col h-full hover:shadow-md transition-shadow",
      task.priorityLevel === 'CRITICAL' ? "border-red-200" : "border-gray-200"
    )}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight" title={task.title}>{task.title}</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-5">
        <PriorityBadge priority={task.priorityLevel} />
        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
          {task.category}
        </span>
      </div>
      
      <div className="space-y-2.5 text-sm mb-4 flex-grow">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-gray-500"><Calendar className="w-4 h-4"/> Due</span>
          <span className={task.isOverdue ? "text-red-600 font-semibold" : "text-gray-900 font-medium"}>
            {task.deadline || 'None'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-gray-500"><Clock className="w-4 h-4"/> Est. Workload</span>
          <span className="text-gray-900 font-medium">{Math.round(task.estimatedMinutes / 60 * 10) / 10} hrs</span>
        </div>
      </div>

      {detailed && task.reasons.length > 0 && (
        <div className="mb-5 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-2">Why this is prioritized:</p>
          <ul className="text-xs text-gray-600 space-y-1.5 pl-4 list-disc marker:text-gray-400">
            {task.reasons.map((r: string, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-gray-100">
        <Link 
          to="/activities" 
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 group"
        >
          View Activity <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
