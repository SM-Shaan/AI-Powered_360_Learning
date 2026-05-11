import {
  Plus, X, CheckCircle, AlertCircle, Hash, Loader2, Send
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { POST_TYPES } from './ForumConstants';

const ForumCreateModal = ({
  newPost,
  setNewPost,
  tagInput,
  setTagInput,
  creating,
  showCreateModal,
  setShowCreateModal,
  handleCreatePost,
  handleAddTag,
  handleRemoveTag
}) => {
  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowCreateModal(false)}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500 p-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <button
            onClick={() => setShowCreateModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create New Post</h2>
              <p className="text-white/80 text-sm mt-1">Share your question or start a discussion</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Post Type Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">1</span>
              Post Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {POST_TYPES.map(type => {
                const TypeIcon = type.icon;
                const isSelected = newPost.post_type === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setNewPost(p => ({ ...p, post_type: type.id }))}
                    className={cn(
                      "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left group",
                      isSelected
                        ? `${type.bg} ${type.border} ${type.text} shadow-md`
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl transition-all",
                      isSelected
                        ? `bg-gradient-to-br ${type.gradient} text-white shadow-lg`
                        : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                    )}>
                      <TypeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-semibold block">{type.label}</span>
                      <span className={cn(
                        "text-xs",
                        isSelected ? "opacity-80" : "text-slate-400"
                      )}>
                        {type.id === 'question' && 'Get help from community'}
                        {type.id === 'discussion' && 'Start a conversation'}
                        {type.id === 'resource' && 'Share useful content'}
                        {type.id === 'announcement' && 'Important updates'}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle className="absolute top-2 right-2 h-5 w-5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">2</span>
              Title
              <span className="ml-auto text-xs font-normal text-slate-400">
                {newPost.title.length}/100
              </span>
            </label>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost(p => ({ ...p, title: e.target.value.slice(0, 100) }))}
              placeholder="What's your question or topic?"
              className={cn(
                "w-full px-4 py-3.5 border rounded-xl transition-all text-lg",
                newPost.title.trim().length >= 5
                  ? "border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/30"
                  : "border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              )}
            />
            {newPost.title.trim().length > 0 && newPost.title.trim().length < 5 && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Title should be at least 5 characters
              </p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">3</span>
              Content
              <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">Markdown supported</span>
            </label>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost(p => ({ ...p, content: e.target.value }))}
              placeholder="Describe in detail what you'd like to discuss..."
              rows={6}
              className={cn(
                "w-full px-4 py-3 border rounded-xl resize-none transition-all leading-relaxed",
                newPost.content.trim().length >= 10
                  ? "border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/30"
                  : "border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              )}
            />
            {newPost.content.trim().length > 0 && newPost.content.trim().length < 10 && (
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Content should be at least 10 characters
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <Hash className="h-4 w-4 text-slate-400" />
              Tags
              <span className="text-xs font-normal text-slate-400">(optional)</span>
            </label>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
              <button
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            {newPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newPost.tags.map(tag => (
                  <span key={tag} className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors">
                    #{tag}
                    <button onClick={() => handleRemoveTag(tag)} className="p-0.5 hover:bg-emerald-300 rounded transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {newPost.tags.length === 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-400">Suggestions:</span>
                {['javascript', 'python', 'help', 'exam'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setNewPost(p => ({ ...p, tags: [...p.tags, tag] }))}
                    className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium hover:bg-slate-200 hover:text-slate-700 transition-colors"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <p className="text-sm text-slate-500 hidden sm:block">
            {newPost.title.trim().length >= 5 && newPost.content.trim().length >= 10
              ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Ready to post!</span>
              : 'Complete all required fields to post'}
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 hover:border-slate-300 font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePost}
              disabled={creating || !newPost.title.trim() || newPost.title.trim().length < 5 || !newPost.content.trim() || newPost.content.trim().length < 10}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
            >
              {creating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Create Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumCreateModal;
