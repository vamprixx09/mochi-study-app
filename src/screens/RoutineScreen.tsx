import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Plus, Calendar, Save, Trash2, Edit2, 
  Brain, Sparkles, CheckCircle2, Circle, 
  Coffee, Moon, Sun, BookOpen, PenTool, Layout,
  ChevronRight, AlertCircle, RefreshCcw
} from 'lucide-react';
import { RoutineBlock, DailyRoutine, UserProfile } from '../types';
import { getTranslation } from '../lib/translations';
import { generateDailyRoutine } from '../services/geminiService';

interface RoutineScreenProps {
  user: UserProfile;
  routine: DailyRoutine | null;
  onUpdateRoutine: (routine: DailyRoutine) => Promise<void>;
}

const BLOCK_TYPES = [
  { id: 'study', icon: BookOpen, color: 'bg-blue-100 text-blue-600', label: 'study_block' },
  { id: 'break', icon: Coffee, color: 'bg-green-100 text-green-600', label: 'break' },
  { id: 'revision', icon: RefreshCcw, color: 'bg-purple-100 text-purple-600', label: 'revision' },
  { id: 'quiz', icon: PenTool, color: 'bg-orange-100 text-orange-600', label: 'quiz' },
  { id: 'rest', icon: Moon, color: 'bg-indigo-100 text-indigo-600', label: 'rest' },
  { id: 'personal', icon: Sun, color: 'bg-yellow-100 text-yellow-600', label: 'personal' },
];

