import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Shield, Lock, CheckCircle2, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInAsGuest();
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-stone-900 text-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Personal Gemini Journal</h1>
          <p className="text-sm text-stone-500 mt-1">
            Private, AI-powered journaling & mindful reflections with isolated cloud storage
          </p>
        </div>

        {/* Security Trust Indicators */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-6">
          <div className="flex items-center space-x-2 text-xs font-semibold text-stone-800 mb-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero-Trust Privacy & Data Isolation</span>
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            Your journals and conversations are strictly isolated under your unique user ID with Cloud Firestore security rules.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={clearError} className="text-rose-500 hover:text-rose-700 font-bold ml-2">×</button>
          </div>
        )}

        {/* Google One-Click Sign In */}
        <button
          id="btn-google-signin"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors text-sm font-medium text-stone-700 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-stone-400">or with email</span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Your Name</label>
              <input
                id="input-signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mindful Explorer"
                className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Email Address</label>
            <input
              id="input-auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Password</label>
            <input
              id="input-auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{mode === 'login' ? 'Sign In to Journal' : 'Create Free Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Mode & Guest Access */}
        <div className="mt-6 text-center space-y-3">
          <button
            id="btn-toggle-auth-mode"
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              clearError();
            }}
            className="text-xs text-stone-600 hover:text-stone-900 underline"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>

          <div className="pt-2 border-t border-stone-100">
            <button
              id="btn-guest-signin"
              type="button"
              onClick={handleGuestSignIn}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 text-xs text-stone-500 hover:text-stone-800 py-1 px-3 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Explore as Guest (Anonymous Sandbox)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
