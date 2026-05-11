import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Code, FileText, TrendingUp, ArrowRight, Upload,
  Users, Database, Settings, AlertCircle, CheckCircle,
  RefreshCw, Shield, BarChart3, Activity, Server, Zap,
  FolderOpen, Clock, Eye, ChevronRight, ArrowUpToLine,
  HardDrive, Cpu, Globe, Layers, PieChart
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { contentAPI } from '../services/api';
import ContentCard from '../components/ContentCard';
import { cn } from '../lib/utils';

// Animated stat card
const StatCard = ({ icon: Icon, value, label, color, trend, delay = 0 }) => (
  <div
    className={cn(
      "relative group bg-white rounded-2xl border border-slate-200 p-5 overflow-hidden",
      "hover:shadow-lg hover:border-slate-300 transition-all duration-300"
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Decorative gradient */}
    <div className={cn(
      "absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 group-hover:opacity-40 transition-opacity",
      color.gradient
    )} />

    {/* Accent bar */}
    <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-2xl", color.bar)} />

    <div className="relative flex items-center gap-4">
      <div className={cn(
        "p-3 rounded-xl transition-transform group-hover:scale-110",
        color.bg
      )}>
        <Icon className={cn("h-6 w-6", color.text)} />
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 mt-3 text-xs text-emerald-600">
        <TrendingUp className="h-3 w-3" />
        <span>{trend}</span>
      </div>
    )}
  </div>
);

// Quick action card
const ActionCard = ({ to, onClick, icon: Icon, title, description, color, disabled }) => {
  const Wrapper = to ? Link : 'button';
  const wrapperProps = to ? { to } : { onClick, disabled };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 group text-left",
        color.bg,
        color.hover,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-lg transition-transform group-hover:scale-110",
        color.iconBg
      )}>
        <Icon className={cn("h-5 w-5", color.iconText)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold", color.title)}>{title}</p>
        <p className={cn("text-sm", color.description)}>{description}</p>
      </div>
      <ChevronRight className={cn(
        "h-5 w-5 transition-all",
        color.arrow,
        "group-hover:translate-x-1"
      )} />
    </Wrapper>
  );
};

// Progress bar component
const ProgressBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 capitalize">{label}</span>
        <span className="text-slate-500">{value} items</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// System status indicator
const SystemStatus = ({ label, status, icon: Icon }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-slate-100 rounded-lg">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={cn(
        "h-2 w-2 rounded-full",
        status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
      )} />
      <span className={cn(
        "text-xs font-medium",
        status === 'online' ? "text-emerald-600" : "text-slate-500"
      )}>
        {status === 'online' ? 'Online' : 'Offline'}
      </span>
    </div>
  </div>
);

