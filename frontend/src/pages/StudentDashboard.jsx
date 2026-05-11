import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Code, MessageSquare, Sparkles, Search,
  Brain, GraduationCap, ArrowRight, Clock, Star,
  TrendingUp, Target, Award, Zap, ChevronRight,
  Play, FileText, Lightbulb, ArrowUpToLine, Flame,
  BarChart3, BookMarked, Rocket
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { contentAPI } from '../services/api';
import ContentCard from '../components/ContentCard';
import { cn } from '../lib/utils';

// Animated stat card component
const StatCard = ({ icon: Icon, value, label, color, trend, delay = 0 }) => (
  <div
    className={cn(
      "relative group bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20",
      "hover:bg-white/15 hover:border-white/30 transition-all duration-300",
      "animate-fade-in"
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-4xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-white/70 mt-1">{label}</p>
      </div>
      <div className={cn(
        "p-3 rounded-xl transition-transform group-hover:scale-110",
        color
      )}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 mt-3 text-xs text-emerald-300">
        <TrendingUp className="h-3 w-3" />
        <span>{trend}</span>
      </div>
    )}
  </div>
);

// AI Tool card with enhanced design
const AIToolCard = ({ to, icon: Icon, title, description, color, gradient, badge }) => (
  <Link to={to} className="group block">
    <div className={cn(
      "relative h-full bg-white rounded-2xl border-2 border-slate-200 p-6 overflow-hidden",
      "hover:border-transparent hover:shadow-xl transition-all duration-300"
    )}>
      {/* Hover gradient background */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        gradient
      )} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300",
            "group-hover:scale-110 group-hover:shadow-lg",
            color.bg
          )}>
            <Icon className={cn("h-7 w-7", color.text)} />
          </div>
          {badge && (
            <span className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-full",
              badge.color
            )}>
              {badge.text}
            </span>
          )}
        </div>

        <h3 className={cn(
          "font-semibold text-lg mb-2 transition-colors",
          `group-hover:${color.text}`
        )}>
          {title}
        </h3>
        <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
          {description}
        </p>

        <div className={cn(
          "flex items-center gap-1 mt-4 text-sm font-medium transition-all",
          color.text,
          "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
        )}>
          <span>Get Started</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  </Link>
);

// Material category card
const MaterialCard = ({ to, icon: Icon, title, count, color }) => (
  <Link to={to} className="group block">
    <div className={cn(
      "relative bg-white rounded-2xl border border-slate-200 p-5 overflow-hidden",
      "hover:shadow-lg hover:border-slate-300 transition-all duration-300"
    )}>
      {/* Decorative gradient */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity",
        color.gradient
      )} />

      <div className="relative flex items-center gap-4">
        <div className={cn(
          "p-3 rounded-xl transition-transform group-hover:scale-110",
          color.bg
        )}>
          <Icon className={cn("h-6 w-6", color.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-500">{count} resources available</p>
        </div>
        <ChevronRight className={cn(
          "h-5 w-5 text-slate-300 transition-all",
          "group-hover:text-slate-500 group-hover:translate-x-1"
        )} />
      </div>
    </div>
  </Link>
);

// Learning progress ring
const ProgressRing = ({ progress, size = 80, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-white/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-white transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{progress}%</span>
      </div>
    </div>
  );
};

// Skeleton loader
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
    <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 h-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white/20 animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-64 bg-white/20 rounded-lg animate-pulse" />
            <div className="h-5 w-48 bg-white/20 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-white rounded-2xl animate-pulse shadow-lg" />
        ))}
      </div>
    </div>
  </div>
);

