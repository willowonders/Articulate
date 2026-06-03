import { useState, useCallback } from 'react';
import { whisperService, type WhisperTranscription } from '../services/whisper.service';

interface UseWhisperReturn {
  transcript: WhisperTranscription | null;
  isTranscribing: boolean;
  error: string | null;
  transcribe: (audioBlob: Blob) => Promise<WhisperTranscription>;
  reset: () => void;
}

export function useWhisper(): UseWhisperReturn {
  const [transcript, setTranscript] = useState<WhisperTranscription | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcribe = useCallback(async (audioBlob: Blob): Promise<WhisperTranscription> => {
    setIsTranscribing(true);
    setError(null);

    try {
      const result = await whisperService.transcribe(audioBlob);
      setTranscript(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript(null);
    setError(null);
    setIsTranscribing(false);
  }, []);

  return { transcript, isTranscribing, error, transcribe, reset };
}
