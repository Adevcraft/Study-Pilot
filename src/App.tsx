import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  Cpu,
  FileText,
  Folder,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Bell,
  X,
  TrendingUp,
  User,
  GraduationCap
} from 'lucide-react';

// Import Views
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

// Lazy load non-essential or heavier views to dramatically minimize initial chunk sizes
const Subjects = React.lazy(() => import('./components/Subjects'));
const Assignments = React.lazy(() => import('./components/Assignments'));
const Quizzes = React.lazy(() => import('./components/Quizzes'));
const Exams = React.lazy(() => import('./components/Exams'));
const Timetable = React.lazy(() => import('./components/Timetable'));
const Notes = React.lazy(() => import('./components/Notes'));
const PdfVault = React.lazy(() => import('./components/PdfVault'));
const Analytics = React.lazy(() => import('./components/Analytics'));
const AiPlanner = React.lazy(() => import('./components/AiPlanner'));
const AiTutor = React.lazy(() => import('./components/AiTutor'));
const Settings = React.lazy(() => import('./components/Settings'));

function MainAppLayout() {
  const {
    currentUser,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    theme,
    toggleTheme,
    subjects,
    assignments,
    notes,
    pdfs
  } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar navigation options
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: GraduationCap },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: CheckSquare },
    { id: 'quizzes', label: 'Quizzes', icon: Clock },
    { id: 'exams', label: 'Exams Count', icon: Calendar },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'notes', label: 'Lecture Notes', icon: FileText },
    { id: 'pdfs', label: 'PDF Vault', icon: Folder },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'planner', label: 'AI Study Planner', icon: Sparkles, isAi: true },
    { id: 'tutor', label: 'AI Tutor', icon: Cpu, isAi: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const unreadNotifications = notifications.filter(n => !n.read);

  // Global search compiler memoized to prevent redundant iterations
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: Array<{ id: string; type: string; title: string; subtitle: string; tab: string }> = [];

    // Search Subjects
    subjects.forEach(s => {
      if (s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)) {
        results.push({
          id: s.id,
          type: 'Subject',
          title: s.name,
          subtitle: s.code,
          tab: 'subjects'
        });
      }
    });

    // Search Assignments
    assignments.forEach(a => {
      if (a.title.toLowerCase().includes(query)) {
        const sub = subjects.find(s => s.id === a.subjectId);
        results.push({
          id: a.id,
          type: 'Assignment',
          title: a.title,
          subtitle: `Subject: ${sub?.code || 'Syllabus'} • Due: ${a.dueDate}`,
          tab: 'assignments'
        });
      }
    });

    // Search Notes
    notes.forEach(n => {
      if (n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query)) {
        const sub = subjects.find(s => s.id === n.subjectId);
        results.push({
          id: n.id,
          type: 'Lecture Note',
          title: n.title,
          subtitle: `Subject: ${sub?.code || 'Syllabus'} • Content matching`,
          tab: 'notes'
        });
      }
    });

    // Search PDFs
    pdfs.forEach(p => {
      if (p.name.toLowerCase().includes(query)) {
        const sub = subjects.find(s => s.id === p.subjectId);
        results.push({
          id: p.id,
          type: 'PDF Attachment',
          title: p.name,
          subtitle: `Subject: ${sub?.code || 'Syllabus'} • Vault storage`,
          tab: 'pdfs'
        });
      }
    });

    return results;
  }, [searchQuery, subjects, assignments, notes, pdfs]);

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200 font-sans">
      
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 h-screen sticky top-0">
        {/* Sidebar Logo */}
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            StudyPilot<span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </span>
        </div>

        {/* User Mini profile */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 mx-2 my-2 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{currentUser.name}</span>
            <span className="text-[9px] text-slate-400 block truncate">{currentUser.institution}</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.isAi && (
                  <span className="text-[8px] font-bold uppercase text-white bg-indigo-600 dark:bg-indigo-500 px-1.5 py-0.5 rounded">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Streak card from theme */}
        <div className="p-4 border-t border-slate-150 dark:border-slate-800">
          <div className="bg-indigo-600 dark:bg-indigo-700 rounded-xl p-4 text-white shadow-lg shadow-indigo-600/10 dark:shadow-none">
            <p className="text-[10px] font-semibold opacity-80 uppercase tracking-widest mb-1">Study Streak</p>
            <p className="text-xl font-bold">{currentUser.streak} Days</p>
            <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${Math.min((currentUser.streak / 15) * 100, 100)}%` }}></div>
            </div>
            <p className="text-[9px] mt-1.5 opacity-80">Daily study maintains high GPA</p>
          </div>
        </div>

        {/* Light Dark Mode quick Toggle in Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          <span className="text-[10px] font-semibold text-slate-400">StudyPilot AI</span>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Navigation Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
          {/* Left mobile menu toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Title / Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-400 text-xs text-left w-48 md:w-64 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search everything...</span>
            </button>
          </div>

          {/* Right quick controls */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-colors relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-950 rounded-full animate-pulse" />
                )}
              </button>

              {/* Notifications dropdown menu overlay */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Academic Alert Vault</span>
                    <button onClick={clearAllNotifications} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline">
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationAsRead(n.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                            n.read
                              ? 'bg-slate-50/50 dark:bg-slate-950/10 border-slate-100 dark:border-slate-850 opacity-60'
                              : 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-100/20 dark:border-indigo-900/10'
                          }`}
                        >
                          <h4 className="font-bold text-xs text-slate-850 dark:text-slate-100 mb-0.5">{n.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{n.desc}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-1.5 opacity-20" />
                        <span className="text-xs">No notifications logged.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Streak Counter pill in Header */}
            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/15 py-1 px-3 rounded-full text-xs font-bold select-none">
              <span>🔥 {currentUser.streak} Day streak</span>
            </div>
          </div>
        </header>

        {/* Content Section Wrapper */}
        <main className="p-4 md:p-6 flex-1 max-w-7xl mx-auto w-full">
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-3"></span>
              <span className="text-xs font-semibold">Loading View...</span>
            </div>
          }>
            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
            {activeTab === 'subjects' && <Subjects />}
            {activeTab === 'assignments' && <Assignments />}
            {activeTab === 'quizzes' && <Quizzes />}
            {activeTab === 'exams' && <Exams />}
            {activeTab === 'timetable' && <Timetable />}
            {activeTab === 'notes' && <Notes />}
            {activeTab === 'pdfs' && <PdfVault />}
            {activeTab === 'analytics' && <Analytics />}
            {activeTab === 'planner' && <AiPlanner />}
            {activeTab === 'tutor' && <AiTutor />}
            {activeTab === 'settings' && <Settings />}
          </React.Suspense>
        </main>
      </div>

      {/* Mobile Drawer Slide-in Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs" />
          
          <div className="relative w-64 max-w-xs bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl z-10 border-r border-slate-200 dark:border-slate-800 animate-slide-in">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sidebar Logo */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span className="font-extrabold text-base text-slate-900 dark:text-white">StudyPilot AI</span>
            </div>

            {/* Navigation list */}
            <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/20'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.isAi && (
                      <span className="text-[8px] font-black uppercase text-white bg-indigo-600 px-1 rounded">
                        AI
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Global Search Modal Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/40 backdrop-blur-xs pt-[15vh]">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh] relative">
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Input Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Subjects, Assignments, Notes, PDFs..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {searchQuery.trim() ? (
                searchResults.length > 0 ? (
                  searchResults.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveTab(res.tab);
                        setSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="p-3 bg-slate-50 dark:bg-slate-950/20 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 border border-slate-150 dark:border-slate-850 rounded-xl cursor-pointer text-left transition-colors flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{res.title}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{res.subtitle}</span>
                      </div>
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
                        {res.type}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-2 opacity-25" />
                    <p className="text-xs">No matching academic records found.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-25 text-indigo-500" />
                  <p className="text-xs">Start typing to index subjects, assignments, and notes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppLayout />
    </AppProvider>
  );
}
