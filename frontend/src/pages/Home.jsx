import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Brain,
  Sparkles,
  GraduationCap,
  FileText,
  Code2,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Users,
  MessageCircle,
  Bot,
  Presentation,
  HelpCircle,
  ChevronRight,
  Play,
  Star,
  Quote,
  Rocket,
  Target,
  TrendingUp,
  Globe,
  Award,
  Layers,
  MousePointer
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Learning',
    description: 'Get intelligent answers and explanations powered by Claude AI with course context.',
    color: 'violet'
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Find content using semantic search that understands concepts, not just keywords.',
    color: 'blue'
  },
  {
    icon: Sparkles,
    title: 'Content Generation',
    description: 'Generate study notes, quizzes, slides, and code examples on any topic.',
    color: 'amber'
  },
  {
    icon: MessageCircle,
    title: 'AI Chat Assistant',
    description: 'Have conversations with an AI tutor that knows your course materials.',
    color: 'emerald'
  },
  {
    icon: FileText,
    title: 'Rich Content Library',
    description: 'Access PDFs, code samples, slides, and notes all in one organized place.',
    color: 'rose'
  },
  {
    icon: Shield,
    title: 'Always Available',
    description: 'Study anytime with 24/7 access to all materials and AI assistance.',
    color: 'cyan'
  }
];

const COLOR_CLASSES = {
  violet: 'bg-violet-100 text-violet-600',
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  rose: 'bg-rose-100 text-rose-600',
  cyan: 'bg-cyan-100 text-cyan-600'
};

const AI_TOOLS = [
  {
    icon: MessageCircle,
    title: 'AI Chat',
    description: 'Interactive learning assistant',
    path: '/chat',
    gradient: 'from-violet-500 to-purple-600'
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Semantic content search',
    path: '/search',
    gradient: 'from-blue-500 to-cyan-600'
  },
  {
    icon: Sparkles,
    title: 'Content Generator',
    description: 'Create study materials',
    path: '/generate',
    gradient: 'from-amber-500 to-orange-600'
  }
];

const STATS = [
  { value: 'AI', label: 'Powered', suffix: '', icon: Brain },
  { value: '24/7', label: 'Access', suffix: '', icon: Globe },
  { value: '4', label: 'AI Tools', suffix: '+', icon: Layers },
  { value: '100', label: 'Materials', suffix: '%', icon: FileText }
];

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Computer Science Student',
    avatar: 'SC',
    content: 'LearnAI360 transformed how I study. The AI chat understands my course material perfectly!',
    rating: 5
  },
  {
    name: 'Michael Roberts',
    role: 'Graduate Researcher',
    avatar: 'MR',
    content: 'The semantic search is incredible. I find relevant content in seconds instead of hours.',
    rating: 5
  },
  {
    name: 'Emily Davis',
    role: 'Engineering Student',
    avatar: 'ED',
    content: 'Content generation saved me countless hours preparing for exams. Highly recommended!',
    rating: 5
  }
];

// Animated counter hook
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated || isNaN(parseInt(end))) return;

    const endNum = parseInt(end);
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * endNum));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, hasAnimated]);

  return count;
}

