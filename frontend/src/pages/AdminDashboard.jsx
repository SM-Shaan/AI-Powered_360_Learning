import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Code, FileText, TrendingUp, ArrowRight, Upload,
  Users, Database, Settings, AlertCircle, CheckCircle,
  RefreshCw, Shield, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { contentAPI } from '../services/api';
import ContentCard from '../components/ContentCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessResult, setReprocessResult] = useState(null);

  useEffect(() => {
    fetchDashboardData();
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
    // Refresh stats
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-600" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500">Manage content and monitor system status</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Logged in as</span>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            {user?.username || 'Admin'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-gray-500">Total Materials</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.byCategory?.theory || 0}</p>
              <p className="text-sm text-gray-500">Theory Materials</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-violet-500">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/20 text-violet-600">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.byCategory?.lab || 0}</p>
              <p className="text-sm text-gray-500">Lab Materials</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.keys(stats?.byType || {}).length}
              </p>
              <p className="text-sm text-gray-500">Content Types</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/upload"
              className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors group"
            >
              <Upload className="h-5 w-5 text-emerald-600" />
              <div className="flex-1">
                <p className="font-medium text-emerald-900">Upload New Content</p>
                <p className="text-sm text-emerald-700">Add materials, code, or handwritten notes</p>
              </div>
              <ArrowRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/browse"
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <Database className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">Manage Content</p>
                <p className="text-sm text-blue-700">Edit, update, or delete existing materials</p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={handleReprocessAll}
              disabled={reprocessing}
              className="w-full flex items-center gap-3 p-4 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors group disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 text-violet-600 ${reprocessing ? 'animate-spin' : ''}`} />
              <div className="flex-1 text-left">
                <p className="font-medium text-violet-900">Reindex All Content</p>
                <p className="text-sm text-violet-700">Regenerate search embeddings</p>
              </div>
            </button>

            {reprocessResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                reprocessResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {reprocessResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="text-sm">{reprocessResult.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-500" />
              Content Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.byType || {}).length > 0 ? (
                Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{type}</span>
                      <span className="text-gray-500">{count} items</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(count / (stats?.total || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No content types to display</p>
              )}

              {/* Week breakdown */}
              {Object.keys(stats?.byWeek || {}).length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">By Week</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.byWeek)
                      .sort(([a], [b]) => {
                        const weekA = parseInt(a.replace('week_', ''));
                        const weekB = parseInt(b.replace('week_', ''));
                        return weekA - weekB;
                      })
                      .map(([week, count]) => (
                        <span
                          key={week}
                          className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          Week {week.replace('week_', '')}: {count}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Uploads</h2>
          <Link
            to="/browse"
            className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentContent.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentContent.map(content => (
              <ContentCard
                key={content.id}
                content={content}
                onDelete={handleDelete}
                showActions
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <BookOpen className="h-12 w-12 mx-auto text-gray-500/50" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No content yet</h3>
                <p className="text-gray-500">Start by uploading some course materials</p>
              </div>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link to="/upload">Upload Content</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* System Info */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <Database className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">System Information</h3>
              <p className="text-sm text-gray-600">
                AI-Powered Learning Platform with semantic search, content generation, and validation
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-600">All systems operational</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboard;
