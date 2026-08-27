import React, { useEffect, useState } from 'react';
import { JournalEntry, MoodType } from '../types';
import { geminiApi, AggregateInsightsResponse } from '../services/api';
import {
  Sparkles,
  TrendingUp,
  Smile,
  Heart,
  BarChart2,
  Calendar,
  Zap,
  Tag,
  ShieldAlert,
  Flame,
  Award,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface InsightsDashboardProps {
  entries: JournalEntry[];
  onStartNewChat: () => void;
}

const MOOD_COLORS: Record<MoodType, { bg: string; text: string; bar: string }> = {
  Grateful: { bg: 'bg-emerald-50', text: 'text-emerald-800', bar: 'bg-emerald-500' },
  Optimistic: { bg: 'bg-sky-50', text: 'text-sky-800', bar: 'bg-sky-500' },
  Reflective: { bg: 'bg-indigo-50', text: 'text-indigo-800', bar: 'bg-indigo-500' },
  Calm: { bg: 'bg-teal-50', text: 'text-teal-800', bar: 'bg-teal-500' },
  Energetic: { bg: 'bg-amber-50', text: 'text-amber-800', bar: 'bg-amber-500' },
  Thoughtful: { bg: 'bg-purple-50', text: 'text-purple-800', bar: 'bg-purple-500' },
  Determined: { bg: 'bg-orange-50', text: 'text-orange-800', bar: 'bg-orange-500' },
  Peaceful: { bg: 'bg-cyan-50', text: 'text-cyan-800', bar: 'bg-cyan-500' },
  Challenged: { bg: 'bg-rose-50', text: 'text-rose-800', bar: 'bg-rose-500' },
  Curious: { bg: 'bg-violet-50', text: 'text-violet-800', bar: 'bg-violet-500' },
};

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({
  entries,
  onStartNewChat,
}) => {
  const [aggregate, setAggregate] = useState<AggregateInsightsResponse | null>(null);
  const [loadingAggregate, setLoadingAggregate] = useState(false);

  // Compute statistics
  const totalEntries = entries.length;

  // Mood frequencies
  const moodCounts: Partial<Record<MoodType, number>> = {};
  let totalSentiment = 0;
  const themeCounts: Record<string, number> = {};

  entries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    totalSentiment += e.sentimentScore ?? 0.5;
    if (e.keyThemes) {
      e.keyThemes.forEach((t) => {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      });
    }
  });

  const avgSentiment = totalEntries > 0 ? (totalSentiment / totalEntries) : 0.5;
  const sortedMoods = Object.entries(moodCounts).sort((a, b) => (b[1] || 0) - (a[1] || 0));
  const topThemes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const fetchAggregateInsights = async () => {
    if (entries.length === 0) return;
    setLoadingAggregate(true);
    try {
      const res = await geminiApi.getAggregateInsights(entries);
      setAggregate(res);
    } catch (err) {
      console.warn('Failed to fetch aggregate insights:', err);
    } finally {
      setLoadingAggregate(false);
    }
  };

  useEffect(() => {
    if (entries.length > 0) {
      fetchAggregateInsights();
    }
  }, [entries.length]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center space-x-2">
            <span>Mood & Growth Intelligence</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Automated sentiment tracking, positive coaching insights, and reflection patterns
          </p>
        </div>

        {entries.length > 0 && (
          <button
            id="btn-refresh-aggregate"
            onClick={fetchAggregateInsights}
            disabled={loadingAggregate}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-medium shadow-2xs self-start sm:self-auto transition-colors disabled:opacity-50"
          >
            {loadingAggregate ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span>Regenerate Insights</span>
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-stone-900 text-base mb-1">
            No mood insights recorded yet
          </h3>
          <p className="text-xs text-stone-500 mb-5">
            Save your first journal entry from the chat session to unlock automated mood metrics, trend graphs, and personalized coaching takeaways.
          </p>
          <button
            onClick={onStartNewChat}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-stone-800"
          >
            Start First Journal Session
          </button>
        </div>
      ) : (
        <>
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Total Reflections
                </span>
                <Calendar className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-2xl font-serif font-bold text-stone-900">
                {totalEntries} <span className="text-xs font-sans font-normal text-stone-500">entries</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1">Saved securely to Cloud Firestore</p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Dominant State
                </span>
                <Smile className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-serif font-bold text-stone-900">
                {sortedMoods[0] ? sortedMoods[0][0] : 'Reflective'}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                {sortedMoods[0] ? `${sortedMoods[0][1]} sessions recorded` : 'Consistent reflection'}
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Sentiment Index
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-serif font-bold text-emerald-700">
                {avgSentiment >= 0 ? `+${(avgSentiment * 100).toFixed(0)}%` : `${(avgSentiment * 100).toFixed(0)}%`}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                {avgSentiment > 0.3 ? 'Grounded & constructive mindset' : 'Balanced exploration'}
              </p>
            </div>
          </div>

          {/* AI Mindful Growth Synthesis */}
          {aggregate && (
            <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                  Gemini Growth Synthesis
                </span>
              </div>

              <div>
                <h3 className="text-lg font-serif font-bold text-white mb-1">
                  {aggregate.weeklyTheme}
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {aggregate.coachingTip}
                </p>
              </div>

              <div className="p-3 bg-stone-800/80 border border-stone-700 rounded-xl text-xs text-amber-200 flex items-start space-x-2">
                <Heart className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>{aggregate.encouragement}</span>
              </div>
            </div>
          )}

          {/* Mood Distribution & Top Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mood Frequency Distribution */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-stone-900 text-sm">
                  Mood Frequency Breakdown
                </h3>
                <BarChart2 className="w-4 h-4 text-stone-400" />
              </div>

              <div className="space-y-2.5">
                {sortedMoods.map(([mood, count]) => {
                  const moodKey = mood as MoodType;
                  const moodStyle = MOOD_COLORS[moodKey] || MOOD_COLORS['Reflective'];
                  const pct = totalEntries > 0 ? ((count as number) / totalEntries) * 100 : 0;

                  return (
                    <div key={mood} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-stone-800">{mood}</span>
                        <span className="text-stone-500 font-mono">
                          {count} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${moodStyle.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recurring Life Themes */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-stone-900 text-sm">
                  Key Reflection Themes
                </h3>
                <Tag className="w-4 h-4 text-stone-400" />
              </div>

              {topThemes.length === 0 ? (
                <p className="text-xs text-stone-400">Themes will appear as you save reflections.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topThemes.map(([theme, count], idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>{theme}</span>
                      <span className="text-[10px] bg-stone-200 px-1.5 py-0.2 rounded-full text-stone-600 font-mono">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Latest Positive Insights Feed */}
              <div className="pt-2 border-t border-stone-100">
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Recent Uplifting Takeaways
                </h4>
                <div className="space-y-2">
                  {entries.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="p-2.5 bg-stone-50 rounded-xl text-xs text-stone-700 border border-stone-100 italic"
                    >
                      "{e.positiveInsight}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Safety & Non-Medical Disclaimer */}
          <div className="p-4 bg-stone-100/80 rounded-xl border border-stone-200 text-stone-500 text-[11px] flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">
              <strong>Mindfulness Notice:</strong> Gemini Journal is designed for personal self-reflection, mindfulness, and creative journaling. Mood classifications and positive insights are AI-generated perspectives and do NOT constitute psychiatric, mental-health, or clinical medical diagnoses.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
