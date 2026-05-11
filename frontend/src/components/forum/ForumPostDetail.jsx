import { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  MessageCircle, ThumbsUp, ThumbsDown, CheckCircle, User, ChevronLeft, Send,
  Loader2, AlertCircle, ArrowUp, ArrowDown, Reply,
  ChevronRight, Hash, Eye, Clock, Award, ChevronDown, ChevronUp,
  Minimize2, Maximize2, PenLine
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { POST_TYPES, STATUS_CONFIG, ANSWER_SORT_OPTIONS } from './ForumConstants';
import { AnswerSkeleton } from './ForumComponents';

const ForumPostDetail = ({
  currentPost,
  loadingPost,
  user,
  // Comment state
  newComment,
  setNewComment,
  replyingTo,
  setReplyingTo,
  submittingComment,
  // Answer pagination/sorting
  answerSort,
  setAnswerSort,
  answerPage,
  setAnswerPage,
  answersPerPage = 5,
  // Collapse state
  collapsedAnswers,
  toggleAnswerCollapse,
  expandedContent,
  toggleContentExpand,
  // Actions
  closePost,
  handleVote,
  handleVoteComment,
  handleAcceptAnswer,
  handleSubmitComment,
  getSortedAnswers
}) => {
  const answersContainerRef = useRef(null);

  // Get paginated answers
  const getPaginatedAnswers = useCallback((comments) => {
    if (!comments) return { answers: [], totalPages: 0, totalAnswers: 0, currentPage: 1, hasNext: false, hasPrev: false };
    const sorted = getSortedAnswers ? getSortedAnswers(comments) : comments;
    const totalAnswers = sorted.length;
    const totalPages = Math.ceil(totalAnswers / answersPerPage);
    const start = (answerPage - 1) * answersPerPage;
    const paginatedAnswers = sorted.slice(start, start + answersPerPage);
    return {
      answers: paginatedAnswers,
      totalPages,
      totalAnswers,
      currentPage: answerPage,
      hasNext: answerPage < totalPages,
      hasPrev: answerPage > 1
    };
  }, [answerPage, answersPerPage, getSortedAnswers]);

  // Render comment
  const renderComment = (comment, depth = 0, index = 0) => {
    const isCollapsed = collapsedAnswers?.has(comment.id);
    const isLongContent = comment.content.length > 300;
    const voteScore = comment.upvotes - comment.downvotes;
    const isExpanded = expandedContent?.has(comment.id);

    return (
      <div
        key={comment.id}
        id={comment.is_accepted_answer ? 'accepted-answer' : comment.is_bot ? 'ai-answer' : undefined}
        className={cn("relative", depth > 0 && "ml-4 sm:ml-6 mt-2")}
      >
        {depth > 0 && (
          <div className="absolute left-[-12px] top-3 bottom-0 w-0.5 bg-slate-200" />
        )}

        <div className={cn(
          "relative rounded-lg transition-all",
          comment.is_accepted_answer
            ? "bg-emerald-50 border-l-4 border-l-emerald-500 border border-emerald-200"
            : "bg-white border border-slate-200 hover:border-slate-300",
          isCollapsed ? "p-2" : "p-3 sm:p-4"
        )}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 text-white" />
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="font-medium text-sm truncate text-slate-700">
                {comment.author?.username}
              </span>

              {comment.is_accepted_answer && (
                <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded flex items-center gap-0.5">
                  <Award className="h-2.5 w-2.5" />
                  ACCEPTED
                </span>
              )}

              <span className="text-xs text-slate-400 hidden sm:inline">
                {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Vote & actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); handleVoteComment(comment.id, 'up'); }}
                className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <span className={cn(
                "text-sm font-bold min-w-[20px] text-center",
                voteScore > 0 ? "text-emerald-600" : voteScore < 0 ? "text-red-500" : "text-slate-500"
              )}>
                {voteScore}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleVoteComment(comment.id, 'down'); }}
                className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
              >
                <ArrowDown className="h-4 w-4" />
              </button>

              {depth === 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAnswerCollapse(comment.id); }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors ml-1"
                >
                  {isCollapsed ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {!isCollapsed && (
            <>
              <div className={cn(
                "prose prose-sm max-w-none text-slate-600 leading-relaxed",
                "prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1",
                "prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-code:text-xs",
                isLongContent && !isExpanded && "max-h-[120px] overflow-hidden relative"
              )}>
                <ReactMarkdown>{comment.content}</ReactMarkdown>
                {isLongContent && !isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>

              {isLongContent && (
                <button
                  onClick={() => toggleContentExpand(comment.id)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-0.5 mt-1"
                >
                  {isExpanded ? <><ChevronUp className="h-3 w-3" /> Less</> : <><ChevronDown className="h-3 w-3" /> More</>}
                </button>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setReplyingTo({ id: comment.id, content: '' })}
                  className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-50 transition-all"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                  {comment.replies?.length > 0 && <span className="text-slate-400">({comment.replies.length})</span>}
                </button>

                {currentPost?.author?.id === user?.id && !comment.is_accepted_answer && currentPost.post_type === 'question' && (
                  <button
                    onClick={() => handleAcceptAnswer(comment.id)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-100 transition-all font-medium"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Accept
                  </button>
                )}
              </div>

              {/* Reply input */}
              {replyingTo?.id === comment.id && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <textarea
                    value={replyingTo.content}
                    onChange={(e) => setReplyingTo({ ...replyingTo, content: e.target.value })}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded resize-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setReplyingTo(null)} className="px-2 py-1 text-slate-500 text-xs font-medium hover:bg-slate-100 rounded">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitComment(comment.id)}
                      disabled={submittingComment || !replyingTo.content.trim()}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {submittingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Collapsed preview */}
          {isCollapsed && (
            <p className="text-slate-500 text-xs line-clamp-1 mt-1">
              {comment.content.substring(0, 80)}...
            </p>
          )}
        </div>

        {/* Nested replies */}
        {!isCollapsed && comment.replies?.map((reply, replyIndex) => renderComment(reply, depth + 1, replyIndex))}
      </div>
    );
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-ping opacity-25" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Loading post...</h3>
          <p className="text-slate-500 text-sm">Fetching the latest discussion</p>
        </div>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Post not found</h3>
          <p className="text-slate-500 mb-6">This post may have been deleted or doesn't exist.</p>
          <button
            onClick={closePost}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  const typeConfig = POST_TYPES.find(t => t.id === currentPost.post_type) || POST_TYPES[0];
  const TypeIcon = typeConfig.icon;
  const statusConfig = STATUS_CONFIG[currentPost.status] || STATUS_CONFIG.open;
  const voteScore = currentPost.upvotes - currentPost.downvotes;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <div className={cn("relative overflow-hidden py-6 sm:py-8", `bg-gradient-to-r ${typeConfig.gradient}`)}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <button
            onClick={closePost}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Forum
          </button>

          <div className="flex items-start gap-4">
            <div className={cn("hidden sm:flex p-3 rounded-xl", "bg-white/20 backdrop-blur-sm")}>
              <TypeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium", typeConfig.bg, typeConfig.text)}>
                  {typeConfig.label}
                </span>
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusConfig.bg, statusConfig.text)}>
                  {statusConfig.label}
                </span>
                {currentPost.has_accepted_answer && (
                  <span className="px-2 py-0.5 bg-white/20 text-white rounded text-xs font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Solved
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{currentPost.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-white/70 text-sm">
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
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {currentPost.comment_count} answers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-4">
            {/* Post content */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
              {/* Content */}
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{currentPost.content}</ReactMarkdown>
              </div>

              {/* Tags */}
              {currentPost.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  {currentPost.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                      <Hash className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Voting - Compact horizontal */}
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleVote('up')}
                  className="p-1.5 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <span className={cn(
                  "text-sm font-semibold min-w-[20px] text-center",
                  voteScore > 0 ? "text-emerald-600" : voteScore < 0 ? "text-red-500" : "text-slate-500"
                )}>
                  {voteScore}
                </span>
                <button
                  onClick={() => handleVote('down')}
                  className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Answers section */}
            <div ref={answersContainerRef}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                  {currentPost.comment_count} Answers
                </h2>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                  {ANSWER_SORT_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      onClick={() => { setAnswerSort(option.id); setAnswerPage(1); }}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                        answerSort === option.id
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* New answer input */}
              <div className="bg-white rounded-lg border border-slate-200 p-3 mb-4">
                <h3 className="font-medium text-slate-900 mb-2 flex items-center gap-2 text-sm">
                  <PenLine className="h-4 w-4 text-emerald-500" />
                  Your Answer
                </h3>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your knowledge or answer the question..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleSubmitComment()}
                    disabled={submittingComment || !newComment.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all"
                  >
                    {submittingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Post Answer
                  </button>
                </div>
              </div>

              {/* No answers state */}
              {(!currentPost.comments || currentPost.comments.length === 0) && (
                <div className="text-center py-8 bg-white rounded-lg border border-dashed border-slate-200">
                  <MessageCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No answers yet. Be the first to help!</p>
                </div>
              )}

              {/* Comments List with Pagination */}
              {currentPost.comments?.length > 0 && (() => {
                const { answers, totalPages, totalAnswers, currentPage, hasNext, hasPrev } = getPaginatedAnswers(currentPost.comments);
                const startIndex = (currentPage - 1) * answersPerPage;

                return (
                  <>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
                        <span>Showing {startIndex + 1}-{Math.min(startIndex + answersPerPage, totalAnswers)} of {totalAnswers}</span>
                        <span>Page {currentPage}/{totalPages}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      {answers.map((comment, index) => renderComment(comment, 0, startIndex + index))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => setAnswerPage(1)}
                          disabled={!hasPrev}
                          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <ChevronLeft className="h-4 w-4 -ml-2.5" />
                        </button>
                        <button
                          onClick={() => setAnswerPage(p => p - 1)}
                          disabled={!hasPrev}
                          className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 text-sm flex items-center"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Prev
                        </button>

                        <div className="flex items-center gap-0.5 mx-1">
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let page;
                            if (totalPages <= 5) page = i + 1;
                            else if (currentPage <= 3) page = i + 1;
                            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                            else page = currentPage - 2 + i;

                            return (
                              <button
                                key={page}
                                onClick={() => setAnswerPage(page)}
                                className={cn(
                                  "w-7 h-7 rounded text-xs font-medium transition-colors",
                                  currentPage === page ? "bg-emerald-600 text-white" : "hover:bg-slate-100 text-slate-600"
                                )}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setAnswerPage(p => p + 1)}
                          disabled={!hasNext}
                          className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 text-sm flex items-center"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAnswerPage(totalPages)}
                          disabled={!hasNext}
                          className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                        >
                          <ChevronRight className="h-4 w-4" />
                          <ChevronRight className="h-4 w-4 -ml-2.5" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPostDetail;
