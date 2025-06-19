
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

    // Enhanced difficulty-specific guidance
    const difficultyGuidance = {
      'beginner': {
        description: 'beginner level',
        instructions: 'Focus on basic facts, definitions, and simple concepts. Questions should test fundamental understanding and recall of key information. Use clear, simple language.'
      },
      'intermediate': {
        description: 'intermediate level', 
        instructions: 'Focus on understanding relationships, applying concepts, and making connections. Questions should test comprehension and ability to use knowledge in context.'
      },
      'hard': {
        description: 'advanced level',
        instructions: 'Focus on analysis, evaluation, synthesis, and critical thinking. Questions should test deep understanding, ability to compare/contrast, draw conclusions, and apply knowledge to new situations.'
      }
    };

    const currentDifficulty = difficultyGuidance[difficulty] || difficultyGuidance['intermediate'];

    // Build enhanced system prompt
    let systemPrompt = `You are an expert educator creating high-quality ${currentDifficulty.description} questions based on provided content.

QUALITY REQUIREMENTS:
- Questions must be directly relevant to the provided content
- Each question should test understanding, not just memorization
- Use clear, unambiguous language
- Avoid trick questions or overly complex wording
- Questions should have definitive, factual answers
- ${currentDifficulty.instructions}

CONTENT ANALYSIS:
Analyze the provided text and create exactly 10 questions that cover the most important concepts, facts, and ideas presented.`;

    if (takeQuiz) {
      systemPrompt += `

QUIZ FORMAT REQUIREMENTS:
- For each question, provide exactly 4 multiple choice options labeled a), b), c), d)
- The FIRST option (a) must ALWAYS be the correct answer
- Incorrect options should be plausible but clearly wrong to someone who understands the content
- Avoid obviously incorrect options or joke answers
- Do not use "All of the above" or "None of the above" options
- Make sure incorrect options are related to the topic but factually incorrect

EXAMPLE FORMAT:
1. [Clear, specific question about the content]
a) [Correct answer - factually accurate and complete]
b) [Plausible but incorrect option]
c) [Plausible but incorrect option] 
d) [Plausible but incorrect option]`;
    } else if (includeAnswers) {
      systemPrompt += `

QUESTION + ANSWER FORMAT:
- Provide clear, specific questions
- Follow each question with a comprehensive answer
- Answers should explain the concept thoroughly
- Include relevant details and context from the source material

EXAMPLE FORMAT:
1. [Clear, specific question]
Answer: [Detailed, comprehensive explanation based on the content]`;
    } else {
      systemPrompt += `

QUESTION-ONLY FORMAT:
- Provide clear, specific questions that can be answered based on the content
- Questions should be self-contained and understandable
- Focus on the most important aspects of the content
- Ensure questions test genuine understanding

EXAMPLE FORMAT:
1. [Clear, specific question]
2. [Clear, specific question]`;
    }

    // Add language instruction
    if (language !== 'English') {
      systemPrompt += `

LANGUAGE: Generate all content in ${language}. Ensure proper grammar and natural phrasing in ${language}.`;
    }

    systemPrompt += `

Remember: Quality over quantity. Each question should be valuable for learning and testing understanding of the content.`;

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
            content: systemPrompt
          },
          { 
            role: 'user', 
            content: `Create questions based on this content:\n\n${text}` 
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, focused output
        max_tokens: 1500, // Increased for more detailed responses
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
