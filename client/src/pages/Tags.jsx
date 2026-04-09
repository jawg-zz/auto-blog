import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react';

export default function Tags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const { data } = await api.tags.list();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      await api.tags.delete(id);
      loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingTag) {
        await api.tags.update(editingTag.id, formData);
      } else {
        await api.tags.create(formData);
      }
      setShowModal(false);
      setEditingTag(null);
      loadTags();
    } catch (error) {
      console.error('Failed to save tag:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tags</h1>
        <button
          onClick={() => { setEditingTag(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Tag
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2">
            <Tag size={14} className="text-gray-400" />
            <span className="font-medium text-gray-900">{tag.name}</span>
            <span className="text-xs text-gray-500">({tag._count?.posts || 0})</span>
            <button
              onClick={() => { setEditingTag(tag); setShowModal(true); }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete(tag.id)}
              className="p-1 text-gray-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {tags.length === 0 && !loading && (
          <div className="w-full text-center py-12 text-gray-500">
            No tags yet
          </div>
        )}
      </div>

      {showModal && (
        <TagModal
          tag={editingTag}
          onClose={() => { setShowModal(false); setEditingTag(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function TagModal({ tag, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    slug: tag?.slug || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{tag ? 'Edit Tag' : 'Add Tag'}</h2>
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
            <label className="label">Slug (optional)</label>
            <input
              type="text"
              className="input"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              {tag ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
