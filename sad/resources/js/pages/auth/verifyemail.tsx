import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';

interface LocalPageProps extends Record<string, any> {
  status?: string;
  errors: Record<string, string>;
}

export default function VerifyEmail() {
  const { props } = usePage<LocalPageProps>();
  const { status, errors } = props as any;
  const { data, setData, post, processing, reset } = useForm<{ code: string }>({ code: '' });
  const [resent, setResent] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    post(route('verification.verify'), {
      onSuccess: () => {
        reset();
      }
    });
  };

  const resend = () => {
    post(route('verification.send'), {
      preserveState: true,
      onSuccess: () => setResent(true),
      onFinish: () => setTimeout(() => setResent(false), 8000)
    });
  };

  const codeBoxes = Array.from({ length: 6 });

  const handleCodeChange = (value: string) => {
    // Only digits
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setData('code', cleaned);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4 py-10">
      <Head title="Verify Email" />
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-red-100/40 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-100 rounded-full opacity-40" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-100 rounded-full opacity-30" />
        <div className="relative">
          <h1 className="text-2xl font-bold text-red-600 mb-2 text-center">Email Verification</h1>
          <p className="text-gray-600 text-sm text-center mb-6">
            Enter the 6-digit code we sent to your email to verify your account.
          </p>

          {(status === 'verification-link-sent' || resent) && (
            <div className="mb-4 text-sm font-medium text-green-700 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
              A new verification code has been sent to your email.
            </div>
          )}
          {errors.code && (
            <div className="mb-4 text-sm font-medium text-red-700 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
              {errors.code}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <div className="flex justify-between gap-2" aria-label="6-digit verification code input">
                {codeBoxes.map((_, idx) => (
                  <input
                    key={idx}
                    ref={idx === 0 ? inputRef : undefined}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={data.code[idx] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0,1);
                      const current = data.code.split('');
                      current[idx] = val;
                      handleCodeChange(current.join(''));
                      // focus next
                      if (val && idx < 5) {
                        const next = (e.target.parentElement?.querySelectorAll('input')[idx+1] as HTMLInputElement);
                        next?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !data.code[idx] && idx > 0) {
                        const prev = (e.currentTarget.parentElement?.querySelectorAll('input')[idx-1] as HTMLInputElement);
                        prev?.focus();
                      }
                    }}
                    className="w-12 h-14 rounded-xl border border-gray-200 text-center text-xl font-semibold tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white shadow-sm text-black"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={processing || data.code.length !== 6}
              className="w-full h-12 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors shadow-sm"
            >
              {processing ? 'Verifying...' : 'Verify Email'}
            </button>

            <div className="text-center text-sm text-gray-600">
              Didn't receive a code?{' '}
              <button
                type="button"
                onClick={resend}
                disabled={processing || resent}
                className="text-red-600 font-medium hover:underline disabled:opacity-50"
              >
                Resend Code
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
