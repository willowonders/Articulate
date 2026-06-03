import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, MessageCircle, Clock, Target, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { storageService } from '../services/storage.service';
import { getScoreColor, getScoreLabel } from '../utils/scoring';
import type { Session } from '../types';

export function Analysis() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (sessionId) {
      const s = storageService.getSession(sessionId);
      setSession(s || null);
    }
  }, [sessionId]);

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-lg">Session not found.</p>
        <Link to="/practice" className="mt-4 inline-block text-orange-500 hover:text-orange-600 font-medium">
          Start a new practice
        </Link>
      </div>
    );
  }

  const { analysis } = session;
  const radarData = Object.entries(analysis.scores).map(([key, value]) => ({
    category: key.charAt(0).toUpperCase() + key.slice(1),
    score: value,
    fullMark: 100,
  }));

  const criteriaMap: Record<string, string> = {
    clarity: 'How clear and understandable your speech was — enunciation, articulation, and speaking pace.',
    grammar: 'Grammatical correctness — verb tense consistency, subject-verb agreement, punctuation.',
    vocabulary: 'Range and appropriateness of vocabulary — word choice, richness, and precision.',
    fillerWords: 'Penalty for filler words (um, uh, like, etc.). 0 fillers = 100, each filler reduces score by ~10.',
    structure: 'Logical flow and organization — introduction, body, conclusion, transitions between ideas.',
    engagement: 'How interesting and compelling the speech is — energy, eye contact, conversational tone.',
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/practice"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          New Practice
        </Link>
        <Link
          to="/coach"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-100 text-orange-600 font-medium hover:bg-orange-200 transition-all text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          Ask AI Coach
        </Link>
      </div>

      {/* Overall Score */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8 text-center">
        <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Overall Score</p>
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#FFF0E5" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={getScoreColor(analysis.overallScore)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - analysis.overallScore / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-heading text-3xl font-bold" style={{ color: getScoreColor(analysis.overallScore) }}>
              {analysis.overallScore}
            </span>
          </div>
        </div>
        <p className="font-heading font-semibold text-lg" style={{ color: getScoreColor(analysis.overallScore) }}>
          {getScoreLabel(analysis.overallScore)}
        </p>

        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {session.topic.slice(0, 40)}{session.topic.length > 40 ? '...' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDuration(session.duration)}
          </span>
        </div>
      </div>

      {/* Full Transcript */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="font-heading font-semibold text-gray-700 mb-3">Full Transcript</h3>
        {session.transcript ? (
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{session.transcript}</p>
        ) : (
          <p className="text-gray-400 text-sm italic">No transcript available.</p>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Radar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-semibold text-gray-700 mb-4">Score Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                dataKey="score"
                stroke="#FF6B35"
                fill="#FF6B35"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Cards */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-heading font-semibold text-gray-700">Category Scores</h3>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help hover:text-orange-500 transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                <p className="font-semibold mb-1.5">Weight Formula</p>
                <p className="text-gray-300 leading-relaxed">
                  Clarity 25%, Grammar 20%, Vocabulary 20%, Filler Words 15%, Structure 10%, Engagement 10%
                </p>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(analysis.scores).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-28 group relative">
                  <span className="text-sm text-gray-500 capitalize">{key}</span>
                  {criteriaMap[key] && (
                    <>
                      <HelpCircle className="w-3.5 h-3.5 text-gray-300 cursor-help group-hover:text-orange-400 transition-colors flex-shrink-0" />
                      <div className="absolute left-full ml-2 w-60 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none top-1/2 -translate-y-1/2">
                        <p className="font-semibold mb-1 capitalize">{key}</p>
                        <p className="text-gray-300 leading-relaxed">{criteriaMap[key]}</p>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45" />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${value}%`,
                      backgroundColor: getScoreColor(value),
                    }}
                  />
                </div>
                <span className="font-mono text-sm font-semibold w-10 text-right" style={{ color: getScoreColor(value) }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filler Words */}
      {analysis.fillerWords.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h3 className="font-heading font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Filler Words Detected
          </h3>
          <div className="flex flex-wrap gap-3">
            {analysis.fillerWords.map((fw) => (
              <div
                key={fw.word}
                className="px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200"
              >
                <span className="font-mono font-semibold text-yellow-700">"{fw.word}"</span>
                <span className="text-yellow-500 ml-2">×{fw.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <h3 className="font-heading font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Suggestions for Improvement
        </h3>
        <ul className="space-y-3">
          {analysis.suggestions.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-gray-600">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-6 text-white">
        <h3 className="font-heading font-semibold mb-2">Summary</h3>
        <p className="text-orange-100 leading-relaxed">{analysis.summary}</p>
      </div>
    </div>
  );
}
