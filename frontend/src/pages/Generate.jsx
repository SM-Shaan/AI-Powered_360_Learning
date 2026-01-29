import { useState, useEffect } from 'react';
import { generationAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';

const Generate = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [languages, setLanguages] = useState([]);

  // Form states
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [includeExamples, setIncludeExamples] = useState(true);
  const [numSlides, setNumSlides] = useState(10);
  const [language, setLanguage] = useState('python');
  const [includeComments, setIncludeComments] = useState(true);
  const [includeTests, setIncludeTests] = useState(true);
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionTypes, setQuestionTypes] = useState(['mcq', 'short_answer', 'true_false']);
  const [additionalContext, setAdditionalContext] = useState('');

  // Wikipedia preview
  const [wikiPreview, setWikiPreview] = useState(null);
  const [loadingWiki, setLoadingWiki] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const response = await generationAPI.getSupportedLanguages();
      setLanguages(response.data.data.languages);
    } catch (err) {
      console.error('Failed to load languages:', err);
    }
  };

  const searchWikipedia = async () => {
    if (!topic.trim()) return;
    setLoadingWiki(true);
    try {
      const response = await generationAPI.searchWikipedia(topic);
      setWikiPreview(response.data.data);
    } catch (err) {
      console.error('Wikipedia search failed:', err);
    } finally {
      setLoadingWiki(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let response;

      switch (activeTab) {
        case 'notes':
          response = await generationAPI.generateNotes({
            topic,
            difficulty,
            include_examples: includeExamples,
            additional_context: additionalContext || null
          });
          break;

        case 'slides':
          response = await generationAPI.generateSlides({
            topic,
            num_slides: numSlides,
            additional_context: additionalContext || null
          });
          break;

        case 'code':
          response = await generationAPI.generateCode({
            topic,
            language,
            difficulty,
            include_comments: includeComments,
            include_tests: includeTests
          });
          break;

        case 'quiz':
          response = await generationAPI.generateQuiz({
            topic,
            num_questions: numQuestions,
            question_types: questionTypes,
            difficulty
          });
          break;

        default:
          throw new Error('Invalid generation type');
      }

      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Generation failed. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionTypeChange = (type) => {
    setQuestionTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const renderForm = () => {
    return (
      <div className="space-y-4">
        {/* Topic Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Binary Search Trees, Machine Learning Basics"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={searchWikipedia}
              disabled={loadingWiki || !topic.trim()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {loadingWiki ? '...' : 'Preview Sources'}
            </button>
          </div>
        </div>

        {/* Wikipedia Preview */}
        {wikiPreview && wikiPreview.found && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Wikipedia Sources Found:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {wikiPreview.articles.map((article, idx) => (
                <li key={idx}>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {article.title}
                  </a>
                  {article.description && <span className="text-blue-600"> - {article.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Difficulty (for notes, code, quiz) */}
        {['notes', 'code', 'quiz'].includes(activeTab) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        )}

        {/* Notes-specific options */}
        {activeTab === 'notes' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeExamples"
              checked={includeExamples}
              onChange={(e) => setIncludeExamples(e.target.checked)}
              className="rounded text-blue-600"
            />
            <label htmlFor="includeExamples" className="text-sm text-gray-700">
              Include practical examples
            </label>
          </div>
        )}

        {/* Slides-specific options */}
        {activeTab === 'slides' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Slides
            </label>
            <input
              type="number"
              value={numSlides}
              onChange={(e) => setNumSlides(Math.max(5, Math.min(30, parseInt(e.target.value) || 10)))}
              min="5"
              max="30"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Code-specific options */}
        {activeTab === 'code' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Programming Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Include comments</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeTests}
                  onChange={(e) => setIncludeTests(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-sm text-gray-700">Include tests</span>
              </label>
            </div>
          </>
        )}

        {/* Quiz-specific options */}
        {activeTab === 'quiz' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(3, Math.min(20, parseInt(e.target.value) || 5)))}
                min="3"
                max="20"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Types
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'mcq', label: 'Multiple Choice' },
                  { value: 'short_answer', label: 'Short Answer' },
                  { value: 'true_false', label: 'True/False' }
                ].map((type) => (
                  <label key={type.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={questionTypes.includes(type.value)}
                      onChange={() => handleQuestionTypeChange(type.value)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Additional Context */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Context (Optional)
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Add any course-specific context or requirements..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            `Generate ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
          )}
        </button>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="mt-6 border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Generated Content</h3>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(
                typeof result.content === 'string' ? result.content : JSON.stringify(result, null, 2)
              )}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Copy
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Sources */}
        {result.sources && result.sources.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-medium">Sources:</span>{' '}
            {result.sources.map((source, idx) => (
              <span key={idx}>
                {source.type === 'wikipedia' && source.articles.join(', ')}
              </span>
            ))}
          </div>
        )}

        {/* Content Display */}
        <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-[600px]">
          {result.type === 'theory_notes' || result.type === 'lab_code' ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{result.content}</ReactMarkdown>
            </div>
          ) : result.type === 'slides' && Array.isArray(result.slides) ? (
            <div className="space-y-4">
              {result.slides.map((slide, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Slide {slide.slide_number}
                    </span>
                    <h4 className="font-semibold text-gray-800">{slide.title}</h4>
                  </div>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {slide.bullets.map((bullet, bIdx) => (
                      <li key={bIdx}>{bullet}</li>
                    ))}
                  </ul>
                  {slide.speaker_notes && (
                    <p className="mt-2 text-sm text-gray-500 italic">
                      Notes: {slide.speaker_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : result.type === 'quiz' && result.quiz?.questions ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">{result.quiz.quiz_title}</h4>
              {result.quiz.questions.map((q, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                      Q{q.question_number} - {q.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800 mb-2">{q.question}</p>
                  {q.options && (
                    <ul className="text-gray-700 space-y-1 mb-2">
                      {q.options.map((opt, oIdx) => (
                        <li key={oIdx} className={opt.startsWith(q.correct_answer) ? 'text-green-600 font-medium' : ''}>
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                  {q.correct_answer !== undefined && (
                    <p className="text-sm text-green-600">
                      <span className="font-medium">Answer:</span> {String(q.correct_answer)}
                    </p>
                  )}
                  {q.explanation && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Explanation:</span> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {typeof result.content === 'string' ? result.content : JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>

        {/* Metadata */}
        {result.metadata && (
          <div className="mt-2 text-xs text-gray-500">
            Model: {result.metadata.model} | Tokens: {result.metadata.tokens_used}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">AI Content Generator</h1>
        <p className="text-gray-600">Generate learning materials using AI with Wikipedia context</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: 'notes', label: 'Theory Notes', icon: '📝' },
          { id: 'slides', label: 'Slides', icon: '📊' },
          { id: 'code', label: 'Lab Code', icon: '💻' },
          { id: 'quiz', label: 'Quiz', icon: '❓' }
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

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {renderForm()}
        {renderResult()}
      </div>
    </div>
  );
};

export default Generate;
