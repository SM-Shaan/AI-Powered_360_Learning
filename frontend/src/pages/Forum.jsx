import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { forumAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import {
  MessageSquare, Plus, Search, Filter, Tag, Clock, Eye, MessageCircle,
  ThumbsUp, ThumbsDown, CheckCircle, Bot, User, ChevronLeft, Send,
  Loader2, AlertCircle, HelpCircle, BookOpen, Megaphone, FileText,
  ArrowUp, ArrowDown, MoreVertical, Trash2, Reply, X, Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

const POST_TYPES = [
  { id: 'question', label: 'Question', icon: HelpCircle, color: 'violet' },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare, color: 'blue' },
  { id: 'resource', label: 'Resource', icon: FileText, color: 'emerald' },
  { id: 'announcement', label: 'Announcement', icon: Megaphone, color: 'amber' }
];

const STATUS_COLORS = {
  open: 'bg-green-100 text-green-700',
  answered: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-700'
};

const Forum = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // View state
  const [view, setView] = useState(searchParams.get('post') ? 'detail' : 'list');
  const [selectedPostId, setSelectedPostId] = useState(searchParams.get('post') || null);

  // List state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [popularTags, setPopularTags] = useState([]);

  // Detail state
  const [currentPost, setCurrentPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);

  // Create post state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    post_type: 'question',
    tags: [],
    request_bot_answer: true
  });
  const [tagInput, setTagInput] = useState('');
  const [creating, setCreating] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Load posts
  useEffect(() => {
    loadPosts();
    loadPopularTags();
  }, [pagination.page, filterType, filterStatus, filterTag]);

  // Handle URL params
  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId) {
      setSelectedPostId(postId);
      setView('detail');
      loadPost(postId);
    } else {
      setView('list');
      setSelectedPostId(null);
      setCurrentPost(null);
    }
  }, [searchParams]);

  const loadPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await forumAPI.getPosts({
        page: pagination.page,
        per_page: 15,
        post_type: filterType || undefined,
        status: filterStatus || undefined,
        tag: filterTag || undefined,
        search: searchQuery || undefined,
        sort_by: 'created_at',
        sort_order: 'desc'
      });

      const data = response.data.data;
      setPosts(data.posts);
      setPagination({
        page: data.page,
        totalPages: data.total_pages,
        total: data.total
      });
    } catch (err) {
      setError('Failed to load posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularTags = async () => {
    try {
      const response = await forumAPI.getPopularTags(15);
      setPopularTags(response.data.data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadPost = async (postId) => {
    setLoadingPost(true);
    try {
      const response = await forumAPI.getPost(postId);
      setCurrentPost(response.data.data);
    } catch (err) {
      setError('Failed to load post');
      console.error(err);
    } finally {
      setLoadingPost(false);
    }
  };

  const handleCreatePost = async () => {
    // Validate inputs
    if (!newPost.title.trim() || newPost.title.trim().length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    if (!newPost.content.trim() || newPost.content.trim().length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    setCreating(true);
    try {
      const response = await forumAPI.createPost(newPost);
      setShowCreateModal(false);
      setNewPost({ title: '', content: '', post_type: 'question', tags: [], request_bot_answer: true });

      // Navigate to the new post
      const postId = response.data.data.id;
      setSearchParams({ post: postId });
    } catch (err) {
      // Show actual error message from backend
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to create post';
      setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      console.error('Create post error:', err.response?.data || err);
    } finally {
      setCreating(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newPost.tags.includes(tagInput.trim())) {
      setNewPost(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setNewPost(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmitComment = async (parentId = null) => {
    const content = parentId ? replyingTo?.content : newComment;
    if (!content?.trim()) return;

    setSubmittingComment(true);
    try {
      await forumAPI.createComment(currentPost.id, content.trim(), parentId);
      setNewComment('');
      setReplyingTo(null);
      loadPost(currentPost.id);
    } catch (err) {
      setError('Failed to add comment');
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVotePost = async (voteType) => {
    try {
      const response = await forumAPI.votePost(currentPost.id, voteType);
      setCurrentPost(prev => ({
        ...prev,
        upvotes: response.data.data.upvotes,
        downvotes: response.data.data.downvotes
      }));
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleVoteComment = async (commentId, voteType) => {
    try {
      await forumAPI.voteComment(commentId, voteType);
      loadPost(currentPost.id);
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleAcceptAnswer = async (commentId) => {
    try {
      await forumAPI.acceptAnswer(currentPost.id, commentId);
      loadPost(currentPost.id);
    } catch (err) {
      console.error('Accept answer failed:', err);
    }
  };

  const handleRequestBotAnswer = async () => {
    try {
      await forumAPI.requestBotAnswer(currentPost.id);
      loadPost(currentPost.id);
    } catch (err) {
      console.error('Bot answer request failed:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPosts();
  };

  const openPost = (postId) => {
    setSearchParams({ post: postId });
  };

  const closePost = () => {
    setSearchParams({});
  };

  // Render post list
  const renderPostList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-emerald-600" />
            Community Forum
          </h1>
          <p className="text-gray-500 mt-1">Ask questions, share resources, and learn together</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          New Post
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border p-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="">All Types</option>
            {POST_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="answered">Answered</option>
            <option value="closed">Closed</option>
          </select>

          {filterTag && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm">
              <Tag className="h-3 w-3" />
              {filterTag}
              <button onClick={() => setFilterTag('')} className="hover:text-emerald-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>

        {/* Popular Tags */}
        {popularTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Popular:</span>
            {popularTags.slice(0, 8).map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full transition-colors",
                  filterTag === tag
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tag} ({count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No posts found</p>
          <p className="text-sm">Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const typeConfig = POST_TYPES.find(t => t.id === post.post_type) || POST_TYPES[0];
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={post.id}
                onClick={() => openPost(post.id)}
                className="bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {/* Vote count */}
                  <div className="flex flex-col items-center text-gray-500 min-w-[50px]">
                    <span className="text-lg font-semibold">{post.upvotes - post.downvotes}</span>
                    <span className="text-xs">votes</span>
                  </div>

                  {/* Answers count */}
                  <div className={cn(
                    "flex flex-col items-center min-w-[50px] rounded-lg p-2",
                    post.has_accepted_answer
                      ? "bg-green-100 text-green-700"
                      : post.comment_count > 0
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-400"
                  )}>
                    <span className="text-lg font-semibold">{post.comment_count}</span>
                    <span className="text-xs">answers</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TypeIcon className={cn("h-4 w-4", `text-${typeConfig.color}-600`)} />
                      <span className={cn("px-2 py-0.5 text-xs rounded-full", STATUS_COLORS[post.status])}>
                        {post.status}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                      {post.title}
                    </h3>

                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {post.content.substring(0, 200)}...
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author?.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.view_count} views
                      </span>
                    </div>

                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );

  // Render comment
  const renderComment = (comment, depth = 0) => (
    <div key={comment.id} className={cn("border-l-2 pl-4", depth > 0 ? "ml-8 border-gray-200" : "border-transparent")}>
      <div className={cn(
        "p-4 rounded-lg",
        comment.is_accepted_answer ? "bg-green-50 border border-green-200" : "bg-gray-50",
        comment.is_bot && "bg-violet-50 border border-violet-200"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {comment.is_bot ? (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs">
                <Bot className="h-3 w-3" />
                AI Assistant
              </div>
            ) : (
              <span className="text-sm font-medium text-gray-700">{comment.author?.username}</span>
            )}
            <span className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
            {comment.is_accepted_answer && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                <CheckCircle className="h-3 w-3" />
                Accepted
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVoteComment(comment.id, 'up')}
              className="p-1 text-gray-400 hover:text-green-600"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">{comment.upvotes - comment.downvotes}</span>
            <button
              onClick={() => handleVoteComment(comment.id, 'down')}
              className="p-1 text-gray-400 hover:text-red-600"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{comment.content}</ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => setReplyingTo({ id: comment.id, content: '' })}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>

          {currentPost?.author?.id === user?.id && !comment.is_accepted_answer && currentPost.post_type === 'question' && (
            <button
              onClick={() => handleAcceptAnswer(comment.id)}
              className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Accept Answer
            </button>
          )}
        </div>

        {/* Reply input */}
        {replyingTo?.id === comment.id && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={replyingTo.content}
              onChange={(e) => setReplyingTo({ ...replyingTo, content: e.target.value })}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={() => handleSubmitComment(comment.id)}
              disabled={submittingComment}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reply'}
            </button>
            <button
              onClick={() => setReplyingTo(null)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies?.map(reply => renderComment(reply, depth + 1))}
    </div>
  );

  // Render post detail
  const renderPostDetail = () => {
    if (loadingPost) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      );
    }

    if (!currentPost) {
      return (
        <div className="text-center py-12 text-gray-500">
          Post not found
        </div>
      );
    }

    const typeConfig = POST_TYPES.find(t => t.id === currentPost.post_type) || POST_TYPES[0];
    const TypeIcon = typeConfig.icon;

    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={closePost}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Forum
        </button>

        {/* Post */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start gap-4">
            {/* Voting */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleVotePost('up')}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
              >
                <ArrowUp className="h-6 w-6" />
              </button>
              <span className="text-xl font-bold">{currentPost.upvotes - currentPost.downvotes}</span>
              <button
                onClick={() => handleVotePost('down')}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <ArrowDown className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TypeIcon className={cn("h-5 w-5", `text-${typeConfig.color}-600`)} />
                <span className={cn("px-2 py-0.5 text-sm rounded-full", STATUS_COLORS[currentPost.status])}>
                  {currentPost.status}
                </span>
                {currentPost.has_accepted_answer && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-sm">
                    <CheckCircle className="h-4 w-4" />
                    Answered
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-4">{currentPost.title}</h1>

              <div className="prose max-w-none mb-4">
                <ReactMarkdown>{currentPost.content}</ReactMarkdown>
              </div>

              {currentPost.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentPost.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {currentPost.author?.username}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(currentPost.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {currentPost.view_count} views
                  </span>
                </div>

                {currentPost.post_type === 'question' && (
                  <button
                    onClick={handleRequestBotAnswer}
                    className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Ask AI Bot
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentPost.comment_count} Answers
          </h2>

          {/* New comment */}
          <div className="bg-white rounded-xl border p-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your answer..."
              rows={4}
              className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => handleSubmitComment()}
                disabled={submittingComment || !newComment.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post Answer
              </button>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {currentPost.comments?.map(comment => renderComment(comment))}
          </div>
        </div>
      </div>
    );
  };

  // Create post modal
  const renderCreateModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Create New Post</h2>
            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Post type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Post Type</label>
            <div className="grid grid-cols-2 gap-2">
              {POST_TYPES.map(type => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setNewPost(p => ({ ...p, post_type: type.id }))}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 transition-colors",
                      newPost.post_type === type.id
                        ? `border-${type.color}-500 bg-${type.color}-50`
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <TypeIcon className={cn("h-5 w-5", `text-${type.color}-600`)} />
                    <span className="font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={newPost.title}
              onChange={(e) => setNewPost(p => ({ ...p, title: e.target.value }))}
              placeholder="What's your question or topic?"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Content</label>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost(p => ({ ...p, content: e.target.value }))}
              placeholder="Describe your question or topic in detail... (Markdown supported)"
              rows={6}
              className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tags..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            {newPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newPost.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-emerald-900">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bot answer option */}
          {newPost.post_type === 'question' && (
            <label className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={newPost.request_bot_answer}
                onChange={(e) => setNewPost(p => ({ ...p, request_bot_answer: e.target.checked }))}
                className="w-5 h-5 rounded text-violet-600"
              />
              <div>
                <span className="font-medium text-violet-700 flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Request AI Bot Answer
                </span>
                <span className="text-sm text-violet-600">
                  The AI will try to answer based on course materials
                </span>
              </div>
            </label>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePost}
            disabled={creating || !newPost.title.trim() || !newPost.content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Post
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {view === 'list' ? renderPostList() : renderPostDetail()}
        {showCreateModal && renderCreateModal()}
      </div>
    </div>
  );
};

export default Forum;
