import React from 'react';
import {
  ShieldCheck,
  Lock,
  Server,
  Database,
  KeyRound,
  FileCode2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export const SecurityBadge: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Security Architecture & Threat Modeling
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Production-grade safeguards compliant with OWASP Top 10 Web & LLM Standards
            </p>
          </div>
        </div>
      </div>

      {/* 5 Threat Zones Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Zone 1 */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-stone-900 font-semibold text-xs">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>1. Input Surfaces & Prompt Injection Defense</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Untrusted user messages are treated strictly as data parameters, never executable system instructions. Top-level body limits and schema guards prevent parameter tampering.
          </p>
          <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md inline-block font-mono">
            OWASP LLM01 / LLM02 Mitigated
          </div>
        </div>

        {/* Zone 2 */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-stone-900 font-semibold text-xs">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>2. Isolated Cloud Firestore Rules</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Strict owner-bound path checking ensures users can ONLY read, create, update, or delete records where <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800">request.auth.uid == userId</code>. Zero insecure wildcards.
          </p>
          <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md inline-block font-mono">
            OWASP A01: Broken Access Control Defended
          </div>
        </div>

        {/* Zone 3 */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-stone-900 font-semibold text-xs">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>3. Zero-Knowledge Server-Side Proxy</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            The Gemini API key is NEVER exposed to client browsers. All AI inference is proxied through server-side Express routes backed by Google Cloud Secret Manager.
          </p>
          <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md inline-block font-mono">
            Zero Client-Side Secret Leakage
          </div>
        </div>

        {/* Zone 4 */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-stone-900 font-semibold text-xs">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>4. Model Resilience Fallback Ladder</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Multi-tier automatic fallback ladder across <code className="bg-stone-100 px-1 rounded">gemini-2.5-flash</code>, <code className="bg-stone-100 px-1 rounded">gemini-3.1-flash-lite</code>, and <code className="bg-stone-100 px-1 rounded">gemini-3.7-flash</code> to prevent denial-of-service and rate limit outages.
          </p>
          <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md inline-block font-mono">
            Automated Error Recovery Matrix
          </div>
        </div>
      </div>

      {/* Active Rules Reference */}
      <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300">
            <FileCode2 className="w-4 h-4" />
            <span>Deployed Cloud Firestore Security Rules</span>
          </div>
          <span className="text-[10px] bg-stone-800 text-stone-400 px-2 py-0.5 rounded font-mono">
            firestore.rules
          </span>
        </div>

        <pre className="text-xs font-mono bg-stone-950 p-3.5 rounded-xl text-stone-300 overflow-x-auto leading-relaxed border border-stone-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /conversations/{conversationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
};
