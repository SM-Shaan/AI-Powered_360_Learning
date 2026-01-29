import { Search, Filter, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

function ContentFilter({ filters, setFilters, onSearch }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFilters({
      search: '',
      category: '',
      content_type: '',
      week: '',
      topic: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const selectClasses = "h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500";

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
        <Search className="h-5 w-5 text-gray-500" />
        <Input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Search by title, description, or topic..."
          className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className={selectClasses}
          >
            <option value="">All Categories</option>
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
          </select>
        </div>

        <select
          name="content_type"
          value={filters.content_type}
          onChange={handleChange}
          className={selectClasses}
        >
          <option value="">All Types</option>
          <option value="slides">Slides</option>
          <option value="pdf">PDF</option>
          <option value="code">Code</option>
          <option value="notes">Notes</option>
          <option value="reference">Reference</option>
        </select>

        <Input
          type="number"
          name="week"
          value={filters.week}
          onChange={handleChange}
          placeholder="Week #"
          min="1"
          max="52"
          className="w-24"
        />

        <Input
          type="text"
          name="topic"
          value={filters.topic}
          onChange={handleChange}
          placeholder="Topic..."
          className="w-36"
        />

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

export default ContentFilter;
