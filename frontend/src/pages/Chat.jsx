import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Trash2,
  Plus,
  MessageSquare,
  Loader2,
  BookOpen,
  Globe,
  Sparkles,
  Bot,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  Zap,
  GraduationCap,
  Code2,
  HelpCircle,
  ArrowUpToLine,
  MoreHorizontal,
  Copy,
  Check,
  RefreshCw,
  Lightbulb,
  Brain,
  Mic,
  Paperclip,
  Settings,
  X,
  ChevronDown,
  MessageCircle,
  History,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '../lib/utils';

// Suggestion category icons
const SUGGESTION_ICONS = {
  'Course Questions': BookOpen,
  'Explanations': HelpCircle,
  'Code Help': Code2,
  'Study Tips': GraduationCap,
  default: Zap
};

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center gap-1.5">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-400 to-purple-500"
        style={{
          animation: 'typing-bounce 1.4s ease-in-out infinite',
          animationDelay: `${i * 0.16}s`
        }}
      />
    ))}
  </div>
);

// Message action button
const MessageAction = ({ icon: Icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className={cn(
      "p-1.5 rounded-lg transition-all",
      active
        ? "bg-violet-100 text-violet-600"
        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
    )}
    title={label}
  >
    <Icon className="w-4 h-4" />
  </button>
);

// Source badge component
const SourceBadge = ({ source }) => {
  const isCourse = source.type === 'course';
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
      "hover:scale-105 cursor-default",
      isCourse
        ? "bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200"
        : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200"
    )}>
      {isCourse ? (
        <BookOpen className="w-3.5 h-3.5" />
      ) : (
        <Globe className="w-3.5 h-3.5" />
      )}
      <span className="max-w-[150px] truncate">{source.title}</span>
      {source.relevance && (
        <span className="opacity-60 text-[10px]">
          {Math.round(source.relevance * 100)}%
        </span>
      )}
    </span>
  );
};

// Conversation item component
const ConversationItem = ({ conv, isActive, onClick, onDelete }) => (
  <div
    className={cn(
      "group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
      isActive
        ? "bg-gradient-to-r from-violet-100 to-purple-100 shadow-sm"
        : "hover:bg-white hover:shadow-sm"
    )}
    onClick={onClick}
  >
    <div className={cn(
      "p-2 rounded-lg transition-colors",
      isActive
        ? "bg-gradient-to-br from-violet-500 to-purple-600"
        : "bg-slate-100 group-hover:bg-slate-200"
    )}>
      <MessageSquare className={cn(
        "w-4 h-4",
        isActive ? "text-white" : "text-slate-500"
      )} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn(
        "text-sm font-medium truncate",
        isActive ? "text-violet-900" : "text-slate-700"
      )}>
        {conv.last_message || 'New conversation'}
      </p>
      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
        <Clock className="w-3 h-3" />
        {new Date(conv.updated_at || conv.created_at).toLocaleDateString()}
      </p>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete(conv.id);
      }}
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all",
        "opacity-0 group-hover:opacity-100",
        "hover:bg-red-100 text-slate-400 hover:text-red-500"
      )}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

// Suggestion card component
const SuggestionCard = ({ prompt, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full text-left p-4 bg-white rounded-xl border border-slate-200",
      "hover:border-violet-300 hover:shadow-md hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50",
      "transition-all duration-300 group"
    )}
  >
    <p className="text-sm text-slate-700 line-clamp-2 group-hover:text-violet-700">
      {prompt}
    </p>
    <span className="text-xs text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity mt-2 block">
      Click to ask
    </span>
  </button>
);

