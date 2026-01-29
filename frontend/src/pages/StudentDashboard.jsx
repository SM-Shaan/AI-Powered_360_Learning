import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Code, MessageSquare, Sparkles, Search,
  Brain, GraduationCap, ArrowRight, Clock, Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { contentAPI } from '../services/api';
import ContentCard from '../components/ContentCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

function StudentDashboard() {
  const { user } = useAuth();
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
      setRecentContent(contentRes.data.data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({ total: 0, byCategory: {}, byType: {} });
      setRecentContent([]);
    } finally {
      setLoading(false);
    }
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.username || 'Student'}!</h1>
            <p className="text-emerald-100 mt-1">Ready to continue your learning journey?</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold">{stats?.total || 0}</p>
            <p className="text-sm text-emerald-100">Materials Available</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold">{stats?.byCategory?.theory || 0}</p>
            <p className="text-sm text-emerald-100">Theory Topics</p>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold">{stats?.byCategory?.lab || 0}</p>
            <p className="text-sm text-emerald-100">Lab Exercises</p>
          </div>
        </div>
      </div>

      {/* AI Learning Tools */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          AI Learning Tools
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/chat" className="group">
            <Card className="h-full hover:shadow-lg hover:border-emerald-500/50 transition-all">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <MessageSquare className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-emerald-600 transition-colors">AI Chat Tutor</h3>
                  <p className="text-sm text-gray-500 mt-1">Ask questions and get instant explanations from AI</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/search" className="group">
            <Card className="h-full hover:shadow-lg hover:border-blue-500/50 transition-all">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Search className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">Smart Search</h3>
                  <p className="text-sm text-gray-500 mt-1">Find relevant content using semantic search</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/generate" className="group">
            <Card className="h-full hover:shadow-lg hover:border-violet-500/50 transition-all">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                  <Brain className="h-7 w-7 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-violet-600 transition-colors">Generate Content</h3>
                  <p className="text-sm text-gray-500 mt-1">Create notes, quizzes, and code examples</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Browse Materials */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Study Materials
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/browse?category=theory" className="group">
            <Card className="hover:shadow-lg hover:border-blue-500/50 transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-blue-600 transition-colors">Theory Materials</h3>
                  <p className="text-sm text-gray-500">{stats?.byCategory?.theory || 0} resources available</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>

          <Link to="/browse?category=lab" className="group">
            <Card className="hover:shadow-lg hover:border-emerald-500/50 transition-all">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Code className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-emerald-600 transition-colors">Lab Exercises</h3>
                  <p className="text-sm text-gray-500">{stats?.byCategory?.lab || 0} exercises available</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Materials */}
      {recentContent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Recently Added
            </h2>
            <Link
              to="/browse"
              className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {recentContent.map(content => (
              <ContentCard
                key={content.id}
                content={content}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Learning Tips */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900">Learning Tip</h3>
              <p className="text-sm text-amber-800 mt-1">
                Try using the AI Chat to ask questions about concepts you find difficult.
                The AI tutor can explain topics in different ways and provide examples based on your course materials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentDashboard;
