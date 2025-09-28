import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { MailCheck, MailWarning, RefreshCw } from 'lucide-react';
import type { PageProps } from '@/types';

interface VerifyEmailProps extends PageProps {
  status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
  const { post, processing } = useForm();

  const message =
    status === 'verification-link-sent'
      ? 'A new verification link has been sent to your email address.'
      : 'Thanks for signing up! Before getting started, could you verify your email address by clicking on the link we just emailed to you?';

  const Icon = status === 'verification-link-sent' ? MailCheck : MailWarning;

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    post('/email/verification-notification');
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

              <div className="text-center">
                <Link
                  href="/logout"
                  method="post"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Log Out
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
          </div>
        </div>
      </div>
    </>
  );
}
