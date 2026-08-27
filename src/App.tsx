import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ChatJournal } from './components/ChatJournal';
import { JournalList } from './components/JournalList';
import { InsightsDashboard } from './components/InsightsDashboard';
import { SecurityBadge } from './components/SecurityBadge';
import { SummaryModal } from './components/SummaryModal';
import { firestoreService } from './services/firestoreService';
import { JournalEntry, ChatMessage, ActiveConversation } from './types';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'journals' | 'insights' | 'security'>('chat');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);

  // Summary Modal state
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryMessages, setSummaryMessages] = useState<ChatMessage[]>([]);

  // Realtime Firestore subscription for user's isolated journal entries
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const unsubscribe = firestoreService.subscribeJournalEntries(user.uid, (updatedEntries) => {
      setEntries(updatedEntries);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenSummary = (messages: ChatMessage[]) => {
    setSummaryMessages(messages);
    setIsSummaryOpen(true);
  };

  const handleSavedSuccess = (newEntry: JournalEntry) => {
    // Switch to journals view so user sees their saved entry immediately
    setActiveTab('journals');
    setActiveConversation(null);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    await firestoreService.deleteJournalEntry(user.uid, id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-stone-800 mx-auto" />
          <p className="text-xs font-medium text-stone-500 font-mono">Initializing Personal Gemini Journal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        journalCount={entries.length}
      />

      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatJournal
            onOpenSummary={handleOpenSummary}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
          />
        )}

        {activeTab === 'journals' && (
          <JournalList
            entries={entries}
            onDeleteEntry={handleDeleteEntry}
            onStartNewChat={() => {
              setActiveConversation(null);
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsDashboard
            entries={entries}
            onStartNewChat={() => {
              setActiveConversation(null);
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'security' && <SecurityBadge />}
      </main>

      {/* Summary & Mood Insight Modal */}
      <SummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        messages={summaryMessages}
        onSavedSuccess={handleSavedSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
