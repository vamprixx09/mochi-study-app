import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MochiMascot } from '../components/MochiMascot';
import { UserProfile, Task, StudyLog } from '../types';
import { Flame, Book, CheckCircle2, Sparkles, Wand2, BookOpen, LayoutList } from 'lucide-react';
import { cn } from '../lib/utils';
import { getTranslation } from '../lib/translations';
import { format } from 'date-fns';

const encouragements = [
  "You're doing great! ✨",
  "Don't forget to take a break soon 🍡",
  "Learning is a journey, enjoy it 🌸",
  "I'm so proud of your progress! 🐰",
  "You're smarter than you think 🧠",
  "One step at a time, cutie! ☁️"
];

const fortunes = [
  "A productive study session is in your future! 🔮",
  "You will master a difficult concept today. ✨",
  "Take a sip of water, success follows! 🫧",
  "Someone is cheering for your success (me!). 🎀",
  "A creative breakthrough is coming. 🎨",
  "Rest today, conquer tomorrow. ☁️"
];

interface HomeProps {
  user: UserProfile;
  tasks: Task[];
  studyLogs: StudyLog[];
  setTab: (tab: string) => void;
}

export default function HomeScreen({ user, tasks, studyLogs, setTab }: HomeProps) {
  const [fortune, setFortune] = useState<string | null>(null);
  const t = (key: string) => getTranslation(user.language || 'en', key);

  const fortunes = [
    t('fortune_1'),
    t('fortune_2'),
    t('fortune_3'),
    t('fortune_4'),
    t('fortune_5'),
    t('fortune_6')
  ];

  const encouragements = [
    t('encourage_1'),
    t('encourage_2'),
    t('encourage_3'),
    t('encourage_4'),
    t('encourage_5'),
    t('encourage_6')
  ];

  const playSound = (soundName: string) => {
    if (!user.soundEnabled) return;
    const sounds: Record<string, string> = {
      pop: 'https://www.soundjay.com/misc/sounds/pop-up-02.mp3',
      sparkle: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
      bounce: 'https://assets.mixkit.co/active_storage/sfx/1073/1073-preview.mp3'
    };
    const audio = new Audio(sounds[soundName] || sounds.pop);
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed', e));
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-sm opacity-60 font-medium font-heading">𓇢𓆸 MOCHI STUDY ⋆｡˚ ❀</p>
          <h1 className="text-3xl font-bold font-heading mt-1">{t('greeting')}, {user.name}! 🎀</h1>
        </div>
      </header>

      {/* Mascot Section */}
      <div className="flex flex-col items-center justify-center py-6 bg-white/20 rounded-[3rem] border border-white/30 relative overflow-hidden group">
        <div className="absolute top-[-10%] right-[-5%] w-24 h-24 bg-mochi-pink/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="absolute bottom-[-10%] left-[-5%] w-24 h-24 bg-mochi-blue/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
        
        <MochiMascot 
          size="lg" 
          onClick={() => {
            playSound('bounce');
          }} 
        />
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 px-6 py-2 glass rounded-2xl text-center relative z-10 border-pink-100/50"
        >
          <p className="text-sm font-black italic text-gray-700">"{encouragements[Math.floor(Math.random() * encouragements.length)]}"</p>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Flame} value={user.streak} label={t('streak')} color="bg-mochi-pink/20 text-pink-600" delay={0.1} />
        <StatCard icon={Book} value={Math.round(user.totalHours * 10) / 10} label={t('hours')} color="bg-mochi-lavender/20 text-purple-600" delay={0.2} />
        <StatCard icon={CheckCircle2} value={user.tasksCompleted} label={t('tasks')} color="bg-mochi-mint/20 text-green-600" delay={0.3} />
      </div>

      {/* Progress Summary (New Aesthetic Detail) */}
      <div className="p-5 glass rounded-[2.5rem] bg-gradient-to-br from-white/60 to-mochi-pink/5 border-2 border-white/80 space-y-3">
         <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Today's Focus ☁️</h3>
            <span className="text-[10px] font-bold bg-white/40 px-2 py-0.5 rounded-full">{format(new Date(), 'EEEE')}</span>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
               <div className="flex justify-between text-[10px] font-bold">
                  <span>Daily Goal</span>
                  <span>{Math.min(100, Math.round((tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100))}%</span>
               </div>
               <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.round((tasks.filter(t => t.completed).length / (tasks.length || 1)) * 100))}%` }}
                    className="h-full bg-mochi-pink rounded-full"
                  />
               </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm border border-gray-50">
               {tasks.filter(t => t.completed).length >= tasks.length && tasks.length > 0 ? '👑' : '✨'}
            </div>
         </div>
      </div>

      {/* Fortune Cookie */}
        <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setFortune(fortunes[Math.floor(Math.random() * fortunes.length)]);
          playSound('sparkle');
        }}
        className="w-full p-6 glass rounded-3xl flex items-center justify-between group overflow-hidden relative"
      >
        <div className="z-10">
          <h3 className="text-lg font-bold font-heading flex items-center gap-2">
            {t('daily_fortune')}
          </h3>
          <p className="text-sm mt-1 opacity-70">
            {fortune || t('fortune_placeholder')}
          </p>
        </div>
        <div className="text-4xl group-hover:rotate-12 transition-transform duration-300 z-10">🔮</div>
        <div className="absolute inset-0 bg-gradient-to-r from-mochi-pink/10 to-mochi-lavender/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.button>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold font-heading ml-1">{t('quick_actions')}</h3>
        <div className="grid grid-cols-1 gap-3">
          <ActionButton 
            icon={Sparkles} 
            label={t('teach_me')} 
            desc={t('teach_me_desc')} 
            onClick={() => setTab('ai')}
            color="bg-mochi-pink/80" 
          />
          <ActionButton 
            icon={Book} 
            label={t('quiz_me')} 
            desc={t('quiz_me_desc')} 
            onClick={() => setTab('flashcards')}
            color="bg-mochi-lavender/80" 
          />
          <ActionButton 
            icon={Wand2} 
            label={t('make_plan')} 
            desc={t('make_plan_desc')} 
            onClick={() => setTab('planner')}
            color="bg-mochi-mint/80" 
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color, delay = 0 }: { icon: any, value: number|string, label: string, color: string, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn("flex flex-col items-center justify-center p-3 rounded-2xl glass", color)}
    >
      <Icon className="w-5 h-5 mb-1" />
      <span className="text-lg font-black leading-tight tracking-tight">{value}</span>
      <span className="text-[10px] uppercase tracking-wider font-black opacity-60">{label}</span>
    </motion.div>
  );
}

function ActionButton({ icon: Icon, label, desc, onClick, color }: { icon: any, label: string, desc: string, onClick: () => void, color: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 glass rounded-3xl w-full text-left transition-all hover:bg-white/60 relative overflow-hidden group"
    >
      <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-colors" />
      <div className={cn("p-4 rounded-2xl text-white shadow-lg relative z-10 group-hover:rotate-6 transition-transform", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="relative z-10">
        <div className="font-black font-heading text-gray-800 italic uppercase text-xs tracking-tight">{label}</div>
        <div className="text-[10px] font-bold opacity-60 text-gray-500 mt-0.5">{desc}</div>
      </div>
    </motion.button>
  );
}
