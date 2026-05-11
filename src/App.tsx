import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation } from './components/Navigation';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, deleteField, writeBatch } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from './lib/firebase';
import { UserProfile, Flashcard, Task, StudyLog, ChatMessage, ChatSession, StudyPlan, OperationType, CalendarSticker, SystemConfig, LanguageImmersionData } from './types';
import { cn } from './lib/utils';
import { Loader2, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';

// Screens
import HomeScreen from './screens/HomeScreen';
import AIScreen from './screens/AIScreen';
import FlashcardsScreen from './screens/FlashcardsScreen';
import PlannerScreen from './screens/PlannerScreen';
import ProfileScreen from './screens/ProfileScreen';
import CreatorDashboard from './screens/CreatorDashboard';
import PremiumScreen from './screens/PremiumScreen';

const initialUser: UserProfile = {
  name: 'Cutie',
  bio: 'studying with mochi 🍡',
  pfp: '🐰',
  streak: 0,
  totalHours: 0,
  lastStudyDate: null,
  tasksCompleted: 0,
  flashcardsMastered: 0,
  theme: 'cream',
  soundEnabled: true,
  language: 'English',
  aiVoiceEnabled: true,
  profileFrameId: 'free_1'
};

const CREATOR_EMAILS = ['jeeqlin2013@gmail.com', 'vamprixx55@gmail.com'];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [calendarStickers, setCalendarStickers] = useState<CalendarSticker[]>([]);
  const [languageImmersion, setLanguageImmersion] = useState<LanguageImmersionData>({
    streak: 0,
    lastActive: null,
    vocabulary: [],
    wordsLearnedToday: 0,
    weeklyGoal: 50,
    habitSpeakingActive: false,
    habitListeningSongs: 0,
    habitListeningPodcasts: 0,
    habitReadingPages: 0,
    habitWritingSentences: 0,
    habitJournalDone: false,
    activeGoal: 'read a book in target language 📓',
    unlockedBadges: [],
    totalPreciseHours: 0
  });
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    footerCredits: '˗ˋˏ made by vamprixx ˎˊ˗'
  });
  const [showCreatorDashboard, setShowCreatorDashboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    const checkReminders = () => {
      if (!user.soundEnabled) return;
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      
      tasks.forEach(task => {
        if (task.isReminder && !task.completed && task.reminderTime === currentTime) {
          if (isSameDay(parseISO(task.date), now)) {
            // Play bell sound
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
            
            // Notification
            if (Notification.permission === 'granted') {
              new Notification('Mochi Reminder 🔔', {
                body: `Time for: ${task.text}`,
                icon: 'https://drive.google.com/uc?export=download&id=1QskuwmZXGoTYGqicXnZkj29qjA_hKKg7'
              });
            }
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks, user.soundEnabled]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (user.theme === 'night') {
      root.classList.add('dark');
    }
  }, [user.theme]);

  useEffect(() => {
    // Load local settings as fallback
    const savedLanguage = localStorage.getItem('mochi_language');
    const savedTheme = localStorage.getItem('mochi_theme') as any;
    const savedSound = localStorage.getItem('mochi_sound');
    const savedAiVoice = localStorage.getItem('mochi_ai_voice');
    
    if (savedLanguage || savedTheme || savedSound || savedAiVoice) {
      setUser(prev => ({
        ...prev,
        language: savedLanguage || prev.language,
        theme: savedTheme || prev.theme,
        soundEnabled: savedSound !== 'false',
        aiVoiceEnabled: savedAiVoice !== 'false'
      }));
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        const userPath = `users/${u.uid}`;
        try {
          const userRef = doc(db, 'users', u.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data() as UserProfile;
            const isCreator = CREATOR_EMAILS.includes(u.email || '');
            
            if (isCreator && !userData.isPremium) {
              await setDoc(userRef, { isPremium: true }, { merge: true });
              userData.isPremium = true;
            }
            
            // If the name is still 'Cutie' and we have a Google name, upgrade it
            if (userData.name === 'Cutie' && u.displayName) {
              await updateDoc(userRef, { name: u.displayName });
              userData.name = u.displayName;
            }
            
            setUser({ ...initialUser, ...userData, uid: u.uid, email: u.email || '' } as UserProfile);
          } else {
            const isCreator = CREATOR_EMAILS.includes(u.email || '');
            const newUser = { 
              ...initialUser, 
              name: u.displayName || 'Cutie',
              uid: u.uid, 
              email: u.email || '', 
              isPremium: isCreator 
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }

          // Partitioned Data Sync
          const dataPaths = ['flashcards', 'tasks', 'studyLogs', 'plans', 'chatHistory', 'chatSessions', 'calendarStickers', 'languageImmersion'];
          const unsubs: (() => void)[] = [];

          // System Config Sync
          const configUnsub = onSnapshot(doc(db, 'system', 'config'), (snap) => {
            if (snap.exists()) {
              setSystemConfig(snap.data() as SystemConfig);
            }
          });
          unsubs.push(configUnsub);

          // 1. Listen to legacy document for migration
          const legacyRef = doc(db, 'userData', u.uid);
          const unsubLegacy = onSnapshot(legacyRef, async (snap) => {
            if (snap.exists()) {
              const d = snap.data();
              let needsMigration = false;
              const batch = writeBatch(db);

              dataPaths.forEach(path => {
                if (d[path]) {
                  // Found legacy data, migrate it
                  let val = d[path];
                  
                  // Clean up oversized chat history during migration
                  if ((path === 'chatHistory' || path === 'chatSessions') && Array.isArray(val)) {
                    val = val.map((item: any) => {
                      if (path === 'chatSessions') {
                        return {
                          ...item,
                          messages: item.messages?.map((msg: any) => ({
                            ...msg,
                            imageUrl: (msg.imageUrl && msg.imageUrl.length > 50000) ? null : (msg.imageUrl || null)
                          })).slice(-50) // Truncate old session messages to keep size down
                        };
                      }
                      return {
                        ...item,
                        imageUrl: (item.imageUrl && item.imageUrl.length > 50000) ? null : (item.imageUrl || null)
                      };
                    }).slice(-50);
                  }

                  const partRef = doc(db, 'userData', u.uid, 'parts', path);
                  batch.set(partRef, sanitizeData({ [path]: val }), { merge: true });
                  batch.update(legacyRef, { [path]: deleteField() });
                  needsMigration = true;

                  // Update local state immediately
                  if (path === 'flashcards') setFlashcards(val);
                  if (path === 'tasks') setTasks(val);
                  if (path === 'studyLogs') setStudyLogs(val);
                  if (path === 'plans') setPlans(val);
                  if (path === 'chatHistory') setChatHistory(val);
                  if (path === 'chatSessions') setChatSessions(val);
                  if (path === 'languageImmersion') setLanguageImmersion(val);
                }
              });

              if (needsMigration) {
                try {
                  await batch.commit();
                  console.log('Successfully migrated legacy data to partitioned storage 🍡');
                } catch (e) {
                  console.error('Migration failed', e);
                }
              }
            }
          });
          unsubs.push(unsubLegacy);

          // 2. Listen to partitioned documents
          dataPaths.forEach(path => {
            const partRef = doc(db, 'userData', u.uid, 'parts', path);
            const unsub = onSnapshot(partRef, (doc) => {
              if (doc.exists()) {
                const d = doc.data();
                if (path === 'flashcards' && d.flashcards) setFlashcards(d.flashcards);
                if (path === 'tasks' && d.tasks) setTasks(d.tasks);
                if (path === 'studyLogs' && d.studyLogs) setStudyLogs(d.studyLogs);
                if (path === 'plans' && d.plans) setPlans(d.plans);
                if (path === 'chatHistory' && d.chatHistory) setChatHistory(d.chatHistory);
                if (path === 'chatSessions' && d.chatSessions) setChatSessions(d.chatSessions);
                if (path === 'calendarStickers' && d.calendarStickers) setCalendarStickers(d.calendarStickers);
                if (path === 'languageImmersion' && d.languageImmersion) setLanguageImmersion(d.languageImmersion);
              }
            }, (err) => {
              handleFirestoreError(err, OperationType.GET, `userData/${u.uid}/parts/${path}`);
            });
            unsubs.push(unsub);
          });

          setLoading(false);
          return () => unsubs.forEach(u => u());
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, userPath);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const sanitizeData = (obj: any): any => {
    if (obj === undefined) return null;
    try {
      return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
    } catch (e) {
      console.error('Sanitization failed', e);
      return obj;
    }
  };

  const saveUserToFirebase = async (data: Partial<UserProfile>) => {
    if (firebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      try {
        await setDoc(userRef, sanitizeData(data), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }
    }
  };

  const saveToFirebase = async (data: any) => {
    if (firebaseUser) {
      try {
        const batch = writeBatch(db);
        let hasChanges = false;

        // Route data to correct partitioned documents
        ['flashcards', 'tasks', 'studyLogs', 'plans', 'chatHistory', 'chatSessions', 'calendarStickers', 'languageImmersion'].forEach(path => {
          if (data[path]) {
            let sanitized = sanitizeData(data[path]);
            
            // Special handling for chat history/sessions to prevent size errors
            if ((path === 'chatHistory' || path === 'chatSessions') && Array.isArray(sanitized)) {
              if (path === 'chatSessions') {
                sanitized = sanitized.map((item: any) => ({
                  ...item,
                  messages: item.messages?.map((msg: any) => ({
                    ...msg,
                    imageUrl: (msg.imageUrl && msg.imageUrl.length > 50000) ? null : (msg.imageUrl || null)
                  })).slice(-50)
                })).slice(-30); // Max 30 sessions archived
              } else {
                sanitized = sanitized.map((msg: any) => ({
                  ...msg,
                  imageUrl: (msg.imageUrl && msg.imageUrl.length > 50000) ? null : (msg.imageUrl || null)
                })).slice(-100); // 100 messages for active history
              }
            }

            const partRef = doc(db, 'userData', firebaseUser.uid, 'parts', path);
            batch.set(partRef, sanitizeData({ [path]: sanitized }), { merge: true });
            hasChanges = true;
          }
        });

        if (hasChanges) {
          await batch.commit();
        }
      } catch (err) {
        console.error('Save failed', err);
        // Fallback to old error handler with first key found
        const firstKey = Object.keys(data)[0];
        handleFirestoreError(err, OperationType.WRITE, `userData/${firebaseUser.uid}/parts/${firstKey}`);
      }
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("Email login requires additional manual setup in Firebase Console. Please use Google for now! 🎀");
  };

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setLoginError("Mochi missed you! The login window was closed. Try again? 🍡");
      } else if (err.code === 'auth/cancelled-by-user') {
        setLoginError("Login was cancelled. 🎀");
      } else if (err.code === 'auth/popup-blocked') {
        setLoginError("The login popup was blocked! 🚫 Please enable popups for this site or try a different browser.");
      } else {
        setLoginError(`Mochi encountered a hiccup: ${err.message || "Unknown error"}. Please try again later! 🪄`);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-mochi-cream font-sans">
        <Loader2 className="w-12 h-12 text-mochi-pink animate-spin" />
        <p className="mt-4 font-heading font-bold text-gray-400 uppercase tracking-widest text-xs">Mochi is waking up... 🍡</p>
      </div>
    );
  }

  // Maintenance Mode Check
  const isAdminUser = CREATOR_EMAILS.includes(firebaseUser?.email || '');
  if (systemConfig.maintenanceMode && !isAdminUser && firebaseUser) {
    return (
      <div className="min-h-screen bg-mochi-cream p-6 flex flex-col items-center justify-center font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm glass rounded-[3.5rem] p-10 text-center space-y-6 shadow-2xl"
        >
          <div className="text-6xl animate-bounce">🚧</div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold font-heading text-mochi-blue">UNDER MAINTENANCE</h1>
            <p className="text-xs opacity-60 leading-relaxed px-4">
              Mochi is getting some upgrades and a little nap! 🍡 We'll be back online shortly. ✨
            </p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full py-4 glass rounded-2xl font-bold font-heading text-mochi-blue text-xs uppercase"
          >
            Check back later
          </button>
        </motion.div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-mochi-cream p-6 flex flex-col items-center justify-center font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass rounded-[3.5rem] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50" />

          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl relative z-10">
            🍡
          </div>
          
          <div className="space-y-1 relative z-10">
            <h1 className="text-2xl font-bold font-heading text-gray-800 uppercase tracking-tight">MOCHI // STUDY</h1>
            <p className="text-[10px] text-gray-500 font-medium italic opacity-60">Your kawaii AI study companion ⋆˚࿔</p>
          </div>

          <div className="space-y-4 relative z-10">
            {systemConfig.maintenanceMode ? (
              <div className="p-6 bg-red-50 rounded-3xl space-y-3">
                <div className="text-2xl">💤</div>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Maintenance Mode Active</p>
                <p className="text-[10px] opacity-60">Mochi is currently resting. Check back later!</p>
              </div>
            ) : (
              <>
                <button 
                  onClick={handleLogin}
                  className="w-full py-5 bg-white text-gray-800 border-2 border-gray-50 rounded-3xl flex items-center justify-center gap-3 font-bold font-heading hover:bg-gray-50 hover:border-pink-200 transition-all shadow-md active:scale-95"
                >
                  <LogIn className="w-5 h-5 text-mochi-pink" /> Login with Google
                </button>
                <p className="text-[9px] opacity-40 px-6 leading-relaxed italic">
                  Note: If you're on mobile, please ensure popups are allowed for the login window! 🍡
                </p>
              </>
            )}
          </div>

          <AnimatePresence>
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50/80 backdrop-blur-sm text-red-500 p-4 rounded-2xl text-[10px] flex items-center gap-2 border border-red-100"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {loginError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4 opacity-20 hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Verified Secure System</span>
             </div>
             <p className="text-[8px] font-medium tracking-tight">© 2024 VAMPRIXX. All rights reserved.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen user={user} tasks={tasks} studyLogs={studyLogs} setTab={setActiveTab} />;
      case 'ai': return (
        <AIScreen 
          chatHistory={chatHistory} 
          setChatHistory={(data) => {
            if (typeof data === 'function') {
              setChatHistory(prev => {
                const next = (data as any)(prev);
                saveToFirebase({ chatHistory: next });
                return next;
              });
            } else {
              setChatHistory(data);
              saveToFirebase({ chatHistory: data });
            }
          }} 
          chatSessions={chatSessions}
          setChatSessions={(data) => {
            if (typeof data === 'function') {
              setChatSessions(prev => {
                const next = (data as any)(prev);
                saveToFirebase({ chatSessions: next });
                return next;
              });
            } else {
              setChatSessions(data);
              saveToFirebase({ chatSessions: data });
            }
          }}
          user={user}
          setUser={(data) => {
            setUser(prev => {
              const next = typeof data === 'function' ? (data as any)(prev) : data;
              saveUserToFirebase(next);
              return next;
            });
          }}
          onOpenPremium={() => setActiveTab('premium')}
        />
      );
      case 'flashcards': return <FlashcardsScreen flashcards={flashcards} setFlashcards={(data) => {
        setFlashcards(prev => {
          const next = typeof data === 'function' ? (data as any)(prev) : data;
          saveToFirebase({ flashcards: next });
          return next;
        });
      }} user={user} />;
      case 'planner': return <PlannerScreen tasks={tasks} setTasks={(data) => {
        setTasks(prev => {
          const next = typeof data === 'function' ? (data as any)(prev) : data;
          saveToFirebase({ tasks: next });
          return next;
        });
      }} plans={plans} setPlans={(data) => {
        setPlans(prev => {
          const next = typeof data === 'function' ? (data as any)(prev) : data;
          saveToFirebase({ plans: next });
          return next;
        });
      }} studyLogs={studyLogs} setStudyLogs={(data) => {
        setStudyLogs(prev => {
          const next = typeof data === 'function' ? (data as any)(prev) : data;
          saveToFirebase({ studyLogs: next });
          return next;
        });
      }} user={user} setUser={(data) => {
        setUser(prev => {
          const next = typeof data === 'function' ? (data as any)(prev) : data;
          saveUserToFirebase(next);
          return next;
        });
      }} calendarStickers={calendarStickers} setCalendarStickers={(data) => {
        setCalendarStickers(prev => {
          const next = typeof data === 'function' ? (data as any)(prev) : data;
          saveToFirebase({ calendarStickers: next });
          return next;
        });
      }} onOpenPremium={() => setActiveTab('premium')} languageImmersion={languageImmersion} setLanguageImmersion={(data) => {
        setLanguageImmersion(prev => {
          const next = typeof data === 'function' ? (data as any)(prev) : data;
          saveToFirebase({ languageImmersion: next });
          return next;
        });
      }} />;
      case 'profile': return <ProfileScreen user={user} setUser={(data) => {
        setUser(prev => {
          const next = typeof data === 'function' ? (data as any)(prev) : data;
          saveUserToFirebase(next);
          return next;
        });
      }} flashcards={flashcards} tasks={tasks} studyLogs={studyLogs} resetData={async () => {
        await signOut(auth);
        window.location.reload();
      }} onOpenCreatorDashboard={
        (firebaseUser?.email === 'jeeqlin2013@gmail.com' || firebaseUser?.email === 'vamprixx55@gmail.com') 
        ? () => setShowCreatorDashboard(true) 
        : undefined
      } onOpenPremium={() => setActiveTab('premium')} 
      deferredPrompt={deferredPrompt}
      onInstall={async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            setDeferredPrompt(null);
          }
        }
      }} />;
      case 'premium': return <PremiumScreen user={user} onBack={() => setActiveTab('profile')} />;
      default: return <HomeScreen user={user} tasks={tasks} studyLogs={studyLogs} setTab={setActiveTab} />;
    }
  };

  const getBgColor = () => {
    if (user.theme === 'night') return 'bg-[#1A1525] text-white';
    if (user.theme === 'cloud') return 'bg-[#F2F4F7] text-gray-800';
    if (user.theme === 'matcha') return 'bg-[#E2F0D9] text-[#2D4522]';
    if (user.theme === 'sakura') return 'bg-[#FFE4E1] text-[#704242]';
    if (user.theme === 'berry') return 'bg-[#F3E5F5] text-[#4A235A]';
    return 'bg-[#FFF9F0] text-gray-800'; // cream
  };

  return (
    <div 
      dir={user.language === 'ar' ? 'rtl' : 'ltr'}
      className={cn("min-h-screen pb-24 transition-colors duration-500 overflow-x-hidden grain font-sans relative", getBgColor())}
    >
      {/* Aesthetic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[5%] text-4xl"
        >🌸</motion.div>
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 60, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] right-[10%] text-3xl"
        >☁️</motion.div>
        <motion.div 
          animate={{ x: [0, 30, 0], y: [0, -50, 0], rotate: [0, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[60%] left-[15%] text-2xl"
        >🍡</motion.div>
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, -30, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute top-[15%] right-[20%] text-2xl opacity-40"
        >🎀</motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3 }}
          className="container max-w-md mx-auto px-4 pt-6"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      
      <AnimatePresence>
        {showCreatorDashboard && (
          <CreatorDashboard onBack={() => setShowCreatorDashboard(false)} />
        )}
      </AnimatePresence>
      
      <footer className="w-full text-center py-8 opacity-40">
        <p className="text-[10px] font-medium tracking-[0.2em] uppercase italic">{systemConfig.footerCredits || '˗ˋˏ made by vamprixx ˎˊ˗'}</p>
      </footer>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} language={user.language} />
    </div>
  );
}
