import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Settings, Award, Download, 
  Trash2, Info, ChevronRight, X, Edit, Check, Star, MessageCircle, ShieldCheck, Instagram,
  Volume2, VolumeX, Globe, Upload, Sun, Cloud, Moon, Play, Pause, Music, Crown, Sparkles, Heart, Palette
} from 'lucide-react';
import { UserProfile, Flashcard, Task, StudyLog } from '../types';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getTranslation } from '../lib/translations';
import { exportToPDF } from '../lib/exportUtils';
import ProfileCustomizerScreen from './ProfileCustomizerScreen';
import { PROFILE_TEMPLATES } from '../constants';

interface ProfileScreenProps {
  user: UserProfile;
  setUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  flashcards: Flashcard[];
  tasks: Task[];
  studyLogs: StudyLog[];
  resetData: () => void;
  onOpenCreatorDashboard?: () => void;
  onOpenPremium: () => void;
  deferredPrompt: any;
  onInstall: () => void;
}

const AVATAR_GALLERY = [
  '🐰', '🍡', '🎀', '🌸', '🩵', '🐾', '👒', '🍰', '🧸', '🍙',
  '🐱', '🐼', '🦊', '🐸', '🐣', '🍓', '🍑', '🪐', '💫', '🍮',
];

const SPOTIFY_TRACKS = [
  { id: '1', title: 'Moon is Beautiful', artist: 'Hanafugetsu', url: 'https://open.spotify.com/track/2CSbGdlvxO4sGBELZ9PAcZ' },
  { id: '2', title: 'Lofi Study', artist: 'Mochi Beats', url: 'https://open.spotify.com/track/0o9zmvc5f3EFApU52PPIyW' },
  { id: '3', title: 'Suzume', artist: 'RADWIMPS', url: 'https://open.spotify.com/track/1n1y2kFPISpF9WGD3JaFo5' },
  { id: '4', title: 'Soft Piano', artist: 'Dreamy', url: 'https://open.spotify.com/track/172zA5Yn0YzayQWvEJuGAm' }
];

const LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Korean (한국어)', code: 'ko' },
  { name: 'Japanese (日本語)', code: 'ja' },
  { name: 'Spanish (Español)', code: 'es' },
  { name: 'Chinese (中文)', code: 'zh' },
  { name: 'French (Français)', code: 'fr' },
  { name: 'German (Deutsch)', code: 'de' },
  { name: 'Italian (Italiano)', code: 'it' },
  { name: 'Portuguese (Português)', code: 'pt' },
  { name: 'Russian (Русский)', code: 'ru' },
  { name: 'Arabic (العربية)', code: 'ar' },
  { name: 'Hindi (हिन्दी)', code: 'hi' },
  { name: 'Bengali (বাংলা)', code: 'bn' },
  { name: 'Urdu (اردو)', code: 'ur' },
  { name: 'Turkish (Türkçe)', code: 'tr' },
  { name: 'Dutch (Nederlands)', code: 'nl' },
  { name: 'Polish (Polski)', code: 'pl' },
  { name: 'Swedish (Svenska)', code: 'sv' },
  { name: 'Danish (Dansk)', code: 'da' },
  { name: 'Norwegian (Norsk)', code: 'no' },
  { name: 'Finnish (Suomi)', code: 'fi' },
  { name: 'Greek (Ελληνικά)', code: 'el' },
  { name: 'Hebrew (עברית)', code: 'he' },
  { name: 'Thai (ไทย)', code: 'th' },
  { name: 'Vietnamese (Tiếng Việt)', code: 'vi' },
  { name: 'Indonesian (Bahasa Indonesia)', code: 'id' },
  { name: 'Malay (Bahasa Melayu)', code: 'ms' },
  { name: 'Tagalog (Wikang Tagalog)', code: 'tl' },
  { name: 'Persian (فارسی)', code: 'fa' },
  { name: 'Swahili (Kiswahili)', code: 'sw' },
  { name: 'Zulu (isiZulu)', code: 'zu' },
  { name: 'Hausa (Harshen Hausa)', code: 'ha' },
  { name: 'Czech (Čeština)', code: 'cs' },
  { name: 'Slovak (Slovenčina)', code: 'sk' },
  { name: 'Hungarian (Magyar)', code: 'hu' },
  { name: 'Romanian (Română)', code: 'ro' },
  { name: 'Bulgarian (Български)', code: 'bg' },
  { name: 'Serbian (Српски)', code: 'sr' },
  { name: 'Croatian (Hrvatski)', code: 'hr' },
  { name: 'Ukrainian (Українська)', code: 'uk' },
  { name: 'Lithuanian (Lietuvių)', code: 'lt' },
  { name: 'Latvian (Latviešu)', code: 'lv' },
  { name: 'Estonian (Eesti)', code: 'et' },
  { name: 'Georgian (ქართული)', code: 'ka' },
  { name: 'Armenian (Հայերեն)', code: 'hy' },
  { name: 'Kazakh (Қазақша)', code: 'kk' },
  { name: "Uzbek (O'zbekcha)", code: 'uz' },
  { name: 'Nepali (नेपाली)', code: 'ne' },
  { name: 'Sinhala (සිංහල)', code: 'si' },
  { name: 'Burmese (မြันမာစာ)', code: 'my' },
  { name: 'Khmer (ភាសាខ្មែរ)', code: 'km' },
  { name: 'Lao (ພາສາລາວ)', code: 'lo' },
  { name: 'Mongolian (Монгол хэл)', code: 'mn' },
  { name: 'Amharic (አማርኛ)', code: 'am' },
  { name: 'Yoruba (Èdè Yorùbá)', code: 'yo' },
  { name: 'Igbo (Ásụ̀sụ́ Ìgbò)', code: 'ig' },
  { name: 'Somali (Af Soomaali)', code: 'so' },
  { name: 'Albanian (Shqip)', code: 'sq' },
  { name: 'Macedonian (Македонски)', code: 'mk' },
  { name: 'Icelandic (Íslenska)', code: 'is' },
  { name: 'Irish (Gaeilge)', code: 'ga' },
  { name: 'Welsh (Cymraeg)', code: 'cy' },
  { name: 'Basque (Euskara)', code: 'eu' },
  { name: 'Catalan (Català)', code: 'ca' },
  { name: 'Galician (Galego)', code: 'gl' },
  { name: 'Breton (Brezhoneg)', code: 'br' },
  { name: 'Navajo (Diné Bizaad)', code: 'nv' },
  { name: 'Hawaiian (ʻŌlelo Hawaiʻi)', code: 'hw' },
  { name: 'Māori (Te Reo Māori)', code: 'mi' },
  { name: 'Fijian (Na Vosa Vakaviti)', code: 'fj' },
  { name: 'Samoan (Gagana Sāmoa)', code: 'sm' }
];

