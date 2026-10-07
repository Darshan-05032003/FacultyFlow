import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Login from './features/auth/pages/Login';
import Register from './features/auth/pages/Register';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import ProfilePage from './features/profile/pages/ProfilePage';
import SettingsPage from './features/settings/pages/SettingsPage';
import ActivitiesPage from './features/activities/pages/ActivitiesPage';
import HodDashboard from './features/department/pages/HodDashboard';
import ForecastPage from './features/forecast/pages/ForecastPage';
import PrioritizationPage from './features/prioritization/pages/PrioritizationPage';
import { WorkloadSimulatorPage } from './features/simulator/pages/WorkloadSimulatorPage';
import { ReportsPage } from './features/reports/pages/ReportsPage';

// Placeholder Pages
const Calendar = () => <div className="p-6">Calendar Page</div>;
const Workload = () => <div className="p-6">Workload Page</div>;
const Analytics = () => <div className="p-6">Analytics Page</div>;
const Notifications = () => <div className="p-6">Notifications Page</div>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="priorities" element={<PrioritizationPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="workload" element={<Workload />} />
          <Route path="forecast" element={<ForecastPage />} />
          <Route path="simulator" element={<WorkloadSimulatorPage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* HOD/ADMIN ONLY ROUTES */}
          <Route element={<ProtectedRoute allowedRoles={['HOD', 'ADMIN']} />}>
            <Route path="department/dashboard" element={<HodDashboard />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
