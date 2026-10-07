import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { simulateWorkload, SimulatorAction } from '../api/simulatorApi';

export const WorkloadSimulatorPage: React.FC = () => {
  const [action, setAction] = useState<SimulatorAction>({
    type: 'ADD_ACTIVITY',
    title: '',
    category: 'TEACHING',
    date: new Date().toISOString().split('T')[0],
    estimatedMinutes: 60
  });

  const simulatorMutation = useMutation({
    mutationFn: (act: SimulatorAction) => simulateWorkload(act)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // basic validation
    if (action.type === 'ADD_ACTIVITY' && (!action.title || !action.estimatedMinutes)) return;
    if ((action.type === 'MOVE_ACTIVITY' || action.type === 'CHANGE_DURATION' || action.type === 'REMOVE_ACTIVITY') && !action.activityId) return;
    
    simulatorMutation.mutate(action);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workload "What-If" Simulator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Test hypothetical changes to your workload over the next 30 days without modifying real data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg text-gray-900">Configure Scenario</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Action Type</label>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={action.type}
                  onChange={e => setAction({ ...action, type: e.target.value as any, activityId: '' })}
                >
                  <option value="ADD_ACTIVITY">Add New Activity</option>
                  <option value="CHANGE_DURATION">Change Duration (Existing)</option>
                  <option value="MOVE_ACTIVITY">Reschedule (Existing)</option>
                  <option value="REMOVE_ACTIVITY">Remove (Existing)</option>
                </select>
              </div>

              {action.type === 'ADD_ACTIVITY' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={action.title || ''} onChange={e => setAction({...action, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={action.category || 'TEACHING'} onChange={e => setAction({...action, category: e.target.value})}>
                      <option value="TEACHING">Teaching</option>
                      <option value="RESEARCH">Research</option>
                      <option value="ADMIN">Administrative</option>
                      <option value="MENTORING">Mentoring</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={action.date || ''} onChange={e => setAction({...action, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Minutes</label>
                    <input type="number" required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={action.estimatedMinutes || 60} onChange={e => setAction({...action, estimatedMinutes: parseInt(e.target.value)})} />
                  </div>
                </>
              )}

              {action.type !== 'ADD_ACTIVITY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Activity ID (Paste ID)</label>
                  <input type="text" required placeholder="Paste Activity ID here" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={action.activityId || ''} onChange={e => setAction({...action, activityId: e.target.value})} />
                </div>
              )}

              {action.type === 'CHANGE_DURATION' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Estimated Minutes</label>
                  <input type="number" required min="1" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={action.estimatedMinutes || 60} onChange={e => setAction({...action, estimatedMinutes: parseInt(e.target.value)})} />
                </div>
              )}

              {action.type === 'MOVE_ACTIVITY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Date</label>
                  <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={action.newDate || ''} onChange={e => setAction({...action, newDate: e.target.value})} />
                </div>
              )}

              <button
                type="submit"
                disabled={simulatorMutation.isPending}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {simulatorMutation.isPending ? 'Simulating...' : 'Run Simulation'}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-lg text-gray-900">Simulation Results</h3>
          </div>
          <div className="p-6">
            {simulatorMutation.isError && (
              <div className="text-red-600 p-4 bg-red-50 rounded-md">Error running simulation. Check Activity ID.</div>
            )}
            {!simulatorMutation.data && !simulatorMutation.isError && (
              <div className="text-gray-500 italic flex items-center justify-center h-40">
                Run a simulation to see the impact here.
              </div>
            )}
            
            {simulatorMutation.data && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Baseline (Next 30 Days)</h4>
                    <div className="text-2xl font-bold text-gray-900">{simulatorMutation.data.baseline.utilizationPercent}% <span className="text-sm font-normal text-gray-500">utilization</span></div>
                    <div className="text-sm text-gray-600 mt-1">Status: <span className="font-semibold">{simulatorMutation.data.baseline.workloadStatus}</span></div>
                    <div className="text-sm text-gray-600">Overload Days: {simulatorMutation.data.baseline.overloadDays}</div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Simulated Scenario</h4>
                    <div className="text-2xl font-bold text-blue-900">{simulatorMutation.data.scenario.utilizationPercent}% <span className="text-sm font-normal text-blue-700">utilization</span></div>
                    <div className="text-sm text-blue-800 mt-1">Status: <span className="font-semibold">{simulatorMutation.data.scenario.workloadStatus}</span></div>
                    <div className="text-sm text-blue-800">Overload Days: {simulatorMutation.data.scenario.overloadDays}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 border-b pb-2 mb-3">Impact Analysis</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between text-sm">
                      <span className="text-gray-600">Workload Load:</span>
                      <span className={`font-semibold ${simulatorMutation.data.impact.workloadMinutesDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {simulatorMutation.data.impact.workloadMinutesDelta > 0 ? '+' : ''}{simulatorMutation.data.impact.workloadMinutesDelta} mins
                      </span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilization Shift:</span>
                      <span className={`font-semibold ${simulatorMutation.data.impact.utilizationDelta > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {simulatorMutation.data.impact.utilizationDelta > 0 ? '+' : ''}{simulatorMutation.data.impact.utilizationDelta}%
                      </span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-gray-600">Overload Days Delta:</span>
                      <span className={`font-semibold ${simulatorMutation.data.impact.overloadDaysDelta > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                        {simulatorMutation.data.impact.overloadDaysDelta > 0 ? '+' : ''}{simulatorMutation.data.impact.overloadDaysDelta} days
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
