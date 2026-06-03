import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Clock, Target, TrendingUp, Trash2, BarChart3, Flame } from 'lucide-react';
import { storageService } from '../services/storage.service';
import { getScoreColor } from '../utils/scoring';
import type { Session } from '../types';

export function History() {
  const [sessions, setSessions] = useState<Session[]>(() => storageService.getRecentSessions(50));
  const [stats, setStats] = useState(() => storageService.getOverallStats());
  const [progressData] = useState(() => storageService.getScoreProgress());

  const handleDelete = (id: string) => {
    storageService.deleteSession(id);
    setSessions(storageService.getRecentSessions(50));
    setStats(storageService.getOverallStats());
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl font-bold text-gray-800 mb-2">Your History</h1>
        <p className="text-gray-500">Track your speaking progress over time.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Sessions', value: stats.totalSessions, icon: BarChart3 },
          { label: 'Avg Score', value: `${stats.avgScore}%`, icon: TrendingUp },
          { label: 'Practice Time', value: `${stats.totalPracticeMinutes}m`, icon: Clock },
          { label: 'Streak', value: `${stats.streakDays}d`, icon: Flame },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
              <Icon className="w-5 h-5 text-orange-500" />
            </div>
            <p className="font-heading text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-sm text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress Chart */}
      {progressData.length > 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-10">
          <h3 className="font-heading font-semibold text-gray-700 mb-4">Score Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="session" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#FF6B35"
                strokeWidth={3}
                dot={{ r: 5, fill: '#FF6B35', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session List */}
      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-gray-500 text-lg mb-2">No sessions yet</p>
          <p className="text-gray-400 mb-6">Start practicing to see your progress here.</p>
          <Link
            to="/practice"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            Start Practicing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <Link to={`/analysis/${session.id}`} className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-gray-800 truncate mb-1">
                    {session.topic}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(session.duration)}
                    </span>
                    <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-heading font-bold text-white text-sm"
                    style={{ backgroundColor: getScoreColor(session.analysis.overallScore) }}
                  >
                    {session.analysis.overallScore}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(session.id);
                    }}
                    className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
