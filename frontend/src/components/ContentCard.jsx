import { FileText, Code, BookOpen, File, Download, Trash2, Calendar, Tag } from 'lucide-react';
import { contentAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

function ContentCard({ content, onDelete, compact = false, showActions }) {
  const { isAdmin } = useAuth();

  // If showActions is explicitly set, use that; otherwise use isAdmin
  const displayActions = showActions !== undefined ? showActions : isAdmin;

  const getIcon = (type) => {
    const iconClasses = compact ? "h-5 w-5" : "h-6 w-6";
    switch (type) {
      case 'slides':
        return <FileText className={cn(iconClasses, "text-amber-500")} />;
      case 'pdf':
        return <FileText className={cn(iconClasses, "text-red-500")} />;
      case 'code':
        return <Code className={cn(iconClasses, "text-emerald-500")} />;
      case 'notes':
        return <BookOpen className={cn(iconClasses, "text-blue-500")} />;
      default:
        return <File className={iconClasses} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownload = () => {
    window.open(contentAPI.getDownloadUrl(content.id), '_blank');
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${content.title}"?`)) {
      try {
        await contentAPI.delete(content.id);
        onDelete && onDelete(content.id);
      } catch (error) {
        console.error('Error deleting content:', error);
        alert('Failed to delete content');
      }
    }
  };

  // Compact view for student dashboard
  if (compact) {
    return (
      <Card className={cn(
        "overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer",
        content.category === 'theory' && "border-l-4 border-l-blue-500",
        content.category === 'lab' && "border-l-4 border-l-emerald-500"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-gray-400">
              {getIcon(content.content_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{content.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={content.category === 'theory' ? 'theory' : 'lab'} className="text-xs">
                  {content.category}
                </Badge>
                {content.week && (
                  <span className="text-xs text-gray-500">Week {content.week}</span>
                )}
              </div>
            </div>
          </div>
          {content.topic && (
            <p className="text-xs text-gray-500 mt-2 truncate">{content.topic}</p>
          )}
        </CardContent>
        <CardFooter className="px-4 py-2 bg-gray-50 border-t flex justify-between items-center">
          <span className="text-xs text-gray-400">{formatDate(content.created_at)}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-7 w-7 text-gray-400 hover:text-emerald-600"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Full view (default)
  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
      content.category === 'theory' && "border-t-4 border-t-blue-500",
      content.category === 'lab' && "border-t-4 border-t-emerald-500"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-gray-50 p-4">
        <div className="text-gray-500">
          {getIcon(content.content_type)}
        </div>
        <Badge variant={content.category === 'theory' ? 'theory' : 'lab'}>
          {content.category}
        </Badge>
      </CardHeader>

      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">{content.title}</h3>
        {content.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{content.description}</p>
        )}

        <div className="flex flex-wrap gap-3 mb-3">
          {content.topic && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <BookOpen className="h-3.5 w-3.5" />
              {content.topic}
            </span>
          )}
          {content.week && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />
              Week {content.week}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <File className="h-3.5 w-3.5" />
            {content.content_type}
          </span>
        </div>

        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Tag className="h-3.5 w-3.5 text-gray-500" />
            {content.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center p-4 pt-0 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          {formatFileSize(content.file_size)} • {formatDate(content.created_at)}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="Download"
            className="h-8 w-8 text-gray-500 hover:text-emerald-600"
          >
            <Download className="h-4 w-4" />
          </Button>
          {displayActions && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              title="Delete"
              className="h-8 w-8 text-gray-500 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default ContentCard;
