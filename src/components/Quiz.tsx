
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface QuizQuestion {
  question: string;
}

interface QuizProps {
  quizText: string;
  onRegenerateQuiz: () => void;
}

interface EvaluationResult {
  questionIndex: number;
  userAnswer: string;
  feedback: string;
  isCorrect: boolean;
  score: number;
}

const Quiz: React.FC<QuizProps> = ({ quizText, onRegenerateQuiz }) => {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Parse quiz text to extract questions
  const questions = useMemo(() => {
    const lines = quizText.split('\n').filter(line => line.trim());
    const parsedQuestions: QuizQuestion[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if it's a question (starts with number)
      if (/^\d+\./.test(trimmedLine)) {
        parsedQuestions.push({
          question: trimmedLine
        });
      }
    }
    
    return parsedQuestions;
  }, [quizText]);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmitForEvaluation = async () => {
    if (!allQuestionsAnswered) {
      toast({
        title: "Error",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsEvaluating(true);
    console.log('Evaluating quiz answers...');

    try {
      // Prepare the evaluation data
      const evaluationData = {
        originalText: quizText,
        questionsAndAnswers: questions.map((question, index) => ({
          question: question.question,
          userAnswer: userAnswers[index] || ''
        }))
      };

      const { data, error } = await supabase.functions.invoke('evaluate-quiz', {
        body: evaluationData
      });

      if (error) {
        console.error('Error calling evaluation function:', error);
        throw error;
      }

      if (data?.results) {
        setEvaluationResults(data.results);
        setShowResults(true);
        toast({
          title: "Evaluation Complete!",
          description: "Your quiz has been evaluated. Check your results below.",
        });
      } else {
        throw new Error('No evaluation results received');
      }
    } catch (error) {
      console.error('Error evaluating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleTakeQuizAgain = () => {
    setShowResults(false);
    setUserAnswers({});
    setEvaluationResults([]);
    onRegenerateQuiz();
  };

  const totalQuestions = questions.length;
  const allQuestionsAnswered = Object.keys(userAnswers).length === totalQuestions && 
    Object.values(userAnswers).every(answer => answer.trim().length > 0);

  const calculateScore = () => {
    if (evaluationResults.length === 0) return 0;
    const totalScore = evaluationResults.reduce((sum, result) => sum + result.score, 0);
    return Math.round(totalScore / evaluationResults.length);
  };

  if (showResults) {
    const score = calculateScore();
    
    return (
      <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-gray-200">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold text-blue-600">
              {score}%
            </div>
            <p className="text-gray-600">
              Your overall score based on the quality and accuracy of your answers.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              {score >= 80 ? 'Excellent work! 🎉' : 
               score >= 60 ? 'Good job! 👍' :
               score >= 40 ? 'Not bad, keep practicing! 📚' :
               'Keep studying and try again! 💪'}
            </p>
            <Button 
              onClick={handleTakeQuizAgain}
              className="mt-4"
            >
              Take Quiz Again
            </Button>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Feedback:</h3>
          {evaluationResults.map((result, index) => (
            <Card key={index} className={`border-l-4 ${result.score >= 70 ? 'border-l-green-500' : result.score >= 40 ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {result.score >= 70 ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 mb-2">{questions[result.questionIndex].question}</p>
                    <div className="mb-2">
                      <span className="font-medium text-sm text-gray-600">Your answer:</span>
                      <p className="text-sm text-gray-700 mt-1 p-2 bg-gray-50 rounded">{result.userAnswer}</p>
                    </div>
                    <div className="mb-2">
                      <span className="font-medium text-sm text-gray-600">Score: {result.score}%</span>
                    </div>
                    <div>
                      <span className="font-medium text-sm text-gray-600">Feedback:</span>
                      <p className="text-sm text-gray-700 mt-1">{result.feedback}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Interactive Quiz</h3>
        <div className="text-sm text-gray-600">
          {Object.values(userAnswers).filter(answer => answer.trim().length > 0).length}/{totalQuestions} answered
        </div>
      </div>
      
      <div className="space-y-6">
        {questions.map((question, questionIndex) => (
          <Card key={questionIndex} className="p-4">
            <div className="space-y-4">
              <Label htmlFor={`question-${questionIndex}`} className="font-medium text-gray-800 block">
                {question.question}
              </Label>
              <Textarea
                id={`question-${questionIndex}`}
                placeholder="Enter your answer here..."
                value={userAnswers[questionIndex] || ''}
                onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Button
          onClick={handleSubmitForEvaluation}
          disabled={!allQuestionsAnswered || isEvaluating}
          className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
        >
          {isEvaluating ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Evaluating...
            </div>
          ) : (
            <>Submit for Evaluation ({Object.values(userAnswers).filter(answer => answer.trim().length > 0).length}/{totalQuestions})</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Quiz;
