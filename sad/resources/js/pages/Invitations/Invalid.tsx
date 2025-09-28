import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Clock } from 'lucide-react';

interface Props {
    message: string;
}

export default function Invalid({ message }: Props) {
    return (
        <>
            <Head title="Invalid Invitation" />
            
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
                        {/* Error Icon */}
                        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        {/* Header */}
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">
                            Invalid Invitation
                        </h1>

                        {/* Message */}
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                            <p className="text-red-800 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>

                        {/* Possible Reasons */}
                        <div className="text-left mb-8">
                            <h2 className="text-sm font-semibold text-gray-900 mb-3">
                                This could happen if:
                            </h2>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span>The invitation has expired (invitations are valid for 7 days)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span>The invitation has already been used to activate an account</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span>The invitation link is malformed or incomplete</span>
                                </li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link
                                    href={route('login')}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Go to Login
                                </Link>
                            </motion.div>
                        </div>

                        {/* Help Text */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-xs text-gray-500 text-center leading-relaxed">
                                If you believe this invitation should be valid, please contact the person who sent it to you. 
                                They may need to send you a new invitation.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}