import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  Settings, 
  Megaphone, 
  Save, 
  ArrowLeft,
  Sparkles,
  BarChart3,
  Heart,
  Palette,
  Crown,
  X,
  Calendar,
  Clock,
  History,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, query, updateDoc, orderBy, arrayUnion } from 'firebase/firestore';
import { db, handleFirestoreError, auth } from '../lib/firebase';
import { SystemConfig, OperationType, UserProfile, PremiumHistoryEntry } from '../types';
import { cn } from '../lib/utils';
import { calculateExpiryDate } from '../lib/premiumUtils';
import { AnimatePresence } from 'motion/react';

interface CreatorDashboardProps {
  onBack: () => void;
}

export default function CreatorDashboard({ onBack }: CreatorDashboardProps) {
  const [config, setConfig] = useState<SystemConfig>({
    broadcastMessage: '',
    maintenanceMode: false,
    totalUsersCount: 0,
    footerCredits: '˗ˋˏ made by vamprixx ˎˊ˗'
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'users'>('system');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, 'system', 'config');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig(docSnap.data() as SystemConfig);
        }

        const usersSnap = await getDocs(query(collection(db, 'users')));
        const usersList = usersSnap.docs.map(doc => doc.data() as UserProfile);
        setUsers(usersList);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'system');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'system', 'config'), config);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system/config');
    } finally {
      setSaving(false);
    }
  };

  const handleUpgradeClick = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async (plan: 'starter' | 'full' | 'lifetime' | 'none') => {
    if (!selectedUser?.uid) return;
    
    setUpgrading(true);
    try {
      if (plan === 'none') {
        const userRef = doc(db, 'users', selectedUser.uid);
        await updateDoc(userRef, {
          isPremium: false,
          premiumPlan: 'none',
          premiumExpiresAt: null
        });
        setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { 
          ...u, 
          isPremium: false, 
          premiumPlan: 'none', 
          premiumExpiresAt: undefined 
        } : u));
        setShowUpgradeModal(false);
        alert(`User ${selectedUser.name} downgrade to Free successful! 🍡`);
        return;
      }

      const activatedAt = new Date().toISOString();
      const expiresAt = calculateExpiryDate(plan);
      const userRef = doc(db, 'users', selectedUser.uid);
      
      const newHistoryEntry: PremiumHistoryEntry = {
        plan,
        activatedAt,
        expiresAt,
        adminEmail: auth.currentUser?.email || 'vamprixx@creator.sys'
      };

      const updateData = {
        isPremium: true,
        premiumPlan: plan,
        premiumActivatedAt: activatedAt,
        premiumExpiresAt: expiresAt || null,
        premiumHistory: arrayUnion(newHistoryEntry)
      };

      await updateDoc(userRef, updateData);
      
      setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? { 
        ...u, 
        ...updateData, 
        premiumHistory: [...(u.premiumHistory || []), newHistoryEntry] 
      } : u));
      
      setShowUpgradeModal(false);
      alert(`User ${selectedUser.name} upgraded to ${plan}! ✨`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${selectedUser.uid}`);
    } finally {
      setUpgrading(false);
    }
  };

  const handleDowngrade = async (user: UserProfile) => {
    if (!user.uid || !window.confirm(`Are you sure you want to downgrade ${user.name} to FREE?`)) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isPremium: false,
        premiumPlan: 'none',
        premiumExpiresAt: null
      });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { 
        ...u, 
        isPremium: false, 
        premiumPlan: 'none', 
        premiumExpiresAt: undefined 
      } : u));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-[999] bg-[#FDFBF7] flex flex-col overflow-hidden"
    >

      {/* Header */}
      <header className="p-6 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="p-2 glass rounded-xl hover:scale-105 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-[#2D5A8E]" />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8E414E]" />
            <h1 className="font-sans font-bold text-[#2D5A8E] text-lg tracking-tight">Creator Authority</h1>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2D5A8E]">vamprixx system controls</span>
        </div>
        <div className="w-9" />
      </header>

      {/* Tabs */}
      <div className="flex px-6 gap-2 mb-4 shrink-0">
        <button 
          onClick={() => setActiveTab('system')}
          className={cn(
            "flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'system' ? "bg-[#2D5A8E] text-white shadow-lg" : "bg-white/40 text-[#2D5A8E] opacity-70"
          )}
        >
          System
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={cn(
            "flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'users' ? "bg-[#2D5A8E] text-white shadow-lg" : "bg-white/40 text-[#2D5A8E] opacity-70"
          )}
        >
          Users ({users.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
        <div className="max-w-md mx-auto">
          {activeTab === 'system' ? (
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-4 rounded-3xl flex flex-col items-center gap-2 border border-blue-100 bg-white/60">
                   <Users className="w-5 h-5 text-[#2D5A8E]" />
                  <div className="text-center">
                    <span className="block text-xl font-black text-[#2D5A8E]">{users.length}</span>
                    <span className="text-[10px] font-black uppercase text-[#2D5A8E]">Total Userbase</span>
                  </div>
                </div>
                <div className="glass p-4 rounded-3xl flex flex-col items-center gap-2 border border-pink-100 bg-white/60">
                   <BarChart3 className="w-5 h-5 text-[#8E414E]" />
                  <div className="text-center">
                    <span className="block text-xl font-black text-[#8E414E]">Active</span>
                    <span className="text-[10px] font-black uppercase text-[#8E414E]">System Status</span>
                  </div>
                </div>
              </div>

              {/* Broadcast Section */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                   <Megaphone className="w-4 h-4 text-[#2D5A8E]" />
                  <h2 className="text-[10px] font-black text-[#2D5A8E] uppercase tracking-widest">Global Broadcast</h2>
                </div>
                <div className="glass p-5 rounded-[2rem] bg-white space-y-4">
                  <textarea 
                    value={config.broadcastMessage}
                    onChange={(e) => setConfig({...config, broadcastMessage: e.target.value})}
                    placeholder="Type a message to all users..."
                    className="w-full bg-pink-50/30 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-mochi-lavender min-h-[100px] resize-none text-gray-800 font-medium"
                  />
                </div>
              </section>

              {/* Configuration */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                   <Palette className="w-4 h-4 text-[#2D5A8E]" />
                  <h2 className="text-[10px] font-black text-[#2D5A8E] uppercase tracking-widest">Global Identity</h2>
                </div>
                <div className="glass p-6 rounded-[2rem] bg-white space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase ml-1 text-[#2D5A8E]">Footer Message</label>
                    <input 
                      value={config.footerCredits}
                      onChange={(e) => setConfig({...config, footerCredits: e.target.value})}
                      className="w-full bg-pink-50/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#2D5A8E] text-gray-800 font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-pink-50/20 rounded-2xl border border-pink-50">
                    <div className="flex items-center gap-3">
                       <Settings className="w-4 h-4 text-[#2D5A8E]" />
                      <div>
                        <span className="block text-xs font-black text-[#2D5A8E]">Maintenance Mode</span>
                        <span className="text-[10px] font-bold text-[#2D5A8E]">Block non-admins</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative",
                        config.maintenanceMode ? "bg-red-500" : "bg-[#2D5A8E]/40"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                        config.maintenanceMode ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </section>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full py-5 bg-[#2D5A8E] text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Sparkles className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'UPDATING...' : 'SAVE SYSTEM CONFIG'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-4 glass bg-white focus:bg-white/90 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#2D5A8E] font-bold text-gray-800"
                />
              </div>

              {/* User List */}
              <div className="space-y-3">
                {filteredUsers.map((u) => (
                  <div key={u.uid} className="glass p-4 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => {
                          setSelectedUser(u);
                          setShowHistoryModal(true);
                        }}
                      >
                        {u.pfp || '🍡'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-heading text-gray-800 truncate max-w-[100px]" title={u.name}>{u.name || 'Anonymous Mochi'}</span>
                          {u.isPremium && <Crown className="w-3 h-3 text-yellow-500 shrink-0" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] opacity-70 font-bold block truncate max-w-[100px] text-gray-500">
                            {u.email}
                          </span>
                          {u.isPremium && (
                    <span className="text-[8px] font-black text-[#8E414E] uppercase tracking-tighter">
                      {u.premiumPlan || 'full'} • Expires: {u.premiumExpiresAt ? new Date(u.premiumExpiresAt).toLocaleDateString() : 'Lifetime'}
                    </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                  <div className="flex gap-1">
                       <button 
                        onClick={() => handleUpgradeClick(u)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                          u.isPremium 
                            ? "bg-yellow-500 text-white shadow-lg shadow-yellow-100" 
                            : "bg-white border-2 border-mochi-blue/20 text-[#2D5A8E] hover:bg-yellow-50"
                        )}
                      >
                        {u.isPremium ? 'MANAGE' : 'UPGRADE'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2 pt-8 pb-32">
             <Heart className="w-4 h-4 text-[#8E414E] fill-[#8E414E] animate-pulse" />
             <span className="text-[10px] font-bold text-[#2D5A8E] uppercase tracking-widest italic tracking-tighter">Verified Creator: vamprixx</span>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass rounded-[3rem] p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">👑</div>
                  <div>
                    <h3 className="text-sm font-black font-heading text-[#2D5A8E] uppercase tracking-tight">Upgrade User</h3>
                    <p className="text-[10px] font-bold text-gray-800">{selectedUser.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="p-2 glass rounded-full text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-1">Choose Premium Plan</p>
                <div className="grid grid-cols-1 gap-2">
                  <PlanOption 
                    icon="🩷" 
                    title="Starter Premium" 
                    desc="30 Days | Starter Features" 
                    onClick={() => confirmUpgrade('starter')}
                    disabled={upgrading}
                  />
                  <PlanOption 
                    icon="🍥" 
                    title="Full Premium" 
                    desc="90 Days | All Pro Features" 
                    onClick={() => confirmUpgrade('full')}
                    disabled={upgrading}
                  />
                  <PlanOption 
                    icon="👑" 
                    title="Lifetime Premium" 
                    desc="Permanent Access | No Expiry" 
                    onClick={() => confirmUpgrade('lifetime')}
                    disabled={upgrading}
                  />
                  <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                    <button 
                      onClick={() => confirmUpgrade('none')}
                      disabled={upgrading}
                      className="w-full p-4 bg-red-50 hover:bg-red-100/80 rounded-2xl flex items-center justify-between border border-red-100 group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-red-400 shadow-sm"><X className="w-4 h-4" /></div>
                        <div className="text-left">
                          <div className="text-xs font-black font-heading text-red-500">REMOVE PREMIUM</div>
                          <div className="text-[9px] font-bold text-red-400/70">Revert user to free plan</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-100/30 rounded-2xl border border-[#2D5A8E]/30">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-[#2D5A8E] mt-0.5" />
                  <p className="text-[9px] text-[#2D5A8E] font-bold leading-relaxed">
                    Upgrading will instantly unlock themes, custom stickers, and advanced AI features for this user. A record will be kept in their upgrade history.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm glass rounded-[3rem] p-8 space-y-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">
                    {selectedUser.pfp || '🍡'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-heading text-[#2D5A8E] uppercase tracking-tight">Upgrade History</h3>
                    <p className="text-[10px] font-bold text-gray-800">{selectedUser.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="p-2 glass rounded-full text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {!selectedUser.premiumHistory || selectedUser.premiumHistory.length === 0 ? (
                  <div className="text-center py-10 opacity-30 italic text-xs">No upgrade history found.</div>
                ) : (
                  selectedUser.premiumHistory.slice().reverse().map((entry, i) => (
                    <div key={i} className="glass p-4 rounded-2xl bg-white space-y-2 border border-gray-100">
                      <div className="flex items-center justify-between">
                         <span className={cn(
                           "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                           entry.plan === 'lifetime' ? "bg-yellow-100 text-yellow-600" : "bg-mochi-pink/10 text-mochi-pink"
                         )}>
                           {entry.plan}
                         </span>
                         <span className="text-[8px] font-bold opacity-30">{new Date(entry.activatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500">
                           <Calendar className="w-3 h-3" />
                           Activated: {new Date(entry.activatedAt).toLocaleString()}
                        </div>
                        {entry.expiresAt && (
                          <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500">
                            <Clock className="w-3 h-3" />
                            Expires: {new Date(entry.expiresAt).toLocaleString()}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[8px] font-black text-[#2D5A8E] uppercase tracking-widest">
                           <ShieldCheck className="w-2.5 h-2.5" />
                           Admin: {entry.adminEmail?.split('@')[0]}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PlanOption({ icon, title, desc, onClick, disabled }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className="w-full p-4 glass bg-white hover:bg-pink-50/30 rounded-2xl flex items-center justify-between group transition-all active:scale-[0.98] border border-transparent hover:border-pink-200 disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl group-hover:scale-125 transition-transform">{icon}</div>
        <div className="text-left">
          <div className="text-xs font-black font-heading text-gray-800">{title}</div>
          <div className="text-[9px] font-bold text-gray-600">{desc}</div>
        </div>
      </div>
      <div className="p-2 glass rounded-xl text-mochi-pink opacity-0 group-hover:opacity-100 transition-opacity">
        <CheckCircle2 className="w-4 h-4" />
      </div>
    </button>
  );
}
