
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to generate questions from.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedQuestions('');
    console.log('Generating questions for:', inputText);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: { text: inputText }
      });

      if (error) {
        console.error('Error calling function:', error);
        throw error;
      }

      if (data?.questions) {
        setGeneratedQuestions(data.questions);
        toast({
          title: "Success!",
          description: "Questions generated successfully!",
        });
      } else {
        throw new Error('No questions generated');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              QGen
            </h1>
          </div>
          <p className="text-gray-600 mt-2 ml-13">
            AI-powered question generator
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="input-text" className="block text-lg font-semibold text-gray-700 mb-3">
                  Enter your text to generate questions
                </label>
                <Textarea
                  id="input-text"
                  placeholder="Paste your article, document, or any text here. QGen will analyze it and generate relevant questions..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[300px] resize-none text-base leading-relaxed border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-xl"
                />
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerate}
                  disabled={!inputText.trim() || isGenerating}
                  className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Generate Questions
                    </div>
                  )}
                </Button>
              </div>

              {/* Generated Questions Display */}
              {generatedQuestions && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Generated Questions</h3>
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
                  <div className="prose prose-gray max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-700 font-sans text-base leading-relaxed">
                      {generatedQuestions}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>
              Powered by AI • Enter any text to get started
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
