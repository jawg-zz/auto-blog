import { useState, useEffect } from 'react';
import { api } from '../api';
import { CheckCircle, XCircle, RotateCcw, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data } = await api.get('/logs');
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (postId) => {
    try {
      await api.posts.retry(postId);
      alert('Retry queued');
    } catch (error) {
      console.error('Failed to retry:', error);
    }
  };

  const filteredLogs = filter
    ? logs.filter(log => log.status === filter)
    : logs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Publishing Logs</h1>
        <select
          className="input w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="retrying">Retrying</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Post</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{log.post?.title || 'Untitled'}</p>
                  {log.errorMessage && (
                    <p className="text-sm text-red-500 truncate max-w-xs">{log.errorMessage}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {log.platform?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    'badge',
                    log.status === 'success' ? 'badge-success' :
                    log.status === 'failed' ? 'badge-error' : 'badge-warning'
                  )}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {log.attempts}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {log.publishedUrl && (
                      <a
                        href={log.publishedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    {log.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(log.postId)}
                        className="p-2 text-gray-400 hover:text-green-600"
                        title="Retry"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
