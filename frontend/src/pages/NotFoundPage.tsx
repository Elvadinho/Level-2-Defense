import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Home, ArrowLeft } from 'lucide-react';

/**
 * 404 Not Found Page
 */
export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-[#05AD98]/10 text-[#05AD98] flex items-center justify-center font-extrabold text-3xl mb-6 shadow-sm border border-[#05AD98]/20">
        404
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        Page Not Found
      </h1>

      <p className="mt-2 text-sm text-[#878787] max-w-md">
        The requested module or resource does not exist or has been moved to a different endpoint.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/dashboard')}
          leftIcon={<Home className="w-4 h-4" />}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
