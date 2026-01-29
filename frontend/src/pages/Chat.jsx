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
  MoreVertical,
  Search,
  Clock,
  Zap,
  GraduationCap,
  Code2,
  FileText,
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

// Water Ripple Effect Component
const WaterRipple = ({ className }) => (
  <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
    <div className="water-ripple water-ripple-1" />
    <div className="water-ripple water-ripple-2" />
    <div className="water-ripple water-ripple-3" />
  </div>
);

// Floating Bubbles Component
const FloatingBubbles = ({ count = 15 }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="bubble"
        style={{
          left: `${Math.random() * 100}%`,
          width: `${8 + Math.random() * 20}px`,
          height: `${8 + Math.random() * 20}px`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${4 + Math.random() * 4}s`,
        }}
      />
    ))}
  </div>
);

// Wave Animation Component
const WaveAnimation = ({ className }) => (
  <div className={cn("absolute bottom-0 left-0 right-0 overflow-hidden", className)}>
    <svg
      className="wave wave-1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="currentColor"
        fillOpacity="0.3"
        d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
    <svg
      className="wave wave-2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="currentColor"
        fillOpacity="0.2"
        d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
    <svg
      className="wave wave-3"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <path
        fill="currentColor"
        fillOpacity="0.1"
        d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,186.7C672,192,768,192,864,176C960,160,1056,128,1152,133.3C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      />
    </svg>
  </div>
);

const SUGGESTION_ICONS = {
  'Course Questions': BookOpen,
  'Explanations': HelpCircle,
  'Code Help': Code2,
  'Study Tips': GraduationCap,
  default: Zap
};

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(() => {
    // Restore conversation ID from localStorage on initial load
    return localStorage.getItem('chat_conversation_id') || 'new';
  });
  const [conversations, setConversations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Save conversation ID to localStorage whenever it changes
  useEffect(() => {
    if (conversationId && conversationId !== 'new') {
      localStorage.setItem('chat_conversation_id', conversationId);
    } else {
      localStorage.removeItem('chat_conversation_id');
    }
  }, [conversationId]);

  // Initial load: fetch conversations and restore saved conversation
  useEffect(() => {
    const initializeChat = async () => {
      await loadConversations();
      await loadSuggestions();

      // Restore saved conversation if exists
      const savedConvId = localStorage.getItem('chat_conversation_id');
      if (savedConvId && savedConvId !== 'new') {
        await loadConversation(savedConvId);
      }
      setInitialLoadDone(true);
    };

    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      // If conversation not found (e.g., server restarted), clear saved ID
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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (msg, idx) => {
    const isUser = msg.role === 'user';

    return (
      <div
        key={idx}
        className={cn(
          "flex gap-4 px-4 py-6 animate-in fade-in slide-in-from-bottom-2 duration-300",
          isUser ? "bg-transparent" : "bg-slate-50/50"
        )}
      >
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isUser
            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
            : msg.error
            ? "bg-red-100"
            : "bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 water-glow"
        )}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className={cn("w-4 h-4", msg.error ? "text-red-600" : "text-white")} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-semibold",
              isUser ? "text-blue-700" : msg.error ? "text-red-700" : "text-violet-700"
            )}>
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            <span className="text-xs text-gray-400">
              {formatTime(msg.timestamp)}
            </span>
          </div>

          {/* Message Body */}
          <div className={cn(
            "prose prose-sm max-w-none",
            isUser ? "text-gray-800" : msg.error ? "text-red-700" : "text-gray-700",
            "prose-headings:text-gray-800 prose-code:text-violet-600 prose-code:bg-violet-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none"
          )}>
            {isUser ? (
              <p className="m-0 leading-relaxed">{msg.content}</p>
            ) : (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            )}
          </div>

          {/* Sources */}
          {msg.sources && msg.sources.length > 0 && (
            <div className="pt-3 mt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                Sources
              </p>
              <div className="flex flex-wrap gap-2">
                {msg.sources.map((source, sIdx) => (
                  <span
                    key={sIdx}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      source.type === 'course'
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    {source.type === 'course' ? (
                      <BookOpen className="w-3 h-3" />
                    ) : (
                      <Globe className="w-3 h-3" />
                    )}
                    {source.title}
                    {source.relevance && (
                      <span className="opacity-70">({Math.round(source.relevance * 100)}%)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {msg.metadata && (
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {msg.metadata.course_context_used && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Course context
                </span>
              )}
              {msg.metadata.wikipedia_context_used && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Wikipedia
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWelcome = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Water Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-50/50 via-blue-50/30 to-violet-50/50" />
      <FloatingBubbles count={20} />
      <WaveAnimation className="h-32 text-cyan-400" />

      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Logo with Water Ripple */}
        <div className="mb-6 relative">
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center shadow-lg water-glow">
              <Bot className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            {/* Ripple rings around logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-2xl border-2 border-cyan-300/50 animate-ping-slow" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-2xl border border-blue-200/30 animate-ping-slower" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 left-0 right-0 mx-auto w-fit">
            <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 text-xs font-medium rounded-full shadow-sm">
              Powered by Claude
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 bg-clip-text text-transparent mb-3">
          AI Learning Assistant
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Ask questions about course materials, get explanations, generate study content, and explore code examples.
        </p>

        {/* Suggestions Grid with Water Effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          {suggestions.slice(0, 4).map((category, idx) => {
            const Icon = SUGGESTION_ICONS[category.category] || SUGGESTION_ICONS.default;
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Icon className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">
                    {category.category}
                  </span>
                </div>
                {category.prompts.slice(0, 2).map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="w-full text-left p-3 bg-white/80 backdrop-blur-sm border border-cyan-200/50 rounded-xl hover:border-cyan-400 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-all duration-300 text-sm text-gray-700 group water-shimmer btn-water-ripple shadow-sm hover:shadow-md"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                    <span className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs mt-1 block">
                      Click to use
                    </span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-cyan-50/20 to-blue-50/30">
      {/* Sidebar with Water Effect */}
      <div className={cn(
        "flex-shrink-0 border-r border-cyan-100 bg-gradient-to-b from-slate-50 via-cyan-50/30 to-blue-50/20 flex flex-col transition-all duration-300 relative",
        sidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
      )}>
        {/* Decorative water drops in sidebar */}
        <div className="absolute top-20 right-4 w-2 h-2 rounded-full bg-cyan-300/40 animate-pulse" />
        <div className="absolute top-40 left-6 w-1.5 h-1.5 rounded-full bg-blue-300/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-32 right-8 w-2 h-2 rounded-full bg-violet-300/40 animate-pulse" style={{ animationDelay: '1s' }} />
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-blue-50 opacity-50" />
          <button
            onClick={startNewChat}
            className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white rounded-xl hover:from-cyan-600 hover:via-blue-600 hover:to-violet-600 transition-all shadow-md hover:shadow-lg btn-water-ripple water-glow"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-cyan-200 rounded-lg bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Recent Chats
          </p>
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all",
                    conv.id === conversationId
                      ? "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-900 shadow-sm"
                      : "hover:bg-white/80 hover:shadow-sm text-gray-700"
                  )}
                  onClick={() => loadConversation(conv.id)}
                >
                  <MessageSquare className={cn(
                    "w-4 h-4 mt-0.5 flex-shrink-0",
                    conv.id === conversationId ? "text-cyan-600" : "text-gray-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.last_message || 'New conversation'}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(conv.updated_at || conv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all",
                      "hover:bg-red-100 text-gray-400 hover:text-red-500"
                    )}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header with Water Effect */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-100 bg-gradient-to-r from-white via-cyan-50/30 to-white relative overflow-hidden">
          {/* Subtle water shimmer in header */}
          <div className="absolute inset-0 water-shimmer opacity-50" />
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-cyan-100/50 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-cyan-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-cyan-600" />
              )}
            </button>
            <div>
              <h1 className="text-base font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-500" />
                AI Assistant
              </h1>
              <p className="text-xs text-gray-500">Ask questions, search materials, generate content</p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 rounded-full text-xs font-medium shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Claude AI
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            renderWelcome()
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map((msg, idx) => renderMessage(msg, idx))}
              {loading && (
                <div className="flex gap-4 px-4 py-6 bg-gradient-to-r from-cyan-50/30 to-blue-50/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 flex items-center justify-center water-glow">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500"
                          style={{
                            animation: 'water-drop 1.5s ease-in-out infinite',
                            animationDelay: `${i * 0.2}s`
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent font-medium">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area with Water Effect */}
        <div className="border-t border-cyan-100 bg-gradient-to-r from-white via-cyan-50/50 to-white p-4 relative overflow-hidden">
          {/* Subtle wave at top of input area */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-200 via-blue-300 to-violet-200 opacity-50" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question, search materials, or request content..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-cyan-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm shadow-sm"
                  style={{ maxHeight: '120px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={cn(
                  "p-3 rounded-xl transition-all duration-200 btn-water-ripple",
                  input.trim() && !loading
                    ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white hover:from-cyan-600 hover:via-blue-600 hover:to-violet-600 shadow-md hover:shadow-lg water-glow"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Enter</kbd> to send,
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 ml-1">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>

      {/* Water Effect Animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        /* Floating Bubbles */
        .bubble {
          position: absolute;
          bottom: -50px;
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.2));
          border-radius: 50%;
          animation: float-up linear infinite;
          box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .bubble::before {
          content: '';
          position: absolute;
          top: 20%;
          left: 20%;
          width: 30%;
          height: 30%;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
        }

        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) scale(0.8);
            opacity: 0;
          }
        }

        /* Wave Animations */
        .wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 200%;
          height: 100%;
          color: rgb(6, 182, 212);
        }

        .wave-1 {
          animation: wave-move 8s linear infinite;
          z-index: 3;
        }

        .wave-2 {
          animation: wave-move 12s linear infinite reverse;
          z-index: 2;
          color: rgb(59, 130, 246);
        }

        .wave-3 {
          animation: wave-move 16s linear infinite;
          z-index: 1;
          color: rgb(139, 92, 246);
        }

        @keyframes wave-move {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Water Ripple Effect */
        .water-ripple {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(6, 182, 212, 0.3);
          animation: ripple 3s ease-out infinite;
        }

        .water-ripple-1 {
          width: 100px;
          height: 100px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .water-ripple-2 {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 15%;
          animation-delay: 1s;
        }

        .water-ripple-3 {
          width: 80px;
          height: 80px;
          bottom: 30%;
          left: 30%;
          animation-delay: 2s;
        }

        @keyframes ripple {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Water Glow Effect */
        .water-glow {
          animation: water-glow 3s ease-in-out infinite;
        }

        @keyframes water-glow {
          0%, 100% {
            box-shadow:
              0 0 20px rgba(6, 182, 212, 0.4),
              0 0 40px rgba(59, 130, 246, 0.2),
              0 0 60px rgba(139, 92, 246, 0.1);
          }
          50% {
            box-shadow:
              0 0 30px rgba(6, 182, 212, 0.6),
              0 0 60px rgba(59, 130, 246, 0.3),
              0 0 90px rgba(139, 92, 246, 0.2);
          }
        }

        /* Ping animations for logo ripples */
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-ping-slower {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
          animation-delay: 0.5s;
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        /* Button Ripple Effect */
        .btn-water-ripple {
          position: relative;
          overflow: hidden;
        }

        .btn-water-ripple::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn-water-ripple:active::after {
          width: 200px;
          height: 200px;
        }

        /* Water Drop Animation */
        @keyframes water-drop {
          0% {
            transform: translateY(-20px) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(20px) scale(0.8);
            opacity: 0;
          }
        }

        /* Shimmer effect for cards */
        .water-shimmer {
          position: relative;
          overflow: hidden;
        }

        .water-shimmer::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(6, 182, 212, 0.1),
            transparent
          );
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;
