import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { MailCheck, MailWarning, RefreshCw, LogIn } from 'lucide-react';
import type { PageProps } from '@/types';

interface VerifyEmailProps extends PageProps {
  status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const message =
    status === 'verification-link-sent'
      ? 'A new verification link has been sent to your email address.'
      : 'Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you?';

  const Icon = status === 'verification-link-sent' ? MailCheck : MailWarning;

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    
    router.post('/email/verification-notification', {}, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setProcessing(false);
      },
      onError: (errors) => {
        setProcessing(false);
        setError(errors.message || Object.values(errors)[0] as string || 'An error occurred. Please try again.');
      },
    });
  };

  return (
    <>
      <Head title="Email Verification" />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-red-100">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Icon className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
            
            <p className="text-gray-700 text-sm leading-relaxed">{message}</p>

            {status !== 'verification-link-sent' && (
              <p className="text-gray-600 text-sm">
                If you didn't receive the email, we can send you another.
              </p>
            )}

            <div className="space-y-4">
              <form onSubmit={handleResend}>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Resend Verification Email
                    </>
                  )}
                </button>
              </form>

              {/* Proceed to Login Link */}
              <div className="text-center">
                <p className="text-gray-600 text-sm mb-2">
                  Already verified your email?
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 text-red-600 hover:text-red-700 font-medium py-2 px-4 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <LogIn className="w-4 h-4" />
                  Proceed to Login
                </Link>
              </div>
            </div>

            {status === 'verification-link-sent' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">
                  ✅ Verification email sent! Check your inbox and spam folder.
                </p>
              </div>
            )}

            {/* Display any errors */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  ❌ {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
