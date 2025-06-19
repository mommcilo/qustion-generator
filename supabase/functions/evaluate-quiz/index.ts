
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
    const { originalText, questionsAndAnswers } = await req.json();

    if (!questionsAndAnswers || questionsAndAnswers.length === 0) {
      return new Response(JSON.stringify({ error: 'No questions and answers provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Evaluating quiz with', questionsAndAnswers.length, 'questions');

    const systemPrompt = `You are an expert educator evaluating quiz answers. Your task is to assess each answer based on accuracy, completeness, and understanding demonstrated.

EVALUATION CRITERIA:
- Accuracy: Is the information factually correct?
- Completeness: Does the answer adequately address the question?
- Understanding: Does the answer demonstrate genuine comprehension of the topic?
- Relevance: Is the answer relevant to the specific question asked?

SCORING SYSTEM:
- 90-100%: Excellent - Accurate, complete, demonstrates deep understanding
- 70-89%: Good - Mostly accurate and complete, shows good understanding
- 50-69%: Fair - Partially correct, shows some understanding but missing key elements
- 30-49%: Poor - Limited accuracy or understanding, significant gaps
- 0-29%: Very Poor - Incorrect or completely off-topic

FEEDBACK REQUIREMENTS:
- Provide specific, constructive feedback for each answer
- Point out what was correct and what could be improved
- If the answer is incorrect, briefly explain the correct information
- Be encouraging while being honest about areas for improvement
- Keep feedback concise but informative (2-3 sentences maximum)

RESPONSE FORMAT:
Return a JSON array where each object contains:
- questionIndex: number (0-based index)
- userAnswer: string (the user's exact answer)
- feedback: string (your constructive feedback)
- isCorrect: boolean (true if score >= 70%)
- score: number (0-100)

IMPORTANT: Base your evaluation on the original content provided. The questions were generated from this content, so use it as the reference for accuracy.`;

    const evaluationPrompt = `Original Content:
${originalText}

Questions and User Answers:
${questionsAndAnswers.map((qa, index) => `
${index + 1}. ${qa.question}
User's Answer: ${qa.userAnswer}
`).join('\n')}

Please evaluate each answer and provide detailed feedback according to the criteria above.`;

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
            content: evaluationPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent evaluation
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const evaluationContent = data.choices[0].message.content;

    console.log('Raw evaluation content:', evaluationContent);

    // Try to parse the JSON response
    let results;
    try {
      // Clean the response to extract JSON
      const jsonMatch = evaluationContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        results = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse evaluation results:', parseError);
      console.error('Raw content:', evaluationContent);
      
      // Fallback: create basic results
      results = questionsAndAnswers.map((qa, index) => ({
        questionIndex: index,
        userAnswer: qa.userAnswer,
        feedback: "Unable to provide detailed feedback at this time. Please try again.",
        isCorrect: false,
        score: 50
      }));
    }

    console.log('Successfully evaluated quiz');

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in evaluate-quiz function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
