import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, CheckCircle2, X, Calendar, Clock } from 'lucide-react';
import { getActivities, createActivity, updateActivity, deleteActivity, updateActivityStatus } from '../api/activities';
import { PageHeader, StatusBadge, PriorityBadge, SectionCard, LoadingState, EmptyState } from '../../../components/ui/SharedComponents';

const CATEGORIES = [
  { value: 'TEACHING', label: 'Teaching' },
  { value: 'PREPARATION', label: 'Preparation' },
  { value: 'EVALUATION', label: 'Evaluation' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'ADMINISTRATION', label: 'Administration' },
  { value: 'MENTORING', label: 'Mentoring' },
  { value: 'PROJECT_SUPERVISION', label: 'Project Supervision' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'OTHER', label: 'Other' },
];

const STATUSES = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const CATEGORY_LABELS: Record<string, string> = {
  TEACHING: 'Teaching', LABORATORY: 'Lab', LAB: 'Lab',
  PREPARATION: 'Preparation', EVALUATION: 'Evaluation', MENTORING: 'Mentoring',
  SUPERVISION: 'Supervision', PROJECT_SUPERVISION: 'Project Supervision',
  MEETING: 'Meeting', DEPARTMENT_DUTY: 'Dept Duty', ADMINISTRATION: 'Administration',
  RESEARCH: 'Research', OTHER: 'Other',
};

const DEFAULT_FORM = {
  title: '',
  category: 'TEACHING',
  date: new Date().toISOString().split('T')[0],
  estimatedMinutes: '',
  actualMinutes: '',
  deadline: '',
  description: '',
  status: 'PLANNED',
};

function toHrs(mins: number | null | undefined) {
  if (!mins) return '—';
  return (mins / 60).toFixed(1) + 'h';
}

export const ActivitiesPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(DEFAULT_FORM);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activities', filterCategory, filterStatus],
    queryFn: () => getActivities({ category: filterCategory, status: filterStatus }),
  });

  const createMutation = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['workloadAnalytics'] });
      setIsFormOpen(false);
      setFormData(DEFAULT_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['workloadAnalytics'] });
      setIsFormOpen(false);
      setEditingId(null);
      setFormData(DEFAULT_FORM);
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateActivityStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['workloadAnalytics'] });
    },
  });

  const handleEdit = (activity: any) => {
    setEditingId(activity.id);
    setFormData({
      title: activity.title || '',
      category: activity.category || 'TEACHING',
      date: activity.date ? activity.date.split('T')[0] : '',
      estimatedMinutes: activity.estimatedMinutes || '',
      actualMinutes: activity.actualMinutes || '',
      deadline: activity.deadline ? activity.deadline.split('T')[0] : '',
      description: activity.description || '',
      status: activity.status || 'PLANNED',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : null,
      actualMinutes: formData.actualMinutes ? parseInt(formData.actualMinutes) : null,
      deadline: formData.deadline || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setIsFormOpen(true);
  };

  const rawActivities = (data as any)?.data;
  const activities = Array.isArray(rawActivities)
    ? rawActivities
    : (Array.isArray(rawActivities?.activities) ? rawActivities.activities : (Array.isArray(data) ? data : []));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity & Task Recording"
        subtitle="Record your academic and administrative activities to track workload."
      >
        <button onClick={openAddForm} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add New Activity
        </button>
      </PageHeader>

      {/* Add/Edit Form */}
      {isFormOpen && (
        <SectionCard title={editingId ? 'Edit Activity' : 'Add New Activity / Task'}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Activity / Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="filter-input"
                  placeholder="e.g., DBMS Lecture, Assignment Evaluation..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="filter-select"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="filter-select"
                >
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="filter-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Deadline
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                    className="filter-input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Estimated Duration (mins)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedMinutes}
                    onChange={e => setFormData({ ...formData, estimatedMinutes: e.target.value })}
                    className="filter-input pl-9"
                    placeholder="e.g. 60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Actual Duration (mins)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    value={formData.actualMinutes}
                    onChange={e => setFormData({ ...formData, actualMinutes: e.target.value })}
                    className="filter-input pl-9"
                    placeholder="e.g. 75"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="filter-input resize-none"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingId(null); setFormData(DEFAULT_FORM); }}
                className="btn-secondary"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingId ? 'Update Activity' : 'Save Activity'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <SectionCard
        title="Recently Recorded Activities"
        subtitle={`${activities.length} activities found`}
        noPadding
      >
        {isLoading ? (
          <div className="p-8"><LoadingState message="Loading activities..." /></div>
        ) : activities.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Calendar className="w-6 h-6" />}
              title="No activities found"
              description="Add your first activity to start tracking workload."
              action={
                <button onClick={openAddForm} className="btn-primary text-sm">
                  <Plus className="w-4 h-4" /> Add Activity
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="w-10">No.</th>
                  <th>Date</th>
                  <th>Activity / Task</th>
                  <th>Category</th>
                  <th className="text-right">Est. Hours</th>
                  <th className="text-right">Actual Hours</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity: any, idx: number) => (
                  <tr key={activity.id}>
                    <td className="text-gray-400 font-medium">{idx + 1}</td>
                    <td className="text-gray-500 whitespace-nowrap">
                      {new Date(activity.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td>
                      <div className="max-w-[200px]">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1">{activity.title}</p>
                        {activity.isOverdue && (
                          <span className="text-[10px] text-red-600 font-semibold">OVERDUE</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {CATEGORY_LABELS[activity.category] || activity.category}
                      </span>
                    </td>
                    <td className="text-right font-medium text-gray-700">{toHrs(activity.estimatedMinutes)}</td>
                    <td className="text-right font-medium text-gray-700">{toHrs(activity.actualMinutes)}</td>
                    <td><StatusBadge status={activity.status} /></td>
                    <td>
                      {activity.priorityLevel && activity.status !== 'COMPLETED' && (
                        <PriorityBadge priority={activity.priorityLevel} />
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        {activity.status !== 'COMPLETED' && (
                          <button
                            onClick={() => statusMutation.mutate({ id: activity.id, status: 'COMPLETED' })}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(activity)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to archive this activity?')) {
                              deleteMutation.mutate(activity.id);
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Archive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default ActivitiesPage;
