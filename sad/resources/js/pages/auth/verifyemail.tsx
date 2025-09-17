import React from 'react';
import { usePage } from '@inertiajs/react';
import { MailCheck, MailWarning } from 'lucide-react'; // ✅ Icons
import type { PageProps } from '@/types';

export default function VerifyEmail() {
  const { status } = usePage<PageProps>().props;

  const message =
    status === 'verification-link-sent'
      ? 'A verification link has been sent to your email address. Please check your inbox.'
      : 'Please check your email for a verification link.';

  const Icon = status === 'verification-link-sent' ? MailCheck : MailWarning;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl text-center space-y-6">
        <div className="flex justify-center">
          <Icon className="h-12 w-12 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Verify Your Email</h1>
        <p className="text-gray-700 text-base leading-relaxed">{message}</p>
        <p className="text-sm text-gray-500">
          Once verified, you may{' '}
          <a href="/login" className="text-red-600 font-medium hover:underline">
            log in
          </a>
          .
        </p>
      </div>
    </div>
  );
}
