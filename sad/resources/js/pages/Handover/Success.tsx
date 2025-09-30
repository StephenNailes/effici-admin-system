import MainLayout from '@/layouts/mainlayout';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Mail, RefreshCw, Clock, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { PageProps } from '@/types';
import { getCsrfToken, getXsrfCookieToken, refreshCsrfToken } from '@/lib/csrf';

interface HandoverSuccessProps extends PageProps {
    invitationEmail: string;
    roleLabel: string;
    sendCount?: number;
    lastSentAt?: string;
}

export default function HandoverSuccess({ invitationEmail, roleLabel, sendCount = 1, lastSentAt }: HandoverSuccessProps) {
    const [isResending, setIsResending] = useState(false);
    const [logoutTimer, setLogoutTimer] = useState(300); // 5 minutes in seconds
    const { data, setData, post, processing } = useForm({
        email: invitationEmail,
    });

    // Countdown timer for auto-logout
    useEffect(() => {
        const interval = setInterval(() => {
            setLogoutTimer((prev) => {
                if (prev <= 1) {
                    handleLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleResend = () => {
        setIsResending(true);
        post('/admin/invitations/resend', {
            preserveScroll: true,
            onFinish: () => setIsResending(false),
        });
    };

    const handleLogout = async () => {
        await refreshCsrfToken();
        const csrfToken = getCsrfToken();
        router.post('/logout', { _token: csrfToken }, {
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
            },
            onError: async () => {
                await refreshCsrfToken();
                const fresh = getCsrfToken();
                router.post('/logout', { _token: fresh }, {
                    headers: {
                        'X-CSRF-TOKEN': fresh,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
            }
        });
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <MainLayout>
            <Head title="Handover Complete" />
            
            <div className="p-8 font-poppins">
                <div className="max-w-2xl mx-auto">
                    {/* Success Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Handover Complete!
                        </h1>
                        <p className="text-gray-600">
                            The {roleLabel} role has been successfully transferred.
                        </p>
                    </div>

                    {/* Invitation Status */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-blue-600" />
                            Invitation Status
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Invitation sent to:</p>
                                        <p className="font-semibold text-gray-900">{invitationEmail}</p>
                                        {lastSentAt && (
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Last sent: {lastSentAt}
                                            </p>
                                        )}
                                    </div>
                                    {sendCount > 1 && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Sent {sendCount} times
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="text-sm text-gray-600">
                                <p className="mb-2">The new {roleLabel.toLowerCase()} will receive an email with:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>A secure activation link (valid for 7 days)</li>
                                    <li>Instructions to set up their password</li>
                                    <li>Details about their new role and responsibilities</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                        <h3 className="text-sm font-semibold text-gray-800 mb-4">What happens next?</h3>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-xs flex-shrink-0">1</div>
                                <p className="text-gray-700">The new {roleLabel.toLowerCase()} clicks the activation link in their email</p>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-xs flex-shrink-0">2</div>
                                <p className="text-gray-700">They set up their secure password</p>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-xs flex-shrink-0">3</div>
                                <p className="text-gray-700">All pending approvals are transferred automatically</p>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-semibold text-xs flex-shrink-0">4</div>
                                <p className="text-gray-700">They can start managing their new role immediately</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleResend}
                                disabled={processing || isResending}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {processing || isResending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Resending...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4" />
                                        Resend Invitation
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout Now
                            </button>
                        </div>

                        {/* Auto-logout timer */}
                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-orange-600" />
                                <span className="text-orange-800">
                                    You will be automatically logged out in: <strong>{formatTime(logoutTimer)}</strong>
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                                <strong>Didn't receive the email?</strong> Check spam/junk folders. 
                                You can resend the invitation if needed. There's a 5-minute cooldown between resends.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}