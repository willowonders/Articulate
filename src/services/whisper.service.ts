export interface WhisperTranscription {
  text: string;
  words: {
    word: string;
    start: number;
    end: number;
    probability: number;
  }[];
  language: string;
  language_probability: number;
  duration: number;
}

export const whisperService = {
  async transcribe(audioBlob: Blob): Promise<WhisperTranscription> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', 'en');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    formData.append('timestamp_granularities[]', 'segment');
    formData.append('temperature', '0.4');
    formData.append('prompt', 'um uh like hmm okay so you know actually');

    const response = await fetch('/api/groq/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transcription failed (${response.status}): ${error}`);
    }

    const data = await response.json();

    const words = (data.words || []).map((w: { word: string; start: number; end: number; probability: number }) => ({
      word: w.word,
      start: w.start,
      end: w.end,
      probability: w.probability,
    }));

    return {
      text: data.text,
      words,
      language: data.language || 'en',
      language_probability: data.language_probability || 1.0,
      duration: data.duration || 0,
    };
  },

  async healthCheck(): Promise<boolean> {
    return true;
  },
};
