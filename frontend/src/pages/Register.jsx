import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, GraduationCap, Shield, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.role
    );

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const benefits = [
    'AI-powered learning assistant',
    'Smart semantic search',
    'Auto-generate study materials',
  ];

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
            <Sparkles className="h-3.5 w-3.5" />
            Start Learning Today
          </span>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Join Learn360
          </h1>
          <p className="text-slate-400 text-lg mb-10 max-w-md">
            Create your account and unlock AI-powered learning.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-slate-300">{benefit}</span>
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
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Create Account</h2>
            <p className="text-slate-500 text-sm mb-6">Fill in your details to get started</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose username"
                    value={formData.username}
                    onChange={handleChange}
                    className="h-11 pl-10 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-11 pl-10 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 chars"
                      value={formData.password}
                      onChange={handleChange}
                      className="h-11 pl-10 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm"
                      value={formData.confirmPassword}
                      onChange={handleChange}
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
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                      formData.role === 'student'
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      formData.role === 'student'
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}>
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      "font-medium",
                      formData.role === 'student' ? "text-emerald-700" : "text-slate-600"
                    )}>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                      formData.role === 'admin'
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      formData.role === 'admin'
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <span className={cn(
                      "font-medium",
                      formData.role === 'admin' ? "text-emerald-700" : "text-slate-600"
                    )}>Instructor</span>
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
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign in
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

export default Register;
