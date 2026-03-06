'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

function LoadingState() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl animate-fade-up">
                <CardHeader className="text-center py-10">
                    <div className="mx-auto mb-6 h-12 w-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                    <CardTitle className="text-xl font-medium text-gray-900">Loading...</CardTitle>
                    <CardDescription className="mt-2 text-gray-500">Please wait a moment.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const [email, setEmail] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('Invalid or missing reset token');
                setIsVerifying(false);
                return;
            }

            try {
                const response = await api.get(`/auth/reset-password/${token}`);
                const data = response.data;

                setTokenValid(true);
                setEmail(data.data.email);
            } catch (err: any) {
                const errorMessage = err.response?.data?.message || 'Invalid or expired reset token';
                setError(errorMessage);
            } finally {
                setIsVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            await api.post(`/auth/reset-password/${token}`, { password });

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to reset password';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
                <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl animate-fade-up">
                    <CardHeader className="text-center py-10">
                        <div className="mx-auto mb-6 h-12 w-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                        <CardTitle className="text-xl font-medium text-gray-900">Verifying link...</CardTitle>
                        <CardDescription className="mt-2 text-gray-500">Please wait a moment.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
                <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl animate-fade-up">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 animate-in zoom-in duration-300">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Link Invalid or Expired</CardTitle>
                        <CardDescription className="text-gray-600 mt-2">{error}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-4 pt-4">
                        <Button
                            className="w-full h-11 text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                            onClick={() => router.push('/forgot-password')}
                        >
                            Request New Link
                        </Button>
                        <Link
                            href="/login"
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center group"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
                <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl animate-fade-up">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 animate-scale-in">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Password Reset!</CardTitle>
                        <CardDescription className="text-base text-gray-600 mt-2">
                            Your password has been successfully updated. Redirecting to login...
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-4 pt-6">
                        <Button
                            className="w-full h-11 text-base font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all hover:-translate-y-0.5 bg-green-600 hover:bg-green-700"
                            onClick={() => router.push('/login')}
                        >
                            Go to Login Now
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl animate-fade-up">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 animate-float">
                        <Lock className="h-8 w-8 text-indigo-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Reset Password</CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-2">
                        Create a strong password for <span className="font-medium text-gray-900">{email}</span>
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {error && (
                            <Alert variant="destructive" className="animate-shake">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                    className="h-11 bg-gray-50/50 border-gray-200 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                />
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                                    Must be at least 6 characters
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    minLength={6}
                                    className="h-11 bg-gray-50/50 border-gray-200 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 pt-2">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Resetting Password...' : 'Reset Password'}
                        </Button>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md group mb-2"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span className="font-semibold text-sm">Back to Login</span>
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