export default function ProfileScreen({ 
  user, setUser, flashcards, tasks, studyLogs, resetData, onOpenCreatorDashboard, onOpenPremium, deferredPrompt, onInstall 
}: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'settings' | 'about'>('profile');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  
  const t = (key: string) => getTranslation(user.language || 'en', key);

  useEffect(() => {
    const saved = localStorage.getItem('mochi_study_track');
    if (saved) setSelectedTrack(saved);
  }, []);

  const handleTrackAction = (trackId: string, url: string) => {
    setSelectedTrack(trackId);
    localStorage.setItem('mochi_study_track', trackId);
    window.open(url, '_blank');
  };

  const handleExportAll = () => {
    let content = `
      <h2>${t('tasks')}</h2>
      ${tasks.map(t => `
        <div class="task">
          <span class="task-check">${t.completed ? '✓' : '○'}</span>
          <span>${t.text}</span>
        </div>
      `).join('')}
      
      <h2>${t('flashcards')}</h2>
      ${flashcards.map(f => `
        <div class="card">
          <div class="question">Q: ${f.front}</div>
          <div class="answer">A: ${f.back}</div>
        </div>
      `).join('')}
      
      <h2>${t('stats')}</h2>
      <div class="card">
        <p>${t('streak')}: ${user.streak}</p>
        <p>${t('hours')}: ${Math.round(user.totalHours * 10) / 10}</p>
        <p>${t('tasks')}: ${tasks.filter(t => t.completed).length}</p>
      </div>
    `;
    exportToPDF(content, "Mochi_Study_Data.pdf");
  };

  const realTasksCompleted = tasks.filter(t => t.completed).length;
  const realFlashcardsMastered = flashcards.filter(f => (f.mastery || 0) >= 100).length;

  const achievements = [
    { id: 'sprout', icon: '🌱', label: t('ach_sprout'), desc: t('ach_sprout_desc'), unlocked: studyLogs.length > 0 },
    { id: 'consistent', icon: '🔥', label: t('ach_consistent'), desc: t('ach_consistent_desc'), unlocked: user.streak >= 3 },
    { id: 'scholar', icon: '⭐', label: t('ach_scholar'), desc: t('ach_scholar_desc'), unlocked: flashcards.length >= 10 },
    { id: 'master', icon: '🃏', label: t('ach_master'), desc: t('ach_master_desc'), unlocked: realFlashcardsMastered >= 5 }
  ];

  const currentTemplate = PROFILE_TEMPLATES.find(t => t.id === user.profileFrameId) || PROFILE_TEMPLATES[0];

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

  const handlePfpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUser(prev => ({ ...prev, pfp: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRateApp = () => {
    alert(t('rate_alert'));
    window.open('https://play.google.com/store/apps/details?id=com.mochi.study', '_blank');
  };

  const handleFeedback = () => {
    window.location.href = `mailto:vamprixx55@gmail.com?subject=${t('feedback_subject')}`;
  };

  const handleKofi = () => {
    window.open('https://ko-fi.com/vamp_rixx', '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold font-heading">{t('settings')} ᯓᡣ𐭩</h2>
        <div className="flex gap-2">
          {['profile', 'settings', 'about'].map(tab => (
            <button 
              key={tab}
              onClick={() => { setActiveSettingsTab(tab as any); playSound('pop'); }}
              className={cn(
                "p-2 rounded-xl transition-all",
                activeSettingsTab === tab ? "bg-mochi-pink text-white" : "glass text-mochi-pink"
              )}
            >
              {tab === 'profile' && <User className="w-5 h-5" />}
              {tab === 'settings' && <Settings className="w-5 h-5" />}
              {tab === 'about' && <Info className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSettingsTab === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center gap-4">
               {/* Profile Card / Frame Preview */}
               <div className={cn(
                  "w-full p-6 rounded-[3rem] transition-all duration-500 relative flex flex-col items-center border-[6px]",
                  currentTemplate.bgClass,
                  currentTemplate.borderColor
               )}>
                 <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-5xl relative group font-heading overflow-hidden border-4 border-white">
                    {user.pfp && user.pfp.startsWith('data:') ? (
                      <img src={user.pfp} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user.pfp || '🍡'
                    )}
                    {user.isPremium && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1 rounded-full shadow-lg border-2 border-white">
                        <Crown className="w-3 h-3" />
                      </div>
                    )}
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Edit className="w-6 h-6 text-white" />
                      </button>
                    )}
                  </div>

                  {/* Sparkle & Floating decorations for premium templates */}
                  {currentTemplate.isPremium && (
                    <div className="absolute inset-0 pointer-events-none">
                      <motion.div animate={{ y: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-10 left-10 text-xs">✨</motion.div>
                      <motion.div animate={{ y: [0, 10, 0], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute bottom-10 right-10 text-xs">🌸</motion.div>
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute top-20 right-8 text-sm">🫧</motion.div>
                      <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute bottom-16 left-6 text-xs">🎀</motion.div>
                    </div>
                  )}

                  {!isEditing && (
                    <button 
                       onClick={() => setShowCustomizer(true)}
                       className="absolute top-4 right-4 p-2 glass rounded-full text-mochi-pink hover:scale-110 active:scale-95 transition-all shadow-sm"
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                  )}

                  <div className="text-center mt-3 space-y-1">
                    <div className="flex flex-col items-center">
                       <h3 className="text-xl font-bold font-heading uppercase italic tracking-tight">{user.name}</h3>
                       {onOpenCreatorDashboard && (
                        <button 
                          onClick={() => { playSound('sparkle'); onOpenCreatorDashboard(); }}
                          className="mt-1 flex items-center gap-1 px-3 py-1 bg-mochi-blue/10 rounded-full border border-mochi-blue/20 hover:bg-mochi-blue/20 transition-all"
                        >
                          <ShieldCheck className="w-3 h-3 text-mochi-blue" />
                          <span className="text-[8px] font-bold text-mochi-blue uppercase tracking-widest">Creator</span>
                        </button>
                      )}
                    </div>
                    {!isEditing && <p className="text-[10px] italic opacity-60 max-w-[200px] leading-tight">{user.bio}</p>}
                  </div>
               </div>

              {isEditing && (
                <div className="w-full space-y-4 px-4 bg-white/40 p-6 rounded-[2.5rem] border-2 border-white/60 shadow-lg">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold opacity-40 ml-1">{t('mascot_label')}</label>
                    <div className="flex flex-wrap gap-2 justify-center py-3 glass rounded-2xl max-h-32 overflow-y-auto scrollbar-hide">
                      {AVATAR_GALLERY.map(emoji => (
                        <button 
                          key={emoji}
                          onClick={() => setUser(prev => ({ ...prev, pfp: emoji }))}
                          className={cn("text-2xl p-1 rounded-xl transition-all", user.pfp === emoji ? "bg-white shadow-sm scale-110" : "opacity-50 hover:opacity-100")}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-3 glass rounded-2xl flex items-center justify-center gap-2 text-xs font-bold font-heading text-mochi-pink"
                    >
                      <Upload className="w-4 h-4" /> {t('gallery_btn')}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePfpUpload} />
                  </div>

                  <input 
                    value={user.name} 
                    onChange={(e) => setUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 glass rounded-2xl text-center font-bold font-heading shadow-sm bg-white/20" 
                    placeholder="Your Name ✨"
                  />
                  <textarea 
                    value={user.bio} 
                    onChange={(e) => setUser(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full p-3 glass rounded-2xl text-center text-sm italic shadow-sm bg-white/20" 
                    placeholder="Short bio... 🍡"
                  />
                  <button onClick={() => { setIsEditing(false); playSound('pop'); }} className="w-full py-3 bg-mochi-pink text-white rounded-2xl font-bold font-heading shadow-lg">{t('save_btn')}</button>
                </div>
              )}

              {/* Premium Teaser */}
              {!user.isPremium && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { playSound('sparkle'); onOpenPremium(); }}
                  className="w-full mt-4 p-4 rounded-3xl bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 border border-white shadow-xl flex items-center justify-between group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 slant" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:rotate-12 transition-transform">👑</div>
                    <div className="text-left">
                      <div className="text-xs font-black font-heading tracking-tight italic">𖦁ׅ⋆:Upgrade to Premium:⋆𖦁ׅ</div>
                      <div className="text-[9px] opacity-60 font-bold uppercase tracking-widest">Unlock Mochi Pro ✨</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-mochi-pink relative z-10" />
                </motion.button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label={t('tasks')} value={realTasksCompleted} icon={Check} color="text-mochi-mint" />
              <StatCard label={t('mastered')} value={realFlashcardsMastered} icon={Star} color="text-mochi-blue" />
            </div>

            <div className="glass p-5 rounded-[2rem] space-y-4">
              <h3 className="text-sm font-bold font-heading flex items-center gap-2 italic">
                <Award className="w-4 h-4 text-yellow-500" /> {t('achievements')}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {achievements.map((a) => (
                  <div key={a.id} className={cn("flex flex-col items-center gap-1 p-2 rounded-2xl transition-all", !a.unlocked && "grayscale opacity-30")}>
                    <div className="text-2xl">{a.icon}</div>
                    <span className="text-[8px] font-bold uppercase truncate w-full text-center">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeSettingsTab === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold opacity-40 ml-1 tracking-widest">{t('settings')}</label>
              <div className="grid grid-cols-3 gap-2">
                <ThemeBtn icon={Sun} label={t('theme_cream')} active={user.theme === 'cream'} onClick={() => { setUser(prev => ({ ...prev, theme: 'cream' })); playSound('pop'); }} color="bg-[#FFF9F0]" />
                <ThemeBtn icon={Cloud} label={t('theme_cloud')} active={user.theme === 'cloud'} onClick={() => { setUser(prev => ({ ...prev, theme: 'cloud' })); playSound('pop'); }} color="bg-[#F2F4F7]" />
                <ThemeBtn icon={Moon} label={t('theme_night')} active={user.theme === 'night'} onClick={() => { setUser(prev => ({ ...prev, theme: 'night' })); playSound('pop'); }} color="bg-[#1A1525] text-white" />
                
                {/* Pro Themes */}
                <ThemeBtn 
                  icon={Sparkles} 
                  label="Matcha" 
                  isPro 
                  active={user.theme === 'matcha'} 
                  onClick={() => {
                    if (!user.isPremium) { onOpenPremium(); return; }
                    setUser(prev => ({ ...prev, theme: 'matcha' }));
                    playSound('pop');
                  }} 
                  color="bg-[#E2F0D9]" 
                />
                <ThemeBtn 
                  icon={Heart} 
                  label="Sakura" 
                  isPro 
                  active={user.theme === 'sakura'} 
                  onClick={() => {
                    if (!user.isPremium) { onOpenPremium(); return; }
                    setUser(prev => ({ ...prev, theme: 'sakura' }));
                    playSound('pop');
                  }} 
                  color="bg-[#FFE4E1]" 
                />
                <ThemeBtn 
                  icon={Award} 
                  label="Berry" 
                  isPro 
                  active={user.theme === 'berry'} 
                  onClick={() => {
                    if (!user.isPremium) { onOpenPremium(); return; }
                    setUser(prev => ({ ...prev, theme: 'berry' }));
                    playSound('pop');
                  }} 
                  color="bg-[#F3E5F5]" 
                />
              </div>

              <div className="glass p-2 rounded-3xl space-y-1">
                <SettingRow 
                  icon={user.soundEnabled ? Volume2 : VolumeX} 
                  label={t('sound')} 
                  desc={t('kawaii_blips')}
                  active={user.soundEnabled}
                  onClick={() => { setUser(prev => ({ ...prev, soundEnabled: !prev.soundEnabled })); playSound('pop'); }}
                />
                <SettingRow 
                  icon={Volume2} 
                  label="AI voice" 
                  desc="English voice only"
                  active={user.aiVoiceEnabled}
                  onClick={() => { 
                    const newValue = !user.aiVoiceEnabled;
                    setUser(prev => ({ ...prev, aiVoiceEnabled: newValue })); 
                    localStorage.setItem('mochi_ai_voice', String(newValue));
                    playSound('pop'); 
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold opacity-40 ml-1 tracking-widest">{t('language')}</label>
              <div className="glass p-4 rounded-3xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 glass rounded-xl text-mochi-blue"><Globe className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="text-xs font-bold font-heading">{t('language')}</div>
                    <select 
                      value={user.language || 'en'}
                      onChange={(e) => { setUser(prev => ({ ...prev, language: e.target.value })); playSound('pop'); }}
                      className="text-[10px] bg-transparent border-none p-0 outline-none w-full opacity-60 font-bold"
                    >
                      {LANGUAGES.map(l => <option key={l.code} value={l.code} className="text-gray-800">{l.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold opacity-40 ml-1 tracking-widest">🎵 {t('study_sounds')}</label>
              <div className="grid grid-cols-1 gap-2">
                {SPOTIFY_TRACKS.map(track => (
                  <div key={track.id} className="glass p-3 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 glass rounded-xl text-mochi-pink animate-pulse">
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold font-heading">{track.title}</div>
                        <div className="text-[9px] opacity-40">{track.artist}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleTrackAction(track.id, track.url)}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        selectedTrack === track.id ? "bg-mochi-pink text-white" : "glass text-mochi-pink hover:bg-mochi-pink hover:text-white"
                      )}
                    >
                      {selectedTrack === track.id ? <Play className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-center opacity-40 mt-1 uppercase font-bold tracking-tight">{t('spotify_note')}</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold opacity-40 ml-1 tracking-widest">{t('stats')}</label>
              <button 
                onClick={handleExportAll}
                className="w-full glass p-4 rounded-3xl flex items-center justify-between group hover:bg-white/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 glass rounded-xl text-mochi-blue group-hover:bg-mochi-blue group-hover:text-white transition-all shadow-sm">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold font-heading">{t('export_all')}</div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-20" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] uppercase font-bold opacity-40 ml-1 tracking-widest">{t('support_label')}</label>
              <div className="glass p-2 rounded-3xl space-y-1">
                <button onClick={() => setShowPrivacy(true)} className="w-full flex items-center justify-between p-3 hover:bg-white/40 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 glass rounded-xl group-hover:bg-mochi-pink group-hover:text-white transition-all shadow-sm"><ShieldCheck className="w-4 h-4" /></div>
                    <div className="text-xs font-bold font-heading">{t('privacy')}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-20" />
                </button>
                <button onClick={handleRateApp} className="w-full flex items-center justify-between p-3 hover:bg-white/40 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 glass rounded-xl group-hover:bg-mochi-pink group-hover:text-white transition-all shadow-sm"><Star className="w-4 h-4" /></div>
                    <div className="text-xs font-bold font-heading">{t('rate')}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-20" />
                </button>
                <button onClick={handleFeedback} className="w-full flex items-center justify-between p-3 hover:bg-white/40 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 glass rounded-xl group-hover:bg-mochi-pink group-hover:text-white transition-all shadow-sm"><MessageCircle className="w-4 h-4" /></div>
                    <div className="text-xs font-bold font-heading">{t('feedback')}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-20" />
                </button>
                {deferredPrompt && (
                  <button onClick={onInstall} className="w-full flex items-center justify-between p-3 bg-mochi-pink/10 hover:bg-mochi-pink/20 rounded-2xl transition-all group border-2 border-mochi-pink/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-mochi-pink text-white rounded-xl shadow-sm"><Download className="w-4 h-4" /></div>
                      <div className="text-xs font-bold font-heading">Install Mochi App 🍡</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-mochi-pink" />
                  </button>
                )}
              </div>
            </div>

            <button onClick={() => {
              setShowConfirmLogout(true);
              playSound('pop');
            }} className="w-full p-4 glass rounded-3xl flex items-center justify-center gap-2 text-red-500 font-bold font-heading text-xs shadow-sm hover:bg-white/40">
              <Trash2 className="w-4 h-4" /> {user.uid ? t('logout') : t('reset_data')}
            </button>
          </motion.div>
        )}

        {activeSettingsTab === 'about' && (
          <motion.div 
            key="about"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="glass p-8 rounded-[3rem] text-center space-y-6">
              <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center text-5xl shadow-xl">🌸</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-heading">Mochi Study</h3>
                <p className="text-xs opacity-60 uppercase tracking-widest font-bold">{t('made_by')}</p>
              </div>
              <p className="text-sm italic opacity-80 leading-relaxed italic">
                {t('about_desc')}
              </p>
              
              <div className="space-y-3 pt-4">
                <button 
                  onClick={handleKofi}
                  className="w-full py-3 px-6 bg-[#29abe0] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span className="text-xl">☕</span>
                  Buy Mochi a coffee
                </button>
                <p className="text-[10px] opacity-40 uppercase font-bold tracking-widest">Support the creator 🩵</p>
              </div>

              <div className="flex justify-center gap-4 py-4 border-t border-pink-100">
                <button onClick={() => window.open('https://www.instagram.com/vamp_.rixx/', '_blank')} className="p-3 glass rounded-2xl text-mochi-pink hover:scale-110 transition-all font-bold flex flex-col items-center gap-1">
                  <Instagram className="w-5 h-5" />
                  <span className="text-[7px] uppercase">Insta</span>
                </button>
                <button onClick={handleRateApp} className="p-3 glass rounded-2xl text-mochi-pink hover:scale-110 transition-all font-bold flex flex-col items-center gap-1">
                  <Star className="w-5 h-5" />
                  <span className="text-[7px] uppercase">Rate</span>
                </button>
                <button onClick={handleFeedback} className="p-3 glass rounded-2xl text-mochi-blue hover:scale-110 transition-all font-bold flex flex-col items-center gap-1">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-[7px] uppercase">Email</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomizer && (
          <ProfileCustomizerScreen 
            user={user} 
            setUser={setUser} 
            onClose={() => setShowCustomizer(false)} 
            onOpenPremium={onOpenPremium} 
          />
        )}
        {showPrivacy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass rounded-[3rem] p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowPrivacy(false)} className="p-2 glass rounded-full opacity-40 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
              </div>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg">🔒</div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-heading">{t('privacy')}</h3>
                <p className="text-xs opacity-60 leading-relaxed">
                  Mochi Study respects your privacy. All your study data stays on your account. 
                  We don't sell your data. Your AI features use Gemini, and your API keys are never stored on our servers. 🔮
                </p>
              </div>
              <button 
                onClick={() => setShowPrivacy(false)}
                className="w-full py-4 bg-mochi-pink text-white rounded-2xl font-bold font-heading shadow-lg"
              >
                {t('understand_btn')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmLogout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass rounded-[3rem] p-8 space-y-6 shadow-2xl relative overflow-hidden text-center"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg mx-auto">🚪</div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold font-heading">{user.uid ? t('logout') : t('reset_data')}?</h3>
                <p className="text-xs opacity-60 leading-relaxed px-4">
                  {user.uid ? 'Are you sure you want to log out? You can sign back in anytime. ✨' : t('confirm_delete')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => setShowConfirmLogout(false)}
                  className="py-4 glass rounded-2xl font-bold font-heading text-mochi-blue"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    resetData();
                  }}
                  className="py-4 bg-red-400 text-white rounded-2xl font-bold font-heading shadow-lg"
                >
                  {user.uid ? 'Log Out' : 'Reset'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="glass p-4 rounded-3xl space-y-2">
      <div className={cn("p-2 rounded-xl bg-white/40 w-fit shadow-sm", color)}><Icon className="w-4 h-4" /></div>
      <div>
        <div className="text-lg font-bold font-heading">{value}</div>
        <div className="text-[10px] uppercase font-bold opacity-40 tracking-wider font-mono">{label}</div>
      </div>
    </div>
  );
}

function ThemeBtn({ icon: Icon, label, active, onClick, color, isPro }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border-2 relative",
        active ? "border-mochi-pink scale-105 shadow-md bg-white/40" : "border-transparent opacity-60 hover:opacity-100"
      )}
    >
      {isPro && !active && (
        <div className="absolute top-1 right-1">
          <Crown className="w-2.5 h-2.5 text-yellow-500" />
        </div>
      )}
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-sm", color)}><Icon className="w-5 h-5" /></div>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
      {isPro && (
        <span className="text-[7px] font-black bg-yellow-400 text-white px-1.5 rounded-full absolute -top-1 left-1.5 shadow-sm">PRO</span>
      )}
    </button>
  );
}

function SettingRow({ icon: Icon, label, desc, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 hover:bg-white/40 rounded-2xl transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-xl transition-colors", active ? "bg-mochi-pink text-white" : "bg-gray-200 text-gray-400")}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold font-heading">{label}</div>
          <div className="text-[9px] opacity-40">{desc}</div>
        </div>
      </div>
      <div className={cn("w-8 h-4 rounded-full relative transition-colors", active ? "bg-mochi-pink" : "bg-gray-300")}>
        <motion.div animate={{ x: active ? 16 : 2 }} className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full shadow-sm" />
      </div>
    </button>
  );
}



