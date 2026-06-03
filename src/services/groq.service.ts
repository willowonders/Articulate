import type { AnalysisResult } from '../types';

const BACKEND_URL = '/api/groq';
const MODEL = 'llama-3.3-70b-versatile';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 3000;

async function callGroq(prompt: string): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: MODEL,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    if (response.status === 429) {
      throw new Error('Groq API rate limited. Please wait a moment and try again.');
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  throw new Error('Groq API error: max retries exceeded');
}

export const groqService = {
  async analyzeTranscript(
    transcript: string,
    topic: string,
    fillerWordCount: number,
    duration: number
  ): Promise<AnalysisResult> {
    const prompt = `You are a speech coach. Analyze this speech transcript and return ONLY valid JSON (no markdown).

Topic: "${topic}"
Duration: ${duration} seconds
Filler words detected: ${fillerWordCount}

Transcript:
"""
${transcript}
"""

Return this exact JSON structure:
{
  "overallScore": <0-100>,
  "scores": {
    "clarity": <0-100>,
    "grammar": <0-100>,
    "vocabulary": <0-100>,
    "fillerWords": <0-100>,
    "structure": <0-100>,
    "engagement": <0-100>
  },
  "fillerWords": [
    {"word": "<filler>", "count": <n>, "positions": [<word_indices>]}
  ],
  "suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
  "summary": "<2-3 sentence overall assessment>"
}

CRITICAL: The "fillerWords" score MUST be calculated using this formula based on the filler word count provided above:
- 0 filler words → score 100
- 1 filler word → score 90
- 2 filler words → score 80
- 3 filler words → score 70
- 4 filler words → score 60
- 5+ filler words → score 50 or lower (decrease by 10 per additional filler)
- NEVER assign 100 if filler words were detected. NEVER ignore the filler word count above.

Also include each filler word with its count and word positions in the "fillerWords" array.
Example: if transcript contains "um I was like um nervous", fillerWords array should be:
[{"word": "um", "count": 2, "positions": [0, 5]}, {"word": "like", "count": 1, "positions": [3]}]

Scoring rules:
- clarity: How clear and understandable the speech is
- grammar: Grammatical correctness
- vocabulary: Range and appropriateness of vocabulary
- fillerWords: MUST follow the formula above based on filler word count. Penalty for filler words.
- structure: Logical flow and organization
- engagement: How interesting and compelling the speech is
- overallScore: Weighted average (Clarity 25%, Grammar 20%, Vocabulary 20%, Filler Words 15%, Structure 10%, Engagement 10%)

Return ONLY the JSON object, no other text.`;

    const response = await callGroq(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    return JSON.parse(jsonMatch[0]);
  },

  async generateTopics(count: number = 5, focus?: string): Promise<string[]> {
    const focusInstruction = focus
      ? `Focus specifically on the "${focus}" category.`
      : 'Topics should be diverse across categories: personal experiences, professional topics, creative storytelling, persuasive arguments, technical explanations, and science-related topics.';

    const prompt = `Generate ${count} interesting speech practice topics for someone improving their public speaking skills.
${focusInstruction}
Return ONLY a JSON array of strings, no other text. Example: ["Topic 1", "Topic 2"]`;

    const response = await callGroq(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse topics');
    }
    return JSON.parse(jsonMatch[0]);
  },

  async coachMessage(
    userMessage: string,
    transcript: string,
    scores: AnalysisResult['scores']
  ): Promise<string> {
    const prompt = `You are a friendly, encouraging speech coach named Articulate AI.

Previous speech analysis scores:
- Clarity: ${scores.clarity}/100
- Grammar: ${scores.grammar}/100
- Vocabulary: ${scores.vocabulary}/100
- Filler Words: ${scores.fillerWords}/100
- Structure: ${scores.structure}/100
- Engagement: ${scores.engagement}/100

Recent transcript excerpt:
"${transcript.slice(0, 500)}"

User message: "${userMessage}"

Respond as a supportive coach. Give specific, actionable advice. Be encouraging but honest. Keep responses under 200 words.`;

    return callGroq(prompt);
  },
};
