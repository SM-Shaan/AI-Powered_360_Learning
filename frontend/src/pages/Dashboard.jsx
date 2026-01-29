import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import { contentAPI } from '../services/api';
import ContentCard from '../components/ContentCard';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // Set default empty values on error
      setStats({ total: 0, byCategory: {}, byType: {} });
      setRecentContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setRecentContent(prev => prev.filter(item => item.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Course Dashboard</h1>
        <p className="text-gray-500">AI-Powered Supplementary Learning Platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
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

        <Card className="hover:shadow-md transition-shadow">
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

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-600">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.byCategory?.lab || 0}</p>
              <p className="text-sm text-gray-500">Lab Materials</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-500/20 text-violet-600">
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Materials</h2>
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

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/upload"
            className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl hover:border-emerald-500/50 hover:shadow-md transition-all group"
          >
            <FileText className="h-8 w-8 text-gray-500 group-hover:text-emerald-600 transition-colors" />
            <span className="font-medium group-hover:text-emerald-600 transition-colors">Upload Materials</span>
          </Link>
          <Link
            to="/browse?category=theory"
            className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl hover:border-blue-500/50 hover:shadow-md transition-all group"
          >
            <BookOpen className="h-8 w-8 text-gray-500 group-hover:text-blue-600 transition-colors" />
            <span className="font-medium group-hover:text-blue-600 transition-colors">Browse Theory</span>
          </Link>
          <Link
            to="/browse?category=lab"
            className="flex flex-col items-center gap-3 p-6 bg-card border border-border rounded-xl hover:border-emerald-500/50 hover:shadow-md transition-all group"
          >
            <Code className="h-8 w-8 text-gray-500 group-hover:text-emerald-600 transition-colors" />
            <span className="font-medium group-hover:text-emerald-600 transition-colors">Browse Lab</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
