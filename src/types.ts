export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
  createdAt: string;
}

export interface Note {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  totalMarks: number;
  obtainedMarks?: number;
}

export interface Quiz {
  id: string;
  subjectId: string;
  title: string;
  date: string;
  totalMarks: number;
  obtainedMarks?: number;
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  date: string;
}

export interface TimetableEntry {
  id: string;
  subjectId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
}

export interface PDFFile {
  id: string;
  subjectId: string;
  name: string;
  size: string;
  uploadDate: string;
  dataUrl?: string; // Legacy
  blob?: Blob;      // Stored in IndexedDB for fast local access
  downloadUrl?: string; // Firebase storage download URL if configured
  email?: string;   // Owner email
}

export interface StudyPlan {
  weeklyPlan: {
    day: string;
    tasks: { subject: string; topic: string; duration: string }[];
  }[];
  dailySchedule: { time: string; activity: string }[];
  revisionPlan: string[];
  timeAllocation: { subject: string; hours: number }[];
}

export interface UserProfile {
  name: string;
  email: string;
  institution: string;
  bio?: string;
  streak: number;
  lastActiveDate?: string;
  theme: 'light' | 'dark';
  uid?: string;
}