// Empty state component
const EmptyConversations = () => (
  <div className="text-center py-12 px-4">
    <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <MessageCircle className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="font-medium text-slate-700 mb-1">No conversations yet</h3>
    <p className="text-sm text-slate-400">Start a new chat to begin learning</p>
  </div>
);

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem('chat_conversation_id') || 'new';
  });
  const [conversations, setConversations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Save conversation ID to localStorage
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      localStorage.setItem('chat_conversation_id', conversationId);
    } else {
      localStorage.removeItem('chat_conversation_id');
    }
  }, [conversationId]);

  // Initial load
  useEffect(() => {
    const initializeChat = async () => {
      await loadConversations();
      await loadSuggestions();

      const savedConvId = localStorage.getItem('chat_conversation_id');
      if (savedConvId && savedConvId !== 'new') {
        await loadConversation(savedConvId);
      }
      setInitialLoadDone(true);
    };

    initializeChat();
  }, []);

  // Scroll handling
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    messagesContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await chatAPI.getSuggestions();
      setSuggestions(response.data.data || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const loadConversation = async (convId) => {
    try {
      const response = await chatAPI.getConversation(convId);
      const data = response.data.data;
      setConversationId(convId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      if (err.response?.status === 404 || err.response?.status === 403) {
        localStorage.removeItem('chat_conversation_id');
        setConversationId('new');
        setMessages([]);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await chatAPI.sendMessage(userMessage, conversationId);
      const data = response.data.data;

      if (data.conversation_id && data.conversation_id !== conversationId) {
        setConversationId(data.conversation_id);
        loadConversations();
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        sources: data.sources,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      }]);

    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        error: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = () => {
    setConversationId('new');
    setMessages([]);
    localStorage.removeItem('chat_conversation_id');
    inputRef.current?.focus();
  };

  const deleteConversation = async (convId) => {
    try {
      await chatAPI.deleteConversation(convId);
      if (convId === conversationId) {
        startNewChat();
      }
      loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSuggestionClick = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const copyMessage = async (content, id) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv =>
    !searchQuery || conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMessage = (msg, idx) => {
    const isUser = msg.role === 'user';
    const messageId = `msg-${idx}`;

    return (
      <div
        key={idx}
        className={cn(
          "group px-4 py-6 transition-colors",
          isUser ? "bg-transparent" : "bg-gradient-to-r from-slate-50/80 to-violet-50/30"
        )}
      >
        <div className="max-w-3xl mx-auto flex gap-4">
          {/* Avatar */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
            isUser
              ? "bg-gradient-to-br from-slate-700 to-slate-800"
              : msg.error
              ? "bg-gradient-to-br from-red-400 to-red-500"
              : "bg-gradient-to-br from-violet-500 to-purple-600"
          )}>
            {isUser ? (
              <User className="w-5 h-5 text-white" />
            ) : (
              <Bot className={cn("w-5 h-5 text-white", loading && idx === messages.length - 1 && "animate-pulse")} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-semibold",
                  isUser ? "text-slate-700" : msg.error ? "text-red-700" : "text-violet-700"
                )}>
                  {isUser ? 'You' : 'AI Assistant'}
                </span>
                <span className="text-xs text-slate-400">
                  {formatTime(msg.timestamp)}
                </span>
                {!isUser && !msg.error && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full text-[10px] font-medium">
                    <Sparkles className="w-3 h-3" />
                    Claude
                  </span>
                )}
              </div>

              {/* Message actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <MessageAction
                  icon={copiedId === messageId ? Check : Copy}
                  label="Copy"
                  onClick={() => copyMessage(msg.content, messageId)}
                  active={copiedId === messageId}
                />
                {!isUser && (
                  <>
                    <MessageAction icon={ThumbsUp} label="Good response" onClick={() => {}} />
                    <MessageAction icon={ThumbsDown} label="Bad response" onClick={() => {}} />
                    <MessageAction icon={RefreshCw} label="Regenerate" onClick={() => {}} />
                  </>
                )}
              </div>
            </div>

            {/* Message Body */}
            <div className={cn(
              "prose prose-sm max-w-none leading-relaxed",
              isUser ? "text-slate-800" : msg.error ? "text-red-700" : "text-slate-700",
              "prose-headings:text-slate-800 prose-headings:font-semibold",
              "prose-p:leading-relaxed prose-p:mb-4",
              "prose-code:text-violet-600 prose-code:bg-violet-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm",
              "prose-code:before:content-none prose-code:after:content-none",
              "prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:shadow-lg",
              "prose-ul:my-2 prose-li:my-0.5",
              "prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline"
            )}>
              {isUser ? (
                <p className="m-0">{msg.content}</p>
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>

            {/* Sources */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="pt-4 mt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Referenced Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {msg.sources.map((source, sIdx) => (
                    <SourceBadge key={sIdx} source={source} />
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {msg.metadata && (
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                {msg.metadata.course_context_used && (
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                    <BookOpen className="w-3 h-3" /> Course materials used
                  </span>
                )}
                {msg.metadata.wikipedia_context_used && (
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                    <Globe className="w-3 h-3" /> Wikipedia referenced
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWelcome = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-white to-purple-50/50" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-200/30 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-200/30 rounded-full blur-[80px]" />

      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-purple-600 rounded-3xl blur-xl opacity-40 animate-pulse" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/30">
              <Bot className="w-12 h-12 text-white" />
            </div>
            {/* Orbiting rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-32 h-32 rounded-full border-2 border-violet-300/40 animate-[spin_20s_linear_infinite]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 rounded-full border border-purple-200/30 animate-[spin_30s_linear_infinite_reverse]" />
            </div>
          </div>
          {/* <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 text-sm font-medium rounded-full shadow-sm">
              <Sparkles className="w-4 h-4" />
              Powered by Claude AI
            </span>
          </div> */}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          How can I help you today?
        </h1>
        <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
          Ask questions about course materials, get explanations, or generate study content.
        </p>

        {/* Suggestions Grid */}
        <div className="space-y-6">
          {suggestions.slice(0, 2).map((category, idx) => {
            const Icon = SUGGESTION_ICONS[category.category] || SUGGESTION_ICONS.default;
            return (
              <div key={idx}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="p-1.5 bg-violet-100 rounded-lg">
                    <Icon className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-semibold text-violet-700">
                    {category.category}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {category.prompts.slice(0, 2).map((prompt, pIdx) => (
                    <SuggestionCard
                      key={pIdx}
                      prompt={prompt}
                      onClick={() => handleSuggestionClick(prompt)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Brain className="w-4 h-4 text-violet-500" />
            <span className="text-sm text-slate-600">Context-aware</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-slate-600">Course integrated</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-slate-600">Fast responses</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-0 overflow-hidden" : "w-80"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200">
          <button
            onClick={startNewChat}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3",
              "bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl",
              "hover:from-violet-600 hover:to-purple-700 transition-all duration-200",
              "shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30",
              "font-medium"
            )}
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="flex items-center justify-between px-2 py-2 mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Recent Chats
            </span>
            <span className="text-xs text-slate-400">{filteredConversations.length}</span>
          </div>

          {filteredConversations.length === 0 ? (
            <EmptyConversations />
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === conversationId}
                  onClick={() => loadConversation(conv.id)}
                  onDelete={deleteConversation}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-600">AI Online</span>
            </div>
            {/* <span className="text-xs text-violet-600 font-medium">Claude 3.5</span> */}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-800">AI Learning Assistant</h1>
                <p className="text-xs text-slate-500">Ask anything about your course materials</p>
              </div>
            </div>
          </div>

          {/* <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 rounded-xl">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Claude AI</span>
            </div>
          </div> */}
        </div>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto"
        >
          {messages.length === 0 ? (
            renderWelcome()
          ) : (
            <div>
              {messages.map((msg, idx) => renderMessage(msg, idx))}

              {/* Loading indicator */}
              {loading && (
                <div className="px-4 py-6 bg-gradient-to-r from-slate-50/80 to-violet-50/30">
                  <div className="max-w-3xl mx-auto flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <Bot className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3">
                      <TypingIndicator />
                      <span className="text-sm text-violet-600 font-medium">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about your course materials..."
                rows={1}
                className={cn(
                  "w-full px-4 py-3.5 pr-24 border-2 border-slate-200 rounded-2xl resize-none",
                  "focus:outline-none focus:ring-0 focus:border-violet-500 transition-all",
                  "bg-slate-50 focus:bg-white placeholder:text-slate-400"
                )}
                style={{ maxHeight: '150px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                }}
              />

              {/* Input actions */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={cn(
                    "p-2.5 rounded-xl transition-all duration-200",
                    input.trim() && !loading
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-xs text-slate-400">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-[10px]">Enter</kbd>
                <span className="mx-1">to send</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-[10px]">Shift+Enter</kbd>
                <span className="mx-1">for new line</span>
              </p>
              <p className="text-xs text-slate-400">
                {input.length > 0 && `${input.length} characters`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-24 right-6 z-40 p-3 bg-violet-600 text-white rounded-full",
          "shadow-lg shadow-violet-500/30 transition-all duration-300",
          "hover:bg-violet-700 hover:scale-110",
          showScrollTop ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        )}
      >
        <ArrowUpToLine className="w-5 h-5" />
      </button>

      {/* CSS Animations */}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default Chat;
