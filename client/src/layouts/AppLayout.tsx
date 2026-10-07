import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  BarChart3,
  TrendingUp,
  FileText,
  GraduationCap,
  Bell,
  Users,
  ChevronDown,
  Menu,
  X,
  LogOut,
  User,
  Settings,
  PlayCircle,
  ListTodo,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AIAssistantChat } from '../features/aiAssistant/components/AIAssistantChat';
import { useAuth } from '../features/auth/contexts/AuthContext';

const facultyNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Activities', href: '/activities', icon: Activity },
  { name: 'Tasks', href: '/priorities', icon: ListTodo },
  { name: 'Analysis', href: '/workload', icon: BarChart3 },
  { name: 'Forecast', href: '/forecast', icon: TrendingUp },
  { name: 'Simulator', href: '/simulator', icon: PlayCircle },
  { name: 'Reports', href: '/reports', icon: FileText },
];

const hodNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Faculty', href: '/department/dashboard', icon: Users },
  { name: 'Activities', href: '/activities', icon: Activity },
  { name: 'Tasks', href: '/priorities', icon: ListTodo },
  { name: 'Analysis', href: '/workload', icon: BarChart3 },
  { name: 'Forecast', href: '/forecast', icon: TrendingUp },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const isHodOrAdmin = user?.role === 'HOD' || user?.role === 'ADMIN';
  const navigation = isHodOrAdmin ? hodNavigation : facultyNavigation;

  const getDesignation = () => {
    const profile = user?.facultyProfile;
    if (profile?.designation) return profile.designation;
    if (user?.role === 'HOD') return 'HOD · ' + (profile?.department?.name || 'Computer Engineering');
    if (user?.role === 'ADMIN') return 'System Administrator';
    return profile?.department?.name || 'Faculty';
  };

  const handleLogout = async () => {
    await logout();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-white text-sm font-bold">Faculty Workload &</p>
            <p className="text-white text-sm font-bold">Task Optimization</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn('sidebar-nav-item', isActive && 'active')
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="p-3 border-t border-white/10 space-y-1 flex-shrink-0">
        <NavLink
          to="/profile"
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) => cn('sidebar-nav-item', isActive && 'active')}
        >
          <User className="h-5 w-5 flex-shrink-0" />
          <span>Profile</span>
        </NavLink>
        <NavLink
          to="/settings"
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) => cn('sidebar-nav-item', isActive && 'active')}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-left"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f8]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#1a2b47] flex-col flex-shrink-0 shadow-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-60 bg-[#1a2b47] flex flex-col">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10">
          {/* Left - hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop breadcrumb / spacer */}
          <div className="hidden lg:flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200" />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none">
                  <span className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{getDesignation()}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-20 py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <div className="border-t border-gray-100 mt-1" />
                    <button
                      onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      <AIAssistantChat />
    </div>
  );
}
