/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';

// Check if Firebase credentials are provided in environment
const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_APP_ID
);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase App if configured
let liveAuth: any = null;
let liveStorage: any = null;
let liveFirestore: any = null;
if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    liveAuth = getAuth(app);
    liveStorage = getStorage(app);
    liveFirestore = getFirestore(app);
    console.log('🔒 Live Firebase Authentication, Storage & Firestore initialized successfully.');
  } catch (err) {
    console.error('⚠️ Failed to initialize live Firebase. Falling back to local Auth Engine:', err);
  }
} else {
  console.log('📂 Local Persistent Auth Engine initialized (add VITE_FIREBASE_API_KEY in secrets to go live!).');
}

export { isFirebaseConfigured };

export const firestoreAPI = {
  async savePDFMetadata(pdfId: string, metadata: { name: string; uploadDate: string; downloadUrl: string; size: string; userId: string; email: string; subjectId: string }) {
    if (liveFirestore) {
      try {
        const docRef = doc(liveFirestore, 'pdfs', pdfId);
        await setDoc(docRef, metadata);
        console.log(`Saved PDF metadata to Firestore: ${pdfId}`);
      } catch (err) {
        console.error('Failed to save PDF metadata to Firestore:', err);
        throw err;
      }
    }
  },
  async deletePDFMetadata(pdfId: string) {
    if (liveFirestore) {
      try {
        const docRef = doc(liveFirestore, 'pdfs', pdfId);
        await deleteDoc(docRef);
        console.log(`Deleted PDF metadata from Firestore: ${pdfId}`);
      } catch (err) {
        console.error('Failed to delete PDF metadata from Firestore:', err);
        throw err;
      }
    }
  },
  async getPDFMetadata(userId: string): Promise<any[]> {
    if (liveFirestore) {
      try {
        const pdfsRef = collection(liveFirestore, 'pdfs');
        const q = query(pdfsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const results: any[] = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });
        return results;
      } catch (err) {
        console.error('Failed to fetch PDF metadata from Firestore:', err);
        return [];
      }
    }
    return [];
  }
};

export const storageAPI = {
  async uploadPDF(path: string, file: File | Blob): Promise<string | null> {
    if (liveStorage) {
      try {
        const fileRef = storageRef(liveStorage, path);
        const snapshot = await uploadBytes(fileRef, file);
        return await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error('Failed to upload file to Firebase Storage:', err);
        throw err;
      }
    }
    return null;
  },
  async deletePDF(path: string): Promise<void> {
    if (liveStorage) {
      try {
        const fileRef = storageRef(liveStorage, path);
        await deleteObject(fileRef);
      } catch (err) {
        console.error('Failed to delete file from Firebase Storage:', err);
      }
    }
  }
};

// Interface for subscriber callback
export type AuthCallbackUser = {
  email: string;
  displayName: string | null;
  uid: string;
} | null;

export type AuthSubscriber = (user: AuthCallbackUser) => void;

// Local simulation state manager
class SimulatedAuthEngine {
  private subscribers: AuthSubscriber[] = [];
  private currentEmailKey = 'studypilot_active_email';
  private accountsKey = 'studypilot_sim_auth_accounts';

