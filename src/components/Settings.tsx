import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Sun, Moon, Sparkles, LogOut, Check } from 'lucide-react';

export default function Settings() {
  const {
    currentUser,
    updateProfile,
    toggleTheme,
    theme,
    logout
  } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [institution, setInstitution] = useState(currentUser?.institution || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [success, setSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, institution, bio });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure study profile settings, select dark or light UI modes, and switch accounts.</p>
      </div>

      {/* Profile settings card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
          <User className="w-4 h-4 text-indigo-500" />
          <span>Edit Student Profile</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg font-medium flex items-center gap-1.5 animate-fade-in">
              <Check className="w-4 h-4" />
              <span>Academic profile updated successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">University / Institution</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student Bio / Goals</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Junior Computer Science major. Aspiring machine learning research assistant."
              rows={4}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none font-sans leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md shadow-indigo-600/15"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Interface preferences card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
          <Sun className="w-4 h-4 text-indigo-500" />
          <span>Interface Preferences</span>
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">System Theme</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Toggle interface lighting modes securely</span>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 text-slate-500" />
                <span>Switch Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500 animate-spin" />
                <span>Switch Light Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Access panel card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-850">
          <LogOut className="w-4 h-4 text-indigo-500" />
          <span>Access Control</span>
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Logout of Session</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Clears session credentials locally</span>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Logout Session
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-500">
              <LogOut className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Logout of StudyPilot AI?</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to sign out of your current study session? Your local sandbox data remains securely saved.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
