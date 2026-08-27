import React, { useState } from 'react';
import { JournalEntry, MoodType } from '../types';
import {
  Search,
  Calendar,
  Tag,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Smile,
  Zap,
  Check,
  ArrowRight,
  Sparkles,
  BookOpen,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface JournalListProps {
  entries: JournalEntry[];
  onDeleteEntry: (id: string) => Promise<void>;
  onStartNewChat: () => void;
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

export const JournalList: React.FC<JournalListProps> = ({
  entries,
  onDeleteEntry,
  onStartNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.keyThemes.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood =
      selectedMoodFilter === 'all' || entry.mood.toLowerCase() === selectedMoodFilter.toLowerCase();

    return matchesSearch && matchesMood;
  });

  const uniqueMoods = Array.from(new Set(entries.map((e) => e.mood)));

  const handleExport = (entry: JournalEntry) => {
    const transcript = entry.messages
      ? entry.messages.map((m) => `**${m.role === 'user' ? 'User' : 'Gemini'}**: ${m.content}`).join('\n\n')
      : '';

    const content = `# ${entry.title}
*Date: ${new Date(entry.createdAt).toLocaleDateString()} | Mood: ${entry.mood} (${entry.moodConfidence}%)*

## Summary
${entry.summary}

## Key Highlights
${entry.keyHighlights.map((h) => `- ${h}`).join('\n')}

## Actionable Takeaways
${entry.actionItems.map((a) => `- ${a}`).join('\n')}

## Positive Insight
> "${entry.positiveInsight}"
${entry.suggestedAction ? `\n**Mindful Suggestion**: ${entry.suggestedAction}` : ''}

---
## Full Conversation Transcript
${transcript}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/\s+/g, '_').toLowerCase()}_${new Date(entry.createdAt).toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this journal entry from Firestore?')) {
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteEntry(id);
    } catch (err) {
      alert('Failed to delete entry. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header with Search and Mood filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-serif font-bold text-stone-900">Saved Journal Entries</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Your encrypted, isolated personal archives in Cloud Firestore ({entries.length} total entries)
          </p>
        </div>

        <button
          id="btn-new-entry-from-list"
          onClick={onStartNewChat}
          className="flex items-center space-x-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>New Journal Reflection</span>
        </button>
      </div>

      {/* Search & Mood Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-journals"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, titles, or theme tags..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-stone-900 focus:outline-none"
          />
        </div>

        {uniqueMoods.length > 0 && (
          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedMoodFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedMoodFilter === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              All Moods
            </button>
            {uniqueMoods.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMoodFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedMoodFilter === m
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-stone-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-stone-900 text-base mb-1">
            {entries.length === 0 ? 'No journal entries yet' : 'No matching entries found'}
          </h3>
          <p className="text-xs text-stone-500 mb-5">
            {entries.length === 0
              ? 'Start a reflective chat with Gemini and save your thoughts to build your mindful journal history.'
              : 'Try adjusting your search query or mood filter to locate past journals.'}
          </p>
          {entries.length === 0 && (
            <button
              onClick={onStartNewChat}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-stone-800"
            >
              Start First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const moodStyle = MOOD_COLORS[entry.mood] || MOOD_COLORS['Reflective'];

            return (
              <div
                key={entry.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs hover:border-stone-300 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${moodStyle.bg} ${moodStyle.text} border ${moodStyle.border}`}
                    >
                      {entry.mood}
                    </span>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      {entry.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-stone-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Summary snippet */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-4">
                  {entry.summary}
                </p>

                {/* Positive Insight Banner */}
                <div className={`p-3 rounded-xl border ${moodStyle.bg} ${moodStyle.border} mb-4 text-xs`}>
                  <div className="flex items-start space-x-2">
                    <Smile className={`w-3.5 h-3.5 ${moodStyle.text} mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className="font-medium text-stone-800 italic">"{entry.positiveInsight}"</p>
                      {entry.suggestedAction && (
                        <p className="text-stone-600 mt-1 text-[11px]">
                          <strong>Mindful note:</strong> {entry.suggestedAction}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key themes */}
                {entry.keyThemes && entry.keyThemes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {entry.keyThemes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium"
                      >
                        <Tag className="w-2.5 h-2.5 text-stone-400" />
                        <span>{theme}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded Details: Highlights, Action items, and Chat transcript */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-stone-100 space-y-4 animate-in fade-in duration-150">
                    {/* Highlights */}
                    {entry.keyHighlights && entry.keyHighlights.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
                          Key Highlights
                        </h4>
                        <ul className="space-y-1.5">
                          {entry.keyHighlights.map((h, i) => (
                            <li
                              key={i}
                              className="text-xs text-stone-700 flex items-start space-x-2 bg-stone-50 p-2 rounded-lg"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Items */}
                    {entry.actionItems && entry.actionItems.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2">
                          Action Items & Takeaways
                        </h4>
                        <ul className="space-y-1.5">
                          {entry.actionItems.map((a, i) => (
                            <li
                              key={i}
                              className="text-xs text-stone-700 flex items-start space-x-2 bg-stone-50 p-2 rounded-lg"
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Full Transcript */}
                    {entry.messages && entry.messages.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
                          <span>Original Conversation Session ({entry.messages.length} messages)</span>
                        </h4>
                        <div className="space-y-2.5 max-h-80 overflow-y-auto p-3 bg-stone-50 rounded-xl border border-stone-200/70">
                          {entry.messages.map((msg, i) => (
                            <div
                              key={i}
                              className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-stone-900 text-white ml-6'
                                  : 'bg-white text-stone-800 border border-stone-200 mr-6'
                              }`}
                            >
                              <div className="font-semibold text-[10px] uppercase mb-1 opacity-75">
                                {msg.role === 'user' ? 'You' : 'Gemini Companion'}
                              </div>
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Action Controls */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-100">
                  <button
                    id={`btn-toggle-expand-${entry.id}`}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="flex items-center space-x-1 text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <span>Hide Full Details</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>View Conversation & Highlights</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      id={`btn-export-${entry.id}`}
                      onClick={() => handleExport(entry)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg text-xs font-medium flex items-center space-x-1"
                      title="Export to Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Export</span>
                    </button>

                    <button
                      id={`btn-delete-${entry.id}`}
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete from Firestore"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
