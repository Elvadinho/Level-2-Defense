import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

/**
 * LoginPage Component
 * Professional, clear, and concise authentication interface
 * Implemented using the Vichy color palette (#05AD98, #BBBFBF, #878787, #FFFFFF)
 */
export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation State
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Target route after successful login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Form validation handler
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
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

  // Submit handler calling the backend login endpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#05AD98] to-[#049381] shadow-lg shadow-[#05AD98]/20 mb-4">
            <span className="text-white text-2xl font-bold tracking-tight">M</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in to <span className="text-[#05AD98]">Modoo ERP</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#878787]">
            Enterprise management platform for operations, HR & finance
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-[#BBBFBF]/30">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6">
              <Alert
                type="error"
                message={errorMessage}
                onClose={() => setErrorMessage(null)}
              />
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            {/* Password Field */}
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
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
                  className="text-[#878787] hover:text-slate-800 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Remember Me & Help Links */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-[#BBBFBF] text-[#05AD98] focus:ring-[#05AD98] w-4 h-4"
                />
                <span className="ml-2">Remember this device</span>
              </label>

              <span className="text-[#878787] hover:text-[#05AD98] transition-colors cursor-pointer">
                Forgot password?
              </span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold shadow-md hover:shadow-lg transition-all"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Link to Signup */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-[#878787]">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#05AD98] hover:text-[#037667] transition-colors hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security & Reliability Badge */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[#878787]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#05AD98]" />
            <span>JWT Auth</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#05AD98]" />
            <span>Role-Based Permissions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
