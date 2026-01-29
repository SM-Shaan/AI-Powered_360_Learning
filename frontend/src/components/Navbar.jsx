import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Upload,
  LayoutDashboard,
  Search,
  Menu,
  X,
  Info,
  Home,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
  MessageSquareText,
  MessageCircle,
  Zap,
  GraduationCap,
  FileText,
  Bot,
  ChevronRight,
  Settings,
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

// AI Tools configuration for dropdown
const AI_TOOLS = [
  {
    path: '/chat',
    label: 'AI Chat',
    description: 'Interactive learning assistant',
    icon: MessageCircle,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    gradient: 'from-violet-500 to-purple-600'
  },
  {
    path: '/search',
    label: 'Smart Search',
    description: 'AI-powered content search',
    icon: MessageSquareText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradient: 'from-blue-500 to-cyan-600'
  },
  {
    path: '/generate',
    label: 'Content Generator',
    description: 'Create notes, quizzes & more',
    icon: Sparkles,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    gradient: 'from-amber-500 to-orange-600'
  }
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const [mobileAiToolsOpen, setMobileAiToolsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const aiToolsRef = useRef(null);
  const userMenuRef = useRef(null);

  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const isActive = (path) => location.pathname === path;
  const isAiToolActive = AI_TOOLS.some(tool => location.pathname === tool.path);
  const isHome = location.pathname === '/';

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aiToolsRef.current && !aiToolsRef.current.contains(event.target)) {
        setAiToolsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileAiToolsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      scrolled || !isHome
        ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200/50"
        : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                LearnAI
              </span>
              <span className="text-lg font-light text-gray-600">360</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Home */}
            <Link
              to="/"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive('/')
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              Home
            </Link>

            {/* Browse - Only for authenticated users */}
            {isAuthenticated && (
              <Link
                to="/browse"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive('/browse')
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <BookOpen className="h-4 w-4" />
                Browse
              </Link>
            )}

            {/* AI Tools Dropdown - Only for authenticated users */}
            {isAuthenticated && (
              <div className="relative" ref={aiToolsRef}>
                <button
                  onClick={() => setAiToolsOpen(!aiToolsOpen)}
                  onMouseEnter={() => setAiToolsOpen(true)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isAiToolActive || aiToolsOpen
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Zap className="h-4 w-4" />
                  AI Tools
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    aiToolsOpen && "rotate-180"
                  )} />
                </button>

                {/* AI Tools Mega Menu */}
                {aiToolsOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                    onMouseLeave={() => setAiToolsOpen(false)}
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 mb-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          AI-Powered Features
                        </p>
                      </div>
                      {AI_TOOLS.map((tool) => (
                        <Link
                          key={tool.path}
                          to={tool.path}
                          onClick={() => setAiToolsOpen(false)}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-xl transition-all duration-200 group",
                            isActive(tool.path)
                              ? `${tool.bgColor} ring-1 ring-inset ring-gray-200`
                              : "hover:bg-gray-50"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg transition-all duration-200",
                            isActive(tool.path)
                              ? `bg-gradient-to-br ${tool.gradient} text-white shadow-md`
                              : `${tool.bgColor} ${tool.color} group-hover:shadow-md`
                          )}>
                            <tool.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-semibold",
                              isActive(tool.path) ? tool.color : "text-gray-900"
                            )}>
                              {tool.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {tool.description}
                            </p>
                          </div>
                          <ChevronRight className={cn(
                            "h-4 w-4 mt-1 opacity-0 -translate-x-2 transition-all duration-200",
                            "group-hover:opacity-50 group-hover:translate-x-0",
                            isActive(tool.path) && "opacity-50 translate-x-0"
                          )} />
                        </Link>
                      ))}
                    </div>
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <Bot className="h-3.5 w-3.5 inline mr-1.5" />
                        Powered by advanced AI models
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Admin Upload */}
            {isAuthenticated && isAdmin && (
              <Link
                to="/upload"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive('/upload')
                    ? "text-purple-600 bg-purple-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Link>
            )}

            {/* About */}
            <Link
              to="/about"
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                isActive('/about')
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              About
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={cn(
                      "flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full transition-all duration-200",
                      userMenuOpen
                        ? "bg-gray-100 ring-2 ring-emerald-500/20"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate">
                      {user?.username}
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-gray-400 transition-transform duration-200",
                      userMenuOpen && "rotate-180"
                    )} />
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info Header */}
                      <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                            <span className="text-xl font-bold text-white">
                              {user?.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {user?.username}
                            </p>
                            <p className="text-xs text-emerald-100 truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full",
                            isAdmin
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          )}>
                            {isAdmin ? (
                              <><Settings className="h-3 w-3" /> Instructor/TA</>
                            ) : (
                              <><GraduationCap className="h-3 w-3" /> Student</>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-gray-500" />
                          Dashboard
                        </Link>
                        <Link
                          to="/browse"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <BookOpen className="h-4 w-4 text-gray-500" />
                          My Learning
                        </Link>
                        <hr className="my-2 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    asChild
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Link to="/register">Get Started</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn(
        "lg:hidden fixed inset-x-0 top-16 bottom-0 bg-white/95 backdrop-blur-md z-40 transition-all duration-300 overflow-y-auto",
        mobileMenuOpen
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      )}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* User Info (if authenticated) */}
          {isAuthenticated && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white truncate">
                  {user?.username}
                </p>
                <p className="text-sm text-emerald-100 truncate">
                  {user?.email}
                </p>
                <span className={cn(
                  "inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium rounded-full",
                  isAdmin
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                )}>
                  {isAdmin ? 'Instructor/TA' : 'Student'}
                </span>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </p>
            <Link
              to="/"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                isActive('/') ? "bg-emerald-50 text-emerald-600" : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <Home className="h-5 w-5" />
              Home
            </Link>

            {isAuthenticated && (
              <Link
                to="/browse"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                  isActive('/browse') ? "bg-emerald-50 text-emerald-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <BookOpen className="h-5 w-5" />
                Browse Content
              </Link>
            )}

            <Link
              to="/about"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                isActive('/about') ? "bg-emerald-50 text-emerald-600" : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <Info className="h-5 w-5" />
              About
            </Link>
          </div>

          {/* AI Tools Section (if authenticated) */}
          {isAuthenticated && (
            <div className="space-y-1">
              <button
                onClick={() => setMobileAiToolsOpen(!mobileAiToolsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  AI Tools
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  mobileAiToolsOpen && "rotate-180"
                )} />
              </button>

              <div className={cn(
                "space-y-1 overflow-hidden transition-all duration-300",
                mobileAiToolsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}>
                {AI_TOOLS.map((tool) => (
                  <Link
                    key={tool.path}
                    to={tool.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      isActive(tool.path)
                        ? `${tool.bgColor} ring-1 ring-inset ring-gray-200`
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      isActive(tool.path)
                        ? `bg-gradient-to-br ${tool.gradient} text-white shadow-md`
                        : `${tool.bgColor} ${tool.color}`
                    )}>
                      <tool.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-semibold",
                        isActive(tool.path) ? tool.color : "text-gray-900"
                      )}>
                        {tool.label}
                      </p>
                      <p className="text-xs text-gray-500">{tool.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Admin Section */}
          {isAuthenticated && isAdmin && (
            <div className="space-y-1">
              <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </p>
              <Link
                to="/upload"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                  isActive('/upload') ? "bg-purple-50 text-purple-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <Upload className="h-5 w-5" />
                Upload Content
              </Link>
              <Link
                to="/dashboard"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                  isActive('/dashboard') ? "bg-purple-50 text-purple-600" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
            </div>
          )}

          {/* Auth Actions */}
          <div className="pt-4 border-t border-gray-200">
            {isAuthenticated ? (
              <Button
                variant="outline"
                className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  asChild
                  className="w-full h-12 rounded-xl"
                >
                  <Link to="/login">
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl"
                >
                  <Link to="/register">
                    Get Started Free
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
