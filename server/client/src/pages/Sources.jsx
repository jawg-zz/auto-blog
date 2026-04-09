import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2, Play, Pause, X, Rss, Bot, FileText, Star, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import popularFeeds from '../constants/popular-feeds.json';

const sourceTypes = [
  { value: 'rss', label: 'RSS Feed', icon: Rss },
  { value: 'manual', label: 'Manual Input', icon: FileText },
  { value: 'ai_generation', label: 'AI Generation', icon: Bot }
];

export default function Sources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [showPopularModal, setShowPopularModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [addingFeed, setAddingFeed] = useState(null);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const { data } = await api.sources.list();
      setSources(data);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    try {
      await api.sources.delete(id);
      loadSources();
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const handleToggle = async (source) => {
    try {
      await api.sources.update(source.id, { ...source, enabled: !source.enabled });
      loadSources();
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  };

  const handleTest = async (id) => {
    try {
      const { data } = await api.sources.test(id);
      alert(data.success ? `Test successful! Found ${data.items} items.` : `Test failed: ${data.error}`);
    } catch (error) {
      alert('Test failed: ' + error.message);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingSource) {
        await api.sources.update(editingSource.id, formData);
      } else {
        await api.sources.create(formData);
      }
      setShowModal(false);
      setEditingSource(null);
      loadSources();
    } catch (error) {
      console.error('Failed to save source:', error);
    }
  };

  const getTypeIcon = (type) => {
    const t = sourceTypes.find(s => s.value === type);
    return t ? t.icon : FileText;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Content Sources</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPopularModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Star size={20} />
            Popular Feeds
            <ChevronDown size={16} />
          </button>
          <button
            onClick={() => { setEditingSource(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Source
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => {
          const TypeIcon = getTypeIcon(source.type);
          return (
            <div key={source.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'p-3 rounded-lg',
                    source.type === 'rss' ? 'bg-orange-100 text-orange-600' :
                    source.type === 'ai_generation' ? 'bg-purple-100 text-purple-600' :
                    'bg-blue-100 text-blue-600'
                  )}>
                    <TypeIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{source.name}</h3>
                    <p className="text-sm text-gray-500">{sourceTypes.find(t => t.value === source.type)?.label}</p>
                  </div>
                </div>
                <span className={clsx(
                  'badge',
                  source.enabled ? 'badge-success' : 'badge-error'
                )}>
                  {source.enabled ? 'Active' : 'Paused'}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                {source.type === 'rss' && (
                  <p className="truncate">{source.config?.url || 'No URL configured'}</p>
                )}
                {source.type === 'ai_generation' && (
                  <p>{source.config?.topic || 'No topic set'}</p>
                )}
                {source.type === 'manual' && (
                  <p>Manual content entry</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-gray-500">
                  Created {format(new Date(source.createdAt), 'MMM d, yyyy')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTest(source.id)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Test"
                  >
                    <Play size={16} />
                  </button>
                  <button
                    onClick={() => handleToggle(source)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title={source.enabled ? 'Pause' : 'Resume'}
                  >
                    {source.enabled ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => { setEditingSource(source); setShowModal(true); }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sources.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No sources configured yet
          </div>
        )}
      </div>

      {showModal && (
        <SourceModal
          source={editingSource}
          onClose={() => { setShowModal(false); setEditingSource(null); }}
          onSubmit={handleSubmit}
        />
      )}

      {showPopularModal && (
        <PopularFeedsModal
          sources={sources}
          onClose={() => setShowPopularModal(false)}
          onAdd={async (feed) => {
            setAddingFeed(feed.name);
            try {
              await api.sources.create({
                name: feed.name,
                type: 'rss',
                config: {
                  url: feed.url,
                  refreshInterval: feed.refreshInterval,
                  maxItems: 20
                },
                enabled: true
              });
              loadSources();
            } catch (error) {
              console.error('Failed to add feed:', error);
              alert('Failed to add feed: ' + error.message);
            } finally {
              setAddingFeed(null);
            }
          }}
          addingFeed={addingFeed}
        />
      )}
    </div>
  );
}

function PopularFeedsModal({ sources, onClose, onAdd, addingFeed }) {
  const [selectedCategory, setSelectedCategory] = useState(popularFeeds.categories[0]?.id);
  const [selectedFeeds, setSelectedFeeds] = useState([]);

  const existingUrls = sources.filter(s => s.type === 'rss').map(s => s.config?.url);
  const currentCategory = popularFeeds.categories.find(c => c.id === selectedCategory);
  const availableFeeds = currentCategory?.feeds.filter(f => !existingUrls.includes(f.url)) || [];

  const toggleFeed = (feed) => {
    setSelectedFeeds(prev =>
      prev.includes(feed.name)
        ? prev.filter(n => n !== feed.name)
        : [...prev, feed.name]
    );
  };

  const handleAddSelected = () => {
    const feedsToAdd = currentCategory?.feeds.filter(f => selectedFeeds.includes(f.name)) || [];
    feedsToAdd.forEach(feed => onAdd(feed));
    setSelectedFeeds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Popular RSS Feeds</h2>
            <p className="text-sm text-gray-500 mt-1">Quick add popular feeds with one click</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-2">
            {popularFeeds.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  selectedCategory === cat.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat.label}
                <span className="ml-1 text-xs opacity-60">
                  ({cat.feeds.filter(f => !existingUrls.includes(f.url)).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {availableFeeds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              All feeds in this category are already added
            </div>
          ) : (
            <div className="grid gap-2">
              {availableFeeds.map((feed) => (
                <button
                  key={feed.name}
                  onClick={() => toggleFeed(feed)}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left',
                    selectedFeeds.includes(feed.name)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                      selectedFeeds.includes(feed.name)
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300'
                    )}>
                      {selectedFeeds.includes(feed.name) && <Check size={14} className="text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{feed.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-md">{feed.url}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {feed.refreshInterval}m refresh
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500">
            {selectedFeeds.length > 0
              ? `${selectedFeeds.length} feed${selectedFeeds.length > 1 ? 's' : ''} selected`
              : 'Select feeds to add'}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleAddSelected}
              disabled={selectedFeeds.length === 0 || addingFeed}
              className="btn-primary flex items-center gap-2"
            >
              {addingFeed ? (
                <>Adding {addingFeed}...</>
              ) : (
                <>
                  <Plus size={16} />
                  Add {selectedFeeds.length > 0 ? `${selectedFeeds.length} Feeds` : 'Selected'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceModal({ source, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: source?.name || '',
    type: source?.type || 'rss',
    config: source?.config || {},
    enabled: source?.enabled ?? true
  });

  const handleTypeChange = (type) => {
    setFormData({
      ...formData,
      type,
      config: type === 'rss' ? { url: '', refreshInterval: 60, maxItems: 20 } :
             type === 'ai_generation' ? { topic: '', keywords: [], tone: 'professional' } :
             {}
    });
  };

  const handleConfigChange = (key, value) => {
    setFormData({
      ...formData,
      config: { ...formData.config, [key]: value }
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
          <h2 className="text-xl font-semibold">{source ? 'Edit Source' : 'Add Source'}</h2>
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {sourceTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={clsx(
                    'p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors',
                    formData.type === type.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <type.icon size={20} />
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.type === 'rss' && (
            <>
              <div>
                <label className="label">RSS Feed URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://example.com/feed.xml"
                  value={formData.config.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Refresh Interval (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.config.refreshInterval || 60}
                    onChange={(e) => handleConfigChange('refreshInterval', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Max Items</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.config.maxItems || 20}
                    onChange={(e) => handleConfigChange('maxItems', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}

          {formData.type === 'ai_generation' && (
            <>
              <div>
                <label className="label">Topic</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Latest trends in technology"
                  value={formData.config.topic || ''}
                  onChange={(e) => handleConfigChange('topic', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Keywords (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="AI, automation, productivity"
                  value={(formData.config.keywords || []).join(', ')}
                  onChange={(e) => handleConfigChange('keywords', e.target.value.split(',').map(k => k.trim()))}
                />
              </div>
              <div>
                <label className="label">Tone</label>
                <select
                  className="input"
                  value={formData.config.tone || 'professional'}
                  onChange={(e) => handleConfigChange('tone', e.target.value)}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="authoritative">Authoritative</option>
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {source ? 'Update' : 'Create'} Source
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
