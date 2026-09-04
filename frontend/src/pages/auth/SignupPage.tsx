import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { UserRole } from '../../types/auth';
import { ROLE_LABELS } from '../../components/common/Badge';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

/**
 * SignupPage Component
 * Seamless registration flow with role assignment and clear feedback
 * Built with the Vichy color palette (#05AD98, #BBBFBF, #878787, #FFFFFF)
 */
export const SignupPage: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validation State
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirmation?: string;
  }>({});

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Client-side form validation
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      passwordConfirmation?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler calling the backend registration endpoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Available roles for registration selection
  const availableRoles: UserRole[] = [
    'employee',
    'admin',
    'hr_manager',
    'project_manager',
    'accountant',
    'customer',
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#05AD98] to-[#049381] shadow-lg shadow-[#05AD98]/20 mb-4">
            <span className="text-white text-2xl font-bold tracking-tight">M</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create an Account
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#878787]">
            Join <span className="font-semibold text-slate-700">Modoo ERP</span> and streamline your workflow
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              autoComplete="name"
              required
              placeholder="Alex Smith"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            {/* Email Address */}
            <Input
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              placeholder="alex.smith@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            {/* Role Selection Dropdown */}
            <div className="w-full">
              <label
                htmlFor="role-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Organizational Role <span className="text-[#05AD98]">*</span>
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#878787]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="block w-full rounded-lg text-sm bg-white text-slate-900 border border-[#BBBFBF] pl-10 pr-8 py-2.5 focus:border-[#05AD98] focus:ring-2 focus:ring-[#05AD98]/20 focus:outline-none transition-all cursor-pointer"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]} {r === 'employee' ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-[11px] text-[#878787]">
                Sets your initial dashboard layout and module accessibility
              </p>
            </div>

            {/* Password */}
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
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

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              placeholder="Repeat your password"
              value={passwordConfirmation}
              onChange={(e) => {
                setPasswordConfirmation(e.target.value);
                if (errors.passwordConfirmation)
                  setErrors((prev) => ({ ...prev, passwordConfirmation: undefined }));
              }}
              error={errors.passwordConfirmation}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            {/* Submit Registration Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-md hover:shadow-lg transition-all"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Register & Get Started
              </Button>
            </div>
          </form>

          {/* Link back to Login */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-[#878787]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#05AD98] hover:text-[#037667] transition-colors hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Security & Reliability Badge */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[#878787]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#05AD98]" />
            <span>Encrypted Credentials</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#05AD98]" />
            <span>Instant Provisioning</span>
          </div>
        </div>
      </div>
    </div>
  );
};
