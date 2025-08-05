"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from './AuthLayout';
import { SimpleButton } from '@/components/ui/simple-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleAlert, SimpleAlertDescription } from '@/components/ui/SimpleAlert';
import { useAuth } from '@/context/AuthContext';
import { SignInFormData } from '@/types/auth';
import { Users, User, Shield, Eye, EyeOff, Info } from 'lucide-react';
import Link from 'next/link';

export const SignInForm: React.FC = () => {
  const router = useRouter();
  const { signIn, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<SignInFormData>({
    teamName: '',
    memberName: '',
    teamPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.teamName.trim()) {
      setError('Team name is required');
      return false;
    }
    if (!formData.memberName.trim()) {
      setError('Member name is required');
      return false;
    }
    if (!formData.teamPassword.trim()) {
      setError('Team password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await signIn(formData);
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your team account"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <SimpleAlert variant="destructive">
            <SimpleAlertDescription>{error}</SimpleAlertDescription>
          </SimpleAlert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="teamName">Team Name</Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="teamName"
                name="teamName"
                type="text"
                value={formData.teamName}
                onChange={handleInputChange}
                placeholder="Enter your team name"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="memberName">Your Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="memberName"
                name="memberName"
                type="text"
                value={formData.memberName}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="teamPassword">Team Password</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="teamPassword"
                name="teamPassword"
                type={showPassword ? "text" : "password"}
                value={formData.teamPassword}
                onChange={handleInputChange}
                placeholder="Enter team password"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Use the team password provided by your team leader
            </p>
          </div>
        </div>

        <SimpleButton
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200"
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </SimpleButton>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have a team yet?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Create team account
            </Link>
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                How to Sign In
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Enter your team name exactly as registered</li>
                <li>• Enter your name as it appears in the team</li>
                <li>• Use the team password shared by your leader</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};