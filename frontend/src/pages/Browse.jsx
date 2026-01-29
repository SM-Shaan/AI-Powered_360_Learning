import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { contentAPI } from '../services/api';
import ContentCard from '../components/ContentCard';
import ContentFilter from '../components/ContentFilter';
import { Card, CardContent } from '../components/ui/card';

function Browse() {
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: searchParams.get('category') || '',
    content_type: '',
    week: '',
    topic: ''
  });

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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Browse Course Materials</h1>
        <p className="text-gray-500">Search and filter through all uploaded content</p>
      </div>

      <ContentFilter
        filters={filters}
        setFilters={setFilters}
        onSearch={fetchContent}
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <p className="text-gray-500">Loading content...</p>
        </div>
      ) : content.length > 0 ? (
        <>
          <p className="text-sm text-gray-500">
            Found {content.length} material{content.length !== 1 ? 's' : ''}
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.map(item => (
              <ContentCard
                key={item.id}
                content={item}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-gray-500/50" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No materials found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Browse;
