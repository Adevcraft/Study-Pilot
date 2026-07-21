import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, KeyRound, Mail, Sparkles, User, GraduationCap, AlertCircle, CheckCircle2, ChevronLeft, HelpCircle } from 'lucide-react';

type AuthView = 'LOGIN' | 'SIGNUP' | 'FORGOT';

export default function Auth() {
  const { signUp, login, sendResetPassword } = useApp();
  
  const [view, setView] = useState<AuthView>('LOGIN');
  
  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institution, setInstitution] = useState('');
  
  // States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Translate Firebase error codes to clean, friendly text
  const getFriendlyErrorMessage = (err: any) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Try logging in instead.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'Incorrect email address or password. Please double check and try again.';
      case 'auth/user-not-found':
        return 'No account was found matching this email address. Register a free account first!';
      case 'auth/invalid-email':
        return 'Please enter a valid, well-formed email address.';
      case 'auth/weak-password':
        return 'The password is too short. It must contain at least 6 characters.';
      default:
        return err?.message || 'Authentication failed. Please verify your internet connection and try again.';
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Client-side input validations
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please provide an email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g., scholar@university.edu).');
      return;
    }

    if (view === 'FORGOT') {
      setLoading(true);
      try {
        await sendResetPassword(trimmedEmail);
        setSuccess(`Verification mail simulated! We've sent password reset instructions to "${trimmedEmail}".`);
        // Keep email for reference
      } catch (err) {
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    // Passwords check
    if (!password) {
      setError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setError('Security requirement: Password must be at least 6 characters.');
      return;
    }

    if (view === 'SIGNUP') {
      if (!name.trim()) {
        setError('Please enter your full name to set up your profile.');
        return;
      }
      if (!institution.trim()) {
        setError('Please provide your university or college name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password discrepancy: Confirm password does not match your original password.');
        return;
      }

      setLoading(true);
      try {
        await signUp(name.trim(), trimmedEmail, password, institution.trim());
        setSuccess('Registration successful. Welcome to StudyPilot!');
        setPassword('');
        setConfirmPassword('');
      } catch (err) {
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    } else {
      // LOGIN view
      setLoading(true);
      try {
        await login(trimmedEmail, password);
      } catch (err: any) {
        setError(getFriendlyErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
  };

  const prefillDemoCredentials = () => {
    setEmail('student@studypilot.ai');
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      
      {/* Container Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 relative space-y-6">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3.5 border border-indigo-100 dark:border-indigo-900/30 shadow-xs">
            <BookOpen className="w-8 h-8 animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
            StudyPilot <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">AI</span>
          </h1>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {view === 'LOGIN' && 'Sign in to access your intelligent academic workspace'}
            {view === 'SIGNUP' && 'Create your free account to lock in perfect grades'}
            {view === 'FORGOT' && 'Recover access to your academic schedules'}
          </p>
        </div>

        {/* Feedback Alert Banners */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-bold flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-bold flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Form elements */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* 1. View: SIGNUP (Profile Details) */}
          {view === 'SIGNUP' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">University / School</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Stanford University"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Common Field: Email Address */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@studypilot.ai"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans font-semibold"
              />
            </div>
          </div>

          {/* 3. View: LOGIN & SIGNUP (Password Inputs) */}
          {view !== 'FORGOT' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                  {view === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setView('FORGOT');
                        setError('');
                        setSuccess('');
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              {view === 'SIGNUP' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs transition-all duration-150 cursor-pointer shadow-md shadow-indigo-600/15 select-none"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {view === 'LOGIN' && 'Sign In to Dashboard'}
                  {view === 'SIGNUP' && 'Create Free Account'}
                  {view === 'FORGOT' && 'Send Recovery Email'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Account Prefiller */}
        {view === 'LOGIN' && (
          <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/10 rounded-2xl flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Pre-authenticated Demo Account</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                Want to bypass registration? Click <button onClick={prefillDemoCredentials} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">here</button> to instant prefill with <span className="font-semibold text-indigo-500">student@studypilot.ai</span> and <span className="font-semibold text-indigo-500">password123</span>.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Switcher */}
        <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-center items-center gap-1">
          {view === 'FORGOT' ? (
            <button
              onClick={() => {
                setView('LOGIN');
                setError('');
                setSuccess('');
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {view === 'LOGIN' ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => {
                  setView(view === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                  setError('');
                  setSuccess('');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold ml-1.5 cursor-pointer"
              >
                {view === 'LOGIN' ? 'Sign Up Free' : 'Log In'}
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
