export interface Session {
  id: string;
  topic: string;
  timestamp: number;
  duration: number;
  transcript: string;
  words: WordTiming[];
  analysis: AnalysisResult;
}

export interface WordTiming {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface AnalysisResult {
  overallScore: number;
  scores: {
    clarity: number;
    grammar: number;
    vocabulary: number;
    fillerWords: number;
    structure: number;
    engagement: number;
  };
  fillerWords: FillerWord[];
  suggestions: string[];
  summary: string;
}

export interface FillerWord {
  word: string;
  count: number;
  positions: number[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
