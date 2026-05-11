import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload as UploadIcon, FileText, FileImage, Sparkles, Cloud, CheckCircle,
  FolderOpen, Clock, TrendingUp, Zap, Shield, Eye, Trash2, ExternalLink,
  FileCode, Image, File, ChevronRight, ArrowUpToLine
} from 'lucide-react';
import { cn } from '../lib/utils';
import UploadForm from '../components/UploadForm';
import HandwrittenNotesUpload from '../components/HandwrittenNotesUpload';

// File type icon mapping
const getFileIcon = (type) => {
  switch (type) {
    case 'code': return FileCode;
    case 'notes': return FileText;
    case 'handwritten': return Image;
    default: return File;
  }
};

// Animated stat card
const StatCard = ({ icon: Icon, value, label, color, delay = 0 }) => (
  <div
    className="group relative bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={cn(
      "absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity",
      color
    )} />
    <div className="relative flex items-center gap-3">
      <div className={cn(
        "p-2.5 rounded-xl transition-transform group-hover:scale-110",
        color.replace('bg-', 'bg-').replace('-500', '-100')
      )}>
        <Icon className={cn("h-5 w-5", color.replace('bg-', 'text-'))} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  </div>
);

// Feature card for upload types
const FeatureCard = ({ icon: Icon, title, description, color, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 group overflow-hidden",
      isActive
        ? `${color.bg} ${color.border} shadow-lg`
        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
    )}
  >
    {/* Background gradient */}
    <div className={cn(
      "absolute inset-0 opacity-0 transition-opacity duration-300",
      isActive ? "opacity-100" : "group-hover:opacity-50",
      color.gradient
    )} />

    <div className="relative flex items-start gap-4">
      <div className={cn(
        "p-3 rounded-xl transition-all duration-300",
        isActive
          ? `bg-gradient-to-br ${color.iconGradient} text-white shadow-lg`
          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-semibold text-lg mb-1 transition-colors",
          isActive ? color.text : "text-slate-900"
        )}>
          {title}
        </h3>
        <p className={cn(
          "text-sm transition-colors",
          isActive ? color.textMuted : "text-slate-500"
        )}>
          {description}
        </p>
      </div>
      <ChevronRight className={cn(
        "h-5 w-5 transition-all",
        isActive ? `${color.text} translate-x-0` : "text-slate-300 -translate-x-1 group-hover:translate-x-0 group-hover:text-slate-400"
      )} />
    </div>

    {/* Active indicator */}
    {isActive && (
      <div className={cn(
        "absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full",
        color.indicator
      )} />
    )}
  </button>
);

// Content card for recently uploaded items
const UploadedContentCard = ({ content, onDelete }) => {
  const FileIcon = getFileIcon(content.content_type);

  return (
    <div className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-emerald-200 transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
          <FileIcon className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
            {content.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="px-2 py-0.5 bg-slate-100 rounded-full capitalize">{content.category}</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-full capitalize">{content.content_type}</span>
          </div>
          {content.topic && (
            <p className="text-xs text-slate-400 mt-1 truncate">{content.topic}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => window.open(`/content/${content.id}`, '_blank')}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(content.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

function Upload() {
  const navigate = useNavigate();
  const [uploadedContent, setUploadedContent] = useState([]);
  const [activeTab, setActiveTab] = useState('files');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUploadSuccess = (content) => {
    setUploadedContent(prev => [content, ...prev]);
  };

  const handleDelete = (id) => {
    setUploadedContent(prev => prev.filter(item => item.id !== id));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadTypes = [
    {
      id: 'files',
      icon: FileText,
      title: 'Documents & Code',
      description: 'Upload PDFs, slides, code files, and other course materials',
      color: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        gradient: 'bg-gradient-to-br from-emerald-50/50 to-teal-50/50',
        iconGradient: 'from-emerald-500 to-teal-500',
        text: 'text-emerald-700',
        textMuted: 'text-emerald-600/80',
        indicator: 'bg-emerald-500'
      }
    },
    {
      id: 'handwritten',
      icon: FileImage,
      title: 'Handwritten Notes (OCR)',
      description: 'Convert handwritten notes to searchable digital text',
      color: {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        gradient: 'bg-gradient-to-br from-blue-50/50 to-indigo-50/50',
        iconGradient: 'from-blue-500 to-indigo-500',
        text: 'text-blue-700',
        textMuted: 'text-blue-600/80',
        indicator: 'bg-blue-500'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-0 w-[200%] h-full opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.2) 25%, rgba(59, 130, 246, 0.2) 50%, transparent 100%)',
              animation: 'waterFlow 12s linear infinite'
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${15 + (i % 3) * 25}%`,
                  animation: `float ${3 + i * 0.4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-lg opacity-50" />
                  <div className="relative p-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg">
                    <Cloud className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    Upload Center
                  </h1>
                  <p className="text-slate-400 mt-1 text-sm sm:text-base">
                    Add course materials for students to access
                  </p>
                </div>
              </div>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="text-white/80 text-sm">Instant Processing</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-white/80 text-sm">AI-Powered OCR</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="text-white/80 text-sm">Duplicate Detection</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex flex-col gap-3 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{uploadedContent.length}</div>
                  <div className="text-sm text-slate-400">Uploaded Today</div>
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">Ready</div>
                  <div className="text-sm text-slate-400">System Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload Type Selection */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <UploadIcon className="h-5 w-5 text-slate-500" />
              Choose Upload Type
            </h2>
            <div className="space-y-3">
              {uploadTypes.map(type => (
                <FeatureCard
                  key={type.id}
                  icon={type.icon}
                  title={type.title}
                  description={type.description}
                  color={type.color}
                  isActive={activeTab === type.id}
                  onClick={() => setActiveTab(type.id)}
                />
              ))}
            </div>

            {/* Tips Card */}
            <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
              <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-amber-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-amber-500" />
                  <span>Use descriptive titles for better search</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-amber-500" />
                  <span>Add tags to organize your content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-amber-500" />
                  <span>Enable OCR enhancement for handwritten notes</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Upload Form */}
          <div className="lg:col-span-2">
            <div className="animate-fade-in">
              {activeTab === 'files' ? (
                <UploadForm onUploadSuccess={handleUploadSuccess} />
              ) : (
                <HandwrittenNotesUpload onUploadSuccess={handleUploadSuccess} />
              )}
            </div>
          </div>
        </div>

        {/* Recently Uploaded Section */}
        {uploadedContent.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                Recently Uploaded
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({uploadedContent.length} items)
                </span>
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uploadedContent.map((content, index) => (
                <div
                  key={content.id}
                  className="animate-slide-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <UploadedContentCard
                    content={content}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for No Recent Uploads */}
        {uploadedContent.length === 0 && (
          <div className="mt-12 text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No uploads yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Start by uploading your first course material. Choose a file type from the left panel and fill in the details.
            </p>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-3 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-700 hover:scale-110",
          showScrollTop ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        )}
      >
        <ArrowUpToLine className="h-5 w-5" />
      </button>
    </div>
  );
}

export default Upload;
