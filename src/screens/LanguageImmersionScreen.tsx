import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Crown, Sparkles, Check, ChevronRight, Lock, 
  Heart, Star, Layout, LayoutPanelLeft, Flower2,
  Mic, Music, BookOpen, PenTool, Trophy, Plus,
  Download, ArrowRight, Calendar, Calculator,
  Quote, MessageCircle, Play, Pause, Headphones
} from 'lucide-react';
import { UserProfile, LanguageImmersionData } from '../types';
import { cn } from '../lib/utils';

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
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

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

  const handleAddWord = () => {
    if (!newWord.trim() || !newMeaning.trim()) return;
    setData(prev => ({
      ...prev,
      vocabulary: [{ word: newWord, meaning: newMeaning, date: new Date().toISOString() }, ...prev.vocabulary],
      wordsLearnedToday: prev.wordsLearnedToday + 1
    }));
    setNewWord('');
    setNewMeaning('');
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
        {/* Section 1: Streak */}
        <section className="bg-white/40 p-6 rounded-[3rem] border-2 border-[#FFD1DC] relative overflow-hidden text-center">
            <div className="absolute top-2 left-4 text-xs opacity-20">⋆˚࿔ ༘♡ 🪽</div>
            <div className="absolute bottom-2 right-4 text-xs opacity-20">🪽 ༘♡ ⋆˚࿔</div>
            
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#8E414E] mb-4 flex items-center justify-center gap-2">
               <Star className="w-4 h-4" /> current streak
            </h3>
            <div className="text-5xl font-black font-heading italic text-[#8E414E] mb-2">
              {data.streak} <span className="text-xl">days</span>
            </div>
            
            <motion.button 
              onClick={() => {
                setData(prev => ({ ...prev, streak: prev.streak + 1, lastActive: new Date().toISOString() }));
                playSound('sparkle');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-2 px-6 py-2 bg-[#FFB7C5] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg"
            >
              +1 day streak 🌸
            </motion.button>
            <p className="text-[9px] mt-4 opacity-70 font-bold italic text-[#8E414E]">keep your language flower blooming {data.streak > 0 ? '🌸' : '🥀→🌸'}</p>
        </section>

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
                    placeholder="🍙 new word learned..."
                    className="flex-1 bg-white p-3 rounded-2xl text-[10px] font-bold border-none outline-none focus:ring-2 ring-pink-100 placeholder:text-[#8E414E]/40"
                 />
                 <input 
                    value={newMeaning}
                    onChange={(e) => setNewMeaning(e.target.value)}
                    placeholder="🍥 meaning..."
                    className="flex-1 bg-white p-3 rounded-2xl text-[10px] font-bold border-none outline-none focus:ring-2 ring-pink-100 placeholder:text-[#8E414E]/40"
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
                 <div className="text-center p-4 glass bg-white/90 rounded-[2rem] border-white shadow-sm space-y-1">
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
