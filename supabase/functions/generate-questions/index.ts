
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
        instructions: 'Focus on basic facts, definitions, and simple concepts. Questions should test fundamental understanding and recall of key information. Use clear, simple language.',
      },
      'intermediate': {
        description: 'intermediate level', 
        instructions: 'Focus on understanding relationships, applying concepts, and making connections. Questions should test comprehension and ability to use knowledge in context.',
      },
      'hard': {
        description: 'advanced level',
        instructions: 'Focus on analysis, evaluation, synthesis, and critical thinking. Questions should test deep understanding, ability to compare/contrast, draw conclusions, and apply knowledge to new situations.',
      }
    };

    const currentDifficulty = difficultyGuidance[difficulty] || difficultyGuidance['intermediate'];

    // Build enhanced system prompt with focus on variety and quality
    let systemPrompt = `You are an expert educator creating high-quality ${currentDifficulty.description} questions based on provided content.

CRITICAL QUALITY REQUIREMENTS:
- Questions must be directly relevant to the provided content
- Each question should test genuine understanding, not just memorization
- Use clear, unambiguous language
- Questions should cover different aspects and angles of the content
- ${currentDifficulty.instructions}

VARIETY AND UNIQUENESS:
- Focus on different themes, concepts, and details from the content
- Use varied question types (what, how, why, when, which, etc.)
- Ask about different levels of information (main concepts, specific details, relationships, implications)
- Approach the same topic from multiple angles (causes, effects, comparisons, applications)
- Vary the cognitive level required (recall, comprehension, application, analysis)

CONTENT ANALYSIS:
Analyze the provided text thoroughly and create exactly 10 questions that:
1. Cover the most important concepts AND specific details
2. Test different aspects of understanding
3. Represent various difficulty levels within the chosen category
4. Focus on different parts of the content (beginning, middle, end)
5. Include both broad concepts and specific facts`;

    if (includeAnswers && !takeQuiz) {
      systemPrompt += `

QUESTION + ANSWER FORMAT:
- Provide clear, specific questions that test different aspects of understanding
- Follow each question with a comprehensive answer
- Answers should explain the concept thoroughly with context
- Include relevant details and examples from the source material
- Vary question types to cover breadth and depth

EXAMPLE FORMAT:
1. [Clear, specific question focusing on main concept]
Answer: [Detailed explanation with context and supporting details]

2. [Question about specific detail or application]
Answer: [Comprehensive response with examples from the content]`;
    } else {
      // For both "quiz" mode and "questions only" mode, use the same format
      systemPrompt += `

QUESTION-ONLY FORMAT:
- Provide clear, specific questions that can be answered based on the content
- Questions should be self-contained and understandable
- Cover both main themes and important details
- Use varied question structures and approaches
- Ensure questions test genuine understanding at multiple levels
- Questions should be suitable for open-ended answers where users can demonstrate their knowledge

EXAMPLE FORMAT:
1. [Question about main concept or theme]
2. [Question about specific detail or fact]
3. [Question about relationship or process]
4. [Question about implication or application]`;
    }

    // Add language instruction
    if (language !== 'English') {
      systemPrompt += `

LANGUAGE: Generate all content in ${language}. Ensure proper grammar, natural phrasing, and appropriate terminology in ${language}.`;
    }

    systemPrompt += `

FINAL REMINDER: 
- Quality over quantity - each question should be valuable for learning
- Vary your approach to create diverse, engaging questions that thoroughly test understanding
- Focus on making questions that truly assess comprehension and knowledge depth
- All questions should be answerable based on the provided content`;

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
            content: `Create diverse, high-quality questions based on this content. Focus on different aspects and use varied approaches:\n\n${text}` 
          }
        ],
        temperature: 0.7, // Increased for more variety while maintaining quality
        max_tokens: 2000, // Increased for more detailed responses
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
