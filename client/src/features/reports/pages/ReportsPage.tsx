import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkloadAnalytics } from '../../workload/api/analytics';
import { getActivities } from '../../activities/api/activities';
import { useAuth } from '../../auth/contexts/AuthContext';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['workloadAnalytics', dateRange],
    queryFn: () => getWorkloadAnalytics(dateRange),
  });

  const { data: activitiesResponse, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['activities', dateRange],
    queryFn: () => getActivities({ from: dateRange.startDate, to: dateRange.endDate }),
  });

  const handleExportCSV = () => {
    if (!activitiesResponse?.data?.data) return;
    
    const activities = activitiesResponse.data.data;
    
    // Create CSV header
    const headers = [
      'Title',
      'Category',
      'Status',
      'Date',
      'Estimated Minutes',
      'Actual Minutes',
      'Location',
      'Course ID'
    ].join(',');

    // Create CSV rows
    const rows = activities.map((activity: any) => {
      return [
        `"${activity.title.replace(/"/g, '""')}"`,
        activity.category,
        activity.status,
        new Date(activity.date).toLocaleDateString(),
        activity.estimatedMinutes,
        activity.actualMinutes || 0,
        `"${(activity.location || '').replace(/"/g, '""')}"`,
        `"${(activity.courseId || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FacultyFlow_Workload_Report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Workload Reports</h1>
        <div className="flex space-x-3">
          <button
            onClick={handleExportCSV}
            disabled={isLoadingActivities || !activitiesResponse?.data?.data?.length}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={isLoadingAnalytics}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Print PDF / Report
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none">
        <div className="mb-6 print:mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Faculty Workload Summary Report</h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p><span className="font-semibold">Faculty Name:</span> {(user as any)?.name || (user as any)?.firstName || 'Faculty Member'}</p>
              <p><span className="font-semibold">Email:</span> {user?.email}</p>
              <p><span className="font-semibold">Role:</span> {user?.role}</p>
            </div>
            <div className="print:hidden">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reporting Period</label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="rounded-md border-gray-300 text-sm"
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="rounded-md border-gray-300 text-sm"
                />
              </div>
            </div>
            <div className="hidden print:block">
              <p><span className="font-semibold">Reporting Period:</span> {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}</p>
              <p><span className="font-semibold">Generated On:</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {isLoadingAnalytics ? (
          <div className="text-center py-12">Loading report data...</div>
        ) : analytics ? (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">High-Level Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Planned</p>
                  <p className="text-2xl font-bold text-gray-900">{(analytics.totalPlannedMinutes / 60).toFixed(1)} hrs</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Actual</p>
                  <p className="text-2xl font-bold text-gray-900">{(analytics.totalActualMinutes / 60).toFixed(1)} hrs</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Variance</p>
                  <p className={`text-2xl font-bold ${analytics.varianceMinutes > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {analytics.varianceMinutes > 0 ? '+' : ''}{(analytics.varianceMinutes / 60).toFixed(1)} hrs
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{analytics.completionRate}%</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Category Breakdown</h3>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Category</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Planned Hours</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actual Hours</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {analytics.categoryDistribution?.map((cat: any) => (
                      <tr key={cat.category}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{cat.category}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{(cat.minutes / 60).toFixed(1)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">-</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{cat.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500 hidden print:block">
              End of Report — Generated by FacultyFlow System
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReportsPage;
