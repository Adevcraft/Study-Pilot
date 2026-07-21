import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Subject, Note, Assignment, Quiz, Exam, TimetableEntry, PDFFile, UserProfile, StudyPlan } from '../types';
import { getPDFs, storePDF, deletePDF as idbDeletePDF } from '../lib/indexedDb';
import { authAPI, isFirebaseConfigured, storageAPI, firestoreAPI } from '../lib/firebase';

interface AppContextType {
  currentUser: UserProfile | null;
  subjects: Subject[];
  notes: Note[];
  assignments: Assignment[];
  quizzes: Quiz[];
  exams: Exam[];
  timetable: TimetableEntry[];
  pdfs: PDFFile[];
  notifications: Array<{ id: string; type: string; title: string; desc: string; date: string; read: boolean }>;
  theme: 'light' | 'dark';
  aiPlan: StudyPlan | null;
  aiAdvisorText: string;
  isAiLoading: boolean;
  
  // Auth Functions
  signUp: (name: string, email: string, password: string, institution: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  
  // Subject Functions
  addSubject: (name: string, code: string, color: string) => void;
  editSubject: (id: string, name: string, code: string, color: string) => void;
  deleteSubject: (id: string) => void;
  
  // Note Functions
  addNote: (subjectId: string, title: string, content: string) => void;
  editNote: (id: string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
  
  // Assignment Functions
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  editAssignment: (id: string, assignment: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  
  // Quiz Functions
  addQuiz: (quiz: Omit<Quiz, 'id'>) => void;
  editQuiz: (id: string, quiz: Partial<Quiz>) => void;
  deleteQuiz: (id: string) => void;
  
  // Exam Functions
  addExam: (subjectId: string, title: string, date: string) => void;
  editExam: (id: string, title: string, date: string) => void;
  deleteExam: (id: string) => void;
  
  // Timetable Functions
  addTimetableEntry: (subjectId: string, day: TimetableEntry['day'], startTime: string, endTime: string) => void;
  deleteTimetableEntry: (id: string) => void;
  
  // PDF Vault Functions
  uploadPDF: (subjectId: string, file: File) => Promise<void>;
  deletePDFFile: (id: string) => Promise<void>;
  
  // AI Functions
  generateStudyPlan: (availableHours: number) => Promise<void>;
  getAdvisorReport: () => Promise<void>;
  askAiTutor: (question: string, history: Array<{ role: 'user' | 'assistant'; content: string }>) => Promise<string>;
  
  // Utility Functions
  toggleTheme: () => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  incrementStreak: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; desc: string; date: string; read: boolean }>>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('studypilot_theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return 'light';
  });
  const [aiPlan, setAiPlan] = useState<StudyPlan | null>(null);
  const [aiAdvisorText, setAiAdvisorText] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Prevention of concurrent duplicate requests via synchronous ref guards
  const isPlannerGenerating = useRef(false);
  const isAdvisorGenerating = useRef(false);
  const isTutorGenerating = useRef(false);

  // 1. Initial Load of Auth Session
  useEffect(() => {
    const unsubscribe = authAPI.onAuthStateChanged((user) => {
      if (user) {
        const usersRaw = localStorage.getItem('studypilot_users');
        const users = usersRaw ? JSON.parse(usersRaw) : {};
        let userProfile = users[user.email];
        if (!userProfile) {
          // If no profile exists, create a default one with name
          userProfile = {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            institution: 'Stanford University',
            bio: 'Sophomore Computer Science & Math major. Passionate about AI, algorithms, and coffee.',
            streak: 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
            theme: 'light'
          };
          users[user.email] = userProfile;
          localStorage.setItem('studypilot_users', JSON.stringify(users));
        }
        setCurrentUser({ ...userProfile, uid: user.uid });
        const userTheme = userProfile.theme || 'light';
        setTheme(userTheme);
        localStorage.setItem('studypilot_theme', userTheme);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Load User Specific Data
  useEffect(() => {
    if (!currentUser) {
      setSubjects([]);
      setNotes([]);
      setAssignments([]);
      setQuizzes([]);
      setExams([]);
      setTimetable([]);
      setPdfs([]);
      setAiPlan(null);
      setAiAdvisorText('');
      setReadNotificationIds([]);
      return;
    }

    const email = currentUser.email;
    const s = localStorage.getItem(`${email}_subjects`);
    const n = localStorage.getItem(`${email}_notes`);
    const a = localStorage.getItem(`${email}_assignments`);
    const q = localStorage.getItem(`${email}_quizzes`);
    const ex = localStorage.getItem(`${email}_exams`);
    const t = localStorage.getItem(`${email}_timetable`);
    const plan = localStorage.getItem(`${email}_aiPlan`);
    const advisor = localStorage.getItem(`${email}_aiAdvisor`);

    const savedReadsRaw = localStorage.getItem(`${email}_read_notifications`);
    if (savedReadsRaw) {
      try {
        setReadNotificationIds(JSON.parse(savedReadsRaw));
      } catch (err) {
        setReadNotificationIds([]);
      }
    } else {
      setReadNotificationIds([]);
    }

    // Parse values or populate with initial high-quality sample data if new user
    if (s) {
      setSubjects(JSON.parse(s));
    } else {
      const initialSubjects: Subject[] = [
        { id: 's1', name: 'Computer Science II', code: 'CS 106B', color: '#4F46E5', createdAt: new Date().toISOString() },
        { id: 's2', name: 'Linear Algebra', code: 'MATH 51', color: '#7C3AED', createdAt: new Date().toISOString() },
        { id: 's3', name: 'Web Applications', code: 'CS 142', color: '#06B6D4', createdAt: new Date().toISOString() }
      ];
      setSubjects(initialSubjects);
      localStorage.setItem(`${email}_subjects`, JSON.stringify(initialSubjects));
    }

    if (n) {
      setNotes(JSON.parse(n));
    } else {
      const initialNotes: Note[] = [
        { id: 'n1', subjectId: 's1', title: 'Binary Search Trees & Recursion', content: 'In binary search trees (BST), the left child is smaller than parent, and right child is greater. Recursion depth is key for time complexity: average O(log N), worst case O(N) when tree is skewed.', updatedAt: new Date().toISOString() },
        { id: 'n2', subjectId: 's2', title: 'Eigenvalues and Eigenvectors', content: 'An eigenvector of a square matrix A is a non-zero vector v such that Av = λv, where λ is the eigenvalue. Steps to find them: \n1. Solve det(A - λI) = 0 for λ.\n2. For each λ, solve (A - λI)v = 0.', updatedAt: new Date().toISOString() }
      ];
      setNotes(initialNotes);
      localStorage.setItem(`${email}_notes`, JSON.stringify(initialNotes));
    }

    if (a) {
      setAssignments(JSON.parse(a));
    } else {
      const initialAssignments: Assignment[] = [
        { id: 'a1', subjectId: 's1', title: 'Huffman Encoder Implementation', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], status: 'pending', priority: 'high', totalMarks: 100 },
        { id: 'a2', subjectId: 's2', title: 'Matrix Transformations Worksheet', dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: 'completed', priority: 'medium', totalMarks: 50, obtainedMarks: 46 },
        { id: 'a3', subjectId: 's3', title: 'React SPA Project', dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], status: 'pending', priority: 'high', totalMarks: 100 }
      ];
      setAssignments(initialAssignments);
      localStorage.setItem(`${email}_assignments`, JSON.stringify(initialAssignments));
    }

    if (q) {
      setQuizzes(JSON.parse(q));
    } else {
      const initialQuizzes: Quiz[] = [
        { id: 'q1', subjectId: 's1', title: 'Pointer Basics & Memory Allocation', date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], totalMarks: 10, obtainedMarks: 9 },
        { id: 'q2', subjectId: 's2', title: 'Determinants and Vector Spaces', date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], totalMarks: 20 }
      ];
      setQuizzes(initialQuizzes);
      localStorage.setItem(`${email}_quizzes`, JSON.stringify(initialQuizzes));
    }

    if (ex) {
      setExams(JSON.parse(ex));
    } else {
      const initialExams: Exam[] = [
        { id: 'e1', subjectId: 's1', title: 'Midterm Exam - Algorithms', date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0] },
        { id: 'e2', subjectId: 's2', title: 'Final Comprehensive Exam', date: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0] }
      ];
      setExams(initialExams);
      localStorage.setItem(`${email}_exams`, JSON.stringify(initialExams));
    }

    if (t) {
      setTimetable(JSON.parse(t));
    } else {
      const initialTimetable: TimetableEntry[] = [
        { id: 't1', subjectId: 's1', day: 'Monday', startTime: '09:00', endTime: '10:30' },
        { id: 't2', subjectId: 's1', day: 'Wednesday', startTime: '09:00', endTime: '10:30' },
        { id: 't3', subjectId: 's2', day: 'Tuesday', startTime: '11:00', endTime: '12:30' },
        { id: 't4', subjectId: 's2', day: 'Thursday', startTime: '11:00', endTime: '12:30' },
        { id: 't5', subjectId: 's3', day: 'Monday', startTime: '14:00', endTime: '15:30' },
        { id: 't6', subjectId: 's3', day: 'Wednesday', startTime: '14:00', endTime: '15:30' }
      ];
      setTimetable(initialTimetable);
      localStorage.setItem(`${email}_timetable`, JSON.stringify(initialTimetable));
    }

    if (plan) setAiPlan(JSON.parse(plan));
    if (advisor) setAiAdvisorText(advisor);

    // Load PDF files from Firestore (if configured) or IndexedDB
    if (isFirebaseConfigured) {
      const userId = currentUser.uid || `local_uid_${btoa(email)}`;
      firestoreAPI.getPDFMetadata(userId).then(firestorePdfs => {
        const mapped: PDFFile[] = firestorePdfs.map(p => ({
          id: p.id,
          subjectId: p.subjectId,
          name: p.name,
          size: p.size,
          uploadDate: p.uploadDate,
          downloadUrl: p.downloadUrl,
          email: p.email
        }));
        
        getPDFs().then(localPdfs => {
          const merged = mapped.map(f => {
            const local = localPdfs.find(l => l.id === f.id);
            if (local && local.blob) {
              return { ...f, blob: local.blob };
            }
            return f;
          });
          setPdfs(merged);
        }).catch(() => {
          setPdfs(mapped);
        });
      }).catch(err => {
        console.error('Failed to load PDFs from Firestore, loading from IndexedDB:', err);
        getPDFs().then(loadedPdfs => {
          setPdfs(loadedPdfs.filter(pdf => pdf.email === email || !pdf.email));
        });
      });
    } else {
      getPDFs().then(loadedPdfs => {
        setPdfs(loadedPdfs.filter(pdf => pdf.email === email || !pdf.email));
      });
    }

    // Handle Streaks
    const todayStr = new Date().toISOString().split('T')[0];
    const lastActive = currentUser.lastActiveDate;
    if (lastActive && lastActive !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = currentUser.streak;
      if (lastActive === yesterdayStr) {
        // Logged in on consecutive days - increment streak
        newStreak = currentUser.streak + 1;
      } else {
        // Missed a day - reset streak to 1
        newStreak = 1;
      }
      
      const updatedUser = { ...currentUser, streak: newStreak, lastActiveDate: todayStr };
      setCurrentUser(updatedUser);
      const usersRaw = localStorage.getItem('studypilot_users');
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      users[email] = updatedUser;
      localStorage.setItem('studypilot_users', JSON.stringify(users));
    }

  }, [currentUser?.email]);

