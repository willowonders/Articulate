import type { AnalysisResult } from '../types';

export function calculateOverallScore(scores: AnalysisResult['scores']): number {
  return Math.round(
    scores.clarity * 0.25 +
    scores.grammar * 0.20 +
    scores.vocabulary * 0.20 +
    scores.fillerWords * 0.15 +
    scores.structure * 0.10 +
    scores.engagement * 0.10
  );
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Needs Work';
  return 'Keep Practicing';
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#22C55E';
  if (score >= 75) return '#FF6B35';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

export function getScoreGradient(score: number): string {
  if (score >= 90) return 'from-green-400 to-green-600';
  if (score >= 75) return 'from-orange-400 to-orange-600';
  if (score >= 60) return 'from-yellow-400 to-yellow-600';
  return 'from-red-400 to-red-600';
}
