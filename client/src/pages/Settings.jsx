import { useState } from 'react';
import { api } from '../api';
import { Save, Brain, Key } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    aiProvider: 'openai',
    openaiKey: '',
    anthropicKey: '',
    defaultPostStatus: 'draft',
    autoPublish: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/settings', settings);
      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
          {message}
        </div>
      )}

      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Configuration</h2>
              <p className="text-sm text-gray-500">Configure AI content generation providers</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Default AI Provider</label>
              <select
                className="input max-w-xs"
                value={settings.aiProvider}
                onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Key size={16} />
                OpenAI API Key
              </label>
              <input
                type="password"
                className="input max-w-xl"
                placeholder="sk-..."
                value={settings.openaiKey}
                onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
              />
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Key size={16} />
                Anthropic API Key
              </label>
              <input
                type="password"
                className="input max-w-xl"
                placeholder="sk-ant-..."
                value={settings.anthropicKey}
                onChange={(e) => setSettings({ ...settings, anthropicKey: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Publishing Defaults</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Default Post Status</label>
              <select
                className="input max-w-xs"
                value={settings.defaultPostStatus}
                onChange={(e) => setSettings({ ...settings, defaultPostStatus: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoPublish"
                checked={settings.autoPublish}
                onChange={(e) => setSettings({ ...settings, autoPublish: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="autoPublish" className="text-sm text-gray-700">
                Auto-publish posts from scheduled content sources
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
          <div className="text-sm text-gray-600">
            <p>AutoBlog System v1.0.0</p>
            <p className="mt-1">Advanced auto blogging platform with multi-source content aggregation, AI generation, and multi-platform publishing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
