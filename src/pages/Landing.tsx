import { Star, Mic, ArrowRight, BarChart3, MessageCircle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storage.service';

export function Landing() {
  const stats = storageService.getOverallStats();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-cream">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Practice smarter, speak better
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Your AI-Powered
              <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                {' '}Speech Coach
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Record yourself speaking, get instant AI analysis on clarity, grammar,
              filler words, and more. Track your progress over time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/practice"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold text-lg shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all"
              >
                <Mic className="w-5 h-5" />
                Start Practicing
                <ArrowRight className="w-5 h-5" />
              </Link>
              {stats.totalSessions > 0 && (
                <Link
                  to="/history"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium hover:border-orange-300 hover:text-orange-600 transition-all"
                >
                  <BarChart3 className="w-5 h-5" />
                  View History
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      {stats.totalSessions > 0 && (
        <section className="bg-white border-y border-orange-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Sessions', value: stats.totalSessions, icon: Mic },
                { label: 'Avg Score', value: `${stats.avgScore}%`, icon: TrendingUp },
                { label: 'Practice Time', value: `${stats.totalPracticeMinutes}m`, icon: BarChart3 },
                { label: 'Best Score', value: `${stats.bestScore}%`, icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold text-gray-800">{value}</p>
                    <p className="text-sm text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center text-gray-800 mb-12">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Mic,
              title: 'Record',
              desc: 'Pick a topic, hit record, and speak naturally for up to 2 minutes.',
            },
            {
              icon: BarChart3,
              title: 'Analyze',
              desc: 'Get instant AI-powered feedback on clarity, grammar, fillers, and more.',
            },
            {
              icon: MessageCircle,
              title: 'Improve',
              desc: 'Chat with your AI coach for personalized tips and track your progress.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center mb-5 shadow-sm">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-orange-500 to-orange-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to speak with confidence?
          </h2>
          <p className="text-orange-100 text-lg mb-8">
            Start free. No signup required. Your data stays on your device.
          </p>
          <Link
            to="/practice"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-orange-600 font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Mic className="w-5 h-5" />
            Start Now
          </Link>
        </div>
      </section>
    </div>
  );
}
