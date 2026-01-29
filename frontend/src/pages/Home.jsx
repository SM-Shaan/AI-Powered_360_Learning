import { Link } from 'react-router-dom';
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
  Play
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
  { value: 'AI', label: 'Powered', suffix: '' },
  { value: '24/7', label: 'Access', suffix: '' },
  { value: '4', label: 'AI Tools', suffix: '+' },
  { value: '100', label: 'Materials', suffix: '%' }
];

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>AI-Powered Learning Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Learn Smarter with
                <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  AI Assistance
                </span>
              </h1>

              <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0">
                Access course materials, get AI-powered explanations, generate study content,
                and search intelligently. Your complete learning companion.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 shadow-lg hover:shadow-xl transition-all"
                >
                  <Link to={isAuthenticated ? "/browse" : "/register"}>
                    {isAuthenticated ? "Browse Materials" : "Get Started Free"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 px-8"
                >
                  <Link to="/about">
                    Learn More
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Free to use
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Instant access
                </span>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-sm text-slate-400 ml-2">LearnAI360</span>
                  </div>

                  {/* Mini Feature Cards */}
                  <div className="space-y-3">
                    {AI_TOOLS.map((tool, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className={cn(
                          "p-2 rounded-lg bg-gradient-to-br text-white",
                          tool.gradient
                        )}>
                          <tool.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{tool.title}</p>
                          <p className="text-sm text-slate-400">{tool.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Powered by Claude
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white relative z-10 -mt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, idx) => (
              <div key={idx} className="text-center p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A comprehensive suite of AI-powered tools designed to enhance your learning experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  COLOR_CLASSES[feature.color]
                )}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Tools Showcase */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-4">
              <Bot className="w-4 h-4" />
              AI Tools
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Powerful AI at Your Fingertips
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three specialized AI tools to help you learn, search, and create.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {AI_TOOLS.map((tool, idx) => (
              <Link
                key={idx}
                to={tool.path}
                className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className={cn(
                  "inline-flex p-3 rounded-xl bg-gradient-to-br text-white mb-4 shadow-lg group-hover:scale-110 transition-transform",
                  tool.gradient
                )}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{tool.title}</h3>
                <p className="text-gray-600 mb-4">{tool.description}</p>
                <span className="inline-flex items-center text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all">
                  Try it now
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>

                {/* Decorative gradient */}
                <div className={cn(
                  "absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br",
                  tool.gradient
                )} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              <Play className="w-4 h-4" />
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Get Started in Minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: 1, title: 'Sign Up Free', desc: 'Create your account in seconds with just an email.' },
              { step: 2, title: 'Explore Content', desc: 'Browse materials or use AI search to find what you need.' },
              { step: 3, title: 'Learn & Create', desc: 'Chat with AI, generate content, and ace your courses.' }
            ].map((item, idx) => (
              <div key={idx} className="text-center relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>

                {/* Connector Line */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join students who are already using AI to study smarter, not harder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-600 hover:bg-gray-100 px-8 shadow-lg"
            >
              <Link to={isAuthenticated ? "/chat" : "/register"}>
                {isAuthenticated ? "Start Chatting" : "Get Started Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10 px-8"
            >
              <Link to="/about">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">LearnAI360</span>
              </div>
              <p className="text-slate-400 max-w-md">
                Your AI-powered learning companion. Access materials, get explanations,
                and generate content with cutting-edge AI technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/browse" className="hover:text-emerald-400 transition-colors">Browse</Link></li>
                <li><Link to="/chat" className="hover:text-emerald-400 transition-colors">AI Chat</Link></li>
                <li><Link to="/search" className="hover:text-emerald-400 transition-colors">Search</Link></li>
                <li><Link to="/generate" className="hover:text-emerald-400 transition-colors">Generate</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/browse?category=theory" className="hover:text-emerald-400 transition-colors">Theory Materials</Link></li>
                <li><Link to="/browse?category=lab" className="hover:text-emerald-400 transition-colors">Lab Resources</Link></li>
                <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500">
            <p>&copy; {new Date().getFullYear()} LearnAI360. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
