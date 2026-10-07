import { useState } from 'react';
import { useAuth } from '../../auth/contexts/AuthContext';
import { User, Moon, Bell, Shield } from 'lucide-react';
import { PageHeader, SectionCard } from '../../../components/ui/SharedComponents';

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account preferences and settings."
      />

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          <SectionCard noPadding>
            <div className="p-8">
              {activeTab === 'account' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Basic account details and preferences.
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name</label>
                      <div className="mt-1 text-sm font-medium text-gray-900">{user?.name}</div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email address</label>
                      <div className="mt-1 text-sm text-gray-900">{user?.email}</div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Role</label>
                      <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {user?.role}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Account Status</label>
                      <div className="mt-1 flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${user?.isActive ? 'bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {user?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Customize how FacultyFlow looks on your device.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-sm flex items-start gap-3">
                    <span className="text-xl">🚧</span>
                    <div>
                      <p className="font-semibold mb-1">Under Construction</p>
                      <p>Theme settings will be implemented in a future update.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage how you receive alerts and updates.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-sm flex items-start gap-3">
                    <span className="text-xl">🔔</span>
                    <div>
                      <p className="font-semibold mb-1">Coming Soon</p>
                      <p>Notification preferences will be implemented alongside the notification system in Phase 9.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Security</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage your password and security settings.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm">
                    <p className="font-medium mb-1">Password Management</p>
                    <p className="text-gray-500">Password management will be implemented when requested by the administrator. Contact IT support for password resets.</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
