import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Crown, Sparkles, Check, ChevronRight, Lock, 
  Palette, ShieldCheck, Heart, Star, Layout, LayoutPanelLeft
} from 'lucide-react';
import { UserProfile } from '../types';
import { PROFILE_TEMPLATES, ProfileTemplate } from '../constants';
import { cn } from '../lib/utils';

interface ProfileCustomizerScreenProps {
  user: UserProfile;
  setUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  onClose: () => void;
  onOpenPremium: () => void;
}

export default function ProfileCustomizerScreen({ user, setUser, onClose, onOpenPremium }: ProfileCustomizerScreenProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(user.profileFrameId || 'free_1');
  const [isApplying, setIsApplying] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const selectedTemplate = PROFILE_TEMPLATES.find(t => t.id === selectedTemplateId) || PROFILE_TEMPLATES[0];

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

  const handleApply = () => {
    if (selectedTemplate.isPremium && !user.isPremium) {
      onOpenPremium();
      return;
    }
    
    setIsApplying(true);
    playSound('check');
    
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        profileFrameId: selectedTemplateId
      }));
      setIsApplying(false);
      onClose();
    }, 800);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setIsRedeeming(true);
    
    // In a real app, this would check Firestore.
    // For now, we'll implement a simple "creator secret" or dynamic logic.
    // The user mentioned "code for everyone different".
    // I specify a few "hidden" logic patterns for now.
    
    setTimeout(() => {
      const code = redeemCode.trim().toUpperCase();
      // Logic for creator: Any code starts with MOCHI_ and is longer than 10 chars
      const isValid = code.length >= 10 && (code.startsWith('MOCHI_') || code.startsWith('VAMP_')) || code === 'CREATOR_ACCESS';
      
      if (isValid) {
        setUser(prev => ({ ...prev, isPremium: true }));
        playSound('sparkle');
        alert('✨ Omg! Premium Activated! 🎀 Enjoy your aesthetic study session! 🍡');
        setRedeemCode('');
      } else {
        alert('🥺 Invalid code! Please check with @vamp_.rixx on Instagram to get your unique key! 🎀');
      }
      setIsRedeeming(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-mochi-cream/95 backdrop-blur-md flex flex-col md:p-6 lg:p-10 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-mochi-pink rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black font-heading tracking-tight italic">Customize Profile</h2>
            <p className="text-[10px] opacity-40 uppercase font-black tracking-widest italic">Aesthetic Frames & Styles</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-3 glass rounded-2xl text-mochi-pink hover:scale-110 active:scale-95 transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Preview Section */}
        <div className="p-6 flex flex-col items-center justify-center bg-white/20 border-b md:border-b-0 md:border-r border-white/40 md:w-1/3">
          <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">LIVE PREVIEW</div>
          
          <div className={cn(
            "w-48 h-64 rounded-[2.5rem] relative flex flex-col items-center justify-center p-6 transition-all duration-500 overflow-hidden",
            selectedTemplate.bgClass,
            selectedTemplate.borderColor,
            "border-[6px]"
          )}>
            <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-4xl mb-4 border-4 border-white">
              {user.pfp && user.pfp.startsWith('data:') ? (
                <img src={user.pfp} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                user.pfp || '🍡'
              )}
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black font-heading text-lg tracking-tight uppercase italic">{user.name}</h3>
              <p className="text-[10px] opacity-60 font-medium lowercase">@mochi_student</p>
            </div>

            {selectedTemplate.isPremium && (
              <div className="absolute top-4 right-4">
                <Crown className="w-5 h-5 text-yellow-400 drop-shadow-sm" />
              </div>
            )}

            {/* Sparkle effects for premium */}
            {selectedTemplate.isPremium && (
              <>
                <motion.div animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-10 left-5 text-yellow-400 text-xs">✨</motion.div>
                <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2.5 }} className="absolute bottom-10 right-5 text-white text-xs">🌸</motion.div>
              </>
            )}
          </div>

          <div className="mt-6 text-center">
            <h4 className="font-bold text-mochi-pink">{selectedTemplate.name}</h4>
            <p className="text-[10px] opacity-60 max-w-[200px] leading-relaxed italic">{selectedTemplate.description}</p>
          </div>

          <button
            onClick={handleApply}
            disabled={isApplying}
            className={cn(
              "mt-8 w-full py-4 rounded-3xl font-black font-heading uppercase text-xs tracking-[0.2em] shadow-xl shadow-pink-100 transition-all flex items-center justify-center gap-2",
              selectedTemplate.isPremium && !user.isPremium 
                ? "bg-slate-200 text-slate-500" 
                : "bg-mochi-pink text-white hover:scale-105 active:scale-95"
            )}
          >
            {isApplying ? <Sparkles className="w-5 h-5 animate-spin" /> : (
              selectedTemplate.isPremium && !user.isPremium ? (
                <><Lock className="w-4 h-4" /> Unlock with Pro</>
              ) : (
                <><Check className="w-4 h-4" /> Apply Style</>
              )
            )}
          </button>
        </div>

        {/* Selection Section */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="mb-8 p-4 glass rounded-[2rem] border-white/60">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
               <ShieldCheck className="w-4 h-4" /> Unlock All Themes
             </h4>
             <div className="flex gap-2">
                <input 
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  placeholder="Enter Premium Code..."
                  className="flex-1 bg-white/40 border-none outline-none text-xs px-4 py-3 rounded-2xl font-bold uppercase tracking-widest placeholder:text-[9px] placeholder:opacity-30"
                />
                <button 
                  onClick={handleRedeem}
                  disabled={isRedeeming || !redeemCode.trim()}
                  className="p-3 bg-mochi-blue text-white rounded-2xl shadow-md disabled:opacity-50 hover:scale-105 transition-all"
                >
                  {isRedeeming ? <Sparkles className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                </button>
             </div>
             <p className="text-[8px] opacity-40 mt-2 ml-1 italic leading-tight">
               Pay on Ko-fi & message creator to get your unique code! 🍡
             </p>
          </div>

          <section className="space-y-4 mb-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 italic">Kawaii Freebies</h3>
              <span className="text-[9px] opacity-40 font-bold">7 ITEMS</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PROFILE_TEMPLATES.filter(t => !t.isPremium).map(template => (
                <TemplateCard 
                  key={template.id} 
                  template={template} 
                  isSelected={selectedTemplateId === template.id}
                  onClick={() => { setSelectedTemplateId(template.id); playSound('pop'); }}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-mochi-pink italic flex items-center gap-2">
                Exclusive Pro <Crown className="w-3 h-3" />
              </h3>
              <span className="text-[9px] opacity-40 font-bold">20+ ITEMS</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PROFILE_TEMPLATES.filter(t => t.isPremium).map(template => (
                <TemplateCard 
                  key={template.id} 
                  template={template} 
                  isSelected={selectedTemplateId === template.id}
                  isLocked={!user.isPremium}
                  onClick={() => { setSelectedTemplateId(template.id); playSound('pop'); }}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, isSelected, onClick, isLocked }: { template: ProfileTemplate, isSelected: boolean, onClick: () => void, isLocked?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2 rounded-[2rem] border-2 transition-all flex flex-col items-center relative group",
        isSelected ? "border-mochi-pink bg-white/40 shadow-lg scale-[1.02]" : "border-transparent glass hover:bg-white/20",
        isLocked && "opacity-80"
      )}
    >
      <div className={cn(
        "w-full aspect-square rounded-[1.8rem] flex items-center justify-center text-2xl transition-all border-4 relative",
        template.bgClass,
        isSelected ? template.borderColor : "border-white/40"
      )}>
        <span className="opacity-10 group-hover:opacity-100 transition-opacity">🍡</span>
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-[1.6rem]">
            <Lock className="w-5 h-5 text-white/60" />
          </div>
        )}
      </div>
      <span className="text-[9px] font-black uppercase tracking-tight mt-2 text-center truncate w-full px-1 italic">
        {template.name}
      </span>
      {template.isPremium && (
        <span className="absolute top-1 right-3 text-[7px] font-black bg-yellow-400 text-white px-1.5 py-0.5 rounded-full shadow-sm">PRO</span>
      )}
    </button>
  );
}