export const RoutineScreen: React.FC<RoutineScreenProps> = ({ user, routine, onUpdateRoutine }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<RoutineBlock | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGoals, setAiGoals] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Local state for builder
  const [blocks, setBlocks] = useState<RoutineBlock[]>(routine?.blocks || []);
  const [wakeUpTime, setWakeUpTime] = useState(routine?.wakeUpTime || '07:00');

  useEffect(() => {
    if (routine) {
      setBlocks(routine.blocks);
      setWakeUpTime(routine.wakeUpTime);
    }
  }, [routine]);

  const t = (key: string) => getTranslation(user.language || 'en', key);

  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [blocks]);

  const progress = useMemo(() => {
    if (blocks.length === 0) return 0;
    const completed = blocks.filter(b => b.completed).length;
    return Math.round((completed / blocks.length) * 100);
  }, [blocks]);

  const handleAddBlock = () => {
    const newBlock: RoutineBlock = {
      id: Date.now().toString(),
      title: 'New Activity',
      startTime: '08:00',
      duration: 60,
      type: 'study',
      completed: false
    };
    setSelectedBlock(newBlock);
    setIsEditing(true);
  };

  const handleSaveBlock = (block: RoutineBlock) => {
    const index = blocks.findIndex(b => b.id === block.id);
    let newBlocks;
    if (index >= 0) {
      newBlocks = blocks.map(b => b.id === block.id ? block : b);
    } else {
      newBlocks = [...blocks, block];
    }
    setBlocks(newBlocks);
    setIsEditing(false);
    setSelectedBlock(null);
    onUpdateRoutine({ blocks: newBlocks, wakeUpTime, updatedAt: new Date().toISOString() });
  };

  const handleDeleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    onUpdateRoutine({ blocks: newBlocks, wakeUpTime, updatedAt: new Date().toISOString() });
  };

  const toggleComplete = (id: string) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, completed: !b.completed } : b);
    setBlocks(newBlocks);
    onUpdateRoutine({ blocks: newBlocks, wakeUpTime, updatedAt: new Date().toISOString() });
  };

  const handleGenerateAI = async () => {
    if (!aiGoals.trim()) return;
    setIsLoading(true);
    try {
      const result = await generateDailyRoutine(aiGoals.split(','), routine);
      if (result) {
        const mappedBlocks: RoutineBlock[] = (result.blocks || []).map((b: any, i: number) => ({
          ...b,
          id: `ai-${Date.now()}-${i}`,
          completed: false
        }));
        setBlocks(mappedBlocks);
        setWakeUpTime(result.wakeUpTime || '07:00');
        onUpdateRoutine({ 
          blocks: mappedBlocks, 
          wakeUpTime: result.wakeUpTime || '07:00', 
          updatedAt: new Date().toISOString() 
        });
        setShowAIModal(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-sans text-gray-800">{t('my_daily_routine')} 🎀</h1>
          <p className="text-sm text-gray-500 font-sans">{t('routine_builder_desc') || 'Design your perfect study day'}</p>
        </div>
        <button 
          onClick={() => setShowAIModal(true)}
          className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors shadow-sm"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </header>

      {/* Progress Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-white/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Layout className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-medium text-gray-700">{t('progress')}</span>
          </div>
          <span className="text-2xl font-bold text-blue-500">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-linear-to-r from-blue-300 to-blue-500"
          />
        </div>
      </div>

      {/* Wake-up Time */}
      <div className="flex items-center justify-between bg-white/60 p-4 rounded-2xl border border-white/40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Sun className="w-5 h-5 text-yellow-500" />
          </div>
          <span className="font-medium text-gray-700">{t('wake_up')}</span>
        </div>
        <input 
          type="time" 
          value={wakeUpTime}
          onChange={(e) => {
            setWakeUpTime(e.target.value);
            onUpdateRoutine({ blocks, wakeUpTime: e.target.value, updatedAt: new Date().toISOString() });
          }}
          className="bg-white border-none rounded-lg p-1 text-gray-700 focus:ring-2 focus:ring-blue-100 transition-shadow outline-none"
        />
      </div>

      {/* Timeline View */}
      <div className="relative space-y-4 pl-4 border-l-2 border-gray-100/50">
        <AnimatePresence mode="popLayout">
          {sortedBlocks.map((block, index) => {
            const TypeIcon = BLOCK_TYPES.find(t => t.id === block.type)?.icon || BookOpen;
            const typeColor = BLOCK_TYPES.find(t => t.id === block.type)?.color || 'bg-gray-100 text-gray-600';

            return (
              <motion.div
                key={block.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                {/* Dot */}
                <div className={`absolute -left-[25px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-colors ${block.completed ? 'bg-green-400' : 'bg-gray-200'}`} />
                
                {/* Card */}
                <div className={`group bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50 flex items-center gap-4 transition-all hover:shadow-md ${block.completed ? 'opacity-75' : ''}`}>
                  <button 
                    onClick={() => toggleComplete(block.id)}
                    className="shrink-0"
                  >
                    {block.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-400 bg-blue-50 px-2 py-0.5 rounded-full">{block.startTime}</span>
                      <span className="text-xs text-gray-400 italic">({block.duration}m)</span>
                    </div>
                    <h3 className={`font-bold text-gray-800 truncate ${block.completed ? 'line-through text-gray-400' : ''}`}>
                      {block.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${typeColor}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={() => { setSelectedBlock(block); setIsEditing(true); }}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {blocks.length === 0 && (
          <div className="text-center py-12 bg-white/40 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-sans">{t('no_routine_yet') || 'No routine blocks yet. Tap + to start! 🍡'}</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAddBlock}
        className="fixed bottom-24 right-6 p-4 bg-linear-to-br from-blue-300 to-blue-500 text-white rounded-2xl shadow-lg shadow-blue-200 z-40"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && selectedBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                    <Edit2 className="w-6 h-6 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{t('edit_block')}</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('title')}</label>
                    <input 
                      type="text" 
                      value={selectedBlock.title}
                      onChange={(e) => setSelectedBlock({ ...selectedBlock, title: e.target.value })}
                      className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      placeholder="e.g. Morning Study"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('start_time') || 'Start Time'}</label>
                      <input 
                        type="time" 
                        value={selectedBlock.startTime}
                        onChange={(e) => setSelectedBlock({ ...selectedBlock, startTime: e.target.value })}
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('duration')}</label>
                      <input 
                        type="number" 
                        value={selectedBlock.duration}
                        onChange={(e) => setSelectedBlock({ ...selectedBlock, duration: parseInt(e.target.value) || 0 })}
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        placeholder="Mins"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">{t('type')}</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {BLOCK_TYPES.map((bt) => (
                        <button
                          key={bt.id}
                          onClick={() => setSelectedBlock({ ...selectedBlock, type: bt.id as any })}
                          className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${selectedBlock.type === bt.id ? bt.color + ' ring-2 ring-offset-2 ring-blue-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                          <bt.icon className="w-5 h-5" />
                          <span className="text-[10px] font-bold truncate w-full text-center">{t(bt.label)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                  >
                    {t('cancel_btn')}
                  </button>
                  <button 
                    onClick={() => handleSaveBlock(selectedBlock)}
                    className="flex-1 py-4 bg-linear-to-br from-blue-300 to-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:scale-[1.02] transition-all"
                  >
                    {t('save_btn')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Modal */}
      <AnimatePresence>
        {showAIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAIModal(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-50 rounded-2xl">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('perfect_routine')}</h2>
                    <p className="text-xs text-gray-400">{t('mochi_ai_assistant')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{t('ai_routine_prompt') || 'Tell Mochi your study goals (e.g., Exam in 2 weeks, need to study Math and Urdu, morning person)'}</p>
                  <textarea 
                    value={aiGoals}
                    onChange={(e) => setAiGoals(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-100 outline-none transition-all min-h-[120px] text-gray-700"
                    placeholder="Enter your goals..."
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowAIModal(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl"
                    disabled={isLoading}
                  >
                    {t('cancel_btn')}
                  </button>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isLoading || !aiGoals.trim()}
                    className="flex-1 py-4 bg-linear-to-br from-purple-300 to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Brain className="w-5 h-5" />
                        {t('generate_routine')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
