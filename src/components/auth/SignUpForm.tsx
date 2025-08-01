"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { SignUpFormData } from '@/types/auth';
import { Eye, EyeOff, Users, User, Mail, Lock, Shield } from 'lucide-react';
import Link from 'next/link';

export const SignUpForm: React.FC = () => {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showTeamPassword, setShowTeamPassword] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<SignUpFormData>({
    leaderName: '',
    email: '',
    password: '',
    confirmPassword: '',
    teamName: '',
    member1Name: '',
    member2Name: '',
    member3Name: '',
    teamPassword: '',
    confirmTeamPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.leaderName.trim()) {
      setError('Leader name is required');
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Valid email is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.teamName.trim()) {
      setError('Team name is required');
      return false;
    }
    if (!formData.member1Name.trim() || !formData.member2Name.trim() || !formData.member3Name.trim()) {
      setError('All team member names are required');
      return false;
    }
    if (formData.teamPassword.length < 4) {
      setError('Team password must be at least 4 characters');
      return false;
    }
    if (formData.teamPassword !== formData.confirmTeamPassword) {
      setError('Team passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await signUp(formData);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create account');
      }
    }
  };

  return (
    <AuthLayout
      title="Create Team Account"
      subtitle="Register your team for the contest"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Leader Information */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Team Leader Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="leaderName">Your Name *</Label>
                <Input
                  id="leaderName"
                  name="leaderName"
                  type="text"
                  value={formData.leaderName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create password (min 6 chars)"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Information */}
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Team Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  name="teamName"
                  type="text"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  placeholder="Enter your team name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="member1Name">Team Member 2 *</Label>
                  <Input
                    id="member1Name"
                    name="member1Name"
                    type="text"
                    value={formData.member1Name}
                    onChange={handleInputChange}
                    placeholder="Enter member name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="member2Name">Team Member 3 *</Label>
                  <Input
                    id="member2Name"
                    name="member2Name"
                    type="text"
                    value={formData.member2Name}
                    onChange={handleInputChange}
                    placeholder="Enter member name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="member3Name">Team Member 4 *</Label>
                  <Input
                    id="member3Name"
                    name="member3Name"
                    type="text"
                    value={formData.member3Name}
                    onChange={handleInputChange}
                    placeholder="Enter member name"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Password */}
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Team Security</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamPassword">Team Password *</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="teamPassword"
                    name="teamPassword"
                    type={showTeamPassword ? "text" : "password"}
                    value={formData.teamPassword}
                    onChange={handleInputChange}
                    placeholder="Create team password (min 4 chars)"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeamPassword(!showTeamPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showTeamPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Share this password with your team members for login
                </p>
              </div>

              <div>
                <Label htmlFor="confirmTeamPassword">Confirm Team Password *</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmTeamPassword"
                    name="confirmTeamPassword"
                    type={showTeamPassword ? "text" : "password"}
                    value={formData.confirmTeamPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm team password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Team...' : 'Create Team Account'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have a team?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};