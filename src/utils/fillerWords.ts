const FILLER_WORDS = new Set([
  'um', 'uh', 'erm', 'ah', 'er', 'hmm',
  'like', 'you know', 'i mean',
  'so', 'actually', 'basically', 'literally',
  'right', 'well', 'kind of', 'sort of',
]);

interface Counts {
  [word: string]: number;
}

export function detectFillerWords(transcript: string): { counts: Counts; total: number } {
  const normalized = transcript.toLowerCase().replace(/[^a-z\s]/g, '');
  const words = normalized.split(/\s+/);
  const counts: Counts = {};
  let total = 0;

  // Check multi-word fillers first
  const text = normalized;
  for (const filler of FILLER_WORDS) {
    if (filler.includes(' ')) {
      const regex = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) {
        counts[filler] = matches.length;
        total += matches.length;
      }
    }
  }

  // Check single-word fillers
  for (const word of words) {
    if (FILLER_WORDS.has(word) && !word.includes(' ')) {
      counts[word] = (counts[word] || 0) + 1;
      total++;
    }
  }

  return { counts, total };
}

export function getUniqueFillerWords(counts: Counts): { word: string; count: number }[] {
  return Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}
