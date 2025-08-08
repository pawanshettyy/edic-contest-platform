import { Metadata } from 'next';
import QuizComponent from '@/components/quiz/EnhancedQuizComponent';

export const metadata: Metadata = {
  title: 'Quiz - Techpreneur 3.0',
  description: 'Test your entrepreneurship and innovation knowledge',
};

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Techpreneur 3.0 Quiz
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Test your entrepreneurial decision-making skills! Each question presents a business scenario 
            with four different approaches: Capital, Marketing, Strategy, and Team Building. Choose the 
            approach you believe is most effective.
          </p>
        </div>
        
        <QuizComponent />
      </div>
    </div>
  );
}
