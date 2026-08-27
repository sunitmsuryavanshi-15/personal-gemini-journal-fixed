import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { geminiApi } from '../services/api';
import { firestoreService } from '../services/firestoreService';
import { ChatMessage, JournalEntry, JournalSummary, MoodType } from '../types';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Smile,
  Heart,
  Zap,
  ArrowRight,
  Edit3,
  Loader2,
  Check,
} from 'lucide-react';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSavedSuccess: (newEntry: JournalEntry) => void;
}

const MOOD_COLORS: Record<MoodType, { bg: string; text: string; border: string }> = {
  Grateful: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  Optimistic: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  Reflective: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  Calm: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  Energetic: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Thoughtful: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  Determined: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  Peaceful: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  Challenged: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  Curious: { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200' },
};

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSavedSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable summary state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [keyHighlights, setKeyHighlights] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [mood, setMood] = useState<MoodType>('Reflective');
  const [moodConfidence, setMoodConfidence] = useState(85);
  const [sentimentScore, setSentimentScore] = useState(0.5);
  const [positiveInsight, setPositiveInsight] = useState('');
  const [keyThemes, setKeyThemes] = useState<string[]>([]);
  const [suggestedAction, setSuggestedAction] = useState('');

  useEffect(() => {
    if (!isOpen || messages.length === 0) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function fetchSummary() {
      try {
        const response = await geminiApi.generateSummary(messages);
        if (!isMounted) return;

        const data: JournalSummary = response.data;
        setTitle(data.title || 'Mindful Reflection');
        setSummary(data.summary || '');
        setKeyHighlights(data.keyHighlights || []);
        setActionItems(data.actionItems || []);

        if (data.moodInsight) {
          setMood(data.moodInsight.mood || 'Reflective');
          setMoodConfidence(data.moodInsight.moodConfidence || 85);
          setSentimentScore(data.moodInsight.sentimentScore ?? 0.5);
          setPositiveInsight(data.moodInsight.positiveInsight || '');
          setKeyThemes(data.moodInsight.keyThemes || ['Reflection']);
          setSuggestedAction(data.moodInsight.suggestedAction || '');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Summary error:', err);
        setError(err?.message || 'Failed to generate automatic summary.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSaveToFirestore = async () => {
    if (!user) {
      setError('You must be signed in to save journal entries.');
      return;
    }

    setSaving(true);
    setError(null);

    const newEntry: JournalEntry = {
      id: `entry_${Date.now()}`,
      userId: user.uid,
      title: title.trim() || 'Untitled Reflection',
      summary: summary.trim(),
      messages,
      keyHighlights,
      actionItems,
      mood,
      moodConfidence,
      sentimentScore,
      positiveInsight,
      keyThemes,
      suggestedAction,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await firestoreService.saveJournalEntry(user.uid, newEntry);
      onSavedSuccess(newEntry);
      onClose();
    } catch (saveErr: any) {
      console.error('Firestore save failed:', saveErr);
      setError(
        saveErr?.message || 'Failed to save entry to Cloud Firestore. Please check your network and retry.'
      );
    } finally {
      setSaving(false);
    }
  };

  const moodStyle = MOOD_COLORS[mood] || MOOD_COLORS['Reflective'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base">
                AI Journal Summary & Mood Insights
              </h3>
              <p className="text-xs text-stone-500">
                Review and customize before saving to your isolated Firestore cloud database
              </p>
            </div>
          </div>
          <button
            id="btn-close-summary-modal"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-stone-900">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" />
              <p className="text-sm font-medium text-stone-700">
                Synthesizing multi-turn conversation and mood intelligence...
              </p>
              <p className="text-xs text-stone-400">
                Identifying key takeaways, sentiment, and constructive insights with Gemini.
              </p>
            </div>
          ) : error && !title ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm space-y-3">
              <div className="flex items-center space-x-2 font-medium">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>Error generating summary</span>
              </div>
              <p className="text-xs">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                }}
                className="px-3 py-1.5 bg-rose-700 text-white rounded-lg text-xs font-medium hover:bg-rose-800"
              >
                Retry Generation
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Journal Entry Title
                </label>
                <input
                  id="input-entry-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-base font-serif font-semibold border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none"
                  placeholder="Title of this reflection..."
                />
              </div>

              {/* Mood & Insight Feature Card */}
              <div className={`p-4 rounded-xl border ${moodStyle.bg} ${moodStyle.border} space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smile className={`w-4 h-4 ${moodStyle.text}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                      Identified Mood & Sentiment
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${moodStyle.bg} ${moodStyle.text} border ${moodStyle.border}`}>
                    {mood} ({moodConfidence}% confidence)
                  </span>
                </div>

                <div className="text-xs text-stone-700 leading-relaxed font-medium">
                  "{positiveInsight}"
                </div>

                {suggestedAction && (
                  <div className="text-xs bg-white/70 p-2.5 rounded-lg border border-stone-200/60 text-stone-700 flex items-start space-x-2">
                    <Zap className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Mindful Suggestion:</strong> {suggestedAction}</span>
                  </div>
                )}

                {/* Theme Tags */}
                {keyThemes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {keyThemes.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 text-[11px] font-medium bg-white px-2 py-0.5 rounded-md border border-stone-200 text-stone-600"
                      >
                        <Tag className="w-2.5 h-2.5 text-stone-400" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Text Area */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Summary
                </label>
                <textarea
                  id="textarea-entry-summary"
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none text-stone-800"
                  placeholder="Journal summary..."
                />
              </div>

              {/* Key Highlights */}
              {keyHighlights.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Key Highlights
                  </label>
                  <ul className="space-y-1.5">
                    {keyHighlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-stone-700 flex items-start space-x-2 bg-stone-50 p-2 rounded-lg border border-stone-200/80"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {actionItems.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Actionable Takeaways
                  </label>
                  <ul className="space-y-1.5">
                    {actionItems.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-stone-700 flex items-start space-x-2 bg-stone-50 p-2 rounded-lg border border-stone-200/80"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            id="btn-cancel-summary"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            Back to Chat
          </button>

          <button
            id="btn-save-firestore"
            onClick={handleSaveToFirestore}
            disabled={loading || saving}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Save to Cloud Firestore</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
