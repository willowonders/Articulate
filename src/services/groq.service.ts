import type { AnalysisResult } from '../types';
import type { TextMetrics } from '../utils/textMetrics';

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
    metrics: TextMetrics,
    duration: number
  ): Promise<AnalysisResult> {
    const prompt = `You are a speech coach. Analyze this speech transcript using the provided TEXT METRICS. Return ONLY valid JSON (no markdown).

TOPIC: "${topic}"
DURATION: ${duration} seconds
WORD COUNT: ${metrics.totalWords}

TEXT METRICS (computer-calculated, use these directly):
- Total words: ${metrics.totalWords}
- Total sentences: ${metrics.sentenceCount}
- Average words per sentence: ${metrics.avgWordsPerSentence}
- Long sentences (>30 words): ${metrics.longSentenceCount}
- Fragments (<4 words): ${metrics.fragmentCount}
- Questions asked: ${metrics.questionCount}
- Exclamations: ${metrics.exclamationCount}
- Filler words detected: ${metrics.fillerCount}
- Word diversity (unique/total): ${metrics.wordDiversityRatio}
- Complex words (>6 chars): ${metrics.complexWordCount}
- Simple words (<4 chars): ${metrics.simpleWordCount}
- Complexity ratio: ${metrics.complexityRatio}
- Transition words: ${metrics.transitionWordCount}
- Repeated phrases: ${metrics.repeatedPhrases.length > 0 ? metrics.repeatedPhrases.join('; ') : 'none'}

TRANSCRIPT:
"""
${transcript}
"""

Your job: interpret the meaning and intent of this speech. Provide constructive feedback.

---

SCORING RULES (apply these exactly):

1) CLARITY (0-100)
   - avgWordsPerSentence 10-18 → base 85
   - avgWordsPerSentence 19-24 → base 65
   - avgWordsPerSentence <10 → base 50 (too choppy)
   - avgWordsPerSentence 25+ → base 40 (too dense)
   - longSentenceCount > 3: subtract 10
   - fragmentCount > 5: subtract 10
   - questions > 0 (shows audience engagement): add up to +5
   - Adjust ±10 based on transcript meaning/flow

2) GRAMMAR (0-100)
   - Start with 85. Adjust ±15 based on transcript evidence of errors.
   - Look for: subject-verb disagreement, run-on sentences, sentence fragments,
     missing articles/prepositions, awkward phrasing, tense inconsistency.
   - Award full points ONLY if transcript is genuinely error-free.

3) VOCABULARY (0-100)
   - Start with 60.
   - complexityRatio > 0.3: +10
   - complexityRatio 0.15-0.3: +5
   - wordDiversityRatio > 0.7: +10
   - wordDiversityRatio 0.5-0.7: +5
   - Repeated phrases > 2: subtract 5-10
   - Adjust ±10 based on transcript (topic-appropriate word choice)

4) FILLER WORDS (0-100)
   - fillerCount 0 → 100
   - fillerCount 1 → 85
   - fillerCount 2-3 → 70
   - fillerCount 4-5 → 50
   - fillerCount 6-10 → 30
   - fillerCount >10 → 15

5) STRUCTURE (0-100)
   - Start with 60.
   - 3-15 sentences: +5 (good paragraph length)
   - 16+ sentences: +10 (developed content)
   - questionCount > 0: +5
   - transitionWordCount >= 3: +10
   - longSentenceCount > 3 or fragmentCount > 5: -10
   - Adjust ±10 based on whether opening/body/conclusion are distinguishable.

6) ENGAGEMENT (0-100)
   - Start with 60.
   - questionCount > 2: +10
   - questionCount 1-2: +5
   - exclamationCount > 0: +5
   - wordsPerSecond > 3 (energetic pacing): +5
   - Adjust ±10 based on transcript: humor, vivid language, storytelling, rhetorical devices.

7) OVERALL SCORE
   - Weighted average: Clarity 25%, Grammar 20%, Vocabulary 20%, Filler Words 15%, Structure 10%, Engagement 10%

---

OUTPUT (valid JSON only, no markdown):
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
    {"word": "<filler>", "count": <n>}
  ],
  "suggestions": [
    "<specific actionable suggestion 1>",
    "<specific actionable suggestion 2>",
    "<specific actionable suggestion 3>"
  ],
  "summary": "<2-3 sentence overall assessment. Be specific about what worked and what needs improvement.>"
}

CRITICAL RULES:
- Use the TEXT METRICS provided above. Do NOT count words or estimate counts yourself.
- FILLER WORDS array: include each filler word and its count. Do NOT include positions.
- suggestions: Must be specific to THIS speech, referencing actual words from the transcript. Generic advice like "speak more clearly" is not acceptable.
- summary: Reference specific things from the transcript.
- Return ONLY the JSON object, no other text.`;

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
