import type { Session } from '../types';

const STORAGE_KEY = 'articulate-sessions';

export const storageService = {
  getSessions(): Session[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSession(session: Session): void {
    const sessions = this.getSessions();
    sessions.push(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },

  getSession(id: string): Session | undefined {
    return this.getSessions().find((s) => s.id === id);
  },

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  },

  getRecentSessions(limit: number = 10): Session[] {
    return this.getSessions()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },

  getOverallStats() {
    const sessions = this.getSessions();
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        avgScore: 0,
        avgDuration: 0,
        totalPracticeMinutes: 0,
        bestScore: 0,
        streakDays: 0,
      };
    }

    const avgScore =
      sessions.reduce((sum, s) => sum + s.analysis.overallScore, 0) /
      sessions.length;
    const avgDuration =
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
    const bestScore = Math.max(
      ...sessions.map((s) => s.analysis.overallScore)
    );

    // Calculate streak
    const days = new Set(
      sessions.map((s) => new Date(s.timestamp).toDateString())
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      totalSessions: sessions.length,
      avgScore: Math.round(avgScore),
      avgDuration: Math.round(avgDuration),
      totalPracticeMinutes: Math.round(
        sessions.reduce((sum, s) => sum + s.duration, 0) / 60
      ),
      bestScore: Math.round(bestScore),
      streakDays: streak,
    };
  },

  getWeeklyScores(): { day: string; score: number }[] {
    const sessions = this.getSessions();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekly: { day: string; score: number; count: number }[] = days.map(
      (day) => ({ day, score: 0, count: 0 })
    );

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    sessions
      .filter((s) => s.timestamp > oneWeekAgo)
      .forEach((s) => {
        const dayIdx = new Date(s.timestamp).getDay();
        weekly[dayIdx].score += s.analysis.overallScore;
        weekly[dayIdx].count++;
      });

    return weekly.map((w) => ({
      day: w.day,
      score: w.count > 0 ? Math.round(w.score / w.count) : 0,
    }));
  },

  getScoreProgress(): { session: number; score: number; date: string }[] {
    return this.getSessions().map((s, i) => ({
      session: i + 1,
      score: s.analysis.overallScore,
      date: new Date(s.timestamp).toLocaleDateString(),
    }));
  },
};
