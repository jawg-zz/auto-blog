import { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, Search, Filter, Edit2, Trash2, Send, RotateCcw, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ status: '', search: '' });

  useEffect(() => {
    loadPosts();
    loadPlatforms();
    loadCategories();
  }, [filters]);

  const loadPosts = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      const { data } = await api.posts.list(params);
      setPosts(data.posts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlatforms = async () => {
    try {
      const { data } = await api.platforms.list();
      setPlatforms(data);
    } catch (error) {
      console.error('Failed to load platforms:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await api.categories.list();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.posts.delete(id);
      loadPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handlePublish = async (id) => {
    const enabledPlatforms = platforms.filter(p => p.enabled);
    if (enabledPlatforms.length === 0) {
      alert('No enabled platforms to publish to');
      return;
    }
    try {
      await api.posts.publish(id, enabledPlatforms.map(p => p.id));
      alert('Post queued for publishing');
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingPost) {
        await api.posts.update(editingPost.id, formData);
      } else {
        await api.posts.create(formData);
      }
      setShowModal(false);
      setEditingPost(null);
      loadPosts();
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-info',
      scheduled: 'badge-warning',
      published: 'badge-success',
      failed: 'badge-error'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        <button
          onClick={() => { setEditingPost(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Post
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search posts..."
            className="input pl-10"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="input w-auto"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{post.title}</p>
                  <p className="text-sm text-gray-500 truncate max-w-md">{post.excerpt || post.content?.substring(0, 80)}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={clsx('badge', getStatusBadge(post.status))}>
                    {post.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {post.category?.name || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(post.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setEditingPost(post); setShowModal(true); }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handlePublish(post.id)}
                      className="p-2 text-gray-400 hover:text-green-600"
                      title="Publish"
                    >
                      <Send size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  No posts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <PostModal
          post={editingPost}
          categories={categories}
          onClose={() => { setShowModal(false); setEditingPost(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function PostModal({ post, categories, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    status: post?.status || 'draft',
    categoryId: post?.categoryId || '',
    featuredImage: post?.featuredImage || '',
    seoTitle: post?.seoTitle || '',
    seoDescription: post?.seoDescription || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{post ? 'Edit Post' : 'New Post'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="label">Content</label>
            <textarea
              className="input min-h-[200px]"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Featured Image URL</label>
            <input
              type="url"
              className="input"
              value={formData.featuredImage}
              onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
            />
          </div>

          <div>
            <label className="label">SEO Title</label>
            <input
              type="text"
              className="input"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            />
          </div>

          <div>
            <label className="label">SEO Description</label>
            <textarea
              className="input"
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {post ? 'Update' : 'Create'} Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
