import React from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useForm } from '@inertiajs/react';
import { Shield, Clock, User, Mail, AlertTriangle } from 'lucide-react';

interface InvitationData {
    id: number;
    token: string;
    email: string;
    role: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    reason?: string;
    expires_at: string;
    inviter_name: string;
}

interface Props {
    invitation: InvitationData;
    roleLabel: string;
}

export default function Activate({ invitation, roleLabel }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    // Type assertion for additional error fields that may come from the backend
    const allErrors = errors as typeof errors & {
        invitation?: string;
        activation?: string;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('invitations.complete', invitation.token));
    };

    const fullName = [invitation.first_name, invitation.middle_name, invitation.last_name]
        .filter(Boolean)
        .join(' ');

    return (
        <>
            <Head title="Activate Account" />
            
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Shield className="w-8 h-8 text-red-600" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Activate Your Account
                            </h1>
                            <p className="text-gray-600">
                                Set up your password to complete activation
                            </p>
                        </div>

                        {/* Invitation Details */}
                        <div className="bg-red-50 rounded-xl p-6 mb-6">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-red-600" />
                                Invitation Details
                            </h2>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Name:</span>
                                    <span className="font-medium text-gray-900">{fullName}</span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-medium text-gray-900 flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {invitation.email}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Role:</span>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        {roleLabel}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Invited by:</span>
                                    <span className="font-medium text-gray-900">{invitation.inviter_name}</span>
                                </div>
                                
                                {invitation.reason && (
                                    <div className="pt-2 border-t border-red-200">
                                        <span className="text-gray-600 block mb-1">Reason:</span>
                                        <span className="text-gray-900 text-xs">{invitation.reason}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Expiry Warning */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="text-yellow-800 font-medium mb-1">Time Sensitive</p>
                                    <p className="text-yellow-700 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        This invitation expires on {invitation.expires_at}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Password Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {allErrors.invitation && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-red-800 text-sm">{allErrors.invitation}</p>
                                </div>
                            )}

                            {allErrors.activation && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-red-800 text-sm">{allErrors.activation}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="Enter your password"
                                    required
                                    minLength={8}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                    }`}
                                    placeholder="Confirm your password"
                                    required
                                    minLength={8}
                                />
                            </div>

                            <motion.button
                                type="submit"
                                disabled={processing}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                {processing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Activating Account...
                                    </div>
                                ) : (
                                    'Activate Account'
                                )}
                            </motion.button>
                        </form>

                        {/* Security Notice */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-xs text-gray-500 text-center">
                                This invitation link can only be used once and will expire after use.
                                Your account will be automatically verified upon activation.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}