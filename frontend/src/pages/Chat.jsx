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
  const [conversationId, setConversationId] = useState('new');
  const [conversations, setConversations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadSuggestions();
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
            : "bg-gradient-to-br from-violet-500 to-purple-600"
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
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-6 relative">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 left-0 right-0 mx-auto w-fit">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              Powered by Claude
            </span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          AI Learning Assistant
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Ask questions about course materials, get explanations, generate study content, and explore code examples.
        </p>

        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          {suggestions.slice(0, 4).map((category, idx) => {
            const Icon = SUGGESTION_ICONS[category.category] || SUGGESTION_ICONS.default;
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {category.category}
                  </span>
                </div>
                {category.prompts.slice(0, 2).map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="w-full text-left p-3 bg-white border border-gray-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-all duration-200 text-sm text-gray-700 group"
                  >
                    <span className="line-clamp-2">{prompt}</span>
                    <span className="text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs mt-1 block">
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
    <div className="flex h-[calc(100vh-4rem)] bg-white">
      {/* Sidebar */}
      <div className={cn(
        "flex-shrink-0 border-r border-gray-200 bg-slate-50 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
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
                      ? "bg-violet-100 text-violet-900"
                      : "hover:bg-white text-gray-700"
                  )}
                  onClick={() => loadConversation(conv.id)}
                >
                  <MessageSquare className={cn(
                    "w-4 h-4 mt-0.5 flex-shrink-0",
                    conv.id === conversationId ? "text-violet-600" : "text-gray-400"
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
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Bot className="w-5 h-5 text-violet-600" />
                AI Assistant
              </h1>
              <p className="text-xs text-gray-500">Ask questions, search materials, generate content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
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
                <div className="flex gap-4 px-4 py-6 bg-slate-50/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-violet-400"
                          style={{
                            animation: 'bounce 1s infinite',
                            animationDelay: `${i * 0.15}s`
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question, search materials, or request content..."
                  rows={1}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
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
                  "p-3 rounded-xl transition-all duration-200",
                  input.trim() && !loading
                    ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-md hover:shadow-lg"
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

      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default Chat;
