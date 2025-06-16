
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';

const Index = () => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    console.log('Generating questions for:', inputText);
    
    // Simulate generation process
    setTimeout(() => {
      setIsGenerating(false);
      console.log('Questions generated successfully!');
    }, 2000);
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
