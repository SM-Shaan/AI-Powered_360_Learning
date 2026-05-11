import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { forumAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ScrollToTopButton } from '../components/forum/ForumComponents';
import ForumPostList from '../components/forum/ForumPostList';
import ForumPostDetail from '../components/forum/ForumPostDetail';
import ForumCreateModal from '../components/forum/ForumCreateModal';

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
  const [sortBy, setSortBy] = useState('created_at');
  const [popularTags, setPopularTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    request_bot_answer: false
  });
  const [tagInput, setTagInput] = useState('');
  const [creating, setCreating] = useState(false);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState('compact');
  const [answerPage, setAnswerPage] = useState(1);
  const answersPerPage = 5;
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [answerSort, setAnswerSort] = useState('votes');
  const [collapsedAnswers, setCollapsedAnswers] = useState(new Set());
  const [expandedContent, setExpandedContent] = useState(new Set());
  const postsContainerRef = useRef(null);

  // Load posts
  useEffect(() => {
    loadPosts();
    loadPopularTags();
  }, [pagination.page, filterType, filterStatus, filterTag, sortBy]);

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

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset answer page when post changes
  useEffect(() => {
    setAnswerPage(1);
  }, [currentPost?.id, answerSort]);

  const loadPosts = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await forumAPI.getPosts({
        page: pagination.page,
        per_page: 15,
        post_type: filterType || undefined,
        status: filterStatus || undefined,
        tag: filterTag || undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
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
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadPosts(true);
  };

  const loadPopularTags = async () => {
    try {
      const response = await forumAPI.getPopularTags();
      setPopularTags(response.data.data || []);
    } catch (err) {
      console.error('Failed to load tags');
    }
  };

  const loadPost = async (postId) => {
    setLoadingPost(true);
    try {
      const response = await forumAPI.getPost(postId);
      setCurrentPost(response.data.data);
    } catch (err) {
      setCurrentPost(null);
    } finally {
      setLoadingPost(false);
    }
  };

  const openPost = (postId) => {
    setSearchParams({ post: postId });
  };

  const closePost = () => {
    setSearchParams({});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    loadPosts();
  };

  const loadMorePosts = async () => {
    if (loadingMore || pagination.page >= pagination.totalPages) return;
    setLoadingMore(true);
    try {
      const response = await forumAPI.getPosts({
        page: pagination.page + 1,
        per_page: 15,
        post_type: filterType || undefined,
        status: filterStatus || undefined,
        tag: filterTag || undefined,
        search: searchQuery || undefined,
        sort_by: sortBy,
        sort_order: 'desc'
      });
      const data = response.data.data;
      setPosts(prev => [...prev, ...data.posts]);
      setPagination(p => ({ ...p, page: data.page }));
    } catch (err) {
      console.error('Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setCreating(true);
    try {
      await forumAPI.createPost(newPost);
      setShowCreateModal(false);
      setNewPost({
        title: '',
        content: '',
        post_type: 'question',
        tags: [],
        request_bot_answer: false
      });
      loadPosts();
    } catch (err) {
      console.error('Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newPost.tags.includes(tagInput.trim()) && newPost.tags.length < 5) {
      setNewPost(p => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewPost(p => ({ ...p, tags: p.tags.filter(t => t !== tagToRemove) }));
  };

  const handleVote = async (voteType) => {
    if (!currentPost) return;
    try {
      await forumAPI.votePost(currentPost.id, voteType);
      loadPost(currentPost.id);
    } catch (err) {
      console.error('Failed to vote');
    }
  };

  const handleVoteComment = async (commentId, voteType) => {
    try {
      await forumAPI.voteComment(commentId, voteType);
      if (currentPost) loadPost(currentPost.id);
    } catch (err) {
      console.error('Failed to vote on comment');
    }
  };

  const handleAcceptAnswer = async (commentId) => {
    try {
      await forumAPI.acceptAnswer(commentId);
      if (currentPost) loadPost(currentPost.id);
    } catch (err) {
      console.error('Failed to accept answer');
    }
  };

  const handleSubmitComment = async (parentId = null) => {
    const content = parentId ? replyingTo?.content : newComment;
    if (!content?.trim() || !currentPost) return;

    setSubmittingComment(true);
    try {
      await forumAPI.createComment(currentPost.id, content.trim(), parentId);
      if (parentId) {
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      loadPost(currentPost.id);
    } catch (err) {
      console.error('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getSortedAnswers = useCallback((comments) => {
    if (!comments) return [];
    const sorted = [...comments];

    switch (answerSort) {
      case 'votes':
        return sorted.sort((a, b) => {
          if (a.is_accepted_answer) return -1;
          if (b.is_accepted_answer) return 1;
          if (a.is_bot && !b.is_bot) return -1;
          if (b.is_bot && !a.is_bot) return 1;
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        });
      case 'newest':
        return sorted.sort((a, b) => {
          if (a.is_accepted_answer) return -1;
          if (b.is_accepted_answer) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          if (a.is_accepted_answer) return -1;
          if (b.is_accepted_answer) return 1;
          return new Date(a.created_at) - new Date(b.created_at);
        });
      default:
        return sorted;
    }
  }, [answerSort]);

  const toggleAnswerCollapse = (answerId) => {
    setCollapsedAnswers(prev => {
      const next = new Set(prev);
      if (next.has(answerId)) {
        next.delete(answerId);
      } else {
        next.add(answerId);
      }
      return next;
    });
  };

  const toggleContentExpand = (contentId) => {
    setExpandedContent(prev => {
      const next = new Set(prev);
      if (next.has(contentId)) {
        next.delete(contentId);
      } else {
        next.add(contentId);
      }
      return next;
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {view === 'list' ? (
        <ForumPostList
          posts={posts}
          loading={loading}
          error={error}
          pagination={pagination}
          searchQuery={searchQuery}
          filterType={filterType}
          filterStatus={filterStatus}
          filterTag={filterTag}
          sortBy={sortBy}
          popularTags={popularTags}
          showFilters={showFilters}
          isRefreshing={isRefreshing}
          viewMode={viewMode}
          loadingMore={loadingMore}
          setSearchQuery={setSearchQuery}
          setFilterType={setFilterType}
          setFilterStatus={setFilterStatus}
          setFilterTag={setFilterTag}
          setSortBy={setSortBy}
          setShowFilters={setShowFilters}
          setPagination={setPagination}
          setShowCreateModal={setShowCreateModal}
          handleRefresh={handleRefresh}
          handleSearch={handleSearch}
          loadMorePosts={loadMorePosts}
          openPost={openPost}
          loadPosts={loadPosts}
          postsContainerRef={postsContainerRef}
        />
      ) : (
        <ForumPostDetail
          currentPost={currentPost}
          loadingPost={loadingPost}
          user={user}
          newComment={newComment}
          setNewComment={setNewComment}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          submittingComment={submittingComment}
          answerSort={answerSort}
          setAnswerSort={setAnswerSort}
          answerPage={answerPage}
          setAnswerPage={setAnswerPage}
          answersPerPage={answersPerPage}
          collapsedAnswers={collapsedAnswers}
          toggleAnswerCollapse={toggleAnswerCollapse}
          expandedContent={expandedContent}
          toggleContentExpand={toggleContentExpand}
          closePost={closePost}
          handleVote={handleVote}
          handleVoteComment={handleVoteComment}
          handleAcceptAnswer={handleAcceptAnswer}
          handleSubmitComment={handleSubmitComment}
          getSortedAnswers={getSortedAnswers}
        />
      )}

      <ForumCreateModal
        newPost={newPost}
        setNewPost={setNewPost}
        tagInput={tagInput}
        setTagInput={setTagInput}
        creating={creating}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        handleCreatePost={handleCreatePost}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
      />

      <ScrollToTopButton show={showScrollTop} onClick={scrollToTop} />
    </>
  );
};

export default Forum;