  // 3. Save Data helper
  const saveData = (key: string, data: any) => {
    if (!currentUser) return;
    localStorage.setItem(`${currentUser.email}_${key}`, JSON.stringify(data));
  };

  // 4. Generate Smart Notifications Dynamically
  useEffect(() => {
    if (!currentUser || subjects.length === 0) return;

    const notesList: Array<{ id: string; type: string; title: string; desc: string; date: string; read: boolean }> = [];
    
    // Helper to get local YYYY-MM-DD date string safely without timezone shifting issues
    const getLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = getLocalDateStr(tomorrow);

    // Assignment Due Tomorrow
    assignments.forEach(a => {
      if (a.dueDate === tomorrowStr && a.status === 'pending') {
        const notifId = `notif_a_${a.id}`;
        notesList.push({
          id: notifId,
          type: 'assignment',
          title: '📌 Assignment Due Tomorrow',
          desc: `Your assignment '${a.title}' is due tomorrow. Complete it before the deadline.`,
          date: new Date().toISOString(),
          read: readNotificationIds.includes(notifId)
        });
      }
    });

    // Quiz Tomorrow
    quizzes.forEach(q => {
      if (q.date === tomorrowStr) {
        const notifId = `notif_q_${q.id}`;
        notesList.push({
          id: notifId,
          type: 'quiz',
          title: '📝 Quiz Tomorrow',
          desc: `Your quiz '${q.title}' is scheduled for tomorrow. Start revising now.`,
          date: new Date().toISOString(),
          read: readNotificationIds.includes(notifId)
        });
      }
    });

    // Exam Tomorrow
    exams.forEach(e => {
      if (e.date === tomorrowStr) {
        const notifId = `notif_e_tmrw_${e.id}`;
        notesList.push({
          id: notifId,
          type: 'exam',
          title: '📚 Exam Tomorrow',
          desc: `Your exam '${e.title}' is tomorrow. Best of luck!`,
          date: new Date().toISOString(),
          read: readNotificationIds.includes(notifId)
        });
      }
    });

    // Exam countdown within 3 days (but not tomorrow)
    exams.forEach(e => {
      if (e.date !== tomorrowStr) {
        const diffTime = new Date(e.date).getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 3) {
          const sub = subjects.find(s => s.id === e.subjectId);
          const notifId = `notif_e_${e.id}`;
          notesList.push({
            id: notifId,
            type: 'exam',
            title: 'Upcoming Exam Alert! 🚨',
            desc: `"${e.title}" for ${sub?.name || 'Subject'} is in ${diffDays} days! Start revising.`,
            date: new Date().toISOString(),
            read: readNotificationIds.includes(notifId)
          });
        }
      }
    });

    // Study Streak reminder
    if (currentUser.streak > 0) {
      const notifId = 'notif_streak';
      notesList.push({
        id: notifId,
        type: 'streak',
        title: `🔥 Awesome ${currentUser.streak}-Day Streak!`,
        desc: 'Log in today, read a note, or complete an assignment to keep your study streak alive!',
        date: new Date().toISOString(),
        read: readNotificationIds.includes(notifId)
      });
    }

    setNotifications(notesList);
  }, [assignments, quizzes, exams, subjects, currentUser?.streak, readNotificationIds]);

  // Auth Functions
  const signUp = async (name: string, email: string, password: string, institution: string) => {
    const user = await authAPI.registerUser(email, password, name);
    if (user) {
      const usersRaw = localStorage.getItem('studypilot_users');
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      const userProfile: UserProfile = {
        name: name.trim(),
        email: user.email,
        institution: institution.trim() || 'Stanford University',
        bio: 'StudyPilot AI Scholar',
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        theme: 'light'
      };
      users[user.email] = userProfile;
      localStorage.setItem('studypilot_users', JSON.stringify(users));
      // Do not set current user as unverified users are logged out immediately and redirected to the login view.
    }
  };

  const login = async (email: string, password: string) => {
    const user = await authAPI.loginUser(email, password);
    if (user) {
      const usersRaw = localStorage.getItem('studypilot_users');
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      let userProfile = users[user.email];
      if (!userProfile) {
        userProfile = {
          name: user.displayName || user.email.split('@')[0],
          email: user.email,
          institution: 'Stanford University',
          bio: 'Sophomore Computer Science & Math major. Passionate about AI, algorithms, and coffee.',
          streak: 1,
          lastActiveDate: new Date().toISOString().split('T')[0],
          theme: 'light'
        };
        users[user.email] = userProfile;
        localStorage.setItem('studypilot_users', JSON.stringify(users));
      }
      setCurrentUser(userProfile);
    }
  };

  const logout = async () => {
    await authAPI.logoutUser();
    setCurrentUser(null);
  };

  const sendResetPassword = async (email: string) => {
    await authAPI.forgotPassword(email);
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    if (!currentUser) return;
    const email = currentUser.email;
    const updated = { ...currentUser, ...profile };
    setCurrentUser(updated);

    const usersRaw = localStorage.getItem('studypilot_users');
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    users[email] = updated;
    localStorage.setItem('studypilot_users', JSON.stringify(users));
  };

  const incrementStreak = () => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastActive = currentUser.lastActiveDate;
    
    if (lastActive !== todayStr) {
      const newStreak = currentUser.streak + 1;
      updateProfile({ streak: newStreak, lastActiveDate: todayStr });
    }
  };

  // Subject Functions
  const addSubject = (name: string, code: string, color: string) => {
    const newSub: Subject = {
      id: 'sub_' + Math.random().toString(36).substr(2, 9),
      name,
      code,
      color,
      createdAt: new Date().toISOString()
    };
    const updated = [...subjects, newSub];
    setSubjects(updated);
    saveData('subjects', updated);
    incrementStreak();
  };

  const editSubject = (id: string, name: string, code: string, color: string) => {
    const updated = subjects.map(s => s.id === id ? { ...s, name, code, color } : s);
    setSubjects(updated);
    saveData('subjects', updated);
  };

  const deleteSubject = (id: string) => {
    const updated = subjects.filter(s => s.id !== id);
    setSubjects(updated);
    saveData('subjects', updated);
    
    // Clean up associated entities
    const updatedNotes = notes.filter(n => n.subjectId !== id);
    setNotes(updatedNotes);
    saveData('notes', updatedNotes);

    const updatedAssignments = assignments.filter(a => a.subjectId !== id);
    setAssignments(updatedAssignments);
    saveData('assignments', updatedAssignments);

    const updatedQuizzes = quizzes.filter(q => q.subjectId !== id);
    setQuizzes(updatedQuizzes);
    saveData('quizzes', updatedQuizzes);

    const updatedExams = exams.filter(e => e.subjectId !== id);
    setExams(updatedExams);
    saveData('exams', updatedExams);

    const updatedTimetable = timetable.filter(t => t.subjectId !== id);
    setTimetable(updatedTimetable);
    saveData('timetable', updatedTimetable);
  };

  // Note Functions
  const addNote = (subjectId: string, title: string, content: string) => {
    const newNote: Note = {
      id: 'note_' + Math.random().toString(36).substr(2, 9),
      subjectId,
      title,
      content,
      updatedAt: new Date().toISOString()
    };
    const updated = [...notes, newNote];
    setNotes(updated);
    saveData('notes', updated);
    incrementStreak();
  };

  const editNote = (id: string, title: string, content: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, title, content, updatedAt: new Date().toISOString() } : n);
    setNotes(updated);
    saveData('notes', updated);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveData('notes', updated);
  };

  // Assignment Functions
  const addAssignment = (assignment: Omit<Assignment, 'id'>) => {
    const newAsg: Assignment = {
      ...assignment,
      id: 'asg_' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [...assignments, newAsg];
    setAssignments(updated);
    saveData('assignments', updated);
    incrementStreak();
  };

  const editAssignment = (id: string, updatedFields: Partial<Assignment>) => {
    const updated = assignments.map(a => a.id === id ? { ...a, ...updatedFields } : a);
    setAssignments(updated);
    saveData('assignments', updated);
  };

  const deleteAssignment = (id: string) => {
    const updated = assignments.filter(a => a.id !== id);
    setAssignments(updated);
    saveData('assignments', updated);
  };

  // Quiz Functions
  const addQuiz = (quiz: Omit<Quiz, 'id'>) => {
    const newQuiz: Quiz = {
      ...quiz,
      id: 'quiz_' + Math.random().toString(36).substr(2, 9)
    };
    const updated = [...quizzes, newQuiz];
    setQuizzes(updated);
    saveData('quizzes', updated);
    incrementStreak();
  };

  const editQuiz = (id: string, updatedFields: Partial<Quiz>) => {
    const updated = quizzes.map(q => q.id === id ? { ...q, ...updatedFields } : q);
    setQuizzes(updated);
    saveData('quizzes', updated);
  };

  const deleteQuiz = (id: string) => {
    const updated = quizzes.filter(q => q.id !== id);
    setQuizzes(updated);
    saveData('quizzes', updated);
  };

  // Exam Functions
  const addExam = (subjectId: string, title: string, date: string) => {
    const newExam: Exam = {
      id: 'exam_' + Math.random().toString(36).substr(2, 9),
      subjectId,
      title,
      date
    };
    const updated = [...exams, newExam];
    setExams(updated);
    saveData('exams', updated);
  };

  const editExam = (id: string, title: string, date: string) => {
    const updated = exams.map(e => e.id === id ? { ...e, title, date } : e);
    setExams(updated);
    saveData('exams', updated);
  };

  const deleteExam = (id: string) => {
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    saveData('exams', updated);
  };

  // Timetable Functions
  const addTimetableEntry = (subjectId: string, day: TimetableEntry['day'], startTime: string, endTime: string) => {
    const newEntry: TimetableEntry = {
      id: 'time_' + Math.random().toString(36).substr(2, 9),
      subjectId,
      day,
      startTime,
      endTime
    };
    const updated = [...timetable, newEntry];
    setTimetable(updated);
    saveData('timetable', updated);
  };

  const deleteTimetableEntry = (id: string) => {
    const updated = timetable.filter(t => t.id !== id);
    setTimetable(updated);
    saveData('timetable', updated);
  };

  // PDF Vault Functions
  const uploadPDF = async (subjectId: string, file: File) => {
    if (!currentUser) return;

    // Validate that the selected file is a PDF
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Invalid file format. Only PDF files are accepted.');
    }

    const pdfId = 'pdf_' + Math.random().toString(36).substring(2, 11);
    const pdfSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    const uploadDate = new Date().toISOString().split('T')[0];

    let downloadUrl: string | undefined = undefined;

    // Store the PDF safely (Firebase Storage and Firestore if configured, otherwise local storage for development)
    if (isFirebaseConfigured) {
      try {
        const path = `pdfs/${currentUser.email}/${pdfId}_${file.name}`;
        const url = await storageAPI.uploadPDF(path, file);
        if (url) {
          downloadUrl = url;
          // Save metadata in Firestore
          const userId = currentUser.uid || `local_uid_${btoa(currentUser.email)}`;
          await firestoreAPI.savePDFMetadata(pdfId, {
            name: file.name,
            uploadDate,
            downloadUrl: url,
            size: pdfSize,
            userId,
            email: currentUser.email,
            subjectId
          });
        }
      } catch (err) {
        console.error('Firebase storage/firestore upload failed, falling back to local database...', err);
      }
    }

    const newPdf: PDFFile = {
      id: pdfId,
      subjectId,
      name: file.name,
      size: pdfSize,
      uploadDate,
      downloadUrl,
      blob: file, // Store the raw File/Blob in IndexedDB
      email: currentUser.email
    };

    // Store in IndexedDB
    await storePDF(newPdf);

    // Update local state list
    setPdfs((prev) => [...prev, newPdf]);
    incrementStreak();
  };

  const deletePDFFile = async (id: string) => {
    // Find the PDF file
    const targetPdf = pdfs.find(p => p.id === id);
    if (targetPdf && currentUser) {
      if (isFirebaseConfigured) {
        try {
          if (targetPdf.downloadUrl) {
            const path = `pdfs/${currentUser.email}/${id}_${targetPdf.name}`;
            await storageAPI.deletePDF(path);
          }
          await firestoreAPI.deletePDFMetadata(id);
        } catch (err) {
          console.error('Failed to delete file from Firebase Storage/Firestore:', err);
        }
      }
    }

    await idbDeletePDF(id);
    setPdfs((prev) => prev.filter(p => p.id !== id));
  };

  // AI Functions using our full-stack server proxy endpoints
  const generateStudyPlan = async (availableHours: number) => {
    if (!currentUser) return;
    if (isPlannerGenerating.current) {
      console.warn("Study plan generation is already in progress. Ignoring duplicate call.");
      return;
    }
    isPlannerGenerating.current = true;
    setIsAiLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const subNames = subjects.map(s => s.name);
      const examDates = exams.reduce((acc, curr) => {
        const sub = subjects.find(s => s.id === curr.subjectId);
        acc[sub?.name || curr.subjectId] = curr.date;
        return acc;
      }, {} as { [key: string]: string });

      const res = await fetch('/api/gemini/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: subNames,
          examDates: examDates,
          availableHours
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMsg = `Server returned status ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      setAiPlan(data);
      saveData('aiPlan', data);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Failed to generate study plan:', err);
      throw err;
    } finally {
      isPlannerGenerating.current = false;
      setIsAiLoading(false);
    }
  };

  const getAdvisorReport = async () => {
    if (!currentUser) return;
    if (isAdvisorGenerating.current) {
      console.warn("Advisor report generation is already in progress. Ignoring duplicate call.");
      return;
    }
    isAdvisorGenerating.current = true;
    setIsAiLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const activeSubjects = subjects.map(s => ({ id: s.id, name: s.name, code: s.code }));
      const activeAssignments = assignments.map(a => ({
        subjectId: a.subjectId,
        title: a.title,
        dueDate: a.dueDate,
        status: a.status,
        priority: a.priority,
        totalMarks: a.totalMarks,
        obtainedMarks: a.obtainedMarks
      }));
      const activeQuizzes = quizzes.map(q => ({
        subjectId: q.subjectId,
        title: q.title,
        date: q.date,
        totalMarks: q.totalMarks,
        obtainedMarks: q.obtainedMarks
      }));
      const activeExams = exams.map(e => ({
        subjectId: e.subjectId,
        title: e.title,
        date: e.date
      }));
      const activeTimetable = timetable.map(t => ({
        subjectId: t.subjectId,
        day: t.day,
        startTime: t.startTime,
        endTime: t.endTime
      }));

      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: activeSubjects,
          assignments: activeAssignments,
          quizzes: activeQuizzes,
          exams: activeExams,
          schedule: activeTimetable
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMsg = `Server returned status ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      setAiAdvisorText(data.advice);
      saveData('aiAdvisor', data.advice);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Failed to fetch advisor report:', err);
      setAiAdvisorText(`### Advisor Generation Error ⚠️\n\nFailed to compile advisor report. Reason:\n> ${err.message || 'Unknown network error'}\n\nPlease verify your connection and check your GEMINI_API_KEY settings.`);
    } finally {
      isAdvisorGenerating.current = false;
      setIsAiLoading(false);
    }
  };

  const askAiTutor = async (question: string, history: Array<{ role: 'user' | 'assistant'; content: string }>) => {
    if (isTutorGenerating.current) {
      return "An AI request is currently in progress. Please wait for the current response to complete before submitting another query!";
    }
    isTutorGenerating.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch('/api/gemini/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMsg = `Server returned status ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      return data.text;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Failed to call AI Tutor:', err);
      
      if (err.name === 'AbortError') {
        return "I am sorry, but the request timed out (taking longer than 35s). Please try asking again.";
      }
      return `Error: ${err.message || 'I am sorry, but I am having trouble connecting to my neural core right now. Please try again in a moment!'}`;
    } finally {
      isTutorGenerating.current = false;
    }
  };

  // Utility Functions
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('studypilot_theme', newTheme);
    updateProfile({ theme: newTheme });
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    // Synchronize initial class on document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const markNotificationAsRead = (id: string) => {
    if (!currentUser) return;
    const key = `${currentUser.email}_read_notifications`;
    const savedReadsRaw = localStorage.getItem(key);
    const savedReads = savedReadsRaw ? JSON.parse(savedReadsRaw) : [];
    if (!savedReads.includes(id)) {
      savedReads.push(id);
      localStorage.setItem(key, JSON.stringify(savedReads));
    }
    setReadNotificationIds(savedReads);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    if (!currentUser) return;
    const key = `${currentUser.email}_read_notifications`;
    const savedReadsRaw = localStorage.getItem(key);
    const savedReads = savedReadsRaw ? JSON.parse(savedReadsRaw) : [];
    notifications.forEach(n => {
      if (!savedReads.includes(n.id)) {
        savedReads.push(n.id);
      }
    });
    localStorage.setItem(key, JSON.stringify(savedReads));
    setReadNotificationIds(savedReads);
    setNotifications([]);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      subjects,
      notes,
      assignments,
      quizzes,
      exams,
      timetable,
      pdfs,
      notifications,
      theme,
      aiPlan,
      aiAdvisorText,
      isAiLoading,
      signUp,
      login,
      logout,
      sendResetPassword,
      updateProfile,
      addSubject,
      editSubject,
      deleteSubject,
      addNote,
      editNote,
      deleteNote,
      addAssignment,
      editAssignment,
      deleteAssignment,
      addQuiz,
      editQuiz,
      deleteQuiz,
      addExam,
      editExam,
      deleteExam,
      addTimetableEntry,
      deleteTimetableEntry,
      uploadPDF,
      deletePDFFile,
      generateStudyPlan,
      getAdvisorReport,
      askAiTutor,
      toggleTheme,
      markNotificationAsRead,
      clearAllNotifications,
      incrementStreak
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
