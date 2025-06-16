
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';

interface QuizQuestion {
  question: string;
  answers: string[];
  correctIndex: number;
}

interface QuizProps {
  quizText: string;
}

const Quiz: React.FC<QuizProps> = ({ quizText }) => {
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [showResults, setShowResults] = useState(false);

  // Parse quiz text and randomize answer positions
  const questions = useMemo(() => {
    const lines = quizText.split('\n').filter(line => line.trim());
    const parsedQuestions: QuizQuestion[] = [];
    
    let currentQuestion = '';
    let currentAnswers: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if it's a question (starts with number)
      if (/^\d+\./.test(trimmedLine)) {
        // Save previous question if it exists
        if (currentQuestion && currentAnswers.length === 4) {
          // Randomize answer positions
          const correctAnswer = currentAnswers[0];
          const shuffledAnswers = [...currentAnswers].sort(() => Math.random() - 0.5);
          const newCorrectIndex = shuffledAnswers.indexOf(correctAnswer);
          
          parsedQuestions.push({
            question: currentQuestion,
            answers: shuffledAnswers,
            correctIndex: newCorrectIndex
          });
        }
        
        // Start new question
        currentQuestion = trimmedLine;
        currentAnswers = [];
      } 
      // Check if it's an answer (starts with letter and parenthesis)
      else if (/^[a-d]\)/i.test(trimmedLine)) {
        currentAnswers.push(trimmedLine.substring(2).trim());
      }
    }
    
    // Don't forget the last question
    if (currentQuestion && currentAnswers.length === 4) {
      const correctAnswer = currentAnswers[0];
      const shuffledAnswers = [...currentAnswers].sort(() => Math.random() - 0.5);
      const newCorrectIndex = shuffledAnswers.indexOf(correctAnswer);
      
      parsedQuestions.push({
        question: currentQuestion,
        answers: shuffledAnswers,
        correctIndex: newCorrectIndex
      });
    }
    
    return parsedQuestions;
  }, [quizText]);

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleCheckScore = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctIndex) {
        correct++;
      }
    });
    return correct;
  };

  const score = calculateScore();
  const totalQuestions = questions.length;
  const allQuestionsAnswered = Object.keys(userAnswers).length === totalQuestions;

  if (showResults) {
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
              {score}/{totalQuestions}
            </div>
            <p className="text-gray-600">
              You answered {score} out of {totalQuestions} questions correctly!
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(score / totalQuestions) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              {score / totalQuestions >= 0.8 ? 'Excellent work! 🎉' : 
               score / totalQuestions >= 0.6 ? 'Good job! 👍' :
               score / totalQuestions >= 0.4 ? 'Not bad, keep practicing! 📚' :
               'Keep studying and try again! 💪'}
            </p>
            <Button 
              onClick={() => { setShowResults(false); setUserAnswers({}); }}
              className="mt-4"
            >
              Take Quiz Again
            </Button>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Results:</h3>
          {questions.map((question, questionIndex) => {
            const userAnswer = userAnswers[questionIndex];
            const isCorrect = userAnswer === question.correctIndex;
            
            return (
              <Card key={questionIndex} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-2">{question.question}</p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Your answer:</span> {question.answers[userAnswer]}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600">
                          <span className="font-medium">Correct answer:</span> {question.answers[question.correctIndex]}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Interactive Quiz</h3>
        <div className="text-sm text-gray-600">
          {Object.keys(userAnswers).length}/{totalQuestions} answered
        </div>
      </div>
      
      <div className="space-y-6">
        {questions.map((question, questionIndex) => (
          <Card key={questionIndex} className="p-4">
            <h4 className="font-medium text-gray-800 mb-4">{question.question}</h4>
            <RadioGroup
              value={userAnswers[questionIndex]?.toString() || ""}
              onValueChange={(value) => handleAnswerChange(questionIndex, parseInt(value))}
            >
              {question.answers.map((answer, answerIndex) => (
                <div key={answerIndex} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={answerIndex.toString()}
                    id={`q${questionIndex}-a${answerIndex}`}
                  />
                  <Label 
                    htmlFor={`q${questionIndex}-a${answerIndex}`}
                    className="cursor-pointer flex-1 py-2"
                  >
                    {answer}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Button
          onClick={handleCheckScore}
          disabled={!allQuestionsAnswered}
          className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
        >
          Check Score ({Object.keys(userAnswers).length}/{totalQuestions})
        </Button>
      </div>
    </div>
  );
};

export default Quiz;
