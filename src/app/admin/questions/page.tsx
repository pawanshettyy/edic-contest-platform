'use client';

import { useState, useEffect } from 'react';
import { SimpleCard } from '@/components/ui/SimpleCard';
import { SimpleAlert } from '@/components/ui/SimpleAlert';

interface QuizOption {
  id?: string;
  option_text: string;
  points: number;
  is_correct: boolean;
  option_order: number;
}

interface QuizQuestion {
  id?: string;
  question: string;
  category: string;
  time_limit: number;
  is_active: boolean;
  options: QuizOption[];
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  const [formData, setFormData] = useState<QuizQuestion>({
    question: '',
    category: 'Capital',
    time_limit: 45,
    is_active: true,
    options: [
      { option_text: '', points: 0, is_correct: false, option_order: 1 },
      { option_text: '', points: 0, is_correct: false, option_order: 2 },
      { option_text: '', points: 0, is_correct: false, option_order: 3 },
      { option_text: '', points: 0, is_correct: false, option_order: 4 }
    ]
  });

  const categories = [
    'Capital', 'Marketing', 'Strategy', 'Team Building'
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/questions');
      if (!response.ok) throw new Error('Failed to load questions');
      
      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(`Failed to load questions: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      category: 'Capital',
      time_limit: 45,
      is_active: true,
      options: [
        { option_text: '', points: 0, is_correct: false, option_order: 1 },
        { option_text: '', points: 0, is_correct: false, option_order: 2 },
        { option_text: '', points: 0, is_correct: false, option_order: 3 },
        { option_text: '', points: 0, is_correct: false, option_order: 4 }
      ]
    });
    setEditingQuestion(null);
    setShowForm(false);
  };

  const handleEdit = (question: QuizQuestion) => {
    setFormData({ ...question });
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!formData.question.trim()) {
        setError('Question is required');
        return;
      }

      const hasCorrectAnswer = formData.options.some(opt => opt.is_correct && opt.option_text.trim());
      if (!hasCorrectAnswer) {
        setError('At least one option must be marked as correct and have text');
        return;
      }

      const method = editingQuestion ? 'PUT' : 'POST';
      const url = editingQuestion 
        ? `/api/admin/questions?id=${editingQuestion.id}`
        : '/api/admin/questions';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save question');
      }

      setSuccess(editingQuestion ? 'Question updated successfully!' : 'Question added successfully!');
      resetForm();
      loadQuestions();
    } catch (err) {
      setError(`Failed to save question: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete question');

      setSuccess('Question deleted successfully!');
      loadQuestions();
    } catch (err) {
      setError(`Failed to delete question: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const toggleQuestionStatus = async (questionId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update question status');

      setSuccess(`Question ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      loadQuestions();
    } catch (err) {
      setError(`Failed to update question status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const updateOption = (index: number, field: keyof QuizOption, value: string | number | boolean) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...formData.options];
    newOptions.push({
      option_text: '',
      points: 0,
      is_correct: false,
      option_order: newOptions.length + 1
    });
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      setError('At least 2 options are required');
      return;
    }
    
    const newOptions = formData.options.filter((_, i) => i !== index);
    // Reorder remaining options
    newOptions.forEach((option, i) => {
      option.option_order = i + 1;
    });
    setFormData({ ...formData, options: newOptions });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Question Bank Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Add New Question'}
        </button>
      </div>

      {error && (
        <SimpleAlert variant="destructive" className="mb-4">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">&times;</button>
          </div>
        </SimpleAlert>
      )}
      {success && (
        <SimpleAlert className="mb-4 border-green-500/50 text-green-600 bg-green-50">
          <div className="flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800">&times;</button>
          </div>
        </SimpleAlert>
      )}

      {showForm && (
        <SimpleCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Question *</label>
              <textarea
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full border rounded px-3 py-2 h-24"
                placeholder="Enter your question here..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Time Limit (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={formData.time_limit}
                  onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium">Active in Quiz</label>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Answer Options *</label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-blue-600 text-sm hover:underline"
                >
                  + Add Option
                </button>
              </div>
              
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2 p-2 border rounded">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={option.option_text}
                      onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      value={option.points}
                      onChange={(e) => updateOption(index, 'points', parseInt(e.target.value) || 0)}
                      className="w-full border rounded px-2 py-1 text-sm"
                      placeholder="Points"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={option.is_correct}
                      onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                      className="mr-1"
                    />
                    <span className="text-xs">Correct</span>
                  </div>
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 text-sm hover:text-red-800"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                {editingQuestion ? 'Update Question' : 'Add Question'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </SimpleCard>
      )}

      <SimpleCard>
        <h2 className="text-xl font-semibold mb-4">Questions ({questions.length})</h2>
        
        {questions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No questions found. Add your first question!</p>
        ) : (
          <div className="space-y-4">
            {questions.map((question) => (
              <div key={question.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{question.question}</h3>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span>Type: MCQ</span>
                      <span>Category: {question.category}</span>
                      <span>Time: {question.time_limit}s</span>
                      <span className={question.is_active ? 'text-green-600' : 'text-red-600'}>
                        {question.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(question)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleQuestionStatus(question.id!, question.is_active)}
                      className={`text-sm hover:underline ${
                        question.is_active ? 'text-orange-600' : 'text-green-600'
                      }`}
                    >
                      {question.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(question.id!)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="ml-4 space-y-1">
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        option.is_correct ? 'bg-green-500' : 'bg-gray-300'
                      }`}></span>
                      <span className="flex-1">{option.option_text}</span>
                      <span className="text-gray-500 ml-2">({option.points} pts)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SimpleCard>
    </div>
  );
}
