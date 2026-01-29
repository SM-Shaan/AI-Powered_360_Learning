import { useState } from 'react';
import { searchAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';

const Search = () => {
  const [activeTab, setActiveTab] = useState('ask');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Filters
  const [category, setCategory] = useState('');
  const [contentType, setContentType] = useState('');

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

      switch (activeTab) {
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

  const renderResult = () => {
    if (!result) return null;

    // RAG Answer
    if (activeTab === 'ask' && result.answer) {
      return (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                AI Answer
              </span>
              {result.confidence && (
                <span className="text-sm text-gray-500">
                  Confidence: {Math.round(result.confidence * 100)}%
                </span>
              )}
            </div>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{result.answer}</ReactMarkdown>
            </div>
          </div>

          {/* Sources */}
          {result.sources && result.sources.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Sources</h4>
              <div className="space-y-2">
                {result.sources.map((source, idx) => (
                  <div key={idx} className="bg-white rounded p-3 border text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">{source.title}</span>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                        {source.category}
                      </span>
                      <span className="text-gray-500 text-xs">
                        Relevance: {Math.round(source.relevance * 100)}%
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs line-clamp-2">{source.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Topics */}
          {result.related_topics && result.related_topics.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Related:</span>
              {result.related_topics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(topic);
                    handleSearch();
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Semantic/Hybrid Search Results
    if (result.results && Array.isArray(result.results)) {
      return (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-800">
              {result.total_results} results found
            </h3>
            <span className="text-sm text-gray-500">
              Search type: {result.search_type}
            </span>
          </div>

          <div className="space-y-3">
            {result.results.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {item.content_title || 'Untitled'}
                    </span>
                    {item.content_category && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                        {item.content_category}
                      </span>
                    )}
                    {item.chunk_type && item.chunk_type !== 'text' && (
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">
                        {item.chunk_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      item.similarity >= 0.7 ? 'text-green-600' :
                      item.similarity >= 0.5 ? 'text-yellow-600' : 'text-gray-500'
                    }`}>
                      {Math.round(item.similarity * 100)}% match
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-3">
                  {item.chunk_text || item.code}
                </p>

                {/* Hybrid search scores */}
                {item.semantic_score !== undefined && (
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>Semantic: {Math.round(item.semantic_score * 100)}%</span>
                    <span>Keyword: {Math.round(item.keyword_score * 100)}%</span>
                  </div>
                )}

                {/* Code-specific info */}
                {item.language && (
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {item.language}
                    </span>
                    {item.function_name && (
                      <span className="text-gray-500">fn: {item.function_name}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Intelligent Search</h1>
        <p className="text-gray-600">Search course materials using AI-powered semantic search</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: 'ask', label: 'Ask Question', icon: '💬' },
          { id: 'semantic', label: 'Semantic Search', icon: '🔍' },
          { id: 'hybrid', label: 'Hybrid Search', icon: '🔄' },
          { id: 'code', label: 'Code Search', icon: '💻' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setResult(null);
              setError('');
            }}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-4">
          {/* Query Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {activeTab === 'ask' ? 'Your Question' : 'Search Query'}
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                activeTab === 'ask'
                  ? 'Ask a question about the course materials...'
                  : activeTab === 'code'
                  ? 'Search for code examples...'
                  : 'Enter your search query...'
              }
              rows={activeTab === 'ask' ? 3 : 2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Filters */}
          {['semantic', 'hybrid', 'ask'].includes(activeTab) && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option value="theory">Theory</option>
                  <option value="lab">Lab</option>
                </select>
              </div>

              {activeTab !== 'ask' && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="pdf">PDF</option>
                    <option value="code">Code</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {activeTab === 'ask' ? 'Thinking...' : 'Searching...'}
              </>
            ) : (
              activeTab === 'ask' ? 'Get Answer' : 'Search'
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Results */}
        {renderResult()}
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          {activeTab === 'ask' && (
            <>
              <li>Ask questions in natural language about course topics</li>
              <li>The AI will search materials and provide answers with sources</li>
            </>
          )}
          {activeTab === 'semantic' && (
            <>
              <li>Semantic search finds conceptually similar content</li>
              <li>Try searching for concepts rather than exact keywords</li>
            </>
          )}
          {activeTab === 'hybrid' && (
            <>
              <li>Hybrid search combines keyword and semantic matching</li>
              <li>Best for queries with specific terms and general concepts</li>
            </>
          )}
          {activeTab === 'code' && (
            <>
              <li>Search for code examples by concept or function name</li>
              <li>Results include code snippets from lab materials</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Search;
