import { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  FileText, 
  Rss, 
  Share2, 
  Calendar, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await api.dashboard.stats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Posts"
          value={stats?.posts?.total || 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Published"
          value={stats?.posts?.published || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Scheduled"
          value={stats?.posts?.scheduled || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Failed"
          value={stats?.posts?.failed || 0}
          icon={XCircle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Sources" value={`${stats?.sources?.active || 0}/${stats?.sources?.total || 0}`} icon={Rss} />
        <Card title="Platforms" value={`${stats?.platforms?.active || 0}/${stats?.platforms?.total || 0}`} icon={Share2} />
        <Card title="Schedules" value={`${stats?.schedules?.active || 0}/${stats?.schedules?.total || 0}`} icon={Calendar} />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {stats?.recentActivity?.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity</p>
          ) : (
            stats?.recentActivity?.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'p-2 rounded-lg',
                    log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  )}>
                    {log.status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{log.post?.title || 'Untitled'}</p>
                    <p className="text-sm text-gray-500">
                      Published to {log.platform?.name || 'Unknown platform'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={clsx(
                    'text-sm font-medium',
                    log.status === 'success' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {log.status === 'success' ? 'Success' : 'Failed'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={clsx('p-3 rounded-lg', colorClasses[color])}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon size={20} className="text-gray-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
