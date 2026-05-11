import React from 'react';
import { motion } from 'motion/react';
import { 
  Star, Check, Zap, Crown, Sparkles, Heart, Coffee, 
  ShieldCheck, ArrowRight, Palette, Brain, Layout, Instagram, Mail
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface PremiumScreenProps {
  user: UserProfile;
  onBack: () => void;
}

export default function PremiumScreen({ user, onBack }: PremiumScreenProps) {
  const handleUpgrade = () => {
    // Open Ko-fi or payment link
    window.open('https://ko-fi.com/vamp_rixx', '_blank');
  };

  const features = [
    { 
      icon: Palette, 
      label: 'Exclusive Themes', 
      free: 'Standard', 
      premium: 'Pro Themes',
      desc: 'Unlock Matcha, Sakura, Midnight, and 5+ more aesthetic themes. 🎨'
    },
    { 
      icon: Sparkles, 
      label: 'Custom Assets', 
      free: 'Limited', 
      premium: 'Full Access',
      desc: 'Unlock premium stickers, custom avatars, and home widgets. ✨'
    },
    { 
      icon: Brain, 
      label: 'Advanced AI Tools', 
      free: 'Standard', 
      premium: 'Pro Engine',
      desc: 'Priority access to high-accuracy flashcard AI & study plans. 🧠'
    },
    { 
      icon: Layout, 
      label: 'Premium Templates', 
      free: 'Basic', 
      premium: 'All Access',
      desc: 'Exclusive aesthetic templates for your study planner & habits. 🎀'
    }
  ];

  const tiers = [
    {
      id: 'starter',
      name: 'Starter Premium',
      price: '299 PKR',
      desc: 'For aesthetic personalization',
      features: ['Frames', 'Themes', 'Aesthetic packs'],
      icon: '🍥',
      color: 'bg-mochi-pink/20',
      textColor: 'text-[#8E414E]'
    },
    {
      id: 'full',
      name: 'Full Premium',
      price: '499 PKR',
      desc: 'For serious study productivity',
      features: ['Study modes', 'Flashcards', 'Templates', 'Productivity tools'],
      popular: true,
      icon: '⭐',
      color: 'bg-mochi-blue/20',
      textColor: 'text-[#2D5A8E]'
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: '999 PKR',
      desc: 'Limited Offer',
      features: ['Everything unlocked', 'Future updates included'],
      icon: '👑',
      color: 'bg-yellow-500/20',
      textColor: 'text-yellow-900'
    }
  ];

  return (
    <div className="min-h-screen bg-mochi-cream font-sans relative overflow-hidden pb-12">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-mochi-pink/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[10%] left-[-10%] w-64 h-64 bg-mochi-blue/20 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="p-6 flex items-center justify-between relative z-10">
        <button onClick={onBack} className="p-2 glass rounded-2xl text-mochi-pink">
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <div className="flex items-center gap-2">
           <Crown className="w-5 h-5 text-yellow-500 animate-pulse" />
           <span className="text-xs font-bold font-heading uppercase tracking-widest">Mochi Pro</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="px-6 space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-4xl shadow-xl border-4 border-mochi-pink/30"
          >
            👑
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black font-heading tracking-tight italic">𖦁ׅ⋆:Upgrade to Premium:⋆𖦁ׅ</h1>
            <p className="text-xs opacity-60 px-8 leading-relaxed italic">
              Support Mochi and unlock exclusive aesthetic features. One small step for you, one big snack for Mochi! 🍡
            </p>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="space-y-4">
          {tiers.map((tier, idx) => (
            <motion.div 
              key={tier.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "glass p-6 rounded-[2.5rem] bg-white/60 relative overflow-hidden border-2 transition-all hover:bg-white/80",
                tier.popular ? "border-mochi-blue shadow-blue-100 shadow-2xl scale-[1.02]" : "border-white/40"
              )}
            >
              {tier.popular && (
                <div className="absolute top-4 right-6">
                  <div className="bg-mochi-blue text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-bounce">Most Popular ⭐</div>
                </div>
              )}
              {tier.id === 'lifetime' && (
                <div className="absolute top-4 right-6">
                  <div className="bg-yellow-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Limited Offer ⌛</div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm", tier.color)}>
                    {tier.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className={cn("text-lg font-black font-heading italic tracking-tight", tier.textColor)}>{tier.name}</h3>
                    <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{tier.desc}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tier.features.map((feat, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[9px] font-black text-gray-800">
                      {feat}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-2xl font-black font-heading text-gray-900">{tier.price}</div>
                  <button 
                    onClick={handleUpgrade}
                    className={cn(
                      "px-6 py-3 rounded-2xl font-black font-heading text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg",
                      tier.id === 'full' ? "bg-mochi-blue text-white shadow-blue-100" : 
                      tier.id === 'lifetime' ? "bg-yellow-600 text-white shadow-yellow-100" :
                      "bg-[#8E414E] text-white shadow-pink-100"
                    )}
                  >
                    Select Plan
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 bg-white rounded-[2.5rem] border-2 border-mochi-blue/20 flex flex-col gap-3 shadow-sm">
           <p className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-mochi-blue">
             <ShieldCheck className="w-4 h-4" /> Manual Activation
           </p>
           <div className="space-y-2">
             <p className="text-[10px] leading-relaxed italic text-gray-700 font-bold">
               1. Select your preferred tier and pay on Ko-fi. <br/>
               2. Connect with me on Instagram or Email. <br/>
               3. Provide your account email and payment screenshot. <br/>
               4. I will manually unlock your Pro status! 🎀
             </p>
           </div>
        </div>

        {/* Comparison Table */}
        <div className="space-y-4">
           <h3 className="text-xs font-bold font-heading uppercase tracking-widest text-center opacity-30 italic px-4">Why go Premium?</h3>
           
           <div className="grid gap-3">
             {features.map((f, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="glass p-5 rounded-[2rem] flex items-center gap-4 group hover:bg-white/40 transition-colors"
               >
                 <div className="p-3 bg-white rounded-2xl shadow-sm text-mochi-pink group-hover:rotate-12 transition-transform">
                   <f.icon className="w-5 h-5" />
                 </div>
                 <div className="flex-1 space-y-1">
                   <div className="flex justify-between items-center">
                     <span className="text-xs font-bold font-heading">{f.label}</span>
                     <div className="flex gap-2">
                        <span className="text-[10px] opacity-30 strike font-mono">{f.free}</span>
                        <span className="text-[10px] font-bold text-mochi-blue font-mono">{f.premium}</span>
                     </div>
                   </div>
                   <p className="text-[9px] opacity-50 leading-relaxed italic">{f.desc}</p>
                 </div>
               </motion.div>
             ))}
           </div>
        </div>

        {/* Support Section */}
        <div className="glass p-8 rounded-[3rem] text-center space-y-6 bg-gradient-to-br from-mochi-blue/5 to-mochi-pink/5 border border-white">
           <div className="w-16 h-16 bg-white rounded-full mx-auto flex items-center justify-center text-3xl shadow-xl">🤍</div>
           <div className="space-y-2">
             <h3 className="text-lg font-bold font-heading">Support the Creator</h3>
             <p className="text-xs opacity-60 italic leading-relaxed px-4">
               Mochi is built with love by a student. Your support helps cover server costs and keeps Mochi updated! ˗ˋˏ made with heart ˎˊ˗
             </p>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => window.open('https://ko-fi.com/vamp_rixx', '_blank')}
                className="py-4 glass rounded-2xl text-[10px] font-bold font-heading uppercase flex items-center justify-center gap-2 hover:bg-white/50 transition-all"
              >
                <Coffee className="w-4 h-4" /> Ko-fi
              </button>
              <button 
                onClick={() => window.open('https://www.instagram.com/vamp_.rixx/', '_blank')}
                className="py-4 glass rounded-2xl text-[10px] font-bold font-heading uppercase flex items-center justify-center gap-2 hover:bg-white/50 transition-all"
              >
                <Instagram className="w-4 h-4" /> Instagram
              </button>
           </div>
           <button 
             onClick={() => window.location.href = 'mailto:vamprixx55@gmail.com'}
             className="w-full py-4 glass rounded-2xl text-[10px] font-bold font-heading uppercase flex items-center justify-center gap-2 hover:bg-white/50 transition-all"
           >
             <Mail className="w-4 h-4" /> Email Creator
           </button>
        </div>

        {/* Footer */}
        <div className="pt-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 opacity-20">
             <ShieldCheck className="w-3 h-3" />
             <span className="text-[8px] font-bold uppercase tracking-widest">Verified Payment System</span>
          </div>
          <p className="text-[9px] text-center opacity-40 max-w-[200px]">
             Premium status is permanent and linked to your Google account. Refunds are available if Mochi is mean to you! 🍡
          </p>
        </div>
      </div>
    </div>
  );
}
