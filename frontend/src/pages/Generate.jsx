import { useState, useEffect, useRef } from 'react';
import { generationAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Presentation,
  Code2,
  HelpCircle,
  Sparkles,
  Search,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  BookOpen,
  Zap,
  GraduationCap,
  RotateCcw,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Download
} from 'lucide-react';

const CONTENT_TYPES = [
  {
    id: 'notes',
    label: 'Theory Notes',
    description: 'Comprehensive study notes with explanations',
    icon: FileText,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  {
    id: 'slides',
    label: 'Presentation',
    description: 'Slide deck with speaker notes',
    icon: Presentation,
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700'
  },
  {
    id: 'code',
    label: 'Lab Code',
    description: 'Code examples with tests',
    icon: Code2,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700'
  },
  {
    id: 'quiz',
    label: 'Quiz',
    description: 'Practice questions with answers',
    icon: HelpCircle,
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700'
  }
];

const DIFFICULTY_LEVELS = [
  { value: 'beginner', label: 'Beginner', icon: BookOpen, description: 'Start from basics' },
  { value: 'intermediate', label: 'Intermediate', icon: Zap, description: 'Some prior knowledge' },
  { value: 'advanced', label: 'Advanced', icon: GraduationCap, description: 'Deep dive content' }
];

const LOADING_MESSAGES = [
  'Searching Wikipedia for context...',
  'Analyzing topic requirements...',
  'Generating content with AI...',
  'Structuring the response...',
  'Almost there...'
];

const Generate = () => {
  const [activeType, setActiveType] = useState('notes');
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [languages, setLanguages] = useState([]);
  const [copied, setCopied] = useState(false);

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

  // Quiz interaction
  const [showAnswers, setShowAnswers] = useState({});

  // Slides navigation
  const [currentSlide, setCurrentSlide] = useState(0);

  const resultRef = useRef(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  // Loading message animation
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Debounced Wikipedia search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (topic.trim().length >= 3) {
        searchWikipedia();
      } else {
        setWikiPreview(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [topic]);

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
    setLoadingMessageIndex(0);
    setError('');
    setResult(null);
    setCurrentSlide(0);
    setShowAnswers({});

    try {
      let response;

      switch (activeType) {
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

      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
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

  const toggleAnswer = (index) => {
    setShowAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleAllAnswers = () => {
    if (result?.quiz?.questions) {
      const allShown = result.quiz.questions.every((_, idx) => showAnswers[idx]);
      const newState = {};
      result.quiz.questions.forEach((_, idx) => {
        newState[idx] = !allShown;
      });
      setShowAnswers(newState);
    }
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(
        typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getActiveTypeConfig = () => CONTENT_TYPES.find(t => t.id === activeType);

  const renderTypeSelector = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {CONTENT_TYPES.map((type) => {
        const Icon = type.icon;
        const isActive = activeType === type.id;

        return (
          <button
            key={type.id}
            onClick={() => {
              setActiveType(type.id);
              setResult(null);
              setError('');
            }}
            className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group
              ${isActive
                ? `${type.borderColor} ${type.bgColor} shadow-lg scale-[1.02]`
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
          >
            <div className={`inline-flex p-2.5 rounded-lg mb-3 transition-all duration-300
              ${isActive
                ? `bg-gradient-to-br ${type.color} text-white shadow-md`
                : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <h3 className={`font-semibold mb-1 transition-colors ${isActive ? type.textColor : 'text-gray-800'}`}>
              {type.label}
            </h3>
            <p className="text-sm text-gray-500 leading-snug">
              {type.description}
            </p>
            {isActive && (
              <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${type.color}`} />
            )}
          </button>
        );
      })}
    </div>
  );

  const renderTopicInput = () => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Topic <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Binary Search Trees, Machine Learning Basics, REST APIs"
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-800 placeholder-gray-400"
        />
        {loadingWiki && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Wikipedia Preview */}
      {wikiPreview && wikiPreview.found && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800 text-sm">Context Sources Found</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {wikiPreview.articles.slice(0, 5).map((article, idx) => (
              <a
                key={idx}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-full text-sm text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <span className="truncate max-w-[150px]">{article.title}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDifficultySelector = () => (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        Difficulty Level
      </label>
      <div className="grid grid-cols-3 gap-3">
        {DIFFICULTY_LEVELS.map((level) => {
          const Icon = level.icon;
          const isActive = difficulty === level.value;

          return (
            <button
              key={level.value}
              type="button"
              onClick={() => setDifficulty(level.value)}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-center
                ${isActive
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1.5 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
              <span className={`text-sm font-medium ${isActive ? 'text-emerald-700' : 'text-gray-700'}`}>
                {level.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderOptionsForm = () => {
    const typeConfig = getActiveTypeConfig();

    return (
      <div className="space-y-6">
        {/* Notes Options */}
        {activeType === 'notes' && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="includeExamples"
              checked={includeExamples}
              onChange={(e) => setIncludeExamples(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="includeExamples" className="text-sm text-gray-700 cursor-pointer">
              <span className="font-medium">Include practical examples</span>
              <span className="block text-gray-500 text-xs">Add real-world code snippets and use cases</span>
            </label>
          </div>
        )}

        {/* Slides Options */}
        {activeType === 'slides' && (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Number of Slides
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="30"
                value={numSlides}
                onChange={(e) => setNumSlides(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <span className="w-12 text-center font-semibold text-purple-700 bg-purple-100 py-1 px-2 rounded-lg">
                {numSlides}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>5 slides</span>
              <span>30 slides</span>
            </div>
          </div>
        )}

        {/* Code Options */}
        {activeType === 'code' && (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Programming Language
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${language === lang.value
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 font-medium">Include comments</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={includeTests}
                  onChange={(e) => setIncludeTests(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 font-medium">Include tests</span>
              </label>
            </div>
          </>
        )}

        {/* Quiz Options */}
        {activeType === 'quiz' && (
          <>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Number of Questions
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="20"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <span className="w-12 text-center font-semibold text-orange-700 bg-orange-100 py-1 px-2 rounded-lg">
                  {numQuestions}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Question Types
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'mcq', label: 'Multiple Choice' },
                  { value: 'short_answer', label: 'Short Answer' },
                  { value: 'true_false', label: 'True/False' }
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleQuestionTypeChange(type.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${questionTypes.includes(type.value)
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Additional Context */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Additional Instructions
            <span className="font-normal text-gray-500 ml-2">(optional)</span>
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Add any specific requirements, focus areas, or context..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
        <Sparkles className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Generating Content</h3>
      <p className="text-gray-500 text-center max-w-sm animate-pulse">
        {LOADING_MESSAGES[loadingMessageIndex]}
      </p>
      <div className="mt-6 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-500"
            style={{
              animation: 'bounce 1s infinite',
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}
      </div>
    </div>
  );

  const renderSourcesBadges = () => {
    if (!result?.sources?.length) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {result.sources.map((source, idx) => (
          <div key={idx}>
            {source.type === 'wikipedia' && source.articles && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-blue-700">{source.articles.length} Wikipedia sources</span>
              </div>
            )}
            {source.type === 'course_materials' && source.items && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">{source.items.length} course materials</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderNotesResult = () => (
    <div className="prose prose-sm sm:prose max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-code:text-emerald-600 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown>{result.content}</ReactMarkdown>
    </div>
  );

  const renderSlidesResult = () => {
    if (!result?.slides?.length) return null;
    const slide = result.slides[currentSlide];

    return (
      <div className="space-y-4">
        {/* Slide Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">
              Slide {currentSlide + 1} of {result.slides.length}
            </span>
          </div>
          <button
            onClick={() => setCurrentSlide(prev => Math.min(result.slides.length - 1, prev + 1))}
            disabled={currentSlide === result.slides.length - 1}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Content */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white min-h-[300px] shadow-xl">
          <h2 className="text-2xl font-bold mb-6">{slide.title}</h2>
          <ul className="space-y-3">
            {slide.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-white/60 mt-2 flex-shrink-0" />
                <span className="text-lg text-white/90">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Speaker Notes */}
        {slide.speaker_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Speaker Notes</span>
            </div>
            <p className="text-sm text-amber-700">{slide.speaker_notes}</p>
          </div>
        )}

        {/* Slide Thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {result.slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`flex-shrink-0 w-24 h-16 rounded-lg border-2 transition-all p-2
                ${idx === currentSlide
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
            >
              <p className="text-[8px] text-gray-600 truncate font-medium">{s.title}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCodeResult = () => (
    <div className="relative">
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={() => handleCopy(result.content)}
          className="p-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm text-gray-400 ml-2">{language}</span>
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-sm text-gray-100 font-mono leading-relaxed whitespace-pre-wrap">
            {result.content}
          </pre>
        </div>
      </div>
    </div>
  );

  const renderQuizResult = () => {
    if (!result?.quiz?.questions) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{result.quiz.quiz_title}</h3>
          <button
            onClick={toggleAllAnswers}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
          >
            {Object.keys(showAnswers).length === result.quiz.questions.length && Object.values(showAnswers).every(Boolean)
              ? <><EyeOff className="w-4 h-4" /> Hide All</>
              : <><Eye className="w-4 h-4" /> Show All</>
            }
          </button>
        </div>

        {result.quiz.questions.map((q, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-semibold text-sm">
                    {q.question_number}
                  </span>
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full mb-2">
                      {q.type.replace('_', ' ')}
                    </span>
                    <p className="font-medium text-gray-800">{q.question}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleAnswer(idx)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showAnswers[idx] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Options for MCQ */}
              {q.options && (
                <div className="mt-3 ml-11 space-y-2">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = showAnswers[idx] && opt.startsWith(q.correct_answer?.toString());
                    return (
                      <div
                        key={oIdx}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors
                          ${isCorrect
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-50 text-gray-700'
                          }`}
                      >
                        {opt}
                        {isCorrect && <CheckCircle2 className="inline-block w-4 h-4 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Answer & Explanation */}
              {showAnswers[idx] && (
                <div className="mt-4 ml-11 p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">Answer:</span> {String(q.correct_answer)}
                  </p>
                  {q.explanation && (
                    <p className="text-sm text-green-700 mt-2">
                      <span className="font-semibold">Explanation:</span> {q.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    const typeConfig = getActiveTypeConfig();

    return (
      <div ref={resultRef} className="mt-8 scroll-mt-4">
        {/* Result Header */}
        <div className={`${typeConfig.bgColor} border ${typeConfig.borderColor} rounded-2xl p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${typeConfig.color} text-white`}>
                <typeConfig.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-semibold ${typeConfig.textColor}`}>Generated {typeConfig.label}</h3>
                <p className="text-sm text-gray-500">{result.topic}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(result.content || result)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setCurrentSlide(0);
                  setShowAnswers({});
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                New
              </button>
            </div>
          </div>

          {renderSourcesBadges()}

          {/* Metadata */}
          {result.metadata && (
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full">
                Model: {result.metadata.model?.split('/').pop()}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full">
                Tokens: {result.metadata.tokens_used}
              </span>
            </div>
          )}
        </div>

        {/* Result Content */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {result.type === 'theory_notes' && renderNotesResult()}
          {result.type === 'slides' && renderSlidesResult()}
          {result.type === 'lab_code' && renderCodeResult()}
          {result.type === 'quiz' && renderQuizResult()}

          {/* Fallback for unknown types */}
          {!['theory_notes', 'slides', 'lab_code', 'quiz'].includes(result.type) && (
            <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
              {typeof result.content === 'string' ? result.content : JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-3xl font-bold">AI Content Generator</h1>
          </div>
          <p className="text-emerald-100 text-lg max-w-2xl">
            Create learning materials powered by AI. Generate theory notes, presentations,
            code examples, and quizzes with context from Wikipedia and course materials.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 -mt-6">
        {/* Type Selector */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Choose Content Type
          </h2>
          {renderTypeSelector()}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Generation Failed</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {!loading && (
            <div className="space-y-6">
              {renderTopicInput()}

              {['notes', 'code', 'quiz'].includes(activeType) && renderDifficultySelector()}

              {renderOptionsForm()}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3
                  ${!topic.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : `bg-gradient-to-r ${getActiveTypeConfig().color} hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]`
                  }`}
              >
                <Sparkles className="w-5 h-5" />
                Generate {getActiveTypeConfig().label}
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && renderLoadingState()}
        </div>

        {/* Result */}
        {renderResult()}
      </div>

      {/* Custom styles for animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default Generate;