// Skeleton loader
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 h-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-5 w-64 bg-white/10 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white rounded-2xl animate-pulse shadow-lg" />
        ))}
      </div>
    </div>
  </div>
);

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessResult, setReprocessResult] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, contentRes] = await Promise.all([
        contentAPI.getStats(),
        contentAPI.getAll()
      ]);
      setStats(statsRes.data.data);
      setRecentContent(contentRes.data.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({ total: 0, byCategory: {}, byType: {} });
      setRecentContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReprocessAll = async () => {
    if (!confirm('This will reprocess all content for search indexing. Continue?')) return;

    setReprocessing(true);
    setReprocessResult(null);
    try {
      const response = await contentAPI.reprocessAll();
      setReprocessResult({
        success: true,
        message: `Processed ${response.data.processed} items successfully`
      });
    } catch (error) {
      setReprocessResult({
        success: false,
        message: error.response?.data?.detail || 'Reprocessing failed'
      });
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = (id) => {
    setRecentContent(prev => prev.filter(item => item.id !== id));
    fetchDashboardData();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const typeColors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-0 w-[200%] h-full opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.3) 25%, rgba(16, 185, 129, 0.3) 50%, transparent 100%)',
              animation: 'waterFlow 15s linear infinite'
            }}
          />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px]" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28">
          {/* Header content */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl blur-lg opacity-50" />
                <div className="relative p-3.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-slate-400 mt-1">Manage content and monitor system status</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-white/80">All systems operational</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <span className="text-sm text-slate-400">Logged in as</span>
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-medium">
                  {user?.username || 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 pb-12">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            icon={TrendingUp}
            value={stats?.total || 0}
            label="Total Materials"
            color={{
              bg: 'bg-emerald-100',
              text: 'text-emerald-600',
              gradient: 'bg-emerald-500',
              bar: 'bg-emerald-500'
            }}
            trend="+12% this month"
            delay={0}
          />
          <StatCard
            icon={BookOpen}
            value={stats?.byCategory?.theory || 0}
            label="Theory Materials"
            color={{
              bg: 'bg-blue-100',
              text: 'text-blue-600',
              gradient: 'bg-blue-500',
              bar: 'bg-blue-500'
            }}
            delay={100}
          />
          <StatCard
            icon={Code}
            value={stats?.byCategory?.lab || 0}
            label="Lab Materials"
            color={{
              bg: 'bg-violet-100',
              text: 'text-violet-600',
              gradient: 'bg-violet-500',
              bar: 'bg-violet-500'
            }}
            delay={200}
          />
          <StatCard
            icon={Layers}
            value={Object.keys(stats?.byType || {}).length}
            label="Content Types"
            color={{
              bg: 'bg-amber-100',
              text: 'text-amber-600',
              gradient: 'bg-amber-500',
              bar: 'bg-amber-500'
            }}
            delay={300}
          />
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-slate-100 rounded-xl">
                  <Zap className="h-5 w-5 text-slate-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
              </div>

              <div className="space-y-3">
                <ActionCard
                  to="/upload"
                  icon={Upload}
                  title="Upload Content"
                  description="Add new materials"
                  color={{
                    bg: 'bg-emerald-50',
                    hover: 'hover:bg-emerald-100',
                    iconBg: 'bg-emerald-500/20',
                    iconText: 'text-emerald-600',
                    title: 'text-emerald-900',
                    description: 'text-emerald-700',
                    arrow: 'text-emerald-400'
                  }}
                />

                <ActionCard
                  to="/browse"
                  icon={FolderOpen}
                  title="Manage Content"
                  description="Edit or delete materials"
                  color={{
                    bg: 'bg-blue-50',
                    hover: 'hover:bg-blue-100',
                    iconBg: 'bg-blue-500/20',
                    iconText: 'text-blue-600',
                    title: 'text-blue-900',
                    description: 'text-blue-700',
                    arrow: 'text-blue-400'
                  }}
                />

                <ActionCard
                  onClick={handleReprocessAll}
                  disabled={reprocessing}
                  icon={reprocessing ? RefreshCw : Database}
                  title="Reindex Content"
                  description="Regenerate embeddings"
                  color={{
                    bg: 'bg-violet-50',
                    hover: 'hover:bg-violet-100',
                    iconBg: 'bg-violet-500/20',
                    iconText: cn('text-violet-600', reprocessing && 'animate-spin'),
                    title: 'text-violet-900',
                    description: 'text-violet-700',
                    arrow: 'text-violet-400'
                  }}
                />

                {reprocessResult && (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-xl text-sm",
                    reprocessResult.success
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  )}>
                    {reprocessResult.success ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span>{reprocessResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-slate-100 rounded-xl">
                  <Server className="h-5 w-5 text-slate-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">System Status</h2>
              </div>

              <div className="space-y-1">
                <SystemStatus icon={Globe} label="API Server" status="online" />
                <SystemStatus icon={Database} label="Database" status="online" />
                <SystemStatus icon={Cpu} label="AI Services" status="online" />
                <SystemStatus icon={HardDrive} label="Storage" status="online" />
              </div>
            </div>
          </div>

          {/* Content Breakdown */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Content Analytics</h2>
                </div>
                <Link
                  to="/browse"
                  className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-500 transition-colors"
                >
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Content Types */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">By Content Type</h3>
                {Object.entries(stats?.byType || {}).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.byType).map(([type, count], index) => (
                      <ProgressBar
                        key={type}
                        label={type}
                        value={count}
                        total={stats?.total || 1}
                        color={typeColors[index % typeColors.length]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-sm">No content types to display</p>
                  </div>
                )}
              </div>

              {/* Week breakdown */}
              {Object.keys(stats?.byWeek || {}).length > 0 && (
                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">By Week</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.byWeek)
                      .sort(([a], [b]) => {
                        const weekA = parseInt(a.replace('week_', ''));
                        const weekB = parseInt(b.replace('week_', ''));
                        return weekA - weekB;
                      })
                      .map(([week, count]) => (
                        <div
                          key={week}
                          className="px-4 py-2 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl"
                        >
                          <span className="text-xs text-slate-500">Week {week.replace('week_', '')}</span>
                          <p className="text-lg font-bold text-slate-900">{count}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Category breakdown visual */}
              <div className="pt-6 border-t border-slate-200 mt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Category Distribution</h3>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-blue-900">Theory</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{stats?.byCategory?.theory || 0}</p>
                    <p className="text-xs text-blue-500 mt-1">materials</p>
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Code className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="font-medium text-emerald-900">Lab</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600">{stats?.byCategory?.lab || 0}</p>
                    <p className="text-xs text-emerald-500 mt-1">exercises</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Content */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Recent Uploads</h2>
            </div>
            <Link
              to="/browse"
              className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors group"
            >
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {recentContent.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recentContent.map((content, index) => (
                <div
                  key={content.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ContentCard
                    content={content}
                    onDelete={handleDelete}
                    showActions
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No content yet</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                Start by uploading some course materials to populate your learning platform.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                <Upload className="h-4 w-4" />
                Upload Content
              </Link>
            </div>
          )}
        </div>

        {/* System Info Footer */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI-Powered Learning Platform</h3>
                <p className="text-sm text-slate-400">
                  Semantic search, content generation, and intelligent validation
                </p>
              </div>
            </div>
            <div className="sm:ml-auto flex items-center gap-3 px-4 py-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-300 font-medium">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-3 bg-slate-800 text-white rounded-full",
          "shadow-lg shadow-slate-800/30 transition-all duration-300",
          "hover:bg-slate-700 hover:scale-110",
          showScrollTop ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        )}
      >
        <ArrowUpToLine className="h-5 w-5" />
      </button>

      {/* CSS Animations */}
      <style>{`
        @keyframes waterFlow {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
