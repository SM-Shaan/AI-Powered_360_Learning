import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  FileText,
  Code2,
  Presentation,
  FolderOpen
} from 'lucide-react';
import { contentAPI } from '../services/api';
import ContentCard from '../components/ContentCard';
import ContentFilter from '../components/ContentFilter';
import { PageHeader, PageContainer, ContentCard as CardWrapper, EmptyState, LoadingState } from '../components/ui/PageHeader';
import { cn } from '../lib/utils';

const QUICK_FILTERS = [
  { id: 'all', label: 'All', icon: Grid3X3 }, 
  { id: 'theory', label: 'Theory', icon: BookOpen }, 
  { id: 'lab', label: 'Lab', icon: Code2 },
];

const CONTENT_TYPE_ICONS = {
  pdf: FileText,
  code: Code2,
  slides: Presentation,
  markdown: FileText,
  default: FolderOpen
};

function Browse() {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: searchParams.get('category') || '',
    content_type: '',
    week: '',
    topic: ''
  });

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '').length;

  useEffect(() => {
    fetchContent();
  }, [filters]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await contentAPI.getAll(filters);
      setContent(response.data.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setContent(prev => prev.filter(item => item.id !== id));
  };

  const handleQuickFilter = (category) => {
    setFilters(prev => ({
      ...prev,
      category: category === 'all' ? '' : category
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      category: '',
      content_type: '',
      week: '',
      topic: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Page Header */}
      <PageHeader
        title="Course Materials"
        description="Browse, search, and access all your learning resources in one place"
        icon={BookOpen}
        gradient="from-blue-600 via-indigo-600 to-violet-600"
      >
        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-4"> 
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm"> 
            <FolderOpen className="w-4 h-4" />
            <span>{content.length} materials</span>
          </div>
        </div>
      </PageHeader>

      <PageContainer className="-mt-6">
        {/* Main Content Card */}
        <CardWrapper className="p-0">
          {/* Toolbar */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search materials by title, topic, or content..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
                    showFilters || activeFilterCount > 0
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* View Toggle */}
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      viewMode === 'grid' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      viewMode === 'list' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 mt-4">
              {QUICK_FILTERS.map((filter) => {
                const isActive = filter.id === 'all'
                  ? !filters.category
                  : filters.category === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleQuickFilter(filter.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <filter.icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}

              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <ContentFilter
                  filters={filters}
                  setFilters={setFilters}
                  onSearch={fetchContent}
                  compact
                />
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <LoadingState message="Loading materials..." />
            ) : content.length > 0 ? (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{content.length}</span> material{content.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Content Grid/List */}
                <div className={cn(
                  viewMode === 'grid'
                    ? "grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-4"
                )}>
                  {content.map(item => (
                    <ContentCard
                      key={item.id}
                      content={item}
                      onDelete={handleDelete}
                      variant={viewMode}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No materials found"
                description="Try adjusting your filters or search terms to find what you're looking for"
                action={
                  activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Clear filters
                    </button>
                  )
                }
              />
            )}
          </div>
        </CardWrapper>
      </PageContainer>
    </div>
  );
}

export default Browse;