function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setRecentContent(contentRes.data.data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({ total: 0, byCategory: {}, byType: {} });
      setRecentContent([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-0 w-[200%] h-full opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              animation: 'waterFlow 15s linear infinite'
            }}
          />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-400/20 rounded-full blur-[80px]" />

          {/* Floating particles */}
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 20}%`,
                  animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-32">
          {/* Welcome Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-lg" />
                <div className="relative p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <p className="text-emerald-100 text-sm font-medium">{getGreeting()}</p>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {user?.username || 'Student'}!
                </h1>
                <p className="text-white/80 mt-1 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-300" />
                  Ready to continue your learning journey?
                </p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="hidden lg:flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
              <ProgressRing progress={65} />
              <div>
                <p className="text-white font-semibold">Weekly Progress</p>
                <p className="text-white/70 text-sm">Keep up the great work!</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={BookOpen}
              value={stats?.total || 0}
              label="Materials Available"
              color="bg-white/20"
              trend="+5 this week"
              delay={0}
            />
            <StatCard
              icon={FileText}
              value={stats?.byCategory?.theory || 0}
              label="Theory Topics"
              color="bg-white/20"
              delay={100}
            />
            <StatCard
              icon={Code}
              value={stats?.byCategory?.lab || 0}
              label="Lab Exercises"
              color="bg-white/20"
              delay={200}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-12">
        {/* AI Learning Tools */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">AI Learning Tools</h2>
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">
              Powered by AI
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <AIToolCard
              to="/chat"
              icon={MessageSquare}
              title="AI Chat Tutor"
              description="Ask questions and get instant explanations from your personal AI tutor"
              color={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }}
              gradient="bg-gradient-to-br from-emerald-50 to-teal-50"
              badge={{ text: 'Popular', color: 'bg-emerald-100 text-emerald-700' }}
            />

            <AIToolCard
              to="/search"
              icon={Search}
              title="Smart Search"
              description="Find relevant content instantly using semantic AI-powered search"
              color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
              gradient="bg-gradient-to-br from-blue-50 to-indigo-50"
            />

            <AIToolCard
              to="/generate"
              icon={Brain}
              title="Content Generator"
              description="Create personalized notes, quizzes, and code examples on demand"
              color={{ bg: 'bg-violet-100', text: 'text-violet-600' }}
              gradient="bg-gradient-to-br from-violet-50 to-purple-50"
              badge={{ text: 'New', color: 'bg-amber-100 text-amber-700' }}
            />
          </div>
        </div>

        {/* Study Materials */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
              <BookMarked className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Study Materials</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MaterialCard
              to="/browse?category=theory"
              icon={BookOpen}
              title="Theory Materials"
              count={stats?.byCategory?.theory || 0}
              color={{
                bg: 'bg-blue-100',
                text: 'text-blue-600',
                gradient: 'bg-blue-500'
              }}
            />

            <MaterialCard
              to="/browse?category=lab"
              icon={Code}
              title="Lab Exercises"
              count={stats?.byCategory?.lab || 0}
              color={{
                bg: 'bg-emerald-100',
                text: 'text-emerald-600',
                gradient: 'bg-emerald-500'
              }}
            />
          </div>
        </div>

        {/* Recent Materials */}
        {recentContent.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Recently Added</h2>
              </div>
              <Link
                to="/browse"
                className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-500 transition-colors group"
              >
                View All
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {recentContent.map((content, index) => (
                <div
                  key={content.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ContentCard content={content} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions & Tips */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Start */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Rocket className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg">Quick Start</h3>
              </div>
              <p className="text-white/80 mb-5">
                Jump right into learning with these quick actions
              </p>
              <div className="space-y-3">
                <Link
                  to="/chat"
                  className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group"
                >
                  <Play className="h-5 w-5" />
                  <span className="font-medium">Start a Chat Session</span>
                  <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link
                  to="/browse"
                  className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors group"
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="font-medium">Browse Materials</span>
                  <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>

          {/* Learning Tips */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/50 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-bold text-lg text-amber-900">Learning Tips</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-200 rounded-full mt-0.5">
                    <Star className="h-3 w-3 text-amber-600" />
                  </div>
                  <p className="text-sm text-amber-800">
                    Use the <strong>AI Chat</strong> to ask questions about concepts you find difficult
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-200 rounded-full mt-0.5">
                    <Star className="h-3 w-3 text-amber-600" />
                  </div>
                  <p className="text-sm text-amber-800">
                    Try <strong>Smart Search</strong> to find related topics across all materials
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-200 rounded-full mt-0.5">
                    <Star className="h-3 w-3 text-amber-600" />
                  </div>
                  <p className="text-sm text-amber-800">
                    Generate personalized <strong>quizzes</strong> to test your understanding
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-3 bg-emerald-600 text-white rounded-full",
          "shadow-lg shadow-emerald-500/30 transition-all duration-300",
          "hover:bg-emerald-700 hover:scale-110",
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
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

export default StudentDashboard;
