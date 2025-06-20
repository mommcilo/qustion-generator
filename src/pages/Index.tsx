import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sparkles, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import Quiz from '@/components/Quiz';
import QA from '@/components/QA';

const Index = () => {
  const [inputText, setInputText] = useState('');
  const [questionMode, setQuestionMode] = useState('quiz'); // 'quiz', 'answers', 'only'
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [difficultyLevel, setDifficultyLevel] = useState('intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  // Derived values for backward compatibility
  const includeAnswers = questionMode === 'answers';
  const takeQuiz = questionMode === 'quiz';

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
    console.log('Question mode:', questionMode);
    console.log('Include answers:', includeAnswers);
    console.log('Take quiz:', takeQuiz);
    console.log('Selected language:', selectedLanguage);
    console.log('Difficulty level:', difficultyLevel);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: { text: inputText, includeAnswers, takeQuiz, language: selectedLanguage, difficulty: difficultyLevel }
      });

      if (error) {
        console.error('Error calling function:', error);
        throw error;
      }

      if (data?.questions) {
        setGeneratedQuestions(data.questions);
        const modeText = questionMode === 'quiz' ? ' for quiz' : questionMode === 'answers' ? ' with answers' : '';
        toast({
          title: "Success!",
          description: `${difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)} questions${modeText} generated successfully in ${selectedLanguage}!`,
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

  const handleRegenerateQuiz = () => {
    handleGenerate();
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
            Generate. Quiz. Repeat.
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
                  Enter something about the topic you want to study
                </label>
                <Textarea
                  id="input-text"
                  placeholder="World Cup 2022&#10;Senior Java Developer Interview Questions&#10;WWII&#10;Gravity"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[300px] resize-none text-base leading-relaxed border-2 border-gray-200 focus:border-blue-500 transition-colors rounded-xl"
                />
              </div>

              {/* Options Section */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Generation Options</h3>
                <div className="space-y-4">
                  
                  <div>
                    <RadioGroup value={questionMode} onValueChange={setQuestionMode} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="quiz" id="quiz-mode" />
                        <Label htmlFor="quiz-mode" className="text-sm font-medium leading-none cursor-pointer">
                          Take a quiz
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="answers" id="answers-mode" />
                        <Label htmlFor="answers-mode" className="text-sm font-medium leading-none cursor-pointer">
                          Questions and answers in text format
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="only" id="only-mode" />
                        <Label htmlFor="only-mode" className="text-sm font-medium leading-none cursor-pointer">
                          Questions in text format
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="difficulty-select" className="text-sm font-medium leading-none">
                      Difficulty:
                    </Label>
                    <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">📝 Beginner</SelectItem>
                        <SelectItem value="intermediate">⚡ Intermediate</SelectItem>
                        <SelectItem value="hard">🔥 Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="language-select" className="text-sm font-medium leading-none">
                      Language:
                    </Label>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">🇬🇧 English</SelectItem>
                        <SelectItem value="Spanish">🇪🇸 Spanish</SelectItem>
                        <SelectItem value="French">🇫🇷 French</SelectItem>
                        <SelectItem value="German">🇩🇪 German</SelectItem>
                        <SelectItem value="Italian">🇮🇹 Italian</SelectItem>
                        <SelectItem value="Portuguese">🇵🇹 Portuguese</SelectItem>
                        <SelectItem value="Dutch">🇳🇱 Dutch</SelectItem>
                        <SelectItem value="Russian">🇷🇺 Russian</SelectItem>
                        <SelectItem value="Polish">🇵🇱 Polish</SelectItem>
                        <SelectItem value="Czech">🇨🇿 Czech</SelectItem>
                        <SelectItem value="Slovak">🇸🇰 Slovak</SelectItem>
                        <SelectItem value="Hungarian">🇭🇺 Hungarian</SelectItem>
                        <SelectItem value="Romanian">🇷🇴 Romanian</SelectItem>
                        <SelectItem value="Bulgarian">🇧🇬 Bulgarian</SelectItem>
                        <SelectItem value="Croatian">🇭🇷 Croatian</SelectItem>
                        <SelectItem value="Serbian">🇷🇸 Serbian</SelectItem>
                        <SelectItem value="Macedonian">🇲🇰 Macedonian</SelectItem>
                        <SelectItem value="Slovenian">🇸🇮 Slovenian</SelectItem>
                        <SelectItem value="Greek">🇬🇷 Greek</SelectItem>
                        <SelectItem value="Albanian">🇦🇱 Albanian</SelectItem>
                        <SelectItem value="Bosnian">🇧🇦 Bosnian</SelectItem>
                        <SelectItem value="Montenegrin">🇲🇪 Montenegrin</SelectItem>
                        <SelectItem value="Swedish">🇸🇪 Swedish</SelectItem>
                        <SelectItem value="Norwegian">🇳🇴 Norwegian</SelectItem>
                        <SelectItem value="Danish">🇩🇰 Danish</SelectItem>
                        <SelectItem value="Finnish">🇫🇮 Finnish</SelectItem>
                        <SelectItem value="Estonian">🇪🇪 Estonian</SelectItem>
                        <SelectItem value="Latvian">🇱🇻 Latvian</SelectItem>
                        <SelectItem value="Lithuanian">🇱🇹 Lithuanian</SelectItem>
                        <SelectItem value="Ukrainian">🇺🇦 Ukrainian</SelectItem>
                        <SelectItem value="Belarusian">🇧🇾 Belarusian</SelectItem>
                        <SelectItem value="Moldovan">🇲🇩 Moldovan</SelectItem>
                        <SelectItem value="Turkish">🇹🇷 Turkish</SelectItem>
                        <SelectItem value="Chinese">🇨🇳 Chinese</SelectItem>
                        <SelectItem value="Japanese">🇯🇵 Japanese</SelectItem>
                        <SelectItem value="Korean">🇰🇷 Korean</SelectItem>
                        <SelectItem value="Arabic">🇸🇦 Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                <>
                  {takeQuiz ? (
                    <Quiz quizText={generatedQuestions} onRegenerateQuiz={handleRegenerateQuiz} />
                  ) : includeAnswers ? (
                    <QA generatedQuestions={generatedQuestions} />
                  ) : (
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Generated Questions
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
                      <div className="prose prose-gray max-w-none">
                        <pre className="whitespace-pre-wrap text-gray-700 font-sans text-base leading-relaxed">
                          {generatedQuestions}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>
              Created with AI. Empowering people. • Enter any text to get started
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
