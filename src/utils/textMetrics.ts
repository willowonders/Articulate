export interface TextMetrics {
  totalWords: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  longSentenceCount: number;
  questionCount: number;
  exclamationCount: number;
  fragmentCount: number;
  wordDiversityRatio: number;
  repeatedPhrases: string[];
  transitionWordCount: number;
  complexWordCount: number;
  simpleWordCount: number;
  fillerCount: number;
  complexityRatio: number;
}

const TRANSITION_WORDS = new Set([
  'however', 'therefore', 'moreover', 'furthermore', 'additionally',
  'consequently', 'meanwhile', 'alternatively', 'specifically',
  'firstly', 'secondly', 'thirdly', 'finally', 'next', 'then',
  'also', 'but', 'so', 'because', 'although', 'while',
  'despite', 'instead', 'otherwise', 'likewise', 'similarly',
  'nevertheless', 'nonetheless', 'hence', 'thus', 'besides',
  'indeed', 'notably', 'particularly', 'especially', 'in addition',
  'on the other hand', 'for example', 'in fact', 'as a result',
]);

function splitSentences(transcript: string): string[] {
  const raw = transcript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return raw;
}

function countWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function findRepeatedPhrases(words: string[]): string[] {
  const twoGrams = new Map<string, number>();
  const threeGrams = new Map<string, number>();

  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    twoGrams.set(bigram, (twoGrams.get(bigram) || 0) + 1);
  }

  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    threeGrams.set(trigram, (threeGrams.get(trigram) || 0) + 1);
  }

  const repeated: string[] = [];

  for (const [phrase, count] of twoGrams) {
    if (count >= 2 && words.length > 4) {
      repeated.push(phrase);
    }
  }

  for (const [phrase, count] of threeGrams) {
    if (count >= 2 && words.length > 6) {
      repeated.push(phrase);
    }
  }

  return repeated.slice(0, 10);
}

export function computeTextMetrics(
  transcript: string,
  fillerCount: number
): TextMetrics {
  const trimmed = transcript.trim();
  const totalWords = countWords(trimmed).length;
  const words = countWords(trimmed);

  const sentences = splitSentences(trimmed);
  const sentenceCount = sentences.length;

  const avgWordsPerSentence =
    sentenceCount > 0 ? Math.round((totalWords / sentenceCount) * 10) / 10 : 0;

  const longSentenceCount = sentences.filter((s) => countWords(s).length > 30).length;
  const fragmentCount = sentences.filter((s) => countWords(s).length < 4).length;

  const questionCount = (trimmed.match(/\?/g) || []).length;
  const exclamationCount = (trimmed.match(/!/g) || []).length;

  const uniqueWords = new Set(words);
  const wordDiversityRatio =
    totalWords > 0 ? Math.round((uniqueWords.size / totalWords) * 100) / 100 : 0;

  const complexWordCount = words.filter((w) => w.length > 6).length;
  const simpleWordCount = words.filter((w) => w.length < 4).length;
  const complexityRatio =
    totalWords > 0
      ? Math.round((complexWordCount / totalWords) * 100) / 100
      : 0;

  const repeatedPhrases = findRepeatedPhrases(words);

  const allText = trimmed.toLowerCase();
  let transitionWordCount = 0;
  for (const tw of TRANSITION_WORDS) {
    const regex = new RegExp(`\\b${tw}\\b`, 'gi');
    const matches = allText.match(regex);
    if (matches) transitionWordCount += matches.length;
  }

  return {
    totalWords,
    sentenceCount,
    avgWordsPerSentence,
    longSentenceCount,
    questionCount,
    exclamationCount,
    fragmentCount,
    wordDiversityRatio,
    repeatedPhrases,
    transitionWordCount,
    complexWordCount,
    simpleWordCount,
    fillerCount,
    complexityRatio,
  };
}
