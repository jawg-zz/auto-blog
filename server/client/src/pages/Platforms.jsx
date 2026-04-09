import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2, Play, X, Globe, Ghost, Share, Code } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const platformTypes = [
  { value: 'wordpress', label: 'WordPress', icon: Globe },
  { value: 'ghost', label: 'Ghost', icon: Ghost },
  { value: 'medium', label: 'Medium', icon: Share },
  { value: 'custom_api', label: 'Custom API', icon: Code }
];

export default function Platforms() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const { data } = await api.platforms.list();
      setPlatforms(data);
    } catch (error) {
      console.error('Failed to load platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this platform?')) return;
    try {
      await api.platforms.delete(id);
      loadPlatforms();
    } catch (error) {
      console.error('Failed to delete platform:', error);
    }
  };

  const handleToggle = async (platform) => {
    try {
      await api.platforms.update(platform.id, { ...platform, enabled: !platform.enabled });
      loadPlatforms();
    } catch (error) {
      console.error('Failed to toggle platform:', error);
    }
  };

  const handleTest = async (id) => {
    try {
      const { data } = await api.platforms.test(id);
      alert(data.success ? 'Connection successful!' : `Test failed: ${data.error}`);
    } catch (error) {
      alert('Test failed: ' + error.message);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingPlatform) {
        await api.platforms.update(editingPlatform.id, formData);
      } else {
        await api.platforms.create(formData);
      }
      setShowModal(false);
      setEditingPlatform(null);
      loadPlatforms();
    } catch (error) {
      console.error('Failed to save platform:', error);
    }
  };

  const getTypeIcon = (type) => {
    const t = platformTypes.find(p => p.value === type);
    return t ? t.icon : Globe;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Publishing Platforms</h1>
        <button
          onClick={() => { setEditingPlatform(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Platform
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => {
          const TypeIcon = getTypeIcon(platform.type);
          return (
            <div key={platform.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'p-3 rounded-lg',
                    platform.type === 'wordpress' ? 'bg-blue-100 text-blue-600' :
                    platform.type === 'ghost' ? 'bg-green-100 text-green-600' :
                    platform.type === 'medium' ? 'bg-gray-900 text-white' :
                    'bg-purple-100 text-purple-600'
                  )}>
                    <TypeIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-500">
                      {platformTypes.find(t => t.value === platform.type)?.label}
                    </p>
                  </div>
                </div>
                <span className={clsx(
                  'badge',
                  platform.enabled ? 'badge-success' : 'badge-error'
                )}>
                  {platform.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                {platform.credentials?.siteUrl && (
                  <p className="truncate">{platform.credentials.siteUrl}</p>
                )}
                {platform.credentials?.adminUrl && (
                  <p className="truncate">{platform.credentials.adminUrl}</p>
                )}
                {platform.credentials?.baseUrl && (
                  <p className="truncate">{platform.credentials.baseUrl}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-gray-500">
                  Updated {format(new Date(platform.updatedAt), 'MMM d, yyyy')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTest(platform.id)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Test Connection"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={() => handleToggle(platform)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    {platform.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => { setEditingPlatform(platform); setShowModal(true); }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(platform.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {platforms.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No platforms configured yet
          </div>
        )}
      </div>

      {showModal && (
        <PlatformModal
          platform={editingPlatform}
          onClose={() => { setShowModal(false); setEditingPlatform(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function PlatformModal({ platform, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: platform?.name || '',
    type: platform?.type || 'wordpress',
    credentials: platform?.credentials || {},
    enabled: platform?.enabled ?? true
  });

  const handleTypeChange = (type) => {
    setFormData({
      ...formData,
      type,
      credentials: type === 'wordpress' ? { siteUrl: '', username: '', appPassword: '' } :
                   type === 'ghost' ? { adminUrl: '', apiKey: '' } :
                   type === 'medium' ? { accessToken: '', userId: '' } :
                   { baseUrl: '', apiKey: '', headers: {} }
    });
  };

  const handleCredentialChange = (key, value) => {
    setFormData({
      ...formData,
      credentials: { ...formData.credentials, [key]: value }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{platform ? 'Edit Platform' : 'Add Platform'}</h2>
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
              placeholder="My WordPress Blog"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Platform Type</label>
            <div className="grid grid-cols-2 gap-2">
              {platformTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={clsx(
                    'p-3 rounded-lg border-2 flex items-center gap-2 transition-colors',
                    formData.type === type.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <type.icon size={20} />
                  <span className="text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.type === 'wordpress' && (
            <>
              <div>
                <label className="label">Site URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://myblog.com"
                  value={formData.credentials.siteUrl || ''}
                  onChange={(e) => handleCredentialChange('siteUrl', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  className="input"
                  value={formData.credentials.username || ''}
                  onChange={(e) => handleCredentialChange('username', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Application Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={formData.credentials.appPassword || ''}
                  onChange={(e) => handleCredentialChange('appPassword', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {formData.type === 'ghost' && (
            <>
              <div>
                <label className="label">Admin URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://myblog.ghost.io"
                  value={formData.credentials.adminUrl || ''}
                  onChange={(e) => handleCredentialChange('adminUrl', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Admin API Key</label>
                <input
                  type="text"
                  className="input"
                  placeholder="YOUR_API_KEY"
                  value={formData.credentials.apiKey || ''}
                  onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {formData.type === 'medium' && (
            <>
              <div>
                <label className="label">User ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your Medium User ID"
                  value={formData.credentials.userId || ''}
                  onChange={(e) => handleCredentialChange('userId', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Integration Token</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Your Medium Integration Token"
                  value={formData.credentials.accessToken || ''}
                  onChange={(e) => handleCredentialChange('accessToken', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {formData.type === 'custom_api' && (
            <>
              <div>
                <label className="label">Base URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://api.example.com"
                  value={formData.credentials.baseUrl || ''}
                  onChange={(e) => handleCredentialChange('baseUrl', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">API Key</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Your API Key"
                  value={formData.credentials.apiKey || ''}
                  onChange={(e) => handleCredentialChange('apiKey', e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {platform ? 'Update' : 'Create'} Platform
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
