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
  Crown
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, getDocs, query, updateDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { SystemConfig, OperationType, UserProfile } from '../types';
import { cn } from '../lib/utils';

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

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { isPremium: !currentStatus });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, isPremium: !currentStatus } : u));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-50 bg-[#FDFBF7] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-6 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="p-2 glass rounded-xl hover:scale-105 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-mochi-blue" />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8E414E]" />
            <h1 className="font-sans font-bold text-[#2D5A8E] text-lg tracking-tight">Creator Authority</h1>
          </div>
          <span className="text-[9px] font-black opacity-60 uppercase tracking-[0.3em] text-[#2D5A8E]">vamprixx system controls</span>
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
                    <span className="text-[10px] font-black opacity-60 uppercase text-[#2D5A8E]">Total Userbase</span>
                  </div>
                </div>
                <div className="glass p-4 rounded-3xl flex flex-col items-center gap-2 border border-pink-100 bg-white/60">
                   <BarChart3 className="w-5 h-5 text-[#8E414E]" />
                  <div className="text-center">
                    <span className="block text-xl font-black text-[#8E414E]">Active</span>
                    <span className="text-[10px] font-black opacity-60 uppercase text-[#8E414E]">System Status</span>
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
                    <label className="text-[10px] font-black opacity-60 uppercase ml-1 text-[#2D5A8E]">Footer Message</label>
                    <input 
                      value={config.footerCredits}
                      onChange={(e) => setConfig({...config, footerCredits: e.target.value})}
                      className="w-full bg-pink-50/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mochi-blue text-gray-800 font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-pink-50/20 rounded-2xl border border-pink-50">
                    <div className="flex items-center gap-3">
                       <Settings className="w-4 h-4 text-[#2D5A8E]" />
                      <div>
                        <span className="block text-xs font-black text-[#2D5A8E]">Maintenance Mode</span>
                        <span className="text-[10px] font-bold opacity-60 text-[#2D5A8E]">Block non-admins</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative",
                        config.maintenanceMode ? "bg-red-400" : "bg-mochi-blue/40"
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
                  className="w-full p-4 glass bg-white focus:bg-white/90 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-mochi-blue font-bold text-gray-800"
                />
              </div>

              {/* User List */}
              <div className="space-y-3">
                {filteredUsers.map((u) => (
                  <div key={u.uid} className="glass p-4 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">
                        {u.pfp || '🍡'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-heading text-gray-800 truncate max-w-[120px]" title={u.name}>{u.name || 'Anonymous Mochi'}</span>
                          {u.isPremium && <Crown className="w-3 h-3 text-yellow-500 shrink-0" />}
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(u.email || '');
                            alert('Email copied! 🍡');
                          }}
                          className="text-[10px] opacity-70 font-bold block truncate max-w-[120px] text-gray-500 hover:text-mochi-blue transition-colors text-left" 
                          title={`Click to copy: ${u.email}`}
                        >
                          {u.email}
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => togglePremium(u.uid!, !!u.isPremium)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                        u.isPremium 
                          ? "bg-yellow-500 text-white shadow-lg shadow-yellow-100" 
                          : "bg-white border-2 border-mochi-blue/20 text-[#2D5A8E] hover:bg-yellow-50"
                      )}
                    >
                      {u.isPremium ? 'PRO USER' : 'UPGRADE'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2 pt-8">
             <Heart className="w-4 h-4 text-mochi-pink fill-mochi-pink animate-pulse" />
             <span className="text-[10px] font-bold text-mochi-blue/40 uppercase tracking-widest italic tracking-tighter">Verified Creator: vamprixx</span>
          </div>
        </div>
      </div>
    </div>
  );
}