  constructor() {
    // Listen for storage events to support multi-tab synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.currentEmailKey) {
          this.notifySubscribers();
        }
      });
    }
  }

  private getAccounts(): Record<string, { name: string; email: string; password?: string }> {
    const data = localStorage.getItem(this.accountsKey);
    if (!data) {
      // Seed default demo student account if not exists
      const demoAccount = {
        'student@studypilot.ai': {
          name: 'Sarah Jenkins',
          email: 'student@studypilot.ai',
          password: 'password123'
        }
      };
      localStorage.setItem(this.accountsKey, JSON.stringify(demoAccount));
      return demoAccount;
    }
    return JSON.parse(data);
  }

  private saveAccounts(accounts: Record<string, { name: string; email: string; password?: string }>) {
    localStorage.setItem(this.accountsKey, JSON.stringify(accounts));
  }

  getCurrentUser(): AuthCallbackUser {
    const activeEmail = localStorage.getItem(this.currentEmailKey);
    if (!activeEmail) return null;

    const accounts = this.getAccounts();
    const account = accounts[activeEmail];
    if (!account) return null;

    return {
      email: account.email,
      displayName: account.name,
      uid: `local_uid_${btoa(account.email)}`
    };
  }

  subscribe(callback: AuthSubscriber): () => void {
    this.subscribers.push(callback);
    // Trigger initial notification immediately
    callback(this.getCurrentUser());
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySubscribers() {
    const user = this.getCurrentUser();
    this.subscribers.forEach(sub => sub(user));
  }

  async register(email: string, name: string, password?: string): Promise<AuthCallbackUser> {
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate latency
    
    const accounts = this.getAccounts();
    const normalizedEmail = email.trim().toLowerCase();

    if (accounts[normalizedEmail]) {
      const err = new Error('The email address is already in use by another account.');
      (err as any).code = 'auth/email-already-in-use';
      throw err;
    }

    accounts[normalizedEmail] = {
      name: name.trim(),
      email: normalizedEmail,
      password: password || 'defaultpassword'
    };

    this.saveAccounts(accounts);
    localStorage.setItem(this.currentEmailKey, normalizedEmail);
    this.notifySubscribers();

    return {
      email: normalizedEmail,
      displayName: name,
      uid: `local_uid_${btoa(normalizedEmail)}`
    };
  }

  async login(email: string, password?: string): Promise<AuthCallbackUser> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency

    const accounts = this.getAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    const account = accounts[normalizedEmail];

    if (!account) {
      const err = new Error('There is no user record corresponding to this identifier. The user may have been deleted.');
      (err as any).code = 'auth/user-not-found';
      throw err;
    }

    if (password && account.password !== password) {
      const err = new Error('The credentials offered are invalid. Wrong password.');
      (err as any).code = 'auth/wrong-password';
      throw err;
    }

    localStorage.setItem(this.currentEmailKey, normalizedEmail);
    this.notifySubscribers();

    return {
      email: account.email,
      displayName: account.name,
      uid: `local_uid_${btoa(account.email)}`
    };
  }

  async logout() {
    localStorage.removeItem(this.currentEmailKey);
    this.notifySubscribers();
  }

  async resetPassword(email: string) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const accounts = this.getAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    if (!accounts[normalizedEmail]) {
      const err = new Error('There is no user record corresponding to this identifier.');
      (err as any).code = 'auth/user-not-found';
      throw err;
    }
    // Simulation successful
    console.log(`📧 Simulated Reset Email sent to: ${normalizedEmail}`);
  }

  async updateDisplayName(name: string) {
    const activeEmail = localStorage.getItem(this.currentEmailKey);
    if (!activeEmail) return;

    const accounts = this.getAccounts();
    const account = accounts[activeEmail];
    if (account) {
      account.name = name.trim();
      this.saveAccounts(accounts);
      this.notifySubscribers();
    }
  }
}

const simAuth = new SimulatedAuthEngine();

// ==========================================
// UNIFIED AUTH API FOR STUDYPILOT APP
// ==========================================

export const authAPI = {
  /**
   * Register a new user with Email and Password
   */
  async registerUser(email: string, password: string, name: string): Promise<AuthCallbackUser> {
    if (liveAuth) {
      // 1. Create firebase user account
      const userCredential = await createUserWithEmailAndPassword(liveAuth, email, password);
      // 2. Update display name profile
      await updateProfile(userCredential.user, { displayName: name });
      return {
        email: userCredential.user.email || email,
        displayName: name,
        uid: userCredential.user.uid
      };
    } else {
      return await simAuth.register(email, name, password);
    }
  },

  /**
   * Login user with Email and Password
   */
  async loginUser(email: string, password: string): Promise<AuthCallbackUser> {
    if (liveAuth) {
      const userCredential = await signInWithEmailAndPassword(liveAuth, email, password);
      const fbUser = userCredential.user;
      return {
        email: fbUser.email || email,
        displayName: fbUser.displayName || email.split('@')[0],
        uid: fbUser.uid
      };
    } else {
      return await simAuth.login(email, password);
    }
  },

  /**
   * Send a verification / password reset link
   */
  async forgotPassword(email: string): Promise<void> {
    if (liveAuth) {
      await sendPasswordResetEmail(liveAuth, email);
    } else {
      await simAuth.resetPassword(email);
    }
  },

  /**
   * Sign out current session
   */
  async logoutUser(): Promise<void> {
    if (liveAuth) {
      await signOut(liveAuth);
    } else {
      await simAuth.logout();
    }
  },

  /**
   * Update authenticated profile's name
   */
  async updateProfileName(name: string): Promise<void> {
    if (liveAuth) {
      if (liveAuth.currentUser) {
         await updateProfile(liveAuth.currentUser, { displayName: name });
      }
    } else {
      await simAuth.updateDisplayName(name);
    }
  },

  /**
   * Listen for user authentication state changes
   */
  onAuthStateChanged(callback: (user: AuthCallbackUser) => void): () => void {
    if (liveAuth) {
      return onAuthStateChanged(liveAuth, (fbUser) => {
        if (fbUser) {
          callback({
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            uid: fbUser.uid
          });
        } else {
          callback(null);
        }
      });
    } else {
      return simAuth.subscribe(callback);
    }
  }
};
