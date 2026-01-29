import { useState } from 'react';
import { searchAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import {
  Search as SearchIcon,
  MessageSquareText,
  Sparkles,
  Code2,
  Shuffle,
  Send,
  Loader2,
  BookOpen,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  FileText
} from 'lucide-react';
import { PageHeader, PageContainer, ContentCard, EmptyState } from '../components/ui/PageHeader';
import { cn } from '../lib/utils';

const SEARCH_MODES = [
  {
    id: 'ask',
    label: 'Ask AI',
    description: 'Get direct answers from course materials',
    icon: MessageSquareText,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    placeholder: 'Ask a question about course topics...'
  },
  {
    id: 'semantic',
    label: 'Semantic',
    description: 'Find conceptually similar content',
    icon: Sparkles,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    placeholder: 'Search by concepts and meaning...'
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    description: 'Combine keywords with semantic search',
    icon: Shuffle,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    placeholder: 'Search with keywords and concepts...'
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Search code examples and snippets',
    icon: Code2,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    placeholder: 'Find code by function or concept...'
  }
];

const COLOR_CLASSES = {
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700'
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700'
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700'
  }
};

const Search = () => {
  const [activeMode, setActiveMode] = useState('ask');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Filters
  const [category, setCategory] = useState('');
  const [contentType, setContentType] = useState('');

  const currentMode = SEARCH_MODES.find(m => m.id === activeMode);
  const colors = COLOR_CLASSES[currentMode.color];

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let response;

      switch (activeMode) {
        case 'ask':
          response = await searchAPI.ask(query, { category: category || null });
          break;
        case 'semantic':
          response = await searchAPI.semantic(query, {
            category: category || null,
            content_type: contentType || null
          });
          break;
        case 'hybrid':
          response = await searchAPI.hybrid(query, {
            category: category || null,
            content_type: contentType || null
          });
          break;
        case 'code':
          response = await searchAPI.code(query);
          break;
        default:
          throw new Error('Invalid search type');
      }

      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const renderAskResult = () => {
    if (!result?.answer) return null;

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* AI Answer Card */}
        <ContentCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-violet-700">AI Answer</span>
                {result.confidence && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    result.confidence >= 0.7 ? "bg-green-100 text-green-700" :
                    result.confidence >= 0.5 ? "bg-yellow-100 text-yellow-700" :
                    "bg-gray-100 text-gray-600"
                  )}>
                    {Math.round(result.confidence * 100)}% confident
                  </span>
                )}
              </div>
              <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-600">
                <ReactMarkdown>{result.answer}</ReactMarkdown>
              </div>
            </div>
          </div>
        </ContentCard>

        {/* Sources */}
        {result.sources?.length > 0 && (
          <ContentCard className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Sources ({result.sources.length})
            </h4>
            <div className="space-y-2">
              {result.sources.map((source, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 text-sm truncate">{source.title}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex-shrink-0">
                        {source.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{source.excerpt}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle className="w-3 h-3" />
                      {Math.round(source.relevance * 100)}% relevant
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>
        )}

        {/* Related Topics */}
        {result.related_topics?.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Lightbulb className="w-4 h-4" />
              Related:
            </span>
            {result.related_topics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(topic);
                  handleSearch();
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors flex items-center gap-1"
              >
                {topic}
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!result?.results?.length) return null;

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Found <span className="font-medium text-gray-900">{result.total_results}</span> results
          </p>
          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", colors.badge)}>
            {result.search_type}
          </span>
        </div>

        <div className="space-y-3">
          {result.results.map((item, idx) => (
            <ContentCard key={idx} className="p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800">
                    {item.content_title || 'Untitled'}
                  </span>
                  {item.content_category && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {item.content_category}
                    </span>
                  )}
                  {item.chunk_type && item.chunk_type !== 'text' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {item.chunk_type}
                    </span>
                  )}
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-lg text-sm font-medium",
                  item.similarity >= 0.7 ? 'bg-green-100 text-green-700' :
                  item.similarity >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                )}>
                  {Math.round(item.similarity * 100)}% match
                </div>
              </div>

              <p className="text-gray-600 text-sm line-clamp-3">
                {item.chunk_text || item.code}
              </p>

              {/* Hybrid scores */}
              {item.semantic_score !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Semantic: {Math.round(item.semantic_score * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <SearchIcon className="w-3 h-3" />
                    Keyword: {Math.round(item.keyword_score * 100)}%
                  </span>
                </div>
              )}

              {/* Code info */}
              {item.language && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg font-mono">
                    {item.language}
                  </span>
                  {item.function_name && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg">
                      fn: {item.function_name}
                    </span>
                  )}
                </div>
              )}
            </ContentCard>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <PageHeader
        title="Smart Search"
        description="Find answers and content using AI-powered search across all course materials"
        icon={SearchIcon}
        gradient={`${currentMode.gradient}`}
      />

      <PageContainer className="-mt-6">
        {/* Search Mode Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {SEARCH_MODES.map((mode) => {
            const isActive = activeMode === mode.id;
            const modeColors = COLOR_CLASSES[mode.color];

            return (
              <button
                key={mode.id}
                onClick={() => {
                  setActiveMode(mode.id);
                  setResult(null);
                  setError('');
                }}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  isActive
                    ? `${modeColors.bg} ${modeColors.border} shadow-md`
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <div className={cn(
                  "inline-flex p-2 rounded-lg mb-2 transition-all",
                  isActive
                    ? `bg-gradient-to-br ${mode.gradient} text-white shadow-sm`
                    : "bg-gray-100 text-gray-600"
                )}>
                  <mode.icon className="w-4 h-4" />
                </div>
                <h3 className={cn(
                  "font-semibold text-sm mb-0.5",
                  isActive ? modeColors.text : "text-gray-800"
                )}>
                  {mode.label}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {mode.description}
                </p>
                {isActive && (
                  <div className={cn(
                    "absolute top-2 right-2 w-2 h-2 rounded-full",
                    `bg-gradient-to-br ${mode.gradient}`
                  )} />
                )}
              </button>
            );
          })}
        </div>

        {/* Search Card */}
        <ContentCard className="p-6 mb-6">
          {/* Search Input */}
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentMode.placeholder}
                rows={activeMode === 'ask' ? 3 : 2}
                className={cn(
                  "w-full px-4 py-3 border rounded-xl resize-none transition-all",
                  "focus:ring-2 focus:border-transparent",
                  `focus:ring-${currentMode.color}-500`,
                  "border-gray-200 text-gray-800 placeholder-gray-400"
                )}
              />
            </div>

            {/* Filters */}
            {['semantic', 'hybrid', 'ask'].includes(activeMode) && (
              <div className="flex flex-wrap gap-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="theory">Theory</option>
                  <option value="lab">Lab</option>
                </select>

                {activeMode !== 'ask' && (
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="code">Code</option>
                    <option value="markdown">Markdown</option>
                  </select>
                )}
              </div>
            )}

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className={cn(
                "w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2",
                !query.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : `bg-gradient-to-r ${currentMode.gradient} hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]`
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {activeMode === 'ask' ? 'Thinking...' : 'Searching...'}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {activeMode === 'ask' ? 'Get Answer' : 'Search'}
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </ContentCard>

        {/* Results */}
        {activeMode === 'ask' ? renderAskResult() : renderSearchResults()}

        {/* Tips */}
        {!result && !loading && (
          <ContentCard className={cn("p-4 mt-6", colors.bg, colors.border)}>
            <div className="flex items-start gap-3">
              <Lightbulb className={cn("w-5 h-5 mt-0.5", colors.text)} />
              <div>
                <h4 className={cn("font-semibold text-sm mb-2", colors.text)}>Tips for {currentMode.label}</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {activeMode === 'ask' && (
                    <>
                      <li>Ask questions in natural language about course topics</li>
                      <li>The AI will search materials and provide answers with sources</li>
                    </>
                  )}
                  {activeMode === 'semantic' && (
                    <>
                      <li>Semantic search finds conceptually similar content</li>
                      <li>Try searching for concepts rather than exact keywords</li>
                    </>
                  )}
                  {activeMode === 'hybrid' && (
                    <>
                      <li>Hybrid search combines keyword and semantic matching</li>
                      <li>Best for queries with specific terms and general concepts</li>
                    </>
                  )}
                  {activeMode === 'code' && (
                    <>
                      <li>Search for code examples by concept or function name</li>
                      <li>Results include code snippets from lab materials</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </ContentCard>
        )}
      </PageContainer>
    </div>
  );
};

export default Search;
