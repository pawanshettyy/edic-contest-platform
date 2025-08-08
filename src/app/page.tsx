import Link from 'next/link';
import { SimpleCard, SimpleCardContent, SimpleCardDescription, SimpleCardHeader, SimpleCardTitle } from '@/components/ui/SimpleCard';
import { Trophy, Users, Clock, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
              <span className="text-xl font-bold text-white">T3</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Techpreneur 3.0 Summit
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Innovation Challenge</p>
            </div>
          </div>
          <nav className="flex items-center space-x-4">
            <Link 
              href="/auth/signin" 
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Innovate, Compete, and{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Transform
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Join the ultimate 3-day innovation summit where teams of 4 compete across 3 exciting rounds, 
            solving real-world problems and showcasing entrepreneurial excellence in a dynamic environment.
          </p>
          <div className="mt-6 text-lg text-gray-700 dark:text-gray-300">
            <p className="font-semibold">📅 3-Day Event | 🏆 3 Challenging Rounds | 👥 Teams of 5</p>
            <p className="text-base mt-2 text-gray-600 dark:text-gray-400">More details coming soon...</p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup" 
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl text-lg"
            >
              Create Team Account
            </Link>
            <Link 
              href="/auth/signin" 
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-all text-lg"
            >
              Sign In to Existing Team
            </Link>
            <Link 
              href="/admin/login" 
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-xl text-lg"
            >
              🔐 Admin Access
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <SimpleCard>
            <SimpleCardHeader className="text-center">
              <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <SimpleCardTitle>3-Round Challenge</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <SimpleCardDescription className="text-center">
                Experience 3 diverse rounds testing innovation, problem-solving, and entrepreneurial skills.
              </SimpleCardDescription>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto text-blue-500 mb-4" />
              <SimpleCardTitle>Team Innovation</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <SimpleCardDescription className="text-center">
                Collaborate as a team of 5 to develop creative solutions and innovative ideas.
              </SimpleCardDescription>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardHeader className="text-center">
              <Clock className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <SimpleCardTitle>3-Day Summit</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <SimpleCardDescription className="text-center">
                An intensive 3-day event packed with challenges, networking, and learning opportunities.
              </SimpleCardDescription>
            </SimpleCardContent>
          </SimpleCard>

          <SimpleCard>
            <SimpleCardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto text-purple-500 mb-4" />
              <SimpleCardTitle>Entrepreneurship Focus</SimpleCardTitle>
            </SimpleCardHeader>
            <SimpleCardContent>
              <SimpleCardDescription className="text-center">
                Develop entrepreneurial mindset with real-world problem solving and business innovation.
              </SimpleCardDescription>
            </SimpleCardContent>
          </SimpleCard>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <SimpleCard className="max-w-2xl mx-auto">
            <SimpleCardHeader>
              <SimpleCardTitle className="text-2xl">Ready to Join the Summit?</SimpleCardTitle>
              <SimpleCardDescription>
                Register your team for Techpreneur 3.0 Summit and be part of the innovation revolution.
              </SimpleCardDescription>
            </SimpleCardHeader>
            <SimpleCardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/auth/signup" 
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Get Started Now
                </Link>
                <Link 
                  href="/auth/signin" 
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                >
                  Sign In
                </Link>
              </div>
            </SimpleCardContent>
          </SimpleCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 Techpreneur 3.0 Summit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
