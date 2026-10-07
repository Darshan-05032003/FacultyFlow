import { useState } from 'react';
import { useAuth } from '../../auth/contexts/AuthContext';
import { User, Moon, Bell, Shield } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          <div className="p-6 bg-white rounded-xl shadow-sm border dark:bg-gray-800 dark:border-gray-700">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Account Information</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Basic account details and preferences.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-white">{user?.name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-white">{user?.role}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-900 dark:text-white">
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
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Customize how FacultyFlow looks on your device.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded-md text-sm">
                  Theme settings will be implemented in a future update.
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage how you receive alerts and updates.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded-md text-sm">
                  Notification preferences will be implemented alongside the notification system in Phase 9.
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Security</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage your password and security settings.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 rounded-md text-sm">
                  Password management will be implemented when requested by the administrator. Contact IT support for password resets.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
