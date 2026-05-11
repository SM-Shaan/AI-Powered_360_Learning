import { useRef } from 'react';
import {
  MessageSquare, Plus, Search, Filter, MessageCircle,
  CheckCircle, Loader2, AlertCircle,
  Users, ChevronRight, Hash, Flame,
  RefreshCw, ChevronDown, ChevronLeft, X, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { POST_TYPES, STATUS_CONFIG, SORT_OPTIONS } from './ForumConstants';
import { PostSkeleton, AnimatedNumber } from './ForumComponents';

const ForumPostList = ({
  // State
  posts,
  loading,
  error,
  pagination,
  searchQuery,
  filterType,
  filterStatus,
  filterTag,
  sortBy,
  popularTags,
  showFilters,
  isRefreshing,
  viewMode,
  loadingMore,
  // Setters
  setSearchQuery,
  setFilterType,
  setFilterStatus,
  setFilterTag,
  setSortBy,
  setShowFilters,
  setPagination,
  setShowCreateModal,
  // Actions
  handleRefresh,
  handleSearch,
  loadMorePosts,
  openPost,
  loadPosts,
  postsContainerRef
}) => {
  const searchInputRef = useRef(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-0 w-[200%] h-full opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.2) 25%, rgba(20, 184, 166, 0.3) 50%, transparent 100%)',
              animation: 'waterFlow 10s linear infinite'
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-emerald-400/30 rounded-full"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-lg opacity-50" />
                  <div className="relative p-3.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Community Forum</h1>
                  <p className="text-slate-400 mt-1.5 text-sm sm:text-base">Ask questions, share resources, and learn together</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3 mt-6">
                <div className="group flex items-center gap-2.5 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all cursor-default">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  <AnimatedNumber value={pagination.total} className="text-white font-bold" />
                  <span className="text-slate-400 text-sm">Posts</span>
                </div>
                <div className="group flex items-center gap-2.5 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all cursor-default">
                  <div className="p-1.5 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                  <AnimatedNumber value={popularTags.length} className="text-white font-bold" />
                  <span className="text-slate-400 text-sm">Topics</span>
                </div>
                <div className="group flex items-center gap-2.5 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all cursor-default">
                  <div className="p-1.5 bg-violet-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                  </div>
                  <span className="text-white font-bold">AI</span>
                  <span className="text-slate-400 text-sm">Powered</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-3 bg-white/10 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-white/15 rounded-xl transition-all disabled:opacity-50"
                title="Refresh posts"
              >
                <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98]"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                New Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Search & Filter Toggle */}
        <div className="lg:hidden mb-6 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
            />
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all",
              showFilters
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {(filterType || filterStatus || filterTag) && (
              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                {[filterType, filterStatus, filterTag].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className={cn(
            "lg:w-72 space-y-5 transition-all duration-300",
            showFilters ? "block" : "hidden lg:block"
          )}>
            {/* Search - Desktop */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
              </form>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                Filters
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Type</label>
                  <div className="space-y-1.5">
                    {POST_TYPES.map(type => {
                      const TypeIcon = type.icon;
                      const isActive = filterType === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setFilterType(isActive ? '' : type.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group",
                            isActive
                              ? `${type.bg} ${type.border} border-2 ${type.text} shadow-sm`
                              : "hover:bg-slate-50 text-slate-600 border-2 border-transparent"
                          )}
                        >
                          <div className={cn(
                            "p-1.5 rounded-lg transition-all",
                            isActive ? `bg-gradient-to-br ${type.gradient} text-white` : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                          )}>
                            <TypeIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-medium">{type.label}</span>
                          {isActive && <CheckCircle className="h-4 w-4 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                      const isActive = filterStatus === status;
                      return (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(isActive ? '' : status)}
                          className={cn(
                            "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all",
                            isActive
                              ? `${config.bg} ${config.text} ring-2 ring-offset-1 ring-${status === 'open' ? 'emerald' : status === 'answered' ? 'blue' : 'slate'}-300`
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full", config.dot)} />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Tags */}
            {popularTags.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-emerald-500" />
                  Trending Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 10).map(({ tag, count }, index) => {
                    const isActive = filterTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(isActive ? '' : tag)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                          isActive
                            ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300 ring-offset-1"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        )}
                      >
                        <Hash className="h-3 w-3" />
                        {tag}
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full",
                          isActive ? "bg-emerald-200 text-emerald-800" : "bg-slate-200 text-slate-500"
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Posts List */}
          <div className="flex-1" ref={postsContainerRef}>
            {/* Results Header - Compact */}
            <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  {pagination.total} posts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                  {SORT_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                        sortBy === option.id
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filterType || filterStatus || filterTag || searchQuery) && (
              <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
                <span className="text-slate-400">Filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {filterType && (
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded", POST_TYPES.find(t => t.id === filterType)?.bg, POST_TYPES.find(t => t.id === filterType)?.text)}>
                    {POST_TYPES.find(t => t.id === filterType)?.label}
                    <button onClick={() => setFilterType('')}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {filterStatus && (
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded", STATUS_CONFIG[filterStatus]?.bg, STATUS_CONFIG[filterStatus]?.text)}>
                    {STATUS_CONFIG[filterStatus]?.label}
                    <button onClick={() => setFilterStatus('')}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {filterTag && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded">
                    #{filterTag}
                    <button onClick={() => setFilterTag('')}><X className="h-3 w-3" /></button>
                  </span>
                )}
                <button
                  onClick={() => { setFilterType(''); setFilterStatus(''); setFilterTag(''); setSearchQuery(''); }}
                  className="text-slate-400 hover:text-red-500 ml-1"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Posts */}
            {loading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <PostSkeleton key={i} compact={viewMode === 'compact'} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 bg-white rounded-lg border border-red-200">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-600 text-sm mb-3">{error}</p>
                <button
                  onClick={() => loadPosts()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-dashed border-slate-200">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 mb-1">No posts yet</h3>
                <p className="text-slate-500 text-sm mb-4">Be the first to start a discussion!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Post
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post, index) => {
                  const typeConfig = POST_TYPES.find(t => t.id === post.post_type) || POST_TYPES[0];
                  const TypeIcon = typeConfig.icon;
                  const voteScore = post.upvotes - post.downvotes;
                  const isHot = voteScore > 10 || post.comment_count > 5;
                  const isTop3 = index < 3 && sortBy === 'upvotes';

                  return (
                    <div
                      key={post.id}
                      onClick={() => openPost(post.id)}
                      className={cn(
                        "relative bg-white rounded-lg border px-3 py-2.5 hover:shadow-sm hover:border-emerald-300 transition-all cursor-pointer group flex items-center gap-3",
                        isTop3 && "border-amber-200 bg-amber-50/30",
                        isHot && !isTop3 && "border-orange-200 bg-orange-50/20",
                        !isTop3 && !isHot && "border-slate-200",
                        post.has_accepted_answer && "border-l-4 border-l-emerald-500"
                      )}
                    >
                      {/* Vote score */}
                      <div className={cn(
                        "flex-shrink-0 w-10 text-center font-bold text-sm",
                        voteScore > 0 ? "text-emerald-600" : voteScore < 0 ? "text-red-500" : "text-slate-400"
                      )}>
                        {voteScore > 0 && '+'}{voteScore}
                      </div>

                      {/* Type icon */}
                      <div className={cn("flex-shrink-0 p-1.5 rounded", typeConfig.bg)}>
                        <TypeIcon className={cn("h-3.5 w-3.5", typeConfig.text)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <h3 className="font-medium text-sm text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                          {post.title}
                        </h3>
                        {post.has_accepted_answer && (
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        )}
                        {isHot && <Flame className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />}
                      </div>

                      {/* Meta */}
                      <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {post.comment_count}
                        </span>
                        <span>{post.author?.username}</span>
                        <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>

                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 flex-shrink-0" />
                    </div>
                  );
                })}

                {/* Load more */}
                {pagination.page < pagination.totalPages && (
                  <div className="mt-3">
                    {loadingMore ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      </div>
                    ) : (
                      <button
                        onClick={loadMorePosts}
                        className="w-full py-2.5 bg-slate-50 hover:bg-emerald-50 border border-dashed border-slate-200 hover:border-emerald-300 rounded-lg text-sm text-slate-500 hover:text-emerald-600 font-medium transition-all flex items-center justify-center gap-1.5"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Load more ({pagination.total - posts.length} left)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200 text-sm">
                <span className="text-slate-500">
                  Page {pagination.page}/{pagination.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 text-slate-600"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                  <div className="hidden sm:flex items-center gap-1">
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      let page;
                      if (pagination.totalPages <= 5) {
                        page = i + 1;
                      } else if (pagination.page <= 3) {
                        page = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        page = pagination.totalPages - 4 + i;
                      } else {
                        page = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setPagination(p => ({ ...p, page }))}
                          className={cn(
                            "w-8 h-8 rounded text-sm font-medium transition-all",
                            pagination.page === page
                              ? "bg-emerald-600 text-white"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 text-slate-600"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPostList;
