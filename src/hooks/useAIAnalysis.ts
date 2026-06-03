import { useState, useCallback } from 'react';
import { groqService } from '../services/groq.service';
import { detectFillerWords, getUniqueFillerWords } from '../utils/fillerWords';
import { computeTextMetrics } from '../utils/textMetrics';
import type { AnalysisResult, ChatMessage } from '../types';

interface UseAIAnalysisReturn {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  analyze: (transcript: string, topic: string, fillerCount: number, duration: number) => Promise<AnalysisResult>;
}

export function useAIAnalysis(): UseAIAnalysisReturn {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (transcript: string, topic: string, fillerCount: number, duration: number) => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const { counts } = detectFillerWords(transcript);
        const metrics = computeTextMetrics(transcript, fillerCount);
        const result = await groqService.analyzeTranscript(transcript, topic, metrics, duration);
        setAnalysis(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setError(message);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  return { analysis, isAnalyzing, error, analyze };
}

interface UseChatReturn {
  messages: ChatMessage[];
  isResponding: boolean;
  sendMessage: (content: string, transcript: string, scores: AnalysisResult['scores']) => Promise<void>;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isResponding, setIsResponding] = useState(false);

  const sendMessage = useCallback(
    async (content: string, transcript: string, scores: AnalysisResult['scores']) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsResponding(true);

      try {
        const response = await groqService.coachMessage(content, transcript, scores);
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I'm having trouble connecting to the AI. Make sure your Groq API key is configured in .env.local",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsResponding(false);
      }
    },
    []
  );

  return { messages, isResponding, sendMessage };
}
