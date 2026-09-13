import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { UserRole } from '../../types/auth';
import { ModooLogo } from '../../components/common/ModooLogo';

/**
 * LoginPage Component
 * Professional, clean authentication screen consuming backend JWT endpoints
 * with full error handling, input validation, and instant demo access.
 */
export const LoginPage: React.FC = () => {
  const { login, loginAsDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation error states
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Destination route after successful authentication
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // Redirect if session is already active
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Client-side form validation
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler calling backend /api/auth/login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle instant demo mode login
  const handleDemoLogin = (role: UserRole) => {
    setErrorMessage(null);
    loginAsDemo(role);
    navigate(from, { replace: true });
  };

  // Pre-fill form inputs for testing
  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setErrors({});
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <ModooLogo size={56} className="mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to <span className="text-[#05AD98]">Modoo</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enterprise management workspace for operations, HR & finance
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm rounded-xl border border-slate-200">
          {/* Server / Validation Error Banner */}
          {errorMessage && (
            <div className="mb-5">
              <Alert
                type="error"
                message={errorMessage}
                onClose={() => setErrorMessage(null)}
              />
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. admin@modoo.cm"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
              autoFocus
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full justify-center shadow-xs mt-2"
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Instant Demo Accounts & Quick Fill */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#05AD98]" /> Quick Demo Access
              </span>
              <span className="text-[10px] text-slate-400">Click to preview role</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-[#05AD98]/10 hover:text-[#05AD98] hover:border-[#05AD98]/30 text-slate-700 text-left border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>👑 <strong>Admin</strong></span>
                <span className="text-[10px] text-slate-400 font-normal">Full Access</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('hr_manager')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-[#05AD98]/10 hover:text-[#05AD98] hover:border-[#05AD98]/30 text-slate-700 text-left border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>👥 <strong>HR Manager</strong></span>
                <span className="text-[10px] text-slate-400 font-normal">Staff & Clock</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('project_manager')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-[#05AD98]/10 hover:text-[#05AD98] hover:border-[#05AD98]/30 text-slate-700 text-left border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>📊 <strong>PM Lead</strong></span>
                <span className="text-[10px] text-slate-400 font-normal">Kanban & Tasks</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('accountant')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-[#05AD98]/10 hover:text-[#05AD98] hover:border-[#05AD98]/30 text-slate-700 text-left border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>💼 <strong>Accountant</strong></span>
                <span className="text-[10px] text-slate-400 font-normal">Billing & Invoices</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('employee')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-[#05AD98]/10 hover:text-[#05AD98] hover:border-[#05AD98]/30 text-slate-700 text-left border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>👋 <strong>Employee</strong></span>
                <span className="text-[10px] text-slate-400 font-normal">Portal & Tasks</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('customer')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-[#05AD98]/10 hover:text-[#05AD98] hover:border-[#05AD98]/30 text-slate-700 text-left border border-slate-200 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>🛒 <strong>Customer</strong></span>
                <span className="text-[10px] text-slate-400 font-normal">Invoices & Quotes</span>
              </button>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => handleFillDemo('test@example.com')}
                className="text-[11px] text-slate-500 hover:text-[#05AD98] underline decoration-slate-300 cursor-pointer"
              >
                Or pre-fill test credentials (test@example.com / password)
              </button>
            </div>
          </div>

          {/* Registration Navigation Link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#05AD98] hover:text-[#049381] transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
