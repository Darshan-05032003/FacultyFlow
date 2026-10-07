import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWorkloadAnalytics } from '../../workload/api/analytics';
import { getActivities } from '../../activities/api/activities';
import { useAuth } from '../../auth/contexts/AuthContext';
import { PageHeader, LoadingState, ErrorState, FilterBar } from '../../../components/ui/SharedComponents';
import { Download, Printer, FileText } from 'lucide-react';

function getPeriodDates() {
  const now = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 1, 1);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
}

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [customStart, setCustomStart] = useState(getPeriodDates().startDate);
  const [customEnd, setCustomEnd] = useState(getPeriodDates().endDate);
  const [appliedFilters, setAppliedFilters] = useState(() => getPeriodDates());

  const { data: analyticsResp, isLoading: isLoadingAnalytics, isError } = useQuery({
    queryKey: ['workloadAnalytics', appliedFilters.startDate, appliedFilters.endDate],
    queryFn: () => getWorkloadAnalytics(appliedFilters),
  });

  const { data: activitiesResponse, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['activities', appliedFilters.startDate, appliedFilters.endDate],
    queryFn: () => getActivities({ from: appliedFilters.startDate, to: appliedFilters.endDate }),
  });

  const handleApply = () => {
    setAppliedFilters({ startDate: customStart, endDate: customEnd });
  };

  const handleExportCSV = () => {
    const rawActivities = (activitiesResponse as any)?.data;
    const activities = Array.isArray(rawActivities)
      ? rawActivities
      : (Array.isArray(rawActivities?.activities) ? rawActivities.activities : (Array.isArray(activitiesResponse) ? activitiesResponse : []));
    if (!activities || activities.length === 0) return;
    
    const headers = ['Title', 'Category', 'Status', 'Date', 'Estimated Minutes', 'Actual Minutes', 'Location', 'Course ID'].join(',');
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
    link.setAttribute('download', `FacultyFlow_Workload_Report_${appliedFilters.startDate}_to_${appliedFilters.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const filterFields = [
    {
      label: 'From Date',
      className: 'min-w-[140px]',
      children: (
        <input type="date" value={customStart}
          onChange={e => setCustomStart(e.target.value)}
          className="filter-input" />
      ),
    },
    {
      label: 'To Date',
      className: 'min-w-[140px]',
      children: (
        <input type="date" value={customEnd}
          onChange={e => setCustomEnd(e.target.value)}
          className="filter-input" />
      ),
    },
  ];

  const analytics = analyticsResp?.data;

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex justify-between items-start print:hidden">
        <PageHeader 
          title="Workload Reports" 
          subtitle="Generate, print, and export your workload data."
        />
        <div className="flex space-x-3 mt-1">
          <button
            onClick={handleExportCSV}
            disabled={isLoadingActivities || !(activitiesResponse as any)?.data?.length}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={isLoadingAnalytics || !analytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      <div className="print:hidden">
        <FilterBar fields={filterFields} onApply={handleApply} isLoading={isLoadingAnalytics} />
      </div>

      {isLoadingAnalytics ? (
        <div className="print:hidden"><LoadingState message="Loading report data..." /></div>
      ) : isError ? (
        <div className="print:hidden"><ErrorState message="Failed to load analytics data" /></div>
      ) : analytics ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
          <div className="mb-8 border-b border-gray-200 pb-6 print:border-b-2 print:border-black">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600 print:text-black" />
                  Workload Summary Report
                </h2>
                <p className="text-gray-500 mt-1 print:text-black">FacultyFlow System</p>
              </div>
              <div className="text-right text-sm text-gray-600 print:text-black">
                <p><span className="font-semibold">Generated On:</span> {new Date().toLocaleDateString()}</p>
                <p><span className="font-semibold">Reporting Period:</span> {new Date(appliedFilters.startDate).toLocaleDateString()} - {new Date(appliedFilters.endDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-100 print:bg-transparent print:border-none print:p-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 print:text-lg uppercase">Faculty Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 print:text-black">
                <p><span className="font-medium text-gray-500 print:text-black">Name:</span> {(user as any)?.name || (user as any)?.firstName}</p>
                <p><span className="font-medium text-gray-500 print:text-black">Email:</span> {user?.email}</p>
                <p><span className="font-medium text-gray-500 print:text-black">Role:</span> {user?.role}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-xl border-b pb-2">High-Level Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 print:border print:border-gray-300">
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1 print:text-black">Total Planned</p>
                  <p className="text-2xl font-bold text-blue-900 print:text-black">{(analytics.overview.estimatedMinutes / 60).toFixed(1)} hrs</p>
                </div>
                <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 print:border print:border-gray-300">
                  <p className="text-xs text-green-600 uppercase font-semibold mb-1 print:text-black">Total Actual</p>
                  <p className="text-2xl font-bold text-green-900 print:text-black">{(analytics.overview.actualMinutes / 60).toFixed(1)} hrs</p>
                </div>
                <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100 print:border print:border-gray-300">
                  <p className="text-xs text-orange-600 uppercase font-semibold mb-1 print:text-black">Variance</p>
                  <p className={`text-2xl font-bold ${analytics.overview.varianceMinutes > 0 ? 'text-orange-700' : 'text-green-700'} print:text-black`}>
                    {analytics.overview.varianceMinutes > 0 ? '+' : ''}{(analytics.overview.varianceMinutes / 60).toFixed(1)} hrs
                  </p>
                </div>
                <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100 print:border print:border-gray-300">
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1 print:text-black">Completion Rate</p>
                  <p className="text-2xl font-bold text-purple-900 print:text-black">{Math.round(analytics.completion.activityRate)}%</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-xl border-b pb-2">Category Breakdown</h3>
              <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg print:shadow-none print:ring-0 print:border print:border-gray-300">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Category</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Planned Hours</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actual Hours</th>
                      <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {analytics.categoryDistribution?.map((cat: any) => {
                      const planned = cat.estimatedMinutes / 60;
                      const actual = cat.actualMinutes / 60;
                      const variance = actual - planned;
                      return (
                        <tr key={cat.category}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{cat.category}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600 text-right">{planned.toFixed(1)}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium text-right">{actual.toFixed(1)}</td>
                          <td className={`whitespace-nowrap px-3 py-4 text-sm font-medium text-right ${variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            {variance > 0 ? '+' : ''}{variance.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500 hidden print:block">
              End of Report — Generated by FacultyFlow System
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReportsPage;
