import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useChat } from '../hooks/useAIAnalysis';
import { storageService } from '../services/storage.service';
import type { AnalysisResult } from '../types';

export function Coach() {
  const [input, setInput] = useState('');
  const { messages, isResponding, sendMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  const recentSession = storageService.getRecentSessions(1)[0];
  const scores: AnalysisResult['scores'] = recentSession?.analysis.scores || {
    clarity: 0, grammar: 0, vocabulary: 0, fillerWords: 0, structure: 0, engagement: 0,
  };
  const transcript = recentSession?.transcript || '';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isResponding) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg, transcript, scores);
  };

  const suggestions = [
    "How can I reduce filler words?",
    "Give me tips for speaking more confidently",
    "How should I structure a 2-minute speech?",
    "What makes a speech engaging?",
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="text-center mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-2">AI Coach</h1>
        <p className="text-gray-500">Get personalized speaking tips and feedback.</p>
      </div>

      {recentSession && (
        <div className="bg-orange-50 rounded-xl p-4 mb-4 border border-orange-100 text-sm text-gray-600">
          <span className="font-medium text-orange-600">Latest session:</span> {recentSession.topic} — Score: {recentSession.analysis.overallScore}%
        </div>
      )}

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <p className="text-gray-500 mb-6">Ask your AI coach anything about speaking.</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-br-md'
                  : 'bg-white border border-gray-100 text-gray-700 rounded-bl-md shadow-sm'
              }`}
            >
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isResponding && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask your coach anything..."
          className="flex-1 px-4 py-3 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          disabled={isResponding}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isResponding}
          className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:shadow-md transition-all disabled:opacity-40 disabled:hover:shadow-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
