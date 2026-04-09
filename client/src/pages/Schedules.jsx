import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2, Play, Pause, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [sources, setSources] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedulesRes, sourcesRes, platformsRes] = await Promise.all([
        api.schedules.list(),
        api.sources.list(),
        api.platforms.list()
      ]);
      setSchedules(schedulesRes.data);
      setSources(sourcesRes.data);
      setPlatforms(platformsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await api.schedules.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const handleToggle = async (schedule) => {
    try {
      await api.schedules.update(schedule.id, { ...schedule, enabled: !schedule.enabled });
      loadData();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const handleTrigger = async (id) => {
    try {
      await api.schedules.trigger(id);
      alert('Schedule triggered successfully');
    } catch (error) {
      console.error('Failed to trigger schedule:', error);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingSchedule) {
        await api.schedules.update(editingSchedule.id, formData);
      } else {
        await api.schedules.create(formData);
      }
      setShowModal(false);
      setEditingSchedule(null);
      loadData();
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
        <button
          onClick={() => { setEditingSchedule(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Schedule
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 text-primary-600 rounded-lg">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{schedule.name}</h3>
                  <p className="text-sm text-gray-500">
                    Source: {schedule.source?.name || 'Unknown'} • Cron: {schedule.cronExpression}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Last run: {schedule.lastRun ? format(new Date(schedule.lastRun), 'MMM d, h:mm a') : 'Never'}</span>
                    <span>Next run: {schedule.nextRun ? format(new Date(schedule.nextRun), 'MMM d, h:mm a') : 'Not scheduled'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx(
                  'badge',
                  schedule.enabled ? 'badge-success' : 'badge-error'
                )}>
                  {schedule.enabled ? 'Active' : 'Paused'}
                </span>
                <button
                  onClick={() => handleTrigger(schedule.id)}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="Run Now"
                >
                  <Play size={18} />
                </button>
                <button
                  onClick={() => handleToggle(schedule)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  {schedule.enabled ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  onClick={() => { setEditingSchedule(schedule); setShowModal(true); }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {schedules.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            No schedules configured yet
          </div>
        )}
      </div>

      {showModal && (
        <ScheduleModal
          schedule={editingSchedule}
          sources={sources}
          platforms={platforms}
          onClose={() => { setShowModal(false); setEditingSchedule(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function ScheduleModal({ schedule, sources, platforms, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    sourceId: schedule?.sourceId || '',
    platformIds: schedule?.platformIds || [],
    cronExpression: schedule?.cronExpression || '0 * * * *',
    enabled: schedule?.enabled ?? true
  });

  const cronPresets = [
    { value: '*/5 * * * *', label: 'Every 5 minutes' },
    { value: '*/15 * * * *', label: 'Every 15 minutes' },
    { value: '*/30 * * * *', label: 'Every 30 minutes' },
    { value: '0 * * * *', label: 'Every hour' },
    { value: '0 */6 * * *', label: 'Every 6 hours' },
    { value: '0 0 * * *', label: 'Daily at midnight' },
    { value: '0 9 * * *', label: 'Daily at 9 AM' }
  ];

  const togglePlatform = (id) => {
    const current = formData.platformIds;
    if (current.includes(id)) {
      setFormData({ ...formData, platformIds: current.filter(p => p !== id) });
    } else {
      setFormData({ ...formData, platformIds: [...current, id] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.platformIds.length === 0) {
      alert('Please select at least one platform');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{schedule ? 'Edit Schedule' : 'Add Schedule'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              className="input"
              placeholder="Daily RSS Import"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Content Source</label>
            <select
              className="input"
              value={formData.sourceId}
              onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
              required
            >
              <option value="">Select a source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>{source.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Cron Expression</label>
            <select
              className="input"
              value={formData.cronExpression}
              onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
            >
              {cronPresets.map((preset) => (
                <option key={preset.value} value={preset.value}>{preset.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Current: {formData.cronExpression}
            </p>
          </div>

          <div>
            <label className="label">Publish to Platforms</label>
            <div className="space-y-2 mt-2">
              {platforms.map((platform) => (
                <label key={platform.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.platformIds.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="font-medium">{platform.name}</span>
                  <span className="text-sm text-gray-500">{platform.type}</span>
                </label>
              ))}
              {platforms.length === 0 && (
                <p className="text-sm text-gray-500">No platforms available</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {schedule ? 'Update' : 'Create'} Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
