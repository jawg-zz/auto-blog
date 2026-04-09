import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Rss, 
  Share2, 
  Calendar, 
  Folder, 
  Tag, 
  ScrollText, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/posts', icon: FileText, label: 'Posts' },
  { to: '/sources', icon: Rss, label: 'Sources' },
  { to: '/platforms', icon: Share2, label: 'Platforms' },
  { to: '/schedules', icon: Calendar, label: 'Schedules' },
  { to: '/categories', icon: Folder, label: 'Categories' },
  { to: '/tags', icon: Tag, label: 'Tags' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
  { to: '/settings', icon: Settings, label: 'Settings' }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={clsx(
        "fixed top-0 left-0 z-40 w-64 h-screen bg-gray-900 text-white transition-transform transform lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-400">AutoBlog</h1>
          <p className="text-sm text-gray-400 mt-1">Content Management</p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'sidebar-link',
                isActive && 'active'
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
}