function Home() {
  const { isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Gradient Mesh */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60" />

          {/* Animated Orbs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/25 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />

          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className={cn(
              "text-center lg:text-left transform transition-all duration-1000",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            )}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm border border-emerald-500/30 px-5 py-2.5 rounded-full text-sm font-medium mb-8 hover:border-emerald-400/50 transition-colors cursor-default">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent font-semibold">AI-Powered Learning Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
                Learn Smarter with
                <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  AI Assistance
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Access course materials, get AI-powered explanations, generate study content,
                and search intelligently. <span className="text-emerald-400 font-medium">Your complete learning companion.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="group relative bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-8 py-6 text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300"
                >
                  <Link to={isAuthenticated ? "/browse" : "/register"}>
                    <Rocket className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    {isAuthenticated ? "Browse Materials" : "Get Started Free"}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10 hover:border-white/30 px-8 py-6 text-lg backdrop-blur-sm transition-all duration-300"
                >
                  <Link to="/about">
                    <Play className="mr-2 h-5 w-5" />
                    Learn More
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-12 flex flex-wrap items-center gap-6 justify-center lg:justify-start">
                {[
                  { icon: CheckCircle, text: 'Free to use' },
                  { icon: Shield, text: 'Secure & Private' },
                  { icon: Zap, text: 'Instant access' }
                ].map((badge, idx) => (
                  <span key={idx} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors">
                    <badge.icon className="w-4 h-4 text-emerald-400" />
                    {badge.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Visual - Enhanced 3D Card */}
            <div className={cn(
              "relative hidden lg:block transform transition-all duration-1000 delay-300",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            )}>
              <div className="relative perspective-1000">
                {/* Glow effect behind card */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-2xl transform scale-95" />

                {/* Main Card */}
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:border-white/30">
                  {/* Window Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-300 transition-colors cursor-pointer" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-colors cursor-pointer" />
                      <div className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-300 transition-colors cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-slate-400">LearnAI360</span>
                    </div>
                  </div>

                  {/* Mini Feature Cards */}
                  <div className="space-y-4">
                    {AI_TOOLS.map((tool, idx) => (
                      <Link
                        key={idx}
                        to={tool.path}
                        className="group flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className={cn(
                          "p-3 rounded-xl bg-gradient-to-br text-white shadow-lg group-hover:scale-110 transition-transform duration-300",
                          tool.gradient
                        )}>
                          <tool.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{tool.title}</p>
                          <p className="text-sm text-slate-400">{tool.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>

                  {/* Interactive hint */}
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <MousePointer className="w-3 h-3" />
                    Click any tool to try it
                  </div>
                </div>

                {/* Floating Badges */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-emerald-500/30 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                  <Bot className="w-4 h-4" />
                  Powered by Claude
                </div>

                <div className="absolute -bottom-3 -left-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg shadow-violet-500/30 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Ready
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider - Enhanced */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L48 115C96 110 192 100 288 88C384 76 480 62 576 58C672 54 768 60 864 68C960 76 1056 86 1152 89C1248 92 1344 88 1392 86L1440 84V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white relative z-10 -mt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, idx) => (
              <div
                key={idx}
                className="group relative text-center p-8 rounded-3xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500 overflow-hidden"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-slate-600 mt-2 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-100/50 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-sm font-semibold mb-6 border border-emerald-200">
              <Zap className="w-4 h-4" />
              Powerful Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">Excel in Learning</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A comprehensive suite of AI-powered tools designed to enhance your learning experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="group relative p-8 bg-white rounded-3xl border border-gray-100 hover:border-transparent shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500"
              >
                {/* Gradient border on hover */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-[2px]" />
                <div className="absolute inset-[2px] rounded-[22px] bg-white -z-10" />

                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                  COLOR_CLASSES[feature.color]
                )}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>

                {/* Hover indicator */}
                <div className="mt-6 flex items-center gap-2 text-emerald-600 font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-sm">Learn more</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools Showcase */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-semibold mb-6">
              <Bot className="w-4 h-4 text-violet-400" />
              AI Tools
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Powerful AI at Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">Fingertips</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Three specialized AI tools to help you learn, search, and create content effortlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {AI_TOOLS.map((tool, idx) => (
              <Link
                key={idx}
                to={tool.path}
                className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 p-10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105"
              >
                {/* Icon */}
                <div className={cn(
                  "inline-flex p-4 rounded-2xl bg-gradient-to-br text-white mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500",
                  tool.gradient
                )}>
                  <tool.icon className="w-8 h-8" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">{tool.title}</h3>
                <p className="text-slate-400 mb-6 text-lg">{tool.description}</p>

                <span className="inline-flex items-center gap-2 text-base font-semibold text-emerald-400 group-hover:gap-4 transition-all">
                  Try it now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>

                {/* Large decorative gradient */}
                <div className={cn(
                  "absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 bg-gradient-to-br",
                  tool.gradient
                )} />

                {/* Sparkle effect */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-5 h-5 text-white/50" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-semibold mb-6 border border-blue-200">
              <Target className="w-4 h-4" />
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Get Started in
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600"> Minutes</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connector Line - Desktop */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-1 bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-200 rounded-full" />

            {[
              { step: 1, icon: Users, title: 'Sign Up Free', desc: 'Create your account in seconds with just an email. No credit card required.', color: 'from-emerald-500 to-teal-500' },
              { step: 2, icon: Search, title: 'Explore Content', desc: 'Browse materials or use AI-powered semantic search to find exactly what you need.', color: 'from-blue-500 to-cyan-500' },
              { step: 3, icon: Award, title: 'Learn & Create', desc: 'Chat with AI, generate study materials, and master your courses with ease.', color: 'from-violet-500 to-purple-500' }
            ].map((item, idx) => (
              <div key={idx} className="relative text-center group">
                {/* Step number */}
                <div className="relative inline-block mb-8">
                  <div className={cn(
                    "w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br text-white flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500",
                    item.color
                  )}>
                    <item.icon className="w-10 h-10" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                    {item.step}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">{item.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - NEW */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-semibold mb-6 border border-amber-200">
              <Star className="w-4 h-4 fill-current" />
              Testimonials
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Loved by
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500"> Students</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what our users have to say about their learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, idx) => (
              <div
                key={idx}
                className="group relative p-8 bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2"
              >
                {/* Quote icon */}
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="w-12 h-12 text-emerald-600" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 text-lg leading-relaxed mb-8 italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" />
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/50 via-transparent to-cyan-500/50 animate-pulse" style={{ animationDuration: '4s' }} />

        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-lg animate-float" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full text-sm font-semibold text-white mb-8">
            <TrendingUp className="w-4 h-4" />
            Start Learning Today
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform
            <span className="block">Your Learning?</span>
          </h2>
          <p className="text-xl text-emerald-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students who are already using AI to study smarter, not harder.
            Your AI-powered learning journey starts here.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="group bg-white text-emerald-600 hover:bg-gray-50 px-10 py-6 text-lg shadow-2xl shadow-black/20 hover:shadow-white/20 hover:scale-105 transition-all duration-300"
            >
              <Link to={isAuthenticated ? "/chat" : "/register"}>
                <Rocket className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                {isAuthenticated ? "Start Chatting" : "Get Started Free"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 px-10 py-6 text-lg backdrop-blur-sm transition-all duration-300"
            >
              <Link to="/about">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-200" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-200" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-200" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-20 pb-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">LearnAI360</span>
              </div>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Your AI-powered learning companion. Access materials, get explanations,
                and generate content with cutting-edge AI technology.
              </p>
              {/* Social icons placeholder */}
              <div className="flex gap-4">
                {['Github', 'Twitter', 'LinkedIn'].map((social, idx) => (
                  <div key={idx} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer">
                    <Globe className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
              <ul className="space-y-4">
                {[
                  { to: '/browse', label: 'Browse Materials' },
                  { to: '/chat', label: 'AI Chat' },
                  { to: '/search', label: 'Smart Search' },
                  { to: '/generate', label: 'Content Generator' }
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.to} className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Resources</h4>
              <ul className="space-y-4">
                {[
                  { to: '/browse?category=theory', label: 'Theory Materials' },
                  { to: '/browse?category=lab', label: 'Lab Resources' },
                  { to: '/about', label: 'About Us' }
                ].map((link, idx) => (
                  <li key={idx}>
                    <Link to={link.to} className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Stay Updated</h4>
              <p className="text-slate-400 mb-4">Get the latest updates on new features and AI learning tips.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                />
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 rounded-xl">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} LearnAI360. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-slate-300 cursor-pointer transition-colors">Cookies</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
