import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, Timer, ListTodo, Plus, Wand2, Play, Pause, 
  RotateCcw, Check, Trash2, Loader2, Save, ChevronLeft, ChevronRight, 
  X, Bell, BellOff, Sticker, Clock, Edit2, Crown, Sparkles
} from 'lucide-react';
import { Task, StudyPlan, StudyLog, UserProfile, SubTask, CalendarSticker, LanguageImmersionData } from '../types';
import { generateStudyPlan, generateExamPrep } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval, isToday, parseISO
} from 'date-fns';
import { getTranslation } from '../lib/translations';
import { Music, Coffee, Heart, BookOpen, Quote, Trophy } from 'lucide-react';
import Markdown from 'react-markdown';
import LanguageImmersionScreen from './LanguageImmersionScreen';

interface PlannerScreenProps {
  tasks: Task[];
  setTasks: (tasks: Task[] | ((prev: Task[]) => Task[])) => void;
  plans: StudyPlan[];
  setPlans: (plans: StudyPlan[] | ((prev: StudyPlan[]) => StudyPlan[])) => void;
  studyLogs: StudyLog[];
  setStudyLogs: (logs: StudyLog[] | ((prev: StudyLog[]) => StudyLog[])) => void;
  user: UserProfile;
  setUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  calendarStickers: CalendarSticker[];
  setCalendarStickers: (stickers: CalendarSticker[] | ((prev: CalendarSticker[]) => CalendarSticker[])) => void;
  onOpenPremium: () => void;
  languageImmersion: LanguageImmersionData;
  setLanguageImmersion: (data: LanguageImmersionData | ((prev: LanguageImmersionData) => LanguageImmersionData)) => void;
}

const DEFAULT_STICKERS = ['🍡', '🎀', '🌸', '🐰', '🌟', '☁️', '🍓', '🍵', '📚', '🖋️', '🌈', '🌙', '🧸', '🥛', '🐮', '🐙', '🧠', '🩰', '🏰', '🔭', '🦷', '🧺', '🕯️'];
const PRO_STICKERS = ['👑', '🎨', '🔥', '💎', '🦄', '🐳', '🍀', '🍰', '🧁', '🍦', '🍩', '🍪', '🍫', '🍭', '🍮', '🍟', '🍕', '🥯', '🍣', '🍱', '🥟', '🍤', '🍙'];

