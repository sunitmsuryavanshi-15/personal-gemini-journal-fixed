import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { geminiApi } from '../services/api';
import { firestoreService } from '../services/firestoreService';
import { ChatMessage, JournalSummary, ActiveConversation } from '../types';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  RotateCcw,
  BookOpenCheck,
  Lightbulb,
  HeartHandshake,
  Compass,
  Flame,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';

interface ChatJournalProps {
  onOpenSummary: (messages: ChatMessage[]) => void;
  activeConversation: ActiveConversation | null;
  setActiveConversation: (conv: ActiveConversation | null) => void;
}

const STARTER_PROMPTS = [
  {
    title: 'Daily Reflection',
    prompt: 'How did today feel overall? What was a high point and a low point?',
    icon: Compass,
  },
  {
    title: 'Gratitude & Wins',
    prompt: "I'd like to reflect on 3 specific things I am grateful for today and why they mattered.",
    icon: HeartHandshake,
  },
  {
    title: 'Working Through a Dilemma',
    prompt: "I'm feeling stuck on a decision or challenge. Can you help me unpack it step-by-step?",
    icon: Lightbulb,
  },
  {
    title: 'Energy & Mindset Reset',
    prompt: 'I want to check in on my mental energy, celebrate small wins, and set a calm intention for tomorrow.',
    icon: Flame,
  },
];

export const ChatJournal: React.FC<ChatJournalProps> = ({
  onOpenSummary,
  activeConversation,
  setActiveConversation,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(
    activeConversation ? activeConversation.messages : []
  );
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync state if active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
    }
  }, [activeConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-save active draft to Firestore
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const convId = activeConversation?.id || `conv_${Date.now()}`;
    const title = activeConversation?.title || messages[0]?.content.slice(0, 40) + '...';

    const convData: ActiveConversation = {
      id: convId,
      title,
      messages,
      lastUpdated: new Date().toISOString(),
    };

    if (!activeConversation) {
      setActiveConversation(convData);
    }

    firestoreService.saveConversation(user.uid, convData).catch((err) => {
      console.warn('Draft autosave warning:', err);
    });
  }, [messages, user]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await geminiApi.sendMessage(updatedHistory);
      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        role: 'model',
        content: response.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages([...updatedHistory, botMessage]);
      setModelUsed(response.modelUsed);
    } catch (error: any) {
      console.error('Chat error:', error);
      setErrorMessage(error?.message || 'Failed to receive response from Gemini Companion. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    if (messages.length > 0 && confirm('Start a fresh journal conversation? Your saved entries remain intact.')) {
      setMessages([]);
      setActiveConversation(null);
      setErrorMessage(null);
    }
  };

  const handleTriggerSummary = () => {
    if (messages.length === 0) return;
    onOpenSummary(messages);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 py-4 sm:py-6">
      {/* Top Session Control Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-sm font-semibold text-stone-900">
            Interactive Journal Session
          </h2>
          {modelUsed && (
            <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
              via {modelUsed}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <>
              <button
                id="btn-new-chat-session"
                onClick={handleNewConversation}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                title="Start New Reflection"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Session</span>
              </button>

              <button
                id="btn-generate-summary-top"
                onClick={handleTriggerSummary}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
              >
                <BookOpenCheck className="w-3.5 h-3.5" />
                <span>Save & Summarize Journal</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Scrollable Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mb-4 shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 mb-2">
              What is on your mind today?
            </h3>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              Explore your thoughts, emotions, and breakthroughs in an open conversational dialogue with your private Gemini Journal companion.
            </p>

            {/* Starter Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {STARTER_PROMPTS.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={idx}
                    id={`btn-starter-prompt-${idx}`}
                    onClick={() => handleSendMessage(prompt.prompt)}
                    className="p-3.5 bg-white border border-stone-200 hover:border-stone-400 hover:bg-stone-50 rounded-xl text-left transition-all group shadow-2xs"
                  >
                    <div className="flex items-center space-x-2 text-stone-900 font-medium text-xs mb-1">
                      <Icon className="w-3.5 h-3.5 text-amber-700 group-hover:scale-110 transition-transform" />
                      <span>{prompt.title}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2">{prompt.prompt}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-white'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-stone-100 rounded-tr-none shadow-xs'
                    : 'bg-white text-stone-900 border border-stone-200 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`text-[10px] mt-2 flex items-center justify-end space-x-1 ${
                    msg.role === 'user' ? 'text-stone-400' : 'text-stone-400'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-amber-700" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-none p-4 shadow-xs">
              <div className="flex items-center space-x-2 text-xs text-stone-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reflecting and organizing thoughts...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="text-xs font-semibold underline ml-3"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-2">
        {messages.length >= 2 && (
          <div className="mb-2 flex items-center justify-between bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-2 text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Ready to convert this session into a permanent journal entry?</span>
            </div>
            <button
              id="btn-summarize-banner"
              onClick={handleTriggerSummary}
              className="font-medium text-amber-900 underline hover:text-amber-950 ml-2"
            >
              Generate Summary & Mood
            </button>
          </div>
        )}

        <div className="relative bg-white border border-stone-300 rounded-2xl focus-within:ring-2 focus-within:ring-stone-900 focus-within:border-transparent shadow-xs">
          <textarea
            id="input-journal-chat"
            ref={textareaRef}
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reflection, thoughts, or questions (Shift + Enter for new line)..."
            disabled={isLoading}
            className="w-full px-4 pt-3 pb-10 text-sm focus:outline-none resize-none disabled:bg-stone-50 rounded-2xl text-stone-900"
          />

          <div className="absolute right-2 bottom-2 flex items-center space-x-2">
            <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
              {inputText.length} chars
            </span>
            <button
              id="btn-send-message"
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl disabled:opacity-30 transition-colors shadow-xs"
              title="Send Reflection"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
