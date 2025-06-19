
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface QAProps {
  generatedQuestions: string;
}

interface QuestionAnswer {
  question: string;
  answer?: string;
  index: number;
}

const QA: React.FC<QAProps> = ({ generatedQuestions }) => {
  const [hasCopied, setHasCopied] = useState(false);
  const [visibleAnswers, setVisibleAnswers] = useState<{ [key: number]: boolean }>({});

  // Parse questions and answers for the answers mode
  const parseQuestionsAndAnswers = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const items: QuestionAnswer[] = [];
    let currentIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if it's a question (starts with number)
      if (/^\d+\./.test(line)) {
        const question = line;
        let answer = '';
        
        // Look for the answer in the next few lines
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          const nextLine = lines[j].trim();
          if (/^(Answer|A):\s*/.test(nextLine)) {
            answer = nextLine.replace(/^(Answer|A):\s*/, '');
            break;
          }
        }
        
        items.push({ question, answer, index: currentIndex });
        currentIndex++;
      }
    }
    
    return items;
  };

  const toggleAnswerVisibility = (index: number) => {
    setVisibleAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedQuestions);
      setHasCopied(true);
      toast({
        title: "Copied!",
        description: "Questions copied to clipboard.",
      });
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Generated Questions with Answers
        </h3>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {hasCopied ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="space-y-4">
        {parseQuestionsAndAnswers(generatedQuestions).map((item, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="mb-3">
              <p className="font-medium text-gray-800">{item.question}</p>
            </div>
            {item.answer && (
              <div>
                <Button
                  onClick={() => toggleAnswerVisibility(index)}
                  variant="outline"
                  size="sm"
                  className="mb-2 flex items-center gap-2"
                >
                  {visibleAnswers[index] ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide Answer
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show Answer
                    </>
                  )}
                </Button>
                {visibleAnswers[index] && (
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QA;