export default function PlannerScreen({ 
  tasks, setTasks, plans, setPlans, studyLogs, setStudyLogs, user, setUser, calendarStickers, setCalendarStickers, onOpenPremium, languageImmersion, setLanguageImmersion 
}: PlannerScreenProps) {
  const [activeSubTab, setActiveSubTab] = useState<'timer' | 'planner' | 'tasks' | 'calendar' | 'music'>('timer');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  
  const allStickersPalette = [...DEFAULT_STICKERS];
  const proStickersPalette = [...PRO_STICKERS, ...(user.customStickers || [])];
  
  const t = (key: string) => getTranslation(user.language || 'en', key);

  const playSound = (soundName: string) => {
    if (!user.soundEnabled) return;
    const sounds: Record<string, string> = {
      pop: 'https://www.soundjay.com/misc/sounds/pop-up-02.mp3',
      sparkle: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
      check: 'https://www.soundjay.com/interface/sounds/beep-07.mp3'
    };
    const audio = new Audio(sounds[soundName] || sounds.pop);
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed', e));
  };

  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Plan State
  const [planSubject, setPlanSubject] = useState('');
  const [planExamDate, setPlanExamDate] = useState('');
  const [planHours, setPlanHours] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<Partial<StudyPlan> | null>(null);

  // Special Features State
  const [showExamPrepModal, setShowExamPrepModal] = useState(false);
  const [examPrepData, setExamPrepData] = useState<any>(null);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState(false);
  const [prepSubject, setPrepSubject] = useState('');

  const [showSoftStudySession, setShowSoftStudySession] = useState(false);
  const [softStudyData, setSoftStudyData] = useState({
    quote: "Focus on being productive instead of busy. ✨",
    soundtrack: "Soft Lo-fi Beats for Studying 🎧",
    prompts: ["Review your favorite topic 🍡", "Make a cute flashcard 🎀", "Write a summary note 🖋️"]
  });
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [showLanguageImmersion, setShowLanguageImmersion] = useState(false);

  const PREMIUM_TEMPLATES = [
    {
      id: 'template_exam',
      name: '🔥 Final Exam Szn',
      description: 'Intense 7-day revision sprint for high-stakes exams.',
      tasks: ['Review past papers', 'Flashcard marathon', 'Active recall session', 'Mock exam test']
    },
    {
      id: 'template_aesthetic',
      name: '🎀 Soft Girl Study',
      description: 'Low-stress, high-aesthetic study flow for deep focus.',
      tasks: ['Annotate pretty notes', 'Pomodoro 50/10', 'Read textbook in cafe', 'Mind map with colors']
    },
    {
      id: 'template_language',
      name: '🇯🇵 Language Immersion',
      description: 'Daily habits to master a new language effectively.',
      tasks: ['Duolingo streak', 'Anki vocab deck', 'Shadowing practice', 'Watch media in target lang']
    }
  ];

  const applyTemplate = (template: typeof PREMIUM_TEMPLATES[0]) => {
    if (!user.isPremium) {
      onOpenPremium();
      return;
    }
    
    if (template.id === 'template_exam') {
      setShowSubjectInput(true);
      setCurrentTemplateId(template.id);
      return;
    }

    if (template.id === 'template_aesthetic') {
      startSoftStudySession();
      return;
    }

    if (template.id === 'template_language') {
      setShowLanguageImmersion(true);
      return;
    }

    if (window.confirm(`Apply "${template.name}"? This will add tasks to your today planner! 🍡`)) {
      const today = new Date().toISOString();
      const newTasks: Task[] = template.tasks.map(t => ({
        id: uuidv4(),
        text: t,
        completed: false,
        date: today,
        isReminder: false,
        subtasks: []
      }));
      setTasks(prev => [...newTasks, ...prev]);
      playSound('sparkle');
      setActiveSubTab('tasks');
    }
  };
  const handleStartExamPrep = async () => {
    if (!prepSubject.trim()) return;
    setIsGeneratingPrep(true);
    setShowSubjectInput(false);
    try {
      const data = await generateExamPrep(prepSubject);
      setExamPrepData(data);
      setShowExamPrepModal(true);
      playSound('sparkle');
    } catch (err) {
      alert("Failed to generate exam prep. Try again! 🥺");
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  const startSoftStudySession = () => {
    setTimeLeft(25 * 60);
    setTotalTime(25 * 60);
    setShowSoftStudySession(true);
    playSound('sparkle');
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    setIsActive(false);
    playSound('sparkle');
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    const hours = totalTime / 3600;
    const newLog: StudyLog = {
      id: uuidv4(),
      date: new Date().toISOString(),
      hours,
      subject: 'Study Session 🍡'
    };
    setStudyLogs(prev => [...prev, newLog]);
    setUser(prev => ({ ...prev, totalHours: prev.totalHours + hours }));
    setTimeLeft(25 * 60);
    setTotalTime(25 * 60);
  };

  const formatTimerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // AI Plan Logic
  const handleGeneratePlan = async () => {
    if (!planSubject || !planExamDate) return;
    setIsGenerating(true);
    try {
      const plan = await generateStudyPlan(planSubject, planExamDate, planHours);
      setGeneratedPlan(plan);
    } catch (error) {
      console.error(error);
      alert("Failed to generate plan. Check your API key! 🎀");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedPlan = () => {
    if (!generatedPlan) return;
    const planToSave: StudyPlan = {
      ...generatedPlan as StudyPlan,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    setPlans(prev => [planToSave, ...prev]);
    setGeneratedPlan(null);
    setPlanSubject('');
    setPlanExamDate('');
    setActiveSubTab('planner');
  };

  // Task & Calendar Logic
  const addTask = (isReminder = false) => {
    if (!newTaskText || !selectedDate) return;
    const newTask: Task = {
      id: uuidv4(),
      text: newTaskText,
      completed: false,
      date: selectedDate.toISOString(),
      isReminder,
      reminderTime: isReminder ? (newReminderTime || null) : null,
      subtasks: []
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
    setNewReminderTime('');
    playSound('pop');
    
    if (isReminder) {
      requestNotificationPermission();
    }
  };

  const requestNotificationPermission = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (!t.completed) {
          setUser(curr => ({ ...curr, tasksCompleted: curr.tasksCompleted + 1 }));
          playSound('check');
        }
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const addSubtask = (taskId: string, text: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const subtasks = t.subtasks || [];
        return { ...t, subtasks: [...subtasks, { id: uuidv4(), text, completed: false }] };
      }
      return t;
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks?.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        };
      }
      return t;
    }));
  };

  const addDaySticker = (date: string, emoji: string) => {
    const newSticker: CalendarSticker = {
      id: uuidv4(),
      date,
      emoji
    };
    setCalendarStickers(prev => [...prev || [], newSticker]);
    playSound('pop');
  };

  const removeDaySticker = (stickerId: string) => {
    setCalendarStickers(prev => (prev || []).filter(s => s.id !== stickerId));
  };

  const addStickerToPalette = () => {
    if (!customEmoji) return;
    setUser(prev => ({
      ...prev,
      customStickers: [...(prev.customStickers || []), customEmoji]
    }));
    setCustomEmoji('');
    playSound('sparkle');
  };

  // Calendar Helpers
  const renderHeader = () => (
    <div className="flex items-center justify-between px-4 mb-4">
      <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 glass rounded-full hover:bg-white/40"><ChevronLeft className="w-5 h-5 text-mochi-pink" /></button>
      <div className="text-sm font-bold font-heading uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy')}</div>
      <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 glass rounded-full hover:bg-white/40"><ChevronRight className="w-5 h-5 text-mochi-pink" /></button>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(d => <div key={d} className="text-center text-[10px] font-bold opacity-30 uppercase">{d}</div>)}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const interval = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-1">
        {interval.map((date, i) => {
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const dayTasks = tasks.filter(t => isSameDay(parseISO(t.date), date));
          const dayStickers = (calendarStickers || []).filter(s => isSameDay(parseISO(s.date), date));
          const hasReminder = dayTasks.some(t => t.isReminder);
          const hasTask = dayTasks.some(t => !t.isReminder);

          return (
            <div 
              key={i}
              onClick={() => { setSelectedDate(date); setShowDayModal(true); playSound('pop'); }}
              className={cn(
                "aspect-square rounded-2xl flex flex-col items-center justify-center relative cursor-pointer transition-all",
                !isSameMonth(date, monthStart) ? "opacity-20" : "glass hover:bg-white/40",
                isToday(date) && "ring-2 ring-mochi-pink ring-inset",
                isSelected && "bg-mochi-pink text-white shadow-lg shadow-mochi-pink/20"
              )}
            >
              <span className="text-[10px] font-bold font-mono">{format(date, 'd')}</span>
              <div className="flex gap-0.5 mt-1">
                {hasTask && <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-mochi-blue")} />}
                {hasReminder && <div className={cn("w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-mochi-lavender")} />}
              </div>
              {dayStickers.length > 0 && (
                <div className="absolute top-1 right-1 flex flex-wrap-reverse justify-end max-w-full pointer-events-none">
                  {dayStickers.slice(0, 3).map((s) => (
                    <span key={s.id} className="text-[10px] -ml-1 first:ml-0 drop-shadow-sm">{s.emoji}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-start">
        <h1 className="text-3xl font-black font-heading text-gray-900 flex items-center gap-2">
          {t('planner')} <span className="text-2xl">🗓️</span>
          <div className="ml-2 glass p-1 px-3 rounded-xl border-mochi-pink/20 flex flex-col items-center bg-white/40">
            <span className="text-[8px] font-black uppercase text-mochi-pink opacity-60">{format(new Date(), 'MMM')}</span>
            <span className="text-sm font-black text-mochi-pink -mt-1">{format(new Date(), 'd')}</span>
          </div>
        </h1>
      </div>

      <div className="flex p-1 glass rounded-2xl">
        {[
          { id: 'timer', label: t('timer'), icon: Timer },
          { id: 'calendar', label: t('calendar'), icon: CalendarIcon },
          { id: 'planner', label: t('ai_plan'), icon: Wand2 },
          { id: 'tasks', label: t('tasks'), icon: ListTodo }
        ].map(tab => {
          const Icon = tab.icon as any;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id as any); playSound('pop'); }}
              className={cn(
                "flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold font-heading rounded-xl transition-all",
                activeSubTab === tab.id ? "bg-white shadow-sm text-gray-800" : "text-gray-400"
              )}
            >
              {typeof tab.icon === 'function' ? <Icon /> : <Icon className={cn("w-4 h-4", activeSubTab === tab.id ? "text-mochi-pink" : "text-gray-300")} />}
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'timer' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12 space-y-8">
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="128" cy="128" r="120" fill="none" stroke="#FEE2E2" strokeWidth="8" />
                <motion.circle
                  cx="128" cy="128" r="120" fill="none" stroke="#FFB7C5" strokeWidth="8" strokeDasharray="754"
                  animate={{ strokeDashoffset: 754 - (754 * (timeLeft / (totalTime || 1))) }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-heading font-bold text-gray-800">{formatTimerTime(timeLeft)}</span>
                {!isActive && (
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => { setTotalTime(Math.max(60, totalTime - 300)); setTimeLeft(Math.max(60, totalTime - 300)); }} className="w-6 h-6 flex items-center justify-center rounded-full bg-pink-100 text-pink-600 font-bold">-</button>
                    <span className="text-xs font-bold opacity-60">{Math.floor(totalTime / 60)}m</span>
                    <button onClick={() => { setTotalTime(Math.min(7200, totalTime + 300)); setTimeLeft(Math.min(7200, totalTime + 300)); }} className="w-6 h-6 flex items-center justify-center rounded-full bg-pink-100 text-pink-600 font-bold">+</button>
                  </div>
                )}
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">{t('focus_mode')} ⋆˚࿔</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => { setTimeLeft(25 * 60); setTotalTime(25 * 60); setIsActive(false); }} className="p-4 glass rounded-full text-gray-400 hover:text-gray-600 transition-colors"><RotateCcw className="w-6 h-6" /></button>
              <button onClick={() => setIsActive(!isActive)} className="w-20 h-20 rounded-full bg-mochi-pink text-white flex items-center justify-center shadow-xl shadow-mochi-pink/30 hover:scale-105 transition-all">
                {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              <div className="w-14" /> 
            </div>
          </motion.div>
        )}

        {activeSubTab === 'calendar' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass p-6 rounded-[2.5rem] shadow-sm">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            <div className="mt-6 p-4 glass rounded-2xl space-y-2">
              <div className="text-[10px] uppercase font-bold opacity-30 flex items-center gap-2 italic">{t('legend')} 🍡</div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-mochi-blue rounded-full" /><span className="text-[10px] font-bold">{t('tasks')}</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-mochi-lavender rounded-full" /><span className="text-[10px] font-bold">{t('reminder')}</span></div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'planner' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {!user.isPremium ? (
              <div className="glass p-12 rounded-[3.5rem] text-center space-y-6 bg-gradient-to-br from-yellow-50 via-white to-pink-50 border border-yellow-100 shadow-xl relative overflow-hidden group">
                <div className="absolute top-4 right-6 p-2 bg-yellow-400 text-white rounded-full"><Crown className="w-4 h-4" /></div>
                <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-4xl shadow-md group-hover:rotate-12 transition-transform">🧠</div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-heading italic">AI Analysis Required</h3>
                  <p className="text-xs opacity-60 leading-relaxed px-6 italic">
                    AI-powered study plans and exam preparation require Mochi Pro. Upgrade to unlock advanced study tools! 🍡
                  </p>
                </div>
                <button 
                  onClick={onOpenPremium}
                  className="w-full py-4 bg-mochi-pink text-white rounded-3xl font-bold font-heading text-[10px] uppercase tracking-widest shadow-lg shadow-pink-200 active:scale-95 transition-all"
                >
                  Unlock Mochi Pro
                </button>
              </div>
            ) : (
              <div className="glass p-6 rounded-[2.5rem] space-y-4">
                <h3 className="text-lg font-bold font-heading flex items-center gap-2"><Wand2 className="w-5 h-5 text-mochi-lavender" /> {t('ai_plan')}</h3>
                <div className="space-y-3">
                  <input value={planSubject} onChange={(e) => setPlanSubject(e.target.value)} placeholder={t('subject_placeholder')} className="w-full p-4 bg-white/40 rounded-2xl text-sm" />
                  <input type="date" value={planExamDate} onChange={(e) => setPlanExamDate(e.target.value)} className="w-full p-4 bg-white/40 rounded-2xl text-sm" />
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-40 ml-1">{t('available_hours')}: {planHours}</label>
                    <input type="range" min="1" max="50" value={planHours} onChange={(e) => setPlanHours(parseInt(e.target.value))} className="w-full accent-mochi-pink" />
                  </div>
                </div>
                <button onClick={handleGeneratePlan} disabled={isGenerating || !planSubject || !planExamDate} className="w-full py-4 bg-mochi-lavender text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-gray-200">
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : t('plan_my_week')}
                </button>

                <div className="pt-4 border-t border-white/20 mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-40">Premium Templates 👑</h4>
                    <span className="text-[8px] bg-yellow-400 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {PREMIUM_TEMPLATES.map(template => (
                      <button 
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="p-4 glass bg-white/30 rounded-3xl text-left hover:bg-white/50 transition-all border border-transparent hover:border-mochi-lavender/30 group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-bold">{template.name}</span>
                          <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[10px] opacity-60 leading-tight mb-2">{template.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.tasks.slice(0, 2).map((task, idx) => (
                            <span key={idx} className="text-[8px] bg-white/40 px-2 py-0.5 rounded-full opacity-60">{task}</span>
                          ))}
                          {template.tasks.length > 2 && <span className="text-[8px] bg-white/40 px-2 py-0.5 rounded-full opacity-60">+{template.tasks.length - 2} more</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'tasks' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Quick Templates Teaser */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button 
                onClick={() => setActiveSubTab('planner')}
                className="shrink-0 p-3 glass bg-mochi-pink/10 text-mochi-pink rounded-2xl flex items-center gap-2 border border-mochi-pink/20 hover:scale-105 transition-all outline-none"
              >
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t('ai_plan')}</span>
              </button>
              {PREMIUM_TEMPLATES.map(template => (
                <button 
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="shrink-0 p-3 glass rounded-2xl flex items-center gap-2 border border-white/40 hover:scale-105 transition-all group outline-none"
                >
                  <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 transition-all">{template.name}</span>
                  {!user.isPremium && <Crown className="w-2.5 h-2.5 text-yellow-500" />}
                </button>
              ))}
            </div>

            <div className="glass p-2 rounded-3xl flex items-center gap-2 border-white/60">
              <input value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTask()} placeholder={t('new_task')} className="flex-1 bg-transparent border-none outline-none text-sm px-4 h-11" />
              <button onClick={() => addTask()} className="p-3 bg-mochi-pink text-white rounded-2xl shadow-md"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => !t.sticker).map(task => (
                <div key={task.id} className="glass p-4 rounded-3xl space-y-3 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTask(task.id)} className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all", task.completed ? "bg-mochi-pink border-mochi-pink text-white" : "border-gray-200")}>
                        <AnimatePresence>
                          {task.completed && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <Check className="w-4 h-4" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                      <div className="flex flex-col">
                        <span className={cn("text-sm font-medium", task.completed && "line-through opacity-40")}>{task.text}</span>
                        <span className="text-[9px] opacity-40 italic">{format(parseISO(task.date), 'MMM d, yyyy')} {task.reminderTime && `• 🔔 ${task.reminderTime}`}</span>
                      </div>
                    </div>
                    <button onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))} className="text-red-200 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {/* Subtasks */}
                  <div className="pl-9 space-y-2">
                    {task.subtasks?.map(st => (
                      <div key={st.id} className="flex items-center gap-2">
                        <button onClick={() => toggleSubtask(task.id, st.id)} className={cn("w-4 h-4 rounded border flex items-center justify-center", st.completed ? "bg-mochi-mint border-mochi-mint text-white" : "border-gray-200")}>
                          {st.completed && <Check className="w-2 h-2" />}
                        </button>
                        <span className={cn("text-xs", st.completed && "line-through opacity-40")}>{st.text}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                      <Plus className="w-3 h-3 opacity-30" />
                      <input 
                        onKeyPress={(e) => { if(e.key === 'Enter') { addSubtask(task.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} 
                        placeholder={t('add_subtask')} 
                        className="text-xs bg-transparent border-none outline-none w-full opacity-40 focus:opacity-100 italic" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Special Feature Modals */}
      <AnimatePresence>
        {isGeneratingPrep && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-white/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-6">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-16 h-16 border-4 border-mochi-pink border-t-transparent rounded-full flex items-center justify-center text-4xl"
              >
                🔥
              </motion.div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold font-heading italic uppercase tracking-tighter">Preparing Exam Szn...</h3>
                <p className="text-xs opacity-60 font-medium italic">Analyzing topics and generating resources for you! 🍡</p>
              </div>
            </div>
          </div>
        )}

        {showSubjectInput && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass rounded-[3rem] p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                 <h3 className="text-lg font-bold font-heading uppercase italic tracking-tight">Exam Subject 📚</h3>
                 <button onClick={() => setShowSubjectInput(false)} className="p-2 glass rounded-full opacity-40 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest leading-relaxed">
                What exam are we prepping for? I'll build a 7-day intense sprint for you! ✨
              </p>
              <input 
                value={prepSubject}
                onChange={(e) => setPrepSubject(e.target.value)}
                placeholder="e.g. Biology Finals, History Midterm..."
                className="w-full p-4 bg-white/40 border-none outline-none rounded-2xl text-xs font-bold shadow-inner"
              />
              <button 
                onClick={handleStartExamPrep}
                disabled={!prepSubject.trim()}
                className="w-full py-4 bg-mochi-pink text-white rounded-3xl font-bold font-heading text-[10px] uppercase tracking-widest shadow-lg shadow-pink-200 disabled:opacity-50"
              >
                Prepare My Sprint 🔥
              </button>
            </motion.div>
          </div>
        )}

        {showExamPrepModal && examPrepData && (
          <div className="fixed inset-0 z-[130] bg-mochi-cream/95 backdrop-blur-lg flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black font-heading tracking-tight italic uppercase">Final Exam Szn 🔥</h2>
                  <p className="text-[10px] opacity-40 uppercase font-black tracking-widest italic">{prepSubject}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowExamPrepModal(false)} 
                className="p-3 glass rounded-2xl text-mochi-pink hover:scale-110 active:scale-95 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10 scrollbar-hide">
              {/* Motivation */}
              <div className="glass p-6 rounded-[3rem] bg-gradient-to-br from-red-50 to-orange-50 border-red-100 relative overflow-hidden">
                <Quote className="absolute -top-4 -left-4 w-24 h-24 text-red-500/10 -rotate-12" />
                <p className="text-sm font-bold text-red-600 italic text-center relative z-10">"{examPrepData.motivation}"</p>
              </div>

              {/* Breakdown */}
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 italic flex items-center gap-2">
                  <Coffee className="w-4 h-4" /> The Battle Plan
                </h3>
                <div className="glass p-6 rounded-[2.5rem] text-xs leading-relaxed opacity-80 border-white/60 selectable">
                   <Markdown>{examPrepData.breakdown}</Markdown>
                </div>
              </section>

              {/* 7-Day Schedule */}
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 italic flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> 7-Day Sprint
                </h3>
                <div className="space-y-3">
                  {examPrepData.schedule.map((day: any, idx: number) => (
                    <div key={idx} className="glass p-4 rounded-3xl flex gap-4 border-white/60">
                      <div className="w-12 h-12 bg-white rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[8px] font-black uppercase opacity-40">Day</span>
                        <span className="text-xl font-black font-heading text-red-500 leading-none">{idx + 1}</span>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600">{day.day}</h4>
                        <ul className="space-y-1">
                          {day.tasks.map((task: string, i: number) => (
                            <li key={i} className="text-[10px] opacity-70 flex items-center gap-2">
                              <div className="w-1 h-1 bg-red-400 rounded-full" /> {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quiz Teaser */}
              <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 italic flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> Practice Quiz
                </h3>
                <div className="space-y-4">
                  {examPrepData.quiz.map((q: any, idx: number) => (
                    <div key={idx} className="glass p-6 rounded-[2.5rem] space-y-4 border-white/60 selectable">
                       <p className="text-xs font-bold leading-relaxed">{q.question}</p>
                       <div className="grid grid-cols-1 gap-2">
                         {q.options.map((opt: string, i: number) => (
                           <button key={i} className="w-full p-3 glass bg-white/40 rounded-2xl text-[10px] text-left hover:bg-white/60">
                             {opt}
                           </button>
                         ))}
                       </div>
                       <details className="text-[9px] font-bold opacity-40 cursor-pointer">
                         <summary>View Answer 🍡</summary>
                         <p className="mt-2 p-2 bg-mochi-mint/10 text-mochi-mint border border-mochi-mint/20 rounded-xl">{q.answer}</p>
                       </details>
                    </div>
                  ))}
                </div>
              </section>

              {/* Resources */}
              <section className="space-y-4 mb-20">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 italic flex items-center gap-2">
                   Recommended Resources 🍡
                </h3>
                <div className="flex flex-wrap gap-2">
                  {examPrepData.resources.map((res: string, idx: number) => (
                    <span key={idx} className="px-4 py-2 glass bg-white rounded-full text-[9px] font-bold text-red-500 border border-red-50 shadow-sm uppercase tracking-widest">
                       {res}
                    </span>
                  ))}
                </div>
              </section>
            </div>
            
            <div className="p-6 border-t border-white/40 bg-white/40 backdrop-blur-md">
               <button 
                onClick={() => {
                  const today = new Date().toISOString();
                  const newTasks: Task[] = examPrepData.schedule[0].tasks.map((t: string) => ({
                    id: uuidv4(),
                    text: `Sprint Day 1: ${t}`,
                    completed: false,
                    date: today,
                    isReminder: false,
                    subtasks: []
                  }));
                  setTasks(prev => [...newTasks, ...prev]);
                  setShowExamPrepModal(false);
                  setActiveSubTab('tasks');
                  playSound('check');
                }}
                className="w-full py-4 bg-mochi-pink text-white rounded-3xl font-black font-heading text-xs uppercase tracking-[0.2em] shadow-xl shadow-pink-100"
               >
                 Accept Challenge & Start Day 1 🔥
               </button>
            </div>
          </div>
        )}

        {showSoftStudySession && (
          <div className="fixed inset-0 z-[140] bg-gradient-to-br from-pink-50 via-white to-blue-50 flex flex-col overflow-hidden font-sans">
            <div className="p-6 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-mochi-pink rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Heart className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black font-heading tracking-tight italic uppercase">Soft Girl Study 🎀</h2>
                    <p className="text-[10px] opacity-40 uppercase font-black tracking-widest italic">Aesthetic Focus Mode</p>
                 </div>
               </div>
               <button 
                onClick={() => setShowSoftStudySession(false)} 
                className="p-3 glass rounded-2xl text-mochi-pink hover:scale-110 active:scale-95 transition-all"
               >
                 <X className="w-6 h-6" />
               </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
               {/* Aesthetic Timer */}
               <div className="relative w-72 h-72 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="144" cy="144" r="130" fill="none" stroke="#FDE2E4" strokeWidth="6" />
                    <motion.circle
                      cx="144" cy="144" r="130" fill="none" stroke="#A2D2FF" strokeWidth="6" strokeDasharray="816"
                      animate={{ strokeDashoffset: 816 - (816 * (timeLeft / (totalTime || 1))) }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div 
                      key={timeLeft}
                      initial={{ scale: 0.95, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-6xl font-black font-heading text-mochi-pink drop-shadow-sm italic"
                    >
                      {formatTimerTime(timeLeft)}
                    </motion.div>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30">Cozy Focus</span>
                       <div className="flex gap-1">
                          <div className="w-1 h-1 bg-pink-300 rounded-full animate-pulse" />
                          <div className="w-1 h-1 bg-blue-300 rounded-full animate-pulse delay-75" />
                          <div className="w-1 h-1 bg-purple-300 rounded-full animate-pulse delay-150" />
                       </div>
                    </div>
                  </div>
                  {/* Floating sparkles */}
                  <motion.div animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute -top-4 left-10 text-xl">✨</motion.div>
                  <motion.div animate={{ y: [0, 20, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute bottom-10 -right-4 text-lg">🌸</motion.div>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => { setTimeLeft(25 * 60); setIsActive(false); }} className="p-5 glass rounded-3xl text-mochi-pink hover:bg-white transition-colors shadow-sm"><RotateCcw className="w-7 h-7" /></button>
                  <button onClick={() => setIsActive(!isActive)} className="w-24 h-24 rounded-[3rem] bg-gradient-to-br from-mochi-pink to-pink-400 text-white flex items-center justify-center shadow-2xl shadow-pink-200 hover:scale-105 active:scale-95 transition-all">
                    {isActive ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
                  </button>
                  <button onClick={() => playSound('sparkle')} className="p-5 glass rounded-3xl text-mochi-blue hover:bg-white transition-colors shadow-sm"><Heart className="w-7 h-7" /></button>
               </div>

               <div className="w-full max-w-sm space-y-4">
                 <div className="glass p-5 rounded-[2.5rem] border-white/60 bg-white/40 text-center relative overflow-hidden">
                    <Quote className="absolute -top-2 -left-2 w-12 h-12 text-pink-500/5 rotate-12" />
                    <p className="text-[10px] font-black italic tracking-wide text-mochi-pink">"{softStudyData.quote}"</p>
                 </div>

                 <div className="grid grid-cols-1 gap-2">
                    {softStudyData.prompts.map((prompt, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 glass bg-white/60 rounded-2xl border-white/80 group hover:translate-x-1 transition-transform">
                        <div className="w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center text-[10px]">🧸</div>
                        <span className="text-[10px] font-bold opacity-60 group-hover:opacity-100 transition-opacity">{prompt}</span>
                      </div>
                    ))}
                 </div>
               </div>
            </div>

            <div className="p-6 bg-white/40 border-t border-white/60 backdrop-blur-md">
               <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-mochi-blue opacity-60">Set Cozy Goal 🍡</span>
                  <div className="flex gap-2">
                     {[30, 60, 120].map(m => (
                       <button 
                        key={m}
                        onClick={() => { setTotalTime(m * 60); setTimeLeft(m * 60); playSound('pop'); }}
                        className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black transition-all",
                          totalTime === m * 60 ? "bg-mochi-blue text-white shadow-md" : "glass bg-white/40 opacity-40 hover:opacity-100"
                        )}
                       >
                         {m >= 60 ? `${m/60}H` : `${m}M`}
                       </button>
                     ))}
                  </div>
               </div>
               <div className="flex items-center gap-3 p-4 glass bg-mochi-blue/5 rounded-3xl border-mochi-blue/10">
                  <Music className="w-5 h-5 text-mochi-blue" />
                  <div className="flex-1">
                     <p className="text-[9px] font-black uppercase tracking-widest text-mochi-blue opacity-40">Now Recommended</p>
                     <p className="text-[10px] font-bold italic">{softStudyData.soundtrack}</p>
                  </div>
                  <button onClick={() => window.open('https://www.youtube.com/results?search_query=soft+aesthetic+lofi+study', '_blank')} className="p-2 bg-mochi-blue text-white rounded-xl shadow-sm hover:scale-105 transition-all"><Play className="w-3 h-3" /></button>
               </div>
            </div>
          </div>
        )}

        {showLanguageImmersion && (
          <LanguageImmersionScreen 
            user={user} 
            data={languageImmersion} 
            setData={setLanguageImmersion} 
            onClose={() => setShowLanguageImmersion(false)} 
            onOpenPremium={onOpenPremium} 
          />
        )}
      </AnimatePresence>

      {/* Calendar Day Modal */}
      <AnimatePresence>
        {showDayModal && selectedDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-sm glass rounded-[3rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <button onClick={() => setShowDayModal(false)} className="absolute top-6 right-6 p-2 glass rounded-full opacity-40 hover:opacity-100"><X className="w-4 h-4" /></button>
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-mochi-mint tracking-widest">{format(selectedDate, 'EEEE')}</div>
                <h3 className="text-2xl font-bold font-heading">{format(selectedDate, 'MMMM do')}</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold opacity-40 flex items-center gap-2"><Sticker className="w-3 h-3" /> {t('sticker')}</label>
                  <div className="flex flex-col gap-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-2">
                       <span className="text-[8px] font-bold opacity-30 uppercase tracking-widest pl-1">Free Pack 🍡</span>
                       <div className="flex flex-wrap gap-2">
                        {allStickersPalette.map((s, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => addDaySticker(selectedDate.toISOString(), s)}
                            className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-lg"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center justify-between pl-1">
                          <span className="text-[8px] font-bold opacity-30 uppercase tracking-widest">Aesthetic Pack ⋆˚࿔</span>
                          {!user.isPremium && <Crown className="w-2.5 h-2.5 text-yellow-500" />}
                       </div>
                       <div className="flex flex-wrap gap-2">
                        {proStickersPalette.map((s, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => {
                              if (!user.isPremium) { setShowDayModal(false); onOpenPremium(); return; }
                              addDaySticker(selectedDate.toISOString(), s);
                            }}
                            className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-all text-lg relative",
                              user.isPremium ? "glass hover:scale-110 active:scale-95" : "bg-black/5 opacity-40 grayscale"
                            )}
                          >
                            {s}
                            {!user.isPremium && <div className="absolute inset-0 flex items-center justify-center"><Crown className="w-3 h-3 text-white/50" /></div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-white/20">
                    <input 
                      value={customEmoji} 
                      onChange={(e) => setCustomEmoji(e.target.value)} 
                      placeholder="Add emoji..." 
                      className="flex-1 bg-white/20 rounded-lg px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-mochi-pink"
                    />
                    <button onClick={addStickerToPalette} className="p-1 bg-mochi-pink text-white rounded-lg"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Day's specific stickers info */}
                {(calendarStickers || []).filter(s => isSameDay(parseISO(s.date), selectedDate)).length > 0 && (
                   <div className="p-3 glass rounded-2xl space-y-2">
                     <span className="text-[8px] font-bold opacity-30 uppercase tracking-widest">Active Stickers 🍡</span>
                     <div className="flex flex-wrap gap-2">
                       {(calendarStickers || []).filter(s => isSameDay(parseISO(s.date), selectedDate)).map(s => (
                         <div key={s.id} className="relative group">
                           <span className="text-xl">{s.emoji}</span>
                           <button 
                            onClick={() => removeDaySticker(s.id)}
                            className="absolute -top-1 -right-1 bg-red-400 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Trash2 className="w-2 h-2" />
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                )}

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-40 flex items-center gap-2"><Plus className="w-3 h-3" /> {t('quick_action')}</label>
                    <input value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder={t('add_plan_or_reminder')} className="w-full p-4 glass bg-white/40 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-mochi-pink" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addTask(false)} className="flex-1 py-3 glass rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-mochi-blue"><Save className="w-4 h-4" /> {t('plan')}</button>
                    <button onClick={() => addTask(true)} className="flex-1 py-3 glass rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-mochi-lavender"><Bell className="w-4 h-4" /> {t('alert')}</button>
                  </div>
                  {newReminderTime !== undefined && (
                    <div className="flex items-center gap-2 glass p-2 rounded-xl">
                      <Clock className="w-3 h-3 opacity-40" />
                      <input type="time" value={newReminderTime} onChange={(e) => setNewReminderTime(e.target.value)} className="bg-transparent text-[10px] outline-none w-full" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-white/40">
                {tasks.filter(t => isSameDay(parseISO(t.date), selectedDate) && !t.sticker).map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-2 p-3 glass rounded-2xl bg-white/40">
                    <div className="flex items-center gap-2">
                      <Check className={cn("w-3 h-3", t.completed ? "text-mochi-mint" : "opacity-20")} />
                      <span className="text-[10px] font-bold line-clamp-1">{t.isReminder && '🔔 '}{t.text}</span>
                    </div>
                    <button onClick={() => setTasks(prev => prev.filter(x => x.id !== t.id))} className="text-red-300"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
