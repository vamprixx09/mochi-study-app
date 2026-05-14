import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Crown, Sparkles, Check, ChevronRight, Lock, 
  Heart, Star, Layout, LayoutPanelLeft, Flower2,
  Mic, Music, BookOpen, PenTool, Trophy, Plus,
  Download, ArrowRight, Calendar, Calculator,
  Quote, MessageCircle, Play, Pause, Headphones, Volume2, Info,
  Send, Loader2, Sparkle, Phone, History, PlusCircle, Trash2, XCircle, Copy
} from 'lucide-react';
import { UserProfile, LanguageImmersionData, ChatMessage, ChatSession } from '../types';
import { cn } from '../lib/utils';
import { isFeatureUnlocked } from '../lib/premiumUtils';
import { chatWithLanguageTutor, chatWithMochiStream } from '../services/geminiService';
import { AICallOverlay } from '../components/AICallOverlay';

// Simple unique ID generator
const generateId = () => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

interface LanguageImmersionScreenProps {
  user: UserProfile;
  data: LanguageImmersionData;
  setData: (data: LanguageImmersionData | ((prev: LanguageImmersionData) => LanguageImmersionData)) => void;
  onClose: () => void;
  onOpenPremium: () => void;
}

export default function LanguageImmersionScreen({ user, data, setData, onClose, onOpenPremium }: LanguageImmersionScreenProps) {
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const [activeGoal, setActiveGoal] = useState(data.activeGoal || "read a book in target language 📓");

  // AI Tutor State
  const [showTutor, setShowTutor] = useState(false);
  const [tutorLanguage, setTutorLanguage] = useState('Japanese 🇯🇵');
  const [tutorLevel, setTutorLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [tutorMessages, setTutorMessages] = useState<ChatMessage[]>([]);
  const [tutorInput, setTutorInput] = useState('');
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(() => generateId());
  const [copyStatus, setCopyStatus] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const tutorScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tutorScrollRef.current) {
      tutorScrollRef.current.scrollTop = tutorScrollRef.current.scrollHeight;
    }
  }, [tutorMessages]);

  const startTutorSession = () => {
    if (!isFeatureUnlocked(user, 'ai_tutor')) {
      onOpenPremium();
      return;
    }
    setShowTutor(true);
    if (tutorMessages.length === 0) {
      const initial = `Konnichiwa! 🌸 I'm Mochi Tutu, your favorite language friend. I'm ready to help you practice ${tutorLanguage}! Shall we start with some simple greetings or a small roleplay? 🍡`;
      setTutorMessages([{ role: 'model', content: initial, timestamp: new Date().toISOString() }]);
    }
    playSound('sparkle');
  };

  const handleTutorSend = async (messageOverride?: string | any) => {
    const text = (typeof messageOverride === 'string' ? messageOverride : tutorInput) || "";
    if (!text || typeof text.trim !== 'function' || !text.trim() || isTutorLoading) return;
    
    const textToSend = text.trim();
    
    const userMsg = { role: 'user' as const, content: textToSend, timestamp: new Date().toISOString() };
    const newMessages = [...tutorMessages, userMsg];
    setTutorMessages(newMessages);
    if (!messageOverride) setTutorInput('');
    setIsTutorLoading(true);
    playSound('pop');

    try {
      const response = await chatWithLanguageTutor(tutorLanguage, tutorLevel, newMessages);
      const modelMsg = { role: 'model' as const, content: response, timestamp: new Date().toISOString() };
      const updatedMessages = [...newMessages, modelMsg];
      setTutorMessages(updatedMessages);
      saveTutorSession(updatedMessages);
      playSound('sparkle');
    } catch (error: any) {
      console.error(error);
      const isApiKeyError = error.message === 'API_KEY_INVALID';
      const msg = isApiKeyError 
        ? "Mochi needs your AI magic! ✨ Please go to Settings -> Secrets and ensure your Gemini API key is set correctly. 🎀"
        : "Oh no! My language flower wilted for a second... 🥺 Please try again!";
      setTutorMessages(prev => [...prev, { role: 'model', content: msg, timestamp: new Date().toISOString() }]);
    } finally {
      setIsTutorLoading(false);
    }
  };

  const saveTutorSession = (messages: ChatMessage[]) => {
    if (messages.length <= 1) return;
    
    const title = `Tutu: ${tutorLanguage} (${tutorLevel})`;
    const newSession: ChatSession = {
      id: currentSessionId,
      date: new Date().toISOString(),
      title,
      messages
    };

    setData(prev => {
      const existingSessions = prev.tutorSessions || [];
      const filtered = existingSessions.filter(s => s.id !== currentSessionId);
      return {
        ...prev,
        tutorSessions: [newSession, ...filtered].slice(0, 30)
      };
    });
  };

  const startNewTutorChat = () => {
    if (tutorMessages.length > 1) saveTutorSession(tutorMessages);
    const initial = `Konnichiwa! 🌸 I'm Mochi Tutu, your favorite language friend. I'm ready to help you practice ${tutorLanguage}! Shall we start with some simple greetings or a small roleplay? 🍡`;
    setTutorMessages([{ role: 'model', content: initial, timestamp: new Date().toISOString() }]);
    setCurrentSessionId(generateId());
    playSound('sparkle');
  };

  const loadTutorSession = (session: ChatSession) => {
    if (tutorMessages.length > 1) saveTutorSession(tutorMessages);
    setTutorMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistory(false);
    playSound('pop');
  };

  const startCall = () => {
    setIsCalling(true);
    if (user.soundEnabled) {
      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
    }
  };

  const handleCallClose = (transcript?: string[]) => {
    setIsCalling(false);
    if (transcript && transcript.length > 0) {
      const summary = `**Voice Call Highlight ✨**\n\nWe spoke in ${tutorLanguage}! 🎀 Here's what we covered:\n\n${transcript.join('\n')}\n\nI've added this to our lesson history! 🍡`;
      const msg: ChatMessage = { role: 'model', content: summary, timestamp: new Date().toISOString() };
      const updated = [...tutorMessages, msg];
      setTutorMessages(updated);
      saveTutorSession(updated);
    }
  };

  const handleCallMessage = async (text: string, onChunk: (text: string) => void) => {
    const historyForApi = tutorMessages.map(m => ({
      role: m.role as 'user' | 'model',
      parts: [{ text: m.content }]
    }));

    const systemInstruction = `You are "Mochi Tutu", a friendly and kawaii language learning tutor. 
    The user is practicing ${tutorLanguage} at a ${tutorLevel} level.
    
    VOICE CALL RULES:
    1. Speak primarily in the user's current language (detected from context).
    2. If the user switches languages (e.g. from English to ${tutorLanguage} or vice versa), switch with them seamlessly.
    3. Keep responses concise and conversational for voice interaction.
    4. Automatically detect if the user is struggling and offer gentle guidance.
    5. Supported practice: English, Urdu, Hindi, Japanese, Korean, Chinese, Arabic, French, Spanish.
    6. Always stay in your Mochi Tutu character! 🍡🌸`;

    return await chatWithMochiStream(
      text,
      historyForApi,
      onChunk,
      undefined,
      undefined
    );
  };

  const prompts = [
    "Tell me about your favorite childhood memory. 🌸",
    "What would you do if you won the lottery? 💎",
    "Describe your dream vacation. ✈️",
    "What is your favorite book and why? 📓",
    "If you could have any superpower, what would it be? ✨",
    "Talk about a person who inspires you. 💗"
  ];
  
  const [randomPrompt] = useState(prompts[Math.floor(Math.random() * prompts.length)]);

  const affirmations = [
    "You're doing amazing, sweet learner. 💭",
    "Every small step brings you closer to fluency. 🌸",
    "Your progress is valid and beautiful. ✨",
    "Don't be afraid to make mistakes, they are lessons. 🍡",
    "You have a natural gift for languages. 🪽"
  ];
  const [affirmation] = useState(affirmations[Math.floor(Math.random() * affirmations.length)]);

  const dailySnacks = [
    { word: "こんにちは", meaning: "hello", emoji: "🍡" },
    { word: "ありがとう", meaning: "thank you", emoji: "🍬" },
    { word: "だいすき", meaning: "I love you", emoji: "🍧" },
    { word: "がんばって", meaning: "do your best", emoji: "🥠" },
    { word: "おいしい", meaning: "delicious", emoji: "🍥" }
  ];
  const [dailySnack] = useState(dailySnacks[Math.floor(Math.random() * dailySnacks.length)]);

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

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = tutorLanguage.split(' ')[0] === 'English' ? 'en-US' : (
        tutorLanguage.includes('Japanese') ? 'ja-JP' :
        tutorLanguage.includes('Korean') ? 'ko-KR' :
        tutorLanguage.includes('Chinese') ? 'zh-CN' :
        tutorLanguage.includes('Spanish') ? 'es-ES' :
        tutorLanguage.includes('Urdu') ? 'ur-PK' :
        tutorLanguage.includes('Arabic') ? 'ar-SA' :
        tutorLanguage.includes('French') ? 'fr-FR' : 'en-US'
      );

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setTutorInput(prev => prev ? prev + ' ' + transcript : transcript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
    }
  }, [tutorLanguage]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
        playSound('pop');
      } catch (err) {
        console.error('Failed to start recognition', err);
      }
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(index);
    showToast('Copied to clipboard! 📋');
    playSound('pop');
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleSpeakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleAddWord = () => {
    if (!newWord.trim() || !newMeaning.trim()) return;
    setData(prev => ({
      ...prev,
      vocabulary: [{ 
        word: newWord, 
        meaning: newMeaning, 
        phonetic: newPhonetic.trim() || undefined,
        date: new Date().toISOString() 
      }, ...prev.vocabulary],
      wordsLearnedToday: prev.wordsLearnedToday + 1
    }));
    setNewWord('');
    setNewMeaning('');
    setNewPhonetic('');
    playSound('pop');

    // Achievement check
    if (data.vocabulary.length + 1 >= 100 && !data.unlockedBadges.includes('100w')) {
      setData(prev => ({ ...prev, unlockedBadges: [...prev.unlockedBadges, '100w'] }));
      playSound('sparkle');
    }
  };

  const incrementHabit = (key: keyof LanguageImmersionData) => {
    setData(prev => ({
      ...prev,
      [key]: (prev[key] as number) + 1
    }));
    playSound('pop');
  };

  const startTimer = (minutes: number) => {
    setActiveTimer(minutes);
    setTimeLeft(minutes * 60);
    playSound('pop');
  };

  useEffect(() => {
    let interval: any;
    if (activeTimer && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setActiveTimer(null);
            setData(d => ({ ...d, totalPreciseHours: d.totalPreciseHours + (activeTimer / 60) }));
            playSound('sparkle');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer, timeLeft]);

  const exportWords = () => {
    const text = data.vocabulary.map(v => `${v.word}: ${v.meaning} (${new Date(v.date).toLocaleDateString()})`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulary_list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#FFF9F0] flex flex-col md:p-6 lg:p-10 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-pink-100 bg-[#FFE4E1]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFB7C5] rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Flower2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black font-heading tracking-tight italic text-[#8E414E]">༘♡ Language Immersion Studio 🪽</h2>
            <p className="text-[9px] opacity-80 uppercase font-black tracking-widest italic text-[#8E414E]">daily habits to master a new language effectively 🌸</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 glass rounded-2xl text-[#8E414E] hover:scale-110 active:scale-95 transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* Section streak area ... */}
        <section className="bg-white/40 p-6 rounded-[3rem] border-2 border-[#FFD1DC] relative overflow-hidden text-center">
            {/* ... streak content ... */}
            <div className="absolute top-2 left-4 text-xs opacity-20">⋆˚࿔ ༘♡ 🪽</div>
            <div className="absolute bottom-2 right-4 text-xs opacity-20">🪽 ༘♡ ⋆˚࿔</div>
            
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8E414E] mb-4 flex items-center justify-center gap-2">
               <Star className="w-4 h-4" /> current streak
            </h3>
            <div className="text-5xl font-black font-heading italic text-[#8E414E] mb-2">
              {data.streak} <span className="text-xl">days</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <motion.button 
                onClick={() => {
                  setData(prev => ({ ...prev, streak: prev.streak + 1, lastActive: new Date().toISOString() }));
                  playSound('sparkle');
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-[#FFB7C5] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg"
              >
                +1 day streak 🌸
              </motion.button>

              <button 
                onClick={startTutorSession}
                className="px-6 py-2 bg-white border-2 border-[#FFD1DC] text-[#8E414E] rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-pink-50 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-mochi-pink" /> 
                {isFeatureUnlocked(user, 'ai_tutor') ? 'AI Tutor Tutor' : 'Unlock AI Tutor 👑'}
              </button>
            </div>
            <p className="text-[9px] mt-4 opacity-70 font-bold italic text-[#8E414E]">keep your language flower blooming {data.streak > 0 ? '🌸' : '🥀→🌸'}</p>
        </section>

        {/* AI Tutor Modal */}
        <AnimatePresence>
          {showTutor && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-10 z-[200] glass bg-white/95 rounded-[3rem] shadow-2xl flex flex-col border-4 border-[#FFD1DC] overflow-hidden"
            >
               <div className="p-6 border-b border-pink-100 flex items-center justify-between bg-[#FFE4E1]/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#FFB7C5] rounded-2xl flex items-center justify-center text-white text-2xl shadow-inner">🍡</div>
                    <div className="flex flex-col">
                      <h3 className="text-xl font-black font-heading tracking-tight italic text-[#8E414E]">Mochi Tutu AI 🪽</h3>
                      <div className="flex items-center gap-2">
                        <select 
                          value={tutorLanguage}
                          onChange={(e) => setTutorLanguage(e.target.value)}
                          className="bg-transparent text-[10px] font-black uppercase text-[#8E414E]/60 outline-none cursor-pointer"
                        >
                          <option>Japanese 🇯🇵</option>
                          <option>Korean 🇰🇷</option>
                          <option>Chinese 🇨🇳</option>
                          <option>Spanish 🇪🇸</option>
                          <option>French 🇫🇷</option>
                          <option>English 🇺🇸</option>
                          <option>Urdu 🇵🇰</option>
                          <option>Arabic 🇸🇦</option>
                          <option>Hindi 🇮🇳</option>
                        </select>
                        <select 
                          value={tutorLevel}
                          onChange={(e) => setTutorLevel(e.target.value as any)}
                          className="bg-transparent text-[10px] font-black uppercase text-[#8E414E]/60 outline-none cursor-pointer"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={startCall}
                      className="p-2.5 bg-white text-mochi-pink rounded-2xl shadow-sm hover:scale-110 active:scale-95 transition-all"
                      title="AI Voice Call 📞"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      className={cn(
                        "p-2.5 rounded-2xl shadow-sm transition-all",
                        showHistory ? "bg-mochi-pink text-white" : "bg-white text-mochi-pink"
                      )}
                      title="Lesson History 📖"
                    >
                      <History className="w-5 h-5" />
                    </button>
                    <button onClick={() => setShowTutor(false)} className="p-2.5 bg-white text-[#8E414E] rounded-2xl hover:bg-gray-50"><X className="w-6 h-6" /></button>
                  </div>
               </div>

               <div className="flex-1 relative overflow-hidden flex flex-col">
                 {/* Tutor History Overlay */}
                 <AnimatePresence>
                   {showHistory && (
                     <motion.div 
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md p-6 overflow-y-auto scrollbar-hide"
                     >
                       <div className="flex items-center justify-between mb-6">
                         <h3 className="text-xl font-black font-heading flex items-center gap-2 text-[#8E414E]">
                           <History className="text-mochi-pink" /> Past Lessons
                         </h3>
                         <button 
                           onClick={startNewTutorChat}
                           className="flex items-center gap-2 px-4 py-2 bg-mochi-pink text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-all"
                         >
                           <PlusCircle className="w-4 h-4" /> New Session
                         </button>
                       </div>

                       <div className="space-y-3">
                         {(!data.tutorSessions || data.tutorSessions.length === 0) ? (
                           <div className="text-center py-20 opacity-40 italic text-sm text-[#8E414E]">No lesson history yet... 🌸</div>
                         ) : (
                           data.tutorSessions.map((session) => (
                             <div 
                               key={session.id}
                               onClick={() => loadTutorSession(session)}
                               className={cn(
                                 "group p-4 glass bg-white rounded-3xl cursor-pointer hover:border-mochi-pink transition-all border-2",
                                 currentSessionId === session.id ? "border-mochi-pink" : "border-pink-50"
                               )}
                             >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-[11px] font-black text-[#8E414E]">{session.title}</p>
                                    <p className="text-[9px] opacity-40 font-bold uppercase mt-1">
                                      {new Date(session.date).toLocaleDateString()} • {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm("Delete this lesson session? 🥺")) {
                                          setData(prev => ({
                                            ...prev,
                                            tutorSessions: (prev.tutorSessions || []).filter(s => s.id !== session.id)
                                          }));
                                          if (currentSessionId === session.id) {
                                            startNewTutorChat();
                                          }
                                          playSound('pop');
                                        }
                                      }}
                                      className="p-1.5 text-red-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <ChevronRight className="w-4 h-4 text-pink-200 group-hover:text-mochi-pink transition-colors" />
                                  </div>
                                </div>
                             </div>
                           ))
                         )}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                  <div ref={tutorScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                    {tutorMessages.map((msg, i) => (
                      <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm leading-relaxed relative group",
                          msg.role === 'user' ? "bg-[#FFB7C5] text-white rounded-tr-none" : "bg-white border border-pink-100 text-[#8E414E] rounded-tl-none"
                        )}>
                          {msg.content.split('\n').map((line, j) => (
                            <p key={j} className={cn(j > 0 ? "mt-1.5" : "", "selectable")}>{line}</p>
                          ))}
                          <div className={cn(
                            "absolute -right-10 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all",
                            msg.role === 'user' ? "hidden" : ""
                          )}>
                            <button 
                              onClick={() => handleSpeakText(msg.content)}
                              className="p-2 bg-white text-mochi-pink rounded-xl shadow-sm hover:scale-110 active:scale-95"
                              title="Listen to pronunciation 🌸"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => copyToClipboard(msg.content, i)}
                              className="p-2 bg-white text-mochi-pink rounded-xl shadow-sm hover:scale-110 active:scale-95"
                              title="Copy message ✨"
                            >
                              {copyStatus === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTutorLoading && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-[#8E414E]/40 italic ml-4">
                        <Loader2 className="w-3 h-3 animate-spin" /> Mochi Tutu is thinking... 🍡
                      </div>
                    )}
                  </div>
               </div>

               <div className="p-6 bg-pink-50/30 border-t border-pink-100">
                  <div className="flex gap-3 glass bg-white p-2 rounded-[2rem] border-white shadow-lg shadow-pink-100/50 items-end">
                    <button 
                      onClick={toggleRecording}
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90",
                        isRecording ? "bg-red-500 text-white animate-pulse shadow-red-100" : "bg-pink-50 text-mochi-pink"
                      )}
                      title="Voice Message 🎤"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <textarea 
                      value={tutorInput}
                      onChange={(e) => setTutorInput(e.target.value)}
                      placeholder="Say something to Mochi Tutu... 🌸"
                      className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm font-medium text-[#8E414E] min-h-[48px] max-h-32 resize-none scrollbar-hide"
                    />
                    <button 
                      onClick={() => handleTutorSend()}
                      disabled={!tutorInput.trim() || isTutorLoading}
                      className="w-12 h-12 bg-[#FFB7C5] text-white rounded-xl flex items-center justify-center disabled:opacity-50 shadow-md transition-all active:scale-95 shrink-0"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 2: Vocabulary Tracker */}
        <section className="space-y-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8E414E] italic flex items-center gap-2 px-2">
             <Plus className="w-4 h-4" /> Vocabulary Tracker 📓💿
           </h3>
           <div className="glass p-6 rounded-[2.5rem] border-[#FFD1DC] bg-white/60 space-y-4">
              <div className="flex gap-2">
                 <input 
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="🍙 word..."
                    className="flex-[2] bg-white p-3 rounded-2xl text-[10px] font-bold border-none outline-none focus:ring-2 ring-pink-100 placeholder:text-[#8E414E]/40"
                 />
                 <input 
                    value={newPhonetic}
                    onChange={(e) => setNewPhonetic(e.target.value)}
                    placeholder="☁️ optional phonetic..."
                    className="flex-[1.5] bg-white p-3 rounded-2xl text-[10px] font-bold border-none outline-none focus:ring-2 ring-pink-100 placeholder:text-[#8E414E]/40"
                 />
                 <input 
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    placeholder="🍥 meaning..."
                    className="flex-[2] bg-white p-3 rounded-2xl text-[10px] font-bold border-none outline-none focus:ring-2 ring-pink-100 placeholder:text-[#8E414E]/40"
                 />
                 <button 
                    onClick={handleAddWord}
                    className="p-3 bg-[#FFB7C5] text-white rounded-2xl shadow-md hover:scale-105 transition-all"
                 >
                    <Plus className="w-4 h-4" />
                 </button>
              </div>

              <div className="pt-4 border-t border-pink-100 space-y-2">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#8E414E]/60">
                    <span>Weekly Goal (🍥 50 words)</span>
                    <span>{data.vocabulary.length}/50</span>
                 </div>
                 <div className="w-full h-2 bg-pink-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (data.vocabulary.length / 50) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-pink-300 to-[#FFB7C5]"
                    />
                 </div>
              </div>

              <div className="flex justify-between items-center">
                 <div className="text-[10px] font-bold text-[#8E414E]/80">
                   total vocabulary: <span className="text-[#8E414E] font-black">{data.vocabulary.length} words</span>
                 </div>
                 <button onClick={exportWords} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#8E414E] hover:underline transition-all">
                    <Download className="w-3 h-3" /> export word list 📄
                 </button>
              </div>

              {data.vocabulary.length > 0 && (
                <div className="pt-4 space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#8E414E]/40 mb-2">recent vocabulary 📓</p>
                  <div className="grid grid-cols-1 gap-2">
                    {data.vocabulary.slice(0, 20).map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/40 rounded-2xl border border-pink-50/50 group">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleSpeakText(v.word)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-[#FFB7C5] shadow-sm hover:scale-110 active:scale-95 transition-all"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => copyToClipboard(`${v.word}${v.phonetic ? ` [${v.phonetic}]` : ''} - ${v.meaning}`, idx + 1000)}
                            className="w-8 h-8 flex items-center justify-center bg-white rounded-xl text-[#FFB7C5] shadow-sm hover:scale-110 active:scale-95 transition-all"
                            title="Copy word info 🍡"
                          >
                            {copyStatus === idx + 1000 ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="text-[11px] font-black text-[#8E414E] flex items-center gap-2">
                              {v.word}
                              {v.phonetic && <span className="text-[9px] font-bold opacity-40">[{v.phonetic}]</span>}
                            </div>
                            <div className="text-[9px] font-bold text-[#8E414E]/60 italic">{v.meaning}</div>
                          </div>
                        </div>
                        <div className="text-[8px] opacity-30 font-bold uppercase">{new Date(v.date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
           </div>
        </section>

        {/* Section 3: Daily Habits */}
        <section className="space-y-6">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8E414E] italic flex items-center gap-2 px-2">
             <Calendar className="w-4 h-4" /> Daily Habits
           </h3>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 3a. Speaking */}
              <div className="glass p-5 rounded-[2.5rem] border-[#FFD1DC] bg-white/40 space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E414E] flex items-center gap-2">
                   <Mic className="w-3 h-3" /> Speaking Practice 🎧🎵
                 </h4>
                 <div className="space-y-2">
                    <p className="text-[9px] opacity-60 uppercase font-black text-[#8E414E]">topic of the day:</p>
                    <div className="p-3 bg-pink-100/50 rounded-2xl text-[9px] font-bold italic text-[#8E414E]">
                      "{randomPrompt}"
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {[5, 10, 15, 30].map(m => (
                      <button 
                        key={m}
                        onClick={() => startTimer(m)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black transition-all",
                          activeTimer === m ? "bg-[#FFB7C5] text-white shadow-md shadow-pink-100" : "bg-white text-[#8E414E] border border-pink-50 hover:bg-pink-50"
                        )}
                      >
                        {m}M
                      </button>
                    ))}
                 </div>
                 <button 
                  onClick={() => setData(prev => ({ ...prev, habitSpeakingActive: !prev.habitSpeakingActive }))}
                  className="w-full p-4 glass bg-white rounded-2xl flex items-center justify-between group border border-pink-50 shadow-sm"
                 >
                    <span className="text-[10px] font-bold text-[#8E414E]/80">i practiced speaking today 💬</span>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                      data.habitSpeakingActive ? "bg-green-400 border-green-500 text-white" : "border-[#FFD1DC]"
                    )}>
                      {data.habitSpeakingActive && <Check className="w-3 h-3" />}
                    </div>
                 </button>
              </div>

              {/* 3b. Listening */}
              <div className="glass p-5 rounded-[2.5rem] border-[#FFD1DC] bg-white/40 space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E414E] flex items-center gap-2">
                   <Headphones className="w-3 h-3" /> Listening Immersion 🎧💿
                 </h4>
                 <div className="space-y-3">
                    <HabitCounter 
                      label="🎧 songs listened" 
                      value={data.habitListeningSongs} 
                      onPlus={() => incrementHabit('habitListeningSongs')} 
                    />
                    <HabitCounter 
                      label="💽 podcasts/episodes" 
                      value={data.habitListeningPodcasts} 
                      onPlus={() => incrementHabit('habitListeningPodcasts')} 
                    />
                    <div className="pt-2 border-t border-pink-100 text-center">
                       <span className="text-[9px] font-black opacity-60 text-[#8E414E]">total minutes: </span>
                       <span className="text-[10px] font-black text-[#8E414E]">~{(data.habitListeningSongs * 3) + (data.habitListeningPodcasts * 20)}m</span>
                    </div>
                 </div>
              </div>

              {/* 3c. Reading & Writing */}
              <div className="glass p-5 rounded-[2.5rem] border-[#FFD1DC] bg-white/40 space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E414E] flex items-center gap-2">
                   <BookOpen className="w-3 h-3" /> Reading & Writing 📓🤍
                 </h4>
                 <div className="space-y-3">
                    <HabitCounter 
                      label="📖 pages read" 
                      value={data.habitReadingPages} 
                      onPlus={() => incrementHabit('habitReadingPages')} 
                    />
                    <HabitCounter 
                      label="✍️ sentences written" 
                      value={data.habitWritingSentences} 
                      onPlus={() => incrementHabit('habitWritingSentences')} 
                    />
                    <button 
                      onClick={() => setData(prev => ({ ...prev, habitJournalDone: !prev.habitJournalDone }))}
                      className="w-full p-3 glass bg-white rounded-xl flex items-center justify-between border border-pink-50 shadow-sm"
                    >
                      <span className="text-[10px] font-bold text-[#8E414E]/80">journal entry today? 📄</span>
                      <div className={cn("w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center", data.habitJournalDone ? "bg-green-400 border-green-500 text-white" : "border-[#FFD1DC]")}>
                        {data.habitJournalDone && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                 </div>
              </div>

              {/* 3d. Fun Rewards */}
              <div className="glass p-5 rounded-[2.5rem] border-[#FFD1DC] space-y-4 bg-gradient-to-br from-pink-50 to-white">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E414E] flex items-center gap-2">
                   <Trophy className="w-3 h-3" /> Fun Rewards 🍡🍬
                 </h4>
                 <div className="text-center p-4 glass bg-white/90 rounded-[2rem] border-white shadow-sm space-y-1 relative group">
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleSpeakText(dailySnack.word)}
                        className="p-2 bg-pink-50 text-[#FFB7C5] rounded-xl hover:scale-110 active:scale-95"
                        title="Pronounce 🌸"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => copyToClipboard(`${dailySnack.word} - ${dailySnack.meaning}`, 2000)}
                        className="p-2 bg-pink-50 text-[#FFB7C5] rounded-xl hover:scale-110 active:scale-95"
                        title="Copy snack ✨"
                      >
                        {copyStatus === 2000 ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[8px] font-black opacity-60 text-[#8E414E] uppercase tracking-[0.2em]">daily language snack</p>
                    <div className="text-xl">{dailySnack.emoji}</div>
                    <div className="text-sm font-black text-[#8E414E]">{dailySnack.word}</div>
                    <p className="text-[10px] text-[#8E414E]/80 italic font-bold">({dailySnack.meaning})</p>
                 </div>
                 <div className="flex justify-center gap-2">
                    {['🎀', '🩷', '🌷', '🍥', '🍡'].map((s, i) => (
                      <div key={i} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-sm shadow-sm border border-pink-100 ring-2 ring-pink-50/20">
                        {s}
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* Section 4: Weekly Growth */}
        <section className="space-y-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8E414E] italic flex items-center gap-2 px-2">
             <Trophy className="w-4 h-4" /> Weekly Growth Stats 🌸
           </h3>
           <div className="grid grid-cols-2 gap-3">
              <StatCard label="total practice" value={`${data.totalPreciseHours.toFixed(1)}h`} icon={<Calculator className="w-3 h-3" />} />
              <StatCard label="most active" value="Sunday" icon={<Calendar className="w-3 h-3" />} />
              <StatCard label="favorite act." value="Vocabulary" icon={<Heart className="w-3 h-3" />} />
              <StatCard label="next milestone" value={`${data.streak + (7 - (data.streak % 7))} days`} icon={<Trophy className="w-3 h-3" />} />
           </div>
        </section>

        {/* Section 5: Goals & Dreams */}
        <section className="space-y-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8E414E] italic flex items-center gap-2 px-2">
             <Heart className="w-4 h-4" /> Goals & Dreams 🪽
           </h3>
           <div className="glass p-6 rounded-[2.5rem] border-[#FFD1DC] bg-white/40 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#8E414E]/60 ml-2">🩷 set your language goal:</label>
                <select 
                  value={data.activeGoal}
                  onChange={(e) => setData(prev => ({ ...prev, activeGoal: e.target.value }))}
                  className="w-full p-4 bg-white border-2 border-pink-50 outline-none rounded-2xl text-[11px] font-bold shadow-sm text-[#8E414E] appearance-none"
                >
                  <option>read a book in target language 📓</option>
                  <option>watch a movie without subtitles 🎬</option>
                  <option>have a 5min conversation 💬</option>
                  <option>write a letter/journal entry 📄</option>
                </select>
              </div>

              <div className="p-5 glass bg-[#FFE4E1]/50 rounded-[2rem] border-white text-center shadow-inner">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#8E414E]/40 mb-2">🌷 daily affirmation</p>
                 <p className="text-xs font-black italic text-[#8E414E]">"{affirmation}"</p>
              </div>
           </div>
        </section>

        {/* Section 4: Weekly Growth */}
        <section className="space-y-4 mb-20 px-2">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8E414E] italic flex items-center gap-2">
             <Crown className="w-4 h-4" /> Rewards & Achievements 🏆
           </h3>
           <div className="grid grid-cols-4 gap-4">
              <BadgeItem icon="🌸" label="7-day" unlocked={data.streak >= 7} />
              <BadgeItem icon="🍙" label="100 word" unlocked={data.vocabulary.length >= 100} />
              <BadgeItem icon="🎧" label="10h list." unlocked={data.totalPreciseHours >= 10} />
              <BadgeItem icon="📓" label="30 day" unlocked={data.streak >= 30} />
           </div>
        </section>
      </div>

      <AnimatePresence>
        {activeTimer && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 inset-x-0 p-6 bg-[#FFB7C5] text-white flex items-center justify-between shadow-2xl z-[130]"
          >
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                 <Mic className="w-6 h-6 animate-pulse" />
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase tracking-widest italic leading-none mb-1">Speaking...</h4>
                  <p className="text-2xl font-black font-heading italic tracking-tighter">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
               </div>
             </div>
             <button onClick={() => setActiveTimer(null)} className="p-3 bg-white text-[#FFB7C5] rounded-2xl shadow-xl font-black text-xs">STOP</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AICallOverlay 
        isOpen={isCalling}
        onClose={handleCallClose}
        onSendMessage={handleCallMessage}
        userLanguage={tutorLanguage.split(' ')[0]}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-mochi-pink text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-xl z-[300] whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HabitCounter({ label, value, onPlus }: { label: string, value: number, onPlus: () => void }) {
  return (
    <div className="flex items-center justify-between p-4 glass bg-white rounded-2xl group border border-pink-50 shadow-sm">
      <span className="text-[10px] font-black text-[#8E414E]/80 group-hover:text-[#8E414E] transition-colors">{label}</span>
      <div className="flex items-center gap-3">
         <span className="text-[11px] font-black text-[#8E414E]">{value}</span>
         <button onClick={onPlus} className="p-1 px-2.5 bg-[#FFB7C5] text-white rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all text-xs font-black">+</button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="glass p-4 rounded-3xl border-[#FFD1DC] bg-white text-center space-y-1 shadow-sm">
      <div className="mx-auto w-6 h-6 bg-pink-100 rounded-lg flex items-center justify-center text-[#8E414E] mb-1">
        {icon}
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-[#8E414E]/50">{label}</p>
      <p className="text-[11px] font-black italic text-[#8E414E] uppercase truncate">{value}</p>
    </div>
  );
}

function BadgeItem({ icon, label, unlocked }: { icon: string, label: string, unlocked: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-2 p-3 rounded-[2.2rem] transition-all",
      unlocked ? "glass bg-[#FFE4E1]/80 border-pink-200 shadow-sm" : "opacity-30 grayscale"
    )}>
      <div className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center text-3xl relative",
        unlocked ? "bg-white shadow-md border-2 border-[#FFD1DC]" : "bg-pink-50"
      )}>
        {icon}
        {unlocked && <Check className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-sm" />}
      </div>
      <span className="text-[9px] font-black uppercase tracking-tighter text-center text-[#8E414E]">{label}</span>
    </div>
  );
}
