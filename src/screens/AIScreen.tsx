import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Image as ImageIcon, Sparkles, Brain, Clock, Heart, Loader2, 
  Phone, Mic, FileText, XCircle, Paperclip, User, Download, 
  History, PlusCircle, Volume2, Trash2, Copy, Pencil, RotateCcw, Check, CheckCircle,
  VolumeX, Coffee, AlertCircle, Info, ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, UserProfile, ChatSession } from '../types';
import { isFeatureUnlocked } from '../lib/premiumUtils';
import { MochiMascot } from '../components/MochiMascot';
import { chatWithMochiStream, generateMochiImage, generateNotes } from '../services/geminiService';
import { cn } from '../lib/utils';
import { getTranslation } from '../lib/translations';
import { exportToPDF } from '../lib/exportUtils';

// Simple unique ID generator
const generateId = () => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};


interface AIScreenProps {
  chatHistory: ChatMessage[];
  setChatHistory: (chats: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  chatSessions: ChatSession[];
  setChatSessions: (sessions: ChatSession[] | ((prev: ChatSession[]) => ChatSession[])) => void;
  user: UserProfile;
  setUser: (user: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  syncChatToCloud: (history?: ChatMessage[], sessions?: ChatSession[]) => void;
  onOpenPremium: () => void;
}

export default function AIScreen({ chatHistory, setChatHistory, chatSessions, setChatSessions, user, setUser, syncChatToCloud, onOpenPremium }: AIScreenProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string, type: string } | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isNoteGenMode, setIsNoteGenMode] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return localStorage.getItem('mochi_current_session_id') || generateId();
  });
  const [isImageGenMode, setIsImageGenMode] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editInput, setEditInput] = useState('');
  const [copyStatus, setCopyStatus] = useState<number | null>(null); // Index of copied message
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isSTTSupported, setIsSTTSupported] = useState(false);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [hasMicError, setHasMicError] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Check for permissions status if supported
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as any }).then(result => {
        setMicPermissionState(result.state);
        result.onchange = () => {
          setMicPermissionState(result.state);
        };
      }).catch(e => console.log('Permission query not supported', e));
    }

    // Check for STT support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSTTSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsRecording(false);
        showToast("Mochi heard you! 🎀");
        playSound('pop');
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('STT error', event.error);
        setIsRecording(false);
        showToast("Mochi couldn't hear well... 🥺");
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Recording not supported in this browser 🥺");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
          showToast("Voice message ready! 🎤");
          playSound('sparkle');
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setMicPermissionState('granted');
      setHasMicError(false);
      showToast("Recording voice mail... 🎤");
      playSound('pop');
    } catch (err) {
      console.error("Failed to start recording:", err);
      setMicPermissionState('denied');
      setHasMicError(true);
      
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        showToast("Mic blocked! 🚫 Please check settings or use the 'Open in New Tab' button below.");
      } else {
        showToast(`Recording error: ${errorMsg} 🥺`);
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleVoiceInput = () => {
    // If specifically in "Voice Call" mode (isCalling), we use handleStartRecording/Stop
    // For the main input mic, we'll keep STT but maybe the user wants VM there too?
    // Let's use handleStartRecording for the VM feel.
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };
  
  const t = (key: string) => getTranslation(user.language || 'en', key);

  const quickPrompts = [
    { icon: Brain, label: t('explain_simply'), text: t('explain_5_prompt') },
    { icon: Sparkles, label: t('quiz_me'), text: t('quiz_prompt') },
    { icon: Clock, label: t('three_day_plan'), text: t('plan_3day_prompt') },
    { icon: Heart, label: t('encourage_me'), text: t('encourage_prompt') }
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

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const speakText = (text: string, index: number) => {
    // Check if AI voice is enabled in Settings (both user object and localStorage)
    const aiVoiceEnabled = (user.aiVoiceEnabled ?? true) && localStorage.getItem('mochi_ai_voice') !== 'false';
    
    if (!aiVoiceEnabled) {
      showToast("AI voice is off in Settings 🎀");
      return;
    }
    
    // Stop any currently speaking
    window.speechSynthesis.cancel();
    
    if (isSpeaking && currentSpeakingIndex === index) {
      stopSpeaking();
      return;
    }
    
    // Remove emojis and special markdown for cleaner speech
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
                         .replace(/[*#_`]/g, '')
                         .trim();
    
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find a cute female voice
    const voices = window.speechSynthesis.getVoices();
    const kawaiVoice = voices.find(v => 
      v.name.includes('Google US English') || 
      v.name.includes('Samantha') || 
      v.name.includes('Zira') ||
      v.name.includes('Female')
    );
    
    if (kawaiVoice) utterance.voice = kawaiVoice;

    utterance.lang = 'en-US';
    utterance.rate = 1.1; // Slightly faster for cute vibe
    utterance.pitch = 1.25; // Higher pitch for kawaii feel
    utterance.volume = 0.9;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentSpeakingIndex(index);
      showToast("Reading aloud... 🎀");
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeakingIndex(null);
    };
    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      setIsSpeaking(false);
      setCurrentSpeakingIndex(null);
    };

    window.speechSynthesis.speak(utterance);
    playSound('pop');
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentSpeakingIndex(null);
    playSound('pop');
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(index);
    showToast('Copied to clipboard! 📋');
    playSound('pop');
  };

  // Persistent History Hooks
  useEffect(() => {
    // Sync local sessions to Firestore if they exist locally but not yet in cloud? 
    // Actually, App.tsx should handle this.
    // We'll just rely on App.tsx providing the sessions if we move them there.
  }, []);

  const saveCurrentToHistory = () => {
    if (chatHistory.length <= 1) return; // Don't save empty/initial chats

    const firstUserMsg = chatHistory.find(m => m.role === 'user')?.content || 'New Study Session 🍡';
    const title = firstUserMsg.substring(0, 30) + (firstUserMsg.length > 30 ? '...' : '');
    
    const newSession: ChatSession = {
      id: currentSessionId,
      date: new Date().toISOString(),
      title,
      messages: [...chatHistory]
    };

    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== currentSessionId);
      const updated = [newSession, ...filtered];
      const sliced = updated.slice(0, 50); // Limit to 50 sessions
      syncChatToCloud(chatHistory, sliced);
      return sliced;
    });
  };

  const startNewChat = () => {
    if (chatHistory.length > 1) {
      saveCurrentToHistory();
    }
    setChatHistory([{ 
      role: 'model', 
      content: t('mochi_welcome') || 'Hello! I am Mochi, your study companion. How can I help you today? 🎀', 
      timestamp: new Date().toISOString() 
    }]);
    const nextId = generateId();
    setCurrentSessionId(nextId);
    localStorage.setItem('mochi_current_session_id', nextId);
    showToast('New chat started! ✨');
    playSound('sparkle');
  };

  const loadSession = (session: ChatSession) => {
    saveCurrentToHistory();
    setCurrentSessionId(session.id);
    setChatHistory(session.messages);
    setShowHistory(false);
    playSound('pop');
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this chat forever? 🥺")) {
      setChatSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) {
        setChatHistory([]);
        setCurrentSessionId(generateId());
      }
      playSound('pop');
    }
  };

  const deleteMessage = (index: number) => {
    if (window.confirm("Delete this message? 🎀")) {
      setChatHistory(prev => prev.filter((_, i) => i !== index));
      showToast('Message deleted! ✨');
      playSound('pop');
    }
  };

  const startEditing = (index: number, content: string) => {
    setEditingMessageIndex(index);
    setEditInput(content);
  };

  const handleSaveEdit = async () => {
    if (editingMessageIndex === null) return;
    
    const newHistory = chatHistory.slice(0, editingMessageIndex);
    setChatHistory(newHistory);
    setEditingMessageIndex(null);
    handleSend(editInput);
    playSound('sparkle');
  };

  const handleRegenerate = async (index: number) => {
    // Find the last user message before this model message
    let lastUserMessage = '';
    let lastUserImg = null;
    let lastUserAudio = null;
    
    for (let i = index - 1; i >= 0; i--) {
      if (chatHistory[i].role === 'user') {
        lastUserMessage = chatHistory[i].content;
        lastUserImg = chatHistory[i].imageUrl;
        lastUserAudio = chatHistory[i].audioUrl;
        break;
      }
    }

    if (!lastUserMessage && !lastUserAudio) return;

    // Remove all messages from this index onwards
    const newHistory = chatHistory.slice(0, index);
    setChatHistory(newHistory);
    
    showToast('Regenerating response... 🎀');
    playSound('pop');
    handleSend(lastUserMessage, lastUserImg, lastUserAudio, newHistory);
  };

  const handleQuickAction = (action: string) => {
    if (action === 'image') {
      handleSend(t('gen_study_room_prompt'));
    } else if (action === 'note') {
      setIsNoteGenMode(true);
      showToast("Mochi is ready to write notes! Tell me your topic. 📝");
    }
    setShowQuickActions(false);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
  };

  useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading, shouldAutoScroll]);

  const handleSend = async (
    text: string = input, 
    img: string | null = image, 
    audio: string | null = audioBase64,
    historyOverride?: ChatMessage[]
  ) => {
    if (!text && !img && !attachedFile && !audio) return;

    const currentHistory = historyOverride || chatHistory;

    // Check for special commands
    const isImageGen = isImageGenMode ||
                      (text && (text.toLowerCase().includes('generate an image') || 
                      text.toLowerCase().includes('draw') || 
                      text.toLowerCase().includes('make a picture') ||
                      text.toLowerCase().includes('create an image') ||
                      text.toLowerCase().includes('imagine') ||
                      text.toLowerCase().includes('show me a picture') ||
                      text.toLowerCase().includes('can you draw')));
    
    // Premium Check for AI Tools
    if (isImageGen && !isFeatureUnlocked(user, 'image_gen')) {
      showToast("Mochi's canvas is for Full Premium users! 🎨");
      onOpenPremium();
      return;
    }

    if (!isImageGen && !isFeatureUnlocked(user, 'ai_tools')) {
       // Allow limited chat? User said "unlock starter features only" for Starter.
       // Usually AI chat is a core feature but if the user wants strict tiers:
       showToast("Upgrade to Full Premium for advanced AI tools! 🤖");
       onOpenPremium();
       return;
    }

    const isNoteGen = isNoteGenMode || (!isImageGen && (text && (text.toLowerCase().includes('create a note') || 
                      text.toLowerCase().includes('study note'))));

    let displayText = attachedFile ? `[Linked File: ${attachedFile.name}] ${text}` : text;
    
    // Add file content to prompt if available
    const promptWithFile = fileContent 
      ? `${displayText}\n\n[CONTENT FROM ATTACHED DOCUMENT "${attachedFile?.name}"]:\n${fileContent.substring(0, 5000)}\n[END DOCUMENT]` 
      : (displayText || (audio ? "Listen to my voice message! 🎤" : ""));

    const userMessage: ChatMessage = {
      role: 'user',
      content: displayText || (img ? "What's in this image? 🎀" : (audio ? "Sent a voice message 🎤" : "")),
      timestamp: new Date().toISOString(),
      imageUrl: img || null,
      audioUrl: audio || null
    };

    setChatHistory(prev => [...prev, userMessage]);
    setInput('');
    setImage(null);
    setAudioBase64(null);
    setAttachedFile(null);
    setFileContent(null);
    setIsImageGenMode(false);
    setIsNoteGenMode(false);
    setIsLoading(true);
    setShouldAutoScroll(true);

    try {
      let finalContent = "";
      let generatedImg: string | null = null;

      if (isImageGen) {
        generatedImg = (await generateMochiImage(text || "A cute kawaii illustration", img || undefined)) || null;
        finalContent = text ? `I've imagined this for you based on "${text}"! 🎀` : t('gen_image_success');
        
        const mochiMessage: ChatMessage = {
          role: 'model',
          content: finalContent,
          timestamp: new Date().toISOString(),
          imageUrl: generatedImg
        };
        setChatHistory(prev => {
          const next = [...prev, mochiMessage];
          syncChatToCloud(next);
          return next;
        });
        playSound('sparkle');
      } else if (isNoteGen) {
        const notes = await generateNotes(text!);
        finalContent = `${t('gen_note_success')}\n\n${notes}`;
        
        const mochiMessage: ChatMessage = {
          role: 'model',
          content: finalContent,
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => {
          const next = [...prev, mochiMessage];
          syncChatToCloud(next);
          return next;
        });
        playSound('sparkle');
      } else {
        const historyForApi = currentHistory.map(c => ({
          role: c.role as 'user' | 'model',
          parts: [{ text: c.content }]
        }));

        // Create initial empty message for streaming
        const timestamp = new Date().toISOString();
        const initialModelMsg: ChatMessage = { role: 'model', content: '', timestamp };
        setChatHistory(prev => [...prev, initialModelMsg]);

        finalContent = await chatWithMochiStream(
          promptWithFile, 
          historyForApi, 
          (chunk) => {
            setChatHistory(prev => {
              const newHistory = [...prev];
              const lastMsg = newHistory[newHistory.length - 1];
              if (lastMsg && lastMsg.role === 'model') {
                lastMsg.content = chunk;
              }
              return newHistory;
            });
          },
          img || undefined,
          audio || undefined
        ) || t('mochi_sleepy');
        
        playSound('sparkle');
        // Final sync when streaming is done
        setChatHistory(prev => {
          syncChatToCloud(prev);
          return prev;
        });
      }
    } catch (error) {
      console.error(error);
      // Restore input if it failed 🎀
      if (text) setInput(text); 
      
      const errorMessage: ChatMessage = {
        role: 'model',
        content: `Mochi had a little hiccup... 🥺 (Error: ${error instanceof Error ? error.message : 'Unknown'}). I've put your text back in the input box so you can try again! 🎀`,
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportNote = (content: string) => {
    const htmlContent = `
      <div class="card">
        <div class="prose prose-sm">
          ${content.split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
      </div>
    `;
    exportToPDF(htmlContent, "Mochi_Study_Note.pdf");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.6);
            setImage(compressed);
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        setAttachedFile({ name: file.name, type: file.type });
        // Read text content for common file types
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setFileContent(content);
          showToast(`File "${file.name}" added! 🎀`);
        };
        
        if (file.type === 'application/pdf') {
          // PDFs require specialized parsing, in this context we'll notify user
          showToast("PDF attached! Mochi will try to analyze it. 🎀");
          setFileContent(null);
        } else {
          reader.readAsText(file);
        }
      }
    }
  };

  const startCall = () => {
    setIsCalling(true);
    if (user.soundEnabled) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] relative">
      {/* Header */}
      <div className="flex flex-col mb-4 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MochiMascot 
              size="sm" 
              onClick={() => playSound('bounce')}
              className="mr-1"
            />
            <div className="flex flex-col">
              <h2 className="text-sm font-bold font-heading leading-tight">Mochi AI 🍡</h2>
              <span className="text-[9px] opacity-40 uppercase font-bold tracking-widest">Active Session</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.open('https://ko-fi.com/vamp_rixx', '_blank')}
              className="p-2 glass rounded-full text-[#29abe0] hover:bg-white transition-all shadow-sm"
              title="Buy me a coffee ☕"
            >
              <Coffee className="w-4 h-4" />
            </button>
            <button 
              onClick={startCall}
              className="p-2 glass rounded-full text-mochi-pink hover:bg-white transition-all shadow-sm"
              title="Voice Call 🎀"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button 
            onClick={startNewChat}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-mochi-pink to-pink-400 text-white rounded-2xl text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" /> New Chat ✨
          </button>
          
          <button 
            onClick={() => { setShowHistory(!showHistory); playSound('pop'); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 glass rounded-2xl text-xs font-bold shadow-sm transition-all shrink-0",
              showHistory ? "bg-mochi-pink text-white" : "text-mochi-pink hover:bg-white/60"
            )}
          >
            <History className="w-4 h-4" /> History
          </button>

          <button 
            onClick={() => {
              if(window.confirm("Refresh current chat? 🎀")) {
                setChatHistory(prev => [prev[0]]); // Keep only welcome message
              }
            }}
            className="flex items-center gap-2 px-4 py-2 glass text-mochi-pink rounded-2xl text-xs font-bold shadow-sm hover:bg-white/60 transition-all shrink-0"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* History Overlay */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 z-50 bg-mochi-cream/95 backdrop-blur-md rounded-[2.5rem] p-6 shadow-2xl overflow-y-auto scrollbar-hide border border-mochi-lavender/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-heading flex items-center gap-2">
                <History className="text-mochi-pink" /> Recent Chats
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-2 glass rounded-full"><XCircle className="opacity-40" /></button>
            </div>

            <div className="space-y-3">
              {chatSessions.length === 0 ? (
                <div className="text-center py-10 opacity-40 italic text-sm">No history yet... 🌸</div>
              ) : (
                chatSessions.map((session) => (
                  <div 
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className={cn(
                      "group p-4 glass rounded-3xl cursor-pointer hover:bg-white transition-all border-2",
                      currentSessionId === session.id ? "border-mochi-pink" : "border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 overflow-hidden">
                        <p className="text-[11px] font-bold truncate">{session.title}</p>
                        <p className="text-[9px] opacity-40 uppercase font-bold tracking-tighter">
                          {new Date(session.date).toLocaleDateString()} • {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => deleteSession(e, session.id)}
                        className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Overlay (Same as before) */}
      <AnimatePresence>
        {isCalling && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 bg-mochi-lavender/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-white rounded-[2rem] m-2 overflow-hidden shadow-2xl"
          >
            <div className="relative">
              <MochiMascot size="lg" className="mb-8" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-white/20 rounded-full -z-10 blur-xl"
              />
            </div>
            
            <div className="text-center space-y-2 mb-12">
              <h3 className="text-2xl font-bold font-heading">{t('mochi_calling')}</h3>
              <p className="text-sm opacity-80 uppercase tracking-widest font-bold">{t('awaiting_voice')}</p>
            </div>
            
            <div className="flex gap-8">
              <button 
                onClick={() => isRecording ? handleStopRecording() : handleStartRecording()}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl",
                  isRecording ? "bg-red-400 animate-pulse scale-110" : "bg-white/20 hover:bg-white/30"
                )}
              >
                <Mic className="w-8 h-8 text-white" />
              </button>
              <button 
                onClick={() => {
                  if (audioBase64) {
                    handleSend();
                  }
                  setIsCalling(false);
                }}
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all",
                  audioBase64 ? "bg-green-500 scale-105" : "bg-red-500 hover:bg-red-600 rotate-[135deg]"
                )}
              >
                {audioBase64 ? <Send className="w-8 h-8 text-white" /> : <Phone className="w-8 h-8 text-white" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 scrollbar-hide"
      >
        {chatHistory.length === 0 && (
          <div className="text-center py-10 space-y-4">
            <p className="text-sm opacity-60 italic whitespace-pre-line">
              "Ask Mochi anything! 🎀 {"\n"} — tap New Chat to start fresh"
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="p-3 glass rounded-2xl text-[11px] font-medium hover:bg-white/60 transition-all flex flex-col items-center gap-1"
                >
                  <p.icon className="w-4 h-4 text-mochi-pink" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={cn("flex flex-col group", msg.role === 'user' ? "items-end" : "items-start")}>
            <div className={cn(
              "max-w-[85%] rounded-[2rem] p-4 shadow-sm relative",
              msg.role === 'user' 
                ? "bg-mochi-pink text-white rounded-tr-none" 
                : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-mochi-lavender/30 rounded-tl-none"
            )}>
              {editingMessageIndex === i ? (
                <div className="space-y-2">
                  <textarea 
                    autoFocus
                    value={editInput}
                    onChange={(e) => setEditInput(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm min-h-[60px] resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingMessageIndex(null)} className="p-1 opacity-60 hover:opacity-100 transition-opacity"><XCircle className="w-4 h-4" /></button>
                    <button onClick={handleSaveEdit} className="p-1 hover:scale-110 active:scale-95 transition-all text-white"><CheckCircle className="w-4 h-4" /></button>
                  </div>
                  <p className="text-[8px] opacity-60 italic">Editing message — Mochi will answer again 🍡</p>
                </div>
              ) : (
                <>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Uploaded" className="w-full h-auto rounded-xl mb-2 object-cover max-h-48" />
                  )}
                  {msg.audioUrl && (
                    <div className="mb-2 p-2 glass rounded-xl flex items-center gap-2">
                       <audio src={msg.audioUrl} controls className="h-8 max-w-[200px]" />
                    </div>
                  )}
                  <div className="prose prose-sm dark:prose-invert break-words selectable">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {/* Message Actions */}
                  <div className={cn(
                    "flex gap-2 mt-2 pt-2 border-t border-black/5 opacity-60 group-hover:opacity-100 transition-all",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(msg.content, i); }} 
                      className="p-1 hover:bg-black/5 rounded-md transition-all"
                      title="Copy message"
                    >
                      {copyStatus === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteMessage(i); }} 
                      className="p-1 hover:bg-black/5 rounded-md transition-all text-gray-400 hover:text-red-400"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {msg.role === 'model' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setLikes(prev => ({ ...prev, [i]: !prev[i] }));
                          if (!likes[i]) showToast('Mochi is happy you liked this! 🎀');
                          playSound('sparkle');
                        }} 
                        className={cn("p-1 hover:bg-black/5 rounded-md transition-all", likes[i] ? "text-mochi-pink" : "text-gray-400")}
                      >
                        <Heart className={cn("w-3 h-3", likes[i] && "fill-current")} />
                      </button>
                    )}
                    {msg.role === 'user' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); startEditing(i, msg.content); }} 
                        className="p-1 hover:bg-black/5 rounded-md transition-all text-gray-400 hover:text-mochi-blue"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    {msg.role === 'model' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRegenerate(i); }}
                        className="p-1 hover:bg-black/5 rounded-md transition-all text-gray-400 hover:text-mochi-mint"
                        title="Regenerate response 🎀"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                    {msg.role === 'model' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); speakText(msg.content, i); }} 
                        className={cn(
                          "p-1 hover:bg-black/5 rounded-md transition-all shrink-0",
                          (user.aiVoiceEnabled ?? true) && localStorage.getItem('mochi_ai_voice') !== 'false'
                            ? "hover:bg-white text-gray-400 hover:text-mochi-lavender"
                            : "opacity-40 grayscale text-gray-300 pointer-events-auto"
                        )}
                        title={isSpeaking && currentSpeakingIndex === i ? "Stop speaking" : "Read aloud 🎀"}
                      >
                        {isSpeaking && currentSpeakingIndex === i ? (
                          <VolumeX className="w-3 h-3 text-red-400" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {msg.role === 'model' && msg.content.includes('📝') && (
                      <button 
                        onClick={() => handleExportNote(msg.content)}
                        className="p-1 glass rounded-md text-mochi-blue hover:bg-white/40 transition-all flex items-center gap-1 text-[8px] font-bold"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    )}
                    <span className="text-[8px] opacity-40 block ml-auto">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 shadow-sm border border-mochi-lavender/30 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-mochi-lavender" />
              <span className="text-xs italic opacity-60">{t('mochi_thinking')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area (mostly same, minor tweaks for layout) */}
      <div className="pt-2 space-y-2 relative">
        <AnimatePresence>
          {showQuickActions && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-3 left-0 right-0 glass p-3 rounded-[2rem] shadow-xl z-50 flex gap-2 overflow-x-auto scrollbar-hide bg-white/80"
            >
              <ActionButton 
                icon={ImageIcon} 
                label={t('gen_image_btn')} 
                onClick={() => {
                  setIsImageGenMode(true);
                  setShowQuickActions(false);
                }} 
                color="bg-pink-100 text-pink-500" 
              />
              <ActionButton icon={FileText} label={t('new_note_btn')} onClick={() => handleQuickAction('note')} color="bg-blue-100 text-blue-500" />
              <ActionButton 
                icon={Mic} 
                label={isRecording ? "Recording..." : t('voice_mail')} 
                onClick={() => isRecording ? handleStopRecording() : handleStartRecording()} 
                color={isRecording ? "bg-red-500 text-white animate-bounce" : "bg-green-100 text-green-500"} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isImageGenMode && (
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-mochi-pink/20 to-mochi-lavender/20 rounded-full w-fit animate-pulse border border-mochi-pink/30">
            <Sparkles className="w-3 h-3 text-mochi-pink" />
            <span className="text-[10px] font-bold text-mochi-pink uppercase tracking-widest italic">Imagination Mode Active ✨</span>
            <button onClick={() => setIsImageGenMode(false)} className="ml-1 text-mochi-pink hover:scale-110"><XCircle className="w-3 h-3" /></button>
          </div>
        )}

        {isNoteGenMode && (
          <div className="flex items-center gap-2 px-4 py-1 bg-gradient-to-r from-mochi-blue/20 to-mochi-lavender/20 rounded-full w-fit animate-pulse border border-mochi-blue/30">
            <FileText className="w-3 h-3 text-mochi-blue" />
            <span className="text-[10px] font-bold text-mochi-blue uppercase tracking-widest italic">Note Mode Active 📝</span>
            <button onClick={() => setIsNoteGenMode(false)} className="ml-1 text-mochi-blue hover:scale-110"><XCircle className="w-3 h-3" /></button>
          </div>
        )}

        {image && (
          <div className="relative inline-block">
            <img src={image} className="w-16 h-16 rounded-xl object-cover border-2 border-mochi-pink" />
            <button 
              onClick={() => setImage(null)}
              className="absolute -top-1 -right-1 bg-red-400 text-white rounded-full p-0.5"
            >
              <XCircle className="w-3 h-3" />
            </button>
          </div>
        )}

        {audioBase64 && (
          <div className="relative flex items-center gap-2 glass p-2 rounded-2xl border-mochi-pink border shadow-sm w-fit">
            <div className="w-8 h-8 rounded-full bg-mochi-pink flex items-center justify-center text-white animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-mochi-pink uppercase tracking-widest">Voice Mail Ready ✨</span>
            <button onClick={() => setAudioBase64(null)} className="ml-1 text-mochi-pink hover:scale-110"><XCircle className="w-4 h-4" /></button>
          </div>
        )}
        
        {attachedFile && (
          <div className="relative inline-block px-3 py-1 bg-mochi-mint/30 rounded-full flex items-center gap-2 border border-mochi-mint/50">
            <FileText className="w-3 h-3 text-mochi-mint" />
            <span className="text-[10px] font-bold text-mochi-mint truncate max-w-[100px]">{attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)}><XCircle className="w-3 h-3 text-mochi-mint" /></button>
          </div>
        )}
        
        {(micPermissionState === 'denied' || hasMicError) && (
          <div className="flex flex-col gap-2 mb-3 p-3 bg-rose-50/50 rounded-3xl border border-rose-100 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => handleStartRecording()}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-full w-fit hover:bg-rose-600 transition-all shadow-md active:scale-95"
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Retry Mic</span>
              </button>
              
              {window.self !== window.top && (
                <button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-mochi-mint-dark rounded-full w-fit border border-mochi-mint/30 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-mochi-mint" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-mochi-mint-dark">Fix in New Tab</span>
                </button>
              )}
              
              <button 
                onClick={() => setHasMicError(false)}
                className="p-2 text-rose-300 hover:text-rose-500 transition-colors"
                title="Dismiss"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1.5 px-1">
              <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1.5 leading-tight">
                <AlertCircle className="w-3.5 h-3.5" />
                Recording Blocked 🍡
              </p>
              <p className="text-[10px] text-rose-500/80 leading-relaxed italic">
                Most common fix: Click the **Lock icon** 🔒 in your URL bar and set Microphone to **Allow**, then click Retry! ✨
              </p>
              {window.self !== window.top && (
                <p className="text-[9px] text-rose-400 opacity-80 leading-relaxed font-medium">
                  Still stuck? The **Fix in New Tab** ↗️ button usually solves browser sandbox issues!
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="glass rounded-[2rem] p-2 flex items-center gap-2 shadow-lg border-white/40">
          <button 
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={cn("p-2 rounded-full transition-all text-mochi-pink hover:bg-white/40", showQuickActions && "bg-mochi-pink text-white")}
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-mochi-pink transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          {isSTTSupported && (
            <button 
              onClick={toggleVoiceInput}
              className={cn(
                "p-2 transition-all rounded-full",
                isRecording ? "text-red-500 animate-pulse bg-red-50" : "text-gray-400 hover:text-mochi-pink"
              )}
              title="Voice Input"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,.pdf,.txt" 
            onChange={handleFileUpload} 
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`${t('ask_mochi')}... 🎀`}
            className="flex-1 bg-transparent border-none outline-none text-sm px-2 h-10 min-w-0"
          />
          <button
            onClick={() => handleSend()}
            disabled={(!input && !image && !attachedFile && !audioBase64) || isLoading}
            className={cn(
              "p-3 rounded-full transition-all flex items-center justify-center shrink-0 shadow-sm",
              (input || image || attachedFile || audioBase64) && !isLoading 
                ? "bg-mochi-pink text-white shadow-md active:scale-95" 
                : "bg-mochi-pink/40 text-white/80 cursor-default"
            )}
            id="mochi-send-btn"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-mochi-pink text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-xl z-[100] whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, color }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 min-w-[70px] group transition-all"
    >
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-tighter opacity-60">{label}</span>
    </button>
  );
}
