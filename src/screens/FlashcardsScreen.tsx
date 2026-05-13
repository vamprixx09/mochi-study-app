import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, Brain, RotateCcw, Check, ChevronLeft, ChevronRight, Trash2, Edit2, Loader2, X, Download } from 'lucide-react';
import { UserProfile, Flashcard } from '../types';
import { generateFlashcards } from '../services/geminiService';
import { isFeatureUnlocked } from '../lib/premiumUtils';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { getTranslation } from '../lib/translations';
import { exportToPDF } from '../lib/exportUtils';

interface FlashcardsScreenProps {
  flashcards: Flashcard[];
  setFlashcards: (cards: Flashcard[] | ((prev: Flashcard[]) => Flashcard[])) => void;
  user: UserProfile;
  onOpenPremium: () => void;
}

export default function FlashcardsScreen({ flashcards, setFlashcards, user, onOpenPremium }: FlashcardsScreenProps) {
  const [activeView, setActiveView] = useState<'list' | 'quiz'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const t = (key: string) => getTranslation(user.language || 'en', key);

  const playSound = (soundName: string) => {
    if (!user.soundEnabled) return;
    const sounds: Record<string, string> = {
      pop: 'https://www.soundjay.com/misc/sounds/pop-up-02.mp3',
      sparkle: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
      check: 'https://www.soundjay.com/interface/sounds/beep-07.mp3',
      success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
    };
    const audio = new Audio(sounds[soundName] || sounds.pop);
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed', e));
  };
  const [quizCards, setQuizCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  const startQuiz = () => {
    if (flashcards.length === 0) {
      setShowAddModal(true);
      return;
    }
    // Shuffle and pick cards that need review
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setQuizCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCount(0);
    setActiveView('quiz');
  };

  const handleAIAdd = async () => {
    if (!aiTopic) return;
    
    if (!isFeatureUnlocked(user, 'ai_tools')) {
      onOpenPremium();
      return;
    }

    setIsLoading(true);
    try {
      const newCards = await generateFlashcards(aiTopic);
      const formatted = newCards.map(c => ({
        ...c,
        id: uuidv4(),
        subject: aiTopic,
        mastery: 0,
        lastReviewed: null
      }));
      setFlashcards(prev => [...prev, ...formatted]);
      setShowAIModal(false);
      setAiTopic('');
    } catch (error) {
      console.error(error);
      alert("Failed to generate flashcards. Mochi is having a little trouble thinking... 🥺");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCard = (id: string) => {
    setFlashcards(prev => prev.filter(c => c.id !== id));
  };

  const handleExportFlashcards = () => {
    let content = `
      <h2>${t('flashcards')} Guide</h2>
      ${flashcards.map(f => `
        <div class="card">
          <div class="question">Q: ${f.front}</div>
          <div class="answer">A: ${f.back}</div>
          <div style="font-size: 0.7rem; opacity: 0.5; margin-top: 0.5rem;">Subject: ${f.subject}</div>
        </div>
      `).join('')}
    `;
    exportToPDF(content, "Mochi_Flashcards.pdf");
  };

  const handleQuizAnswer = (mastered: boolean) => {
    const card = quizCards[currentIndex];
    
    // Update master level in main state
    setFlashcards(prev => prev.map(c => {
      if (c.id === card.id) {
        return {
          ...c,
          mastery: mastered ? Math.min(5, c.mastery + 1) : Math.max(0, c.mastery - 1),
          lastReviewed: new Date().toISOString()
        };
      }
      return c;
    }));

    if (mastered) {
      setMasteredCount(prev => prev + 1);
      playSound('check');

      if (currentIndex === quizCards.length - 1) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFB7C5', '#C5B9E0', '#C5E6D6']
        });
        
        setTimeout(() => {
          playSound('success');
        }, 500);
      }
    }

    if (currentIndex < quizCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    } else {
      // Quiz finished
      setTimeout(() => setActiveView('list'), 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-heading">{t('flashcards_header')}</h2>
          {activeView === 'list' && (
            <div className="flex gap-2">
              <button 
                onClick={handleExportFlashcards}
                className="p-2 glass rounded-full text-mochi-blue hover:bg-white/60"
                title={t('export_pdf')}
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowAIModal(true)}
                className="p-2 glass rounded-full text-mochi-lavender hover:bg-white/60"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="p-2 bg-mochi-pink text-white rounded-full shadow-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex p-1 glass rounded-2xl">
          <button
            onClick={() => setActiveView('list')}
            className={cn(
              "flex-1 py-2 text-sm font-bold font-heading rounded-xl transition-all",
              activeView === 'list' ? "bg-white shadow-sm text-gray-800" : "text-gray-400"
            )}
          >
            {t('my_cards')}
          </button>
          <button
            onClick={startQuiz}
            className={cn(
              "flex-1 py-2 text-sm font-bold font-heading rounded-xl transition-all",
              activeView === 'quiz' ? "bg-white shadow-sm text-gray-800" : "text-gray-400"
            )}
          >
            {t('quiz_mode')}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {flashcards.length === 0 ? (
              <div className="text-center py-20 opacity-40 italic">
                {t('no_cards')}
              </div>
            ) : (
              flashcards.map(card => (
                <div key={card.id} className="glass p-4 rounded-3xl group flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase font-bold text-mochi-lavender mb-1">{card.subject}</div>
                    <div className="font-bold text-sm mb-1">{card.front}</div>
                    <div className="text-xs opacity-60 italic">{card.back}</div>
                  </div>
                  <button onClick={() => deleteCard(card.id)} className="text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-8 py-4"
          >
            {/* Progress */}
            <div className="w-full space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider opacity-60">
                <span>{t('progress')}</span>
                <span>{currentIndex + 1} / {quizCards.length}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-mochi-pink"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / quizCards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* The Card */}
            <div 
              className="perspective-1000 w-full max-w-sm aspect-[3/4] cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="relative w-full h-full preserve-3d transition-all duration-500"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden glass rounded-[3rem] p-8 flex flex-col items-center justify-center text-center shadow-xl border-white/60">
                  <span className="text-[10px] uppercase font-bold text-mochi-lavender absolute top-8 ring-1 ring-mochi-lavender/30 px-2 py-0.5 rounded-full">
                    {quizCards[currentIndex]?.subject}
                  </span>
                  <div className="text-2xl font-bold font-heading">{quizCards[currentIndex]?.front}</div>
                  <div className="absolute bottom-8 text-[10px] opacity-40 uppercase font-bold tracking-widest">{t('tap_to_reveal')}</div>
                </div>

                {/* Back */}
                <div 
                  className="absolute inset-0 backface-hidden glass rounded-[3rem] p-8 flex flex-col items-center justify-center text-center shadow-xl border-white/60"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <div className="text-lg font-medium font-sans leading-relaxed text-gray-700">{quizCards[currentIndex]?.back}</div>
                </div>
              </motion.div>
            </div>

            {/* Answer Buttons */}
            <div className="flex gap-4 w-full">
              <button
                onClick={(e) => { e.stopPropagation(); handleQuizAnswer(false); }}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl glass text-mochi-pink hover:bg-white transition-all font-bold"
              >
                <RotateCcw className="w-5 h-5" /> {t('again')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleQuizAnswer(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl bg-mochi-lavender text-white shadow-lg shadow-mochi-lavender/30 hover:scale-105 transition-all font-bold"
              >
                <Check className="w-5 h-5" /> {t('got_it')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm glass rounded-[2.5rem] p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-mochi-pink" /> {t('ai_generator')}
              </h3>
              <button onClick={() => setShowAIModal(false)}><X className="w-5 h-5 opacity-40" /></button>
            </div>
            <p className="text-xs opacity-60">{t('ai_gen_desc')}</p>
            <textarea
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder={t('topic_placeholder')}
              className="w-full h-32 p-4 bg-white/20 border-none outline-none rounded-2xl text-sm italic"
            />
            <button
              onClick={handleAIAdd}
              disabled={isLoading || !aiTopic}
              className="w-full py-4 bg-mochi-pink text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:bg-gray-200"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('generate_cards_btn')}
            </button>
          </motion.div>
        </div>
      )}

      {/* Add Modal stub for symmetry */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm glass rounded-[2.5rem] p-6 shadow-2xl space-y-4"
          >
             <h3 className="text-xl font-bold font-heading">{t('new_card_header')}</h3>
             <input placeholder={t('front_placeholder')} id="card-front" className="w-full p-4 bg-white/20 border-none outline-none rounded-2xl text-sm" />
             <input placeholder={t('back_placeholder')} id="card-back" className="w-full p-4 bg-white/20 border-none outline-none rounded-2xl text-sm" />
             <input placeholder={t('subject_label')} id="card-subj" className="w-full p-4 bg-white/20 border-none outline-none rounded-2xl text-sm" />
             <button
              onClick={() => {
                const front = (document.getElementById('card-front') as HTMLInputElement).value;
                const back = (document.getElementById('card-back') as HTMLInputElement).value;
                const subject = (document.getElementById('card-subj') as HTMLInputElement).value;
                if(front && back) {
                  setFlashcards(prev => [...prev, { id: uuidv4(), front, back, subject: subject || 'General', mastery: 0, lastReviewed: null }]);
                  setShowAddModal(false);
                }
              }}
              className="w-full py-4 bg-mochi-mint text-white rounded-2xl font-bold"
            >
              {t('add_card_btn')}
            </button>
            <button onClick={() => setShowAddModal(false)} className="w-full py-2 text-xs opacity-40">{t('cancel_btn')}</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
