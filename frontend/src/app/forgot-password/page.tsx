'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to send reset email';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
                <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl animate-fade-up">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 animate-scale-in">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Check Your Email</CardTitle>
                        <CardDescription className="text-base text-gray-600 mt-2">
                            If an account exists with this email, you will receive a password reset link shortly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert className="bg-blue-50/50 border-blue-100 text-blue-800">
                            <AlertDescription className="text-sm font-medium">
                                The email may take a few minutes to arrive. Please check your spam folder if you don't see it.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 pt-2">
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-xl animate-fade-up">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 animate-float">
                        <Mail className="h-8 w-8 text-indigo-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Forgot Password?</CardTitle>
                    <CardDescription className="text-base text-gray-600 mt-2">
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {error && (
                            <Alert variant="destructive" className="animate-shake">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="h-11 bg-gray-50/50 border-gray-200 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 pt-2">
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                        </Button>
                        <Link
                            href="/login"
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center group"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Login
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
