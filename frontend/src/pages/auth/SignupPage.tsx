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
} from 'lucide-react';
import { ModooLogo } from '../../components/common/ModooLogo';

/**
 * SignupPage Component
 * Clean, Odoo-inspired registration flow with role selector,
 * real-time input validation, and clear server error handling.
 */
export const SignupPage: React.FC = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation error states
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
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
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

  // Submit handler calling backend /api/auth/register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        role,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Registration failed. Please check the entered information and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const availableRoles: UserRole[] = [
    'employee',
    'hr_manager',
    'project_manager',
    'accountant',
    'customer',
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <ModooLogo size={56} className="mx-auto mb-3" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create an Account
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Join <span className="font-semibold text-slate-700">Modoo</span> and streamline your workflows
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              autoComplete="name"
              required
              placeholder="e.g. Marc Ekwalla"
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
              placeholder="marc@company.cm"
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
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4" />
                </div>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="block w-full rounded-lg text-xs bg-slate-50 border border-slate-300 text-slate-900 pl-10 pr-8 py-2.5 focus:border-[#05AD98] focus:bg-white focus:outline-none transition-all cursor-pointer font-medium"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]} {r === 'employee' ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
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
                  className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  tabIndex={-1}
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
              placeholder="Re-enter your password"
              value={passwordConfirmation}
              onChange={(e) => {
                setPasswordConfirmation(e.target.value);
                if (errors.passwordConfirmation) {
                  setErrors((prev) => ({ ...prev, passwordConfirmation: undefined }));
                }
              }}
              error={errors.passwordConfirmation}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full justify-center mt-2 shadow-xs"
            >
              Create Account
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#05AD98] hover:text-[#049381] transition-colors"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
