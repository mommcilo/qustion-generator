
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, includeAnswers, takeQuiz, language = 'English', difficulty = 'intermediate' } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'No text provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating questions for text:', text.substring(0, 100) + '...');
    console.log('Include answers:', includeAnswers);
    console.log('Take quiz:', takeQuiz);
    console.log('Language:', language);
    console.log('Difficulty:', difficulty);

    // Dynamic prompt based on options
    let basePrompt = `Write 10 ${difficulty} questions about: {replaceWithUserInput}. Questions should be diverse, useful for quiz or discussion.`;
    
    let answersPrompt = '';
    let quizPrompt = '';
    
    if (takeQuiz) {
      // For quiz mode: include multiple choice answers
      quizPrompt = ` For every question provide exactly 4 multiple choice answers (a, b, c, d) where the FIRST answer (a) is always the correct one. Make sure the correct answers are factually accurate and unambiguous. Avoid options like "Both a and c" or similar combinations.`;
    } else if (includeAnswers) {
      // For regular questions with answers (not quiz)
      answersPrompt = ` Please also answer every question with detailed explanations.`;
    }
    
    const languagePrompt = language !== 'English' ? ` Please generate text in ${language}` : '';
    
    const systemContent = basePrompt + answersPrompt + quizPrompt + languagePrompt + `

Format your response as a clean numbered list. Make sure questions are clear, specific, and directly related to the content provided.${takeQuiz ? ' For quiz questions, ensure the correct answer (option a) is factually accurate and the other options are plausible but clearly incorrect.' : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: systemContent
          },
          { 
            role: 'user', 
            content: `Please generate questions based on this text:\n\n${text}` 
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const questions = data.choices[0].message.content;

    console.log('Successfully generated questions');

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-questions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
