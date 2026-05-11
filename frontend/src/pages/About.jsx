import { Link } from 'react-router-dom';
import {
  BookOpen,
  Target,
  Heart,
  Lightbulb,
  Users,
  Award,
  ArrowRight,
  CheckCircle,
  Github,
  Mail,
  Sparkles,
  Brain,
  Search,
  MessageCircle,
  Zap,
  Shield,
  Globe,
  GraduationCap,
  Bot,
  Upload,
  FileText,
  Database,
  Clock,
  TrendingUp,
  Layers,
  Lock,
  Eye,
  HelpCircle,
  ChevronRight,
  Play,
  BookMarked,
  PenTool,
  BarChart3,
  Cpu
} from 'lucide-react';
import { Button } from '../components/ui/button';

function About() {
  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'Making quality education accessible to everyone through technology.',
      color: 'from-rose-500 to-pink-600'
    },
    {
      icon: Heart,
      title: 'Student-First',
      description: 'Every feature designed with students\' needs and learning experience in mind.',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Leveraging AI and modern tech to create smarter learning solutions.',
      color: 'from-amber-500 to-orange-600'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a collaborative space where knowledge is shared freely.',
      color: 'from-cyan-500 to-blue-600'
    }
  ];

  const features = [
    { icon: Brain, label: 'AI-Powered', desc: 'Smart content analysis' },
    { icon: Search, label: 'Semantic Search', desc: 'Find anything instantly' },
    { icon: MessageCircle, label: 'Chat Assistant', desc: 'Ask questions naturally' },
    { icon: Sparkles, label: 'Auto Generate', desc: 'Create study materials' },
    { icon: Shield, label: 'Secure', desc: 'Your data protected' },
    { icon: Zap, label: 'Fast', desc: 'Lightning quick responses' }
  ];

  const stats = [
    { value: '10K+', label: 'Documents Processed' },
    { value: '5K+', label: 'Active Students' },
    { value: '99%', label: 'Uptime' },
    { value: '24/7', label: 'AI Availability' }
  ];

  const techStack = [
    { name: 'React', icon: '⚛️', desc: 'Frontend Framework', color: 'bg-blue-500/10 border-blue-500/20' },
    { name: 'Python', icon: '🐍', desc: 'Backend & AI', color: 'bg-yellow-500/10 border-yellow-500/20' },
    { name: 'FastAPI', icon: '⚡', desc: 'API Framework', color: 'bg-emerald-500/10 border-emerald-500/20' },
    { name: 'ChromaDB', icon: '🎨', desc: 'Vector Database', color: 'bg-purple-500/10 border-purple-500/20' },
    { name: 'Ollama', icon: '🤖', desc: 'Local LLM', color: 'bg-rose-500/10 border-rose-500/20' },
    { name: 'Tailwind', icon: '💨', desc: 'Styling', color: 'bg-cyan-500/10 border-cyan-500/20' }
  ];

  const howItWorks = [
    {
      step: '01',
      icon: Upload,
      title: 'Upload Materials',
      description: 'Instructors upload course materials including PDFs, slides, documents, and more to the platform.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      step: '02',
      icon: Cpu,
      title: 'AI Processing',
      description: 'Our AI automatically analyzes, categorizes, and creates semantic embeddings for intelligent search.',
      color: 'from-violet-500 to-purple-500'
    },
    {
      step: '03',
      icon: Search,
      title: 'Smart Search',
      description: 'Students search using natural language and get precise results based on meaning, not just keywords.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      step: '04',
      icon: MessageCircle,
      title: 'Ask & Learn',
      description: 'Chat with AI to get instant answers, generate summaries, quizzes, and study materials.',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const useCases = [
    {
      icon: BookMarked,
      title: 'Exam Preparation',
      description: 'Generate practice questions, summaries, and flashcards from your course materials automatically.',
      features: ['Auto-generate quizzes', 'Create summaries', 'Flashcard generation']
    },
    {
      icon: Search,
      title: 'Research & Study',
      description: 'Find relevant information across all your documents instantly with semantic search.',
      features: ['Cross-document search', 'Citation finder', 'Topic clustering']
    },
    {
      icon: PenTool,
      title: 'Assignment Help',
      description: 'Get explanations, find references, and understand complex topics with AI assistance.',
      features: ['Concept explanations', 'Reference suggestions', 'Writing assistance']
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey and identify areas that need more attention.',
      features: ['Study analytics', 'Topic mastery', 'Time tracking']
    }
  ];

  const faqs = [
    {
      question: 'How does the AI search work?',
      answer: 'Our platform uses semantic search powered by vector embeddings. This means it understands the meaning behind your queries, not just matching keywords. You can ask natural questions like "What is machine learning?" and get relevant results from all your documents.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, security is our top priority. All documents are processed locally, your data is encrypted, and we never share your information with third parties. You have full control over your uploaded materials.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support a wide range of formats including PDF, DOCX, PPTX, TXT, and more. Our AI can extract and process text from various document types to make them searchable.'
    },
    {
      question: 'Can I use this offline?',
      answer: 'The platform runs with a local LLM (Ollama), which means core AI features work without sending data to external servers. However, an internet connection is needed for initial setup and some features.'
    },
    {
      question: 'How accurate is the AI chat?',
      answer: 'The AI chat is grounded in your actual course materials, which significantly improves accuracy. It provides answers based on your documents and can cite sources, reducing hallucinations common in general AI systems.'
    },
    {
      question: 'Is it free to use?',
      answer: 'Yes! The platform is open-source and free to use. You can deploy it yourself or use our hosted version. We believe quality education tools should be accessible to everyone.'
    }
  ];

  const testimonials = [
    {
      quote: "This platform saved me hours of searching through lecture slides. The AI actually understands what I'm looking for!",
      author: "Sarah M.",
      role: "Computer Science Student",
      avatar: "👩‍💻"
    },
    {
      quote: "The auto-generated quizzes helped me ace my finals. It's like having a personal tutor available 24/7.",
      author: "James K.",
      role: "Engineering Student",
      avatar: "👨‍🎓"
    },
    {
      quote: "As an instructor, uploading materials is seamless. My students can now find resources without flooding my inbox.",
      author: "Dr. Emily R.",
      role: "University Professor",
      avatar: "👩‍🏫"
    }
  ];

  const securityFeatures = [
    { icon: Lock, title: 'End-to-End Encryption', desc: 'All data is encrypted in transit and at rest' },
    { icon: Database, title: 'Local Processing', desc: 'AI runs locally, your data never leaves your control' },
    { icon: Shield, title: 'Privacy First', desc: 'No data sharing with third parties' },
    { icon: Eye, title: 'Transparent', desc: 'Open-source code you can audit yourself' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-0 w-[200%] h-full opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.2) 25%, rgba(20, 184, 166, 0.3) 50%, transparent 100%)',
              animation: 'waterFlow 10s linear infinite'
            }}
          />
          <div
            className="absolute top-0 left-0 w-[200%] h-full opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.25) 30%, rgba(16, 185, 129, 0.2) 60%, transparent 100%)',
              animation: 'waterFlow 14s linear infinite',
              animationDelay: '-5s'
            }}
          />
          {/* Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="container max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <Bot className="h-4 w-4" />
              AI-Powered Learning Platform
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
              Revolutionizing Education with AI
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
              We're on a mission to transform how students access, interact with, and learn from
              course materials using the power of artificial intelligence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 rounded-xl shadow-lg shadow-emerald-500/25">
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-600 text-white hover:bg-white/10 px-8 rounded-xl bg-transparent">
                <Link to="/browse">
                  Explore Materials
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-slate-500 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Born from a Student's Struggle
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  The AI-Powered Learning Platform was born from a simple observation: students
                  often struggle to find and organize their course materials effectively.
                  Lecture slides get lost, lab resources are scattered, and valuable study
                  time is wasted searching for content.
                </p>
                <p>
                  We set out to solve this problem by creating a centralized, intelligent
                  platform that not only stores course materials but also helps students
                  find exactly what they need, when they need it.
                </p>
                <p>
                  Using modern AI techniques including semantic search and large language models,
                  our platform understands your questions and delivers precise answers from your
                  course materials instantly.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                <div className="space-y-5">
                  {[
                    { title: 'Centralized Access', desc: 'All your course materials in one place' },
                    { title: 'Smart Organization', desc: 'AI-powered categorization and tagging' },
                    { title: 'Semantic Search', desc: 'Find by meaning, not just keywords' },
                    { title: 'AI Chat Assistant', desc: 'Ask questions, get instant answers' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <p className="text-slate-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple Steps to Smarter Learning
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Get started in minutes and transform your study experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="relative group">
                {idx < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-slate-200 to-transparent z-0" />
                )}
                <div className="relative bg-slate-50 rounded-2xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300">
                  <div className="text-5xl font-bold text-slate-100 absolute top-4 right-4 group-hover:text-slate-200 transition-colors">
                    {item.step}
                  </div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Learn Smarter
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful AI tools designed to enhance your learning experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((feature, idx) => (
              <div key={idx} className="group p-6 rounded-2xl bg-white hover:bg-gradient-to-br hover:from-emerald-500 hover:to-teal-500 transition-all duration-300 cursor-default shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:bg-white/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-white transition-colors mb-1">{feature.label}</h3>
                <p className="text-sm text-slate-500 group-hover:text-white/80 transition-colors">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">Use Cases</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How Students Use Learn360
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Discover the many ways our platform can help you succeed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    <useCase.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{useCase.title}</h3>
                    <p className="text-slate-600 mb-4">{useCase.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {useCase.features.map((feature, fidx) => (
                        <span key={fidx} className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm text-slate-600 border border-slate-200">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Hear from students and educators who use Learn360
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-600 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">Security & Privacy</span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Your Data, Your Control
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                We take security seriously. Our platform is designed with privacy-first principles,
                ensuring your academic materials and personal data remain secure and under your control.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {securityFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{feature.title}</h3>
                      <p className="text-slate-500 text-xs">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <Shield className="h-12 w-12 text-emerald-400 mb-6" />
                  <h3 className="text-2xl font-bold mb-4">Enterprise-Grade Security</h3>
                  <ul className="space-y-3">
                    {['256-bit AES encryption', 'SOC 2 compliant infrastructure', 'Regular security audits', 'GDPR & FERPA compliant', 'Zero-knowledge architecture'].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-50">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">Our Values</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Principles That Guide Us
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              These core values shape everything we build
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <value.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-500">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Got questions? We've got answers
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-6 hover:bg-slate-100 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      {/* <section className="py-20 bg-slate-50">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">Technology</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Built With Modern Tech Stack
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Cutting-edge technologies powering your learning experience
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
            {techStack.map((tech, idx) => (
              <div key={idx} className={`${tech.color} border rounded-2xl p-5 text-center hover:scale-105 transition-transform cursor-default`}>
                <div className="text-3xl mb-2">{tech.icon}</div>
                <div className="font-semibold text-slate-900">{tech.name}</div>
                <div className="text-xs text-slate-500">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Team/Community Section */}
      {/* <section className="py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider mb-4 block">Community</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Built With Love, For Students
            </h2>
            <p className="text-lg text-slate-600 mb-10">
              This platform is made possible by dedicated developers, open-source contributors,
              and an amazing community of students who believe in better education.
            </p>

            <div className="flex flex-wrap justify-center gap-6">
              {[
                { icon: '🚀', title: 'AI Learning Team', subtitle: 'Core Development' },
                { icon: '💻', title: 'Open Source', subtitle: 'Contributors' },
                { icon: '📚', title: 'Students', subtitle: 'Our Community' }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-6 shadow-sm border border-slate-100 w-48 hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-0 w-[200%] h-full opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.2) 25%, rgba(20, 184, 166, 0.3) 50%, transparent 100%)',
              animation: 'waterFlow 10s linear infinite'
            }}
          />
          <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-teal-500/15 rounded-full blur-[80px]" />
        </div>

        <div className="container max-w-7xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Start Your Journey Today
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to Learn Smarter?
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Join thousands of students already using AI to enhance their learning experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 rounded-xl shadow-lg shadow-emerald-500/25">
              <Link to="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-600 text-white hover:bg-white/10 px-8 rounded-xl bg-transparent">
              <Link to="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
