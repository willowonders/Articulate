import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, RotateCcw, Sparkles, RefreshCw, Briefcase, User, Palette, Megaphone, Cpu, FlaskConical } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import { useWhisper } from '../hooks/useWhisper';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { getRandomTopic } from '../utils/topics';
import { storageService } from '../services/storage.service';
import { groqService } from '../services/groq.service';
import { startRealtimeDetection, stopRealtimeDetection } from '../services/speechmatics.service';
import type { Session } from '../types';

export function Practice() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState(getRandomTopic);
  const [isRecording, setIsRecording] = useState(false);
  const [step, setStep] = useState<'setup' | 'recording' | 'processing'>('setup');
  const processingRef = useRef(false);
  const [aiTopics, setAiTopics] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState('');

  const FOCUS_AREAS = [
    { label: 'Business', icon: Briefcase },
    { label: 'Personal', icon: User },
    { label: 'Creative', icon: Palette },
    { label: 'Persuasive', icon: Megaphone },
    { label: 'Technical', icon: Cpu },
    { label: 'Science', icon: FlaskConical },
    { label: 'All', icon: Sparkles },
  ];

  const timer = useTimer(120);
  const { transcribe, isTranscribing } = useWhisper();
  const { analyze, isAnalyzing } = useAIAnalysis();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleRefreshTopic = useCallback(() => {
    if (aiTopics.length > 0) {
      setTopic(aiTopics[Math.floor(Math.random() * aiTopics.length)]);
    } else {
      setTopic(getRandomTopic());
    }
  }, [aiTopics]);

  const handleUseCustomTopic = useCallback(() => {
    const trimmed = customTopic.trim();
    if (trimmed) {
      setTopic(trimmed);
      setCustomTopic('');
    }
  }, [customTopic]);

  const handleGenerateAITopics = useCallback(async () => {
    setLoadingTopics(true);
    try {
      const topics = await groqService.generateTopics(5, selectedFocus || undefined);
      setAiTopics(topics);
      setTopic(topics[0]);
    } catch {
      // Silently fall back to default topics
    } finally {
      setLoadingTopics(false);
    }
  }, [selectedFocus]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      mediaRecorder.start(1000);
      await startRealtimeDetection(stream);
      setIsRecording(true);
      setStep('recording');
      timer.start();
    } catch (err) {
      alert('Microphone access denied. Please allow microphone access to record.');
    }
  }, [timer]);

  const stopRecording = useCallback(async () => {
    return new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve();
        return;
      }

      recorder.onstop = async () => {
        timer.stop();
        setStep('processing');
        setIsRecording(false);

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

        try {
          // Stop Speechmatics real-time detection and get accumulated fillers
          const speechmaticsFillers = stopRealtimeDetection();

          // Run Whisper transcription
          const whisperResult = await transcribe(audioBlob);

          setLiveTranscript(whisperResult.text);

          const totalFillers = speechmaticsFillers.length;
          const fillerWords = speechmaticsFillers.map((f) => ({
            word: f.word,
            count: 1,
            positions: [],
          }));

          const analysis = await analyze(
            whisperResult.text,
            topic,
            totalFillers,
            timer.time
          );

          const session: Session = {
            id: crypto.randomUUID(),
            topic,
            timestamp: Date.now(),
            duration: timer.time,
            transcript: whisperResult.text,
            words: whisperResult.words.map((w) => ({
              word: w.word,
              start: w.start,
              end: w.end,
              confidence: w.probability,
            })),
            analysis: {
              ...analysis,
              fillerWords,
            },
          };

          storageService.saveSession(session);
          navigate(`/analysis/${session.id}`);
        } catch (err) {
          alert(`Processing failed: ${err instanceof Error ? err.message : err}`);
          setStep('setup');
          timer.reset();
        }

        streamRef.current?.getTracks().forEach((t) => t.stop());
        resolve();
      };

      recorder.stop();
    });
  }, [timer, transcribe, analyze, topic, navigate]);

  const handleRecordClick = useCallback(() => {
    if (processingRef.current) return;
    if (isRecording) {
      processingRef.current = true;
      stopRecording().finally(() => { processingRef.current = false; });
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleReset = useCallback(() => {
    timer.reset();
    setStep('setup');
    setIsRecording(false);
    setLiveTranscript('');
  }, [timer]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-2">
          Practice Speaking
        </h1>
        <p className="text-gray-500">Choose a topic, then record yourself speaking freely.</p>
      </div>

      {/* Topic Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-gray-700">Your Topic</h2>
          <button
            onClick={handleRefreshTopic}
            disabled={step !== 'setup'}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-orange-500 transition-all disabled:opacity-40"
            title="New topic"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xl sm:text-2xl font-heading font-bold text-gray-800 bg-orange-50 rounded-xl p-5 border border-orange-100">
          {topic}
        </p>

        {/* Focus Area Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {FOCUS_AREAS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setSelectedFocus(selectedFocus === label ? null : label)}
              disabled={step !== 'setup'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-40 ${
                selectedFocus === label
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Custom Topic Input */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && customTopic.trim()) handleUseCustomTopic(); }}
            placeholder="Or type your own topic..."
            disabled={step !== 'setup'}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all disabled:opacity-40"
          />
          <button
            onClick={handleUseCustomTopic}
            disabled={!customTopic.trim() || step !== 'setup'}
            className="px-4 py-2 rounded-xl bg-orange-100 text-orange-600 text-sm font-medium hover:bg-orange-200 transition-all disabled:opacity-40"
          >
            Use
          </button>
        </div>

        <button
          onClick={handleGenerateAITopics}
          disabled={loadingTopics || step !== 'setup'}
          className="mt-4 inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors disabled:opacity-40"
        >
          <Sparkles className="w-4 h-4" />
          {loadingTopics ? 'Generating...' : 'Generate AI Topics'}
        </button>
      </div>

      {/* Timer & Controls */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-gray-100 text-center">
        {/* Timer Display */}
        <div className="mb-8">
          <div className="relative w-40 h-40 mx-auto">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#FFF0E5"
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke={isRecording ? '#FF6B35' : '#FFB088'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - timer.progress)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-3xl font-bold text-gray-800">
                {timer.formatted}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-3">
            {step === 'recording' ? 'Recording in progress...' : step === 'processing' ? 'Processing audio...' : 'Max 2 minutes'}
          </p>
        </div>

        {/* Controls */}
        {step === 'setup' && (
          <button
            onClick={handleRecordClick}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all"
          >
            <Mic className="w-6 h-6" />
            Start Recording
          </button>
        )}

        {step === 'recording' && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRecordClick}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-500 text-white font-semibold shadow-lg shadow-red-500/25 hover:bg-red-600 hover:shadow-xl transition-all"
            >
              <Square className="w-5 h-5" fill="currentColor" />
              Stop & Analyze
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 font-medium hover:border-red-300 hover:text-red-500 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-orange-500">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">
                {isTranscribing ? 'Transcribing with Groq Whisper...' : isAnalyzing ? 'Analyzing with Groq AI...' : 'Processing...'}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              This may take a few moments for longer recordings.
            </p>
            {liveTranscript && (
              <div className="mt-6 text-left">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Your Transcript</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-gray-700 leading-relaxed max-h-48 overflow-y-auto">
                  {liveTranscript}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
