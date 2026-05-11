import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, GraduationCap, Sparkles, Search, ArrowRight, Bot, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Water Flow Animation - Full Page */}
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
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-500/15 rounded-full blur-[80px]" />
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-teal-500/10 rounded-full blur-[90px]" />
      </div>

      {/* Left Panel - Content */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[50%] relative z-10">
        <div className="flex flex-col justify-center px-10 lg:px-14 xl:px-20 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Learn360</span>
          </Link>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium w-fit mb-4">
            <Bot className="h-3.5 w-3.5" />
            AI-Powered Platform
          </span>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Welcome Back
          </h1>
          <p className="text-slate-400 text-lg mb-10 max-w-md">
            Continue your learning journey with AI-powered tools.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[
              { icon: MessageCircle, label: 'AI Chat', color: 'from-violet-500 to-purple-600' },
              { icon: Search, label: 'Search', color: 'from-blue-500 to-cyan-600' },
              { icon: Sparkles, label: 'Generate', color: 'from-amber-500 to-orange-600' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className={`w-11 h-11 mx-auto rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-2`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-white text-sm font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-start relative z-10">
        <div className="w-full max-w-md mx-8 lg:ml-16 lg:mr-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Learn360</span>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/80 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign In</h2>
            <p className="text-slate-500 text-sm mb-6">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-medium shadow-md shadow-emerald-500/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>

          <p className="mt-4 text-xs text-slate-500 text-center">
            <span className="font-medium text-slate-400">Demo:</span> Create account with "admin" or "student" role.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
