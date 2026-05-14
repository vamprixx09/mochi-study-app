import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, MicOff, PhoneOff, Volume2, VolumeX, Languages, 
  MessageSquare, Sparkles, Loader2, Globe, Heart
} from 'lucide-react';
import { MochiMascot } from './MochiMascot';
import { cn } from '../lib/utils';
import { ChatMessage } from '../types';

interface AICallOverlayProps {
  isOpen: boolean;
  onClose: (transcript?: string[]) => void;
  onSendMessage: (text: string, onChunk: (text: string) => void) => Promise<string>;
  userLanguage?: string;
}

export function AICallOverlay({ isOpen, onClose, onSendMessage, userLanguage = 'en' }: AICallOverlayProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [status, setStatus] = useState<'connecting' | 'listening' | 'thinking' | 'speaking' | 'idle'>('connecting');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState('');
  const [detectedLang, setDetectedLang] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCall();
    } else {
      endCall();
    }
    return () => endCall();
  }, [isOpen]);

  const startCall = () => {
    setStatus('connecting');
    setupSpeechRecognition();
  };

  const endCall = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setStatus('idle');
  };

  const setupSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser 🥺");
      onClose();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Use the user's selected language for better accuracy
    const langMap: Record<string, string> = {
      'English': 'en-US',
      'Urdu': 'ur-PK',
      'Hindi': 'hi-IN',
      'Japanese': 'ja-JP',
      'Korean': 'ko-KR',
      'Chinese': 'zh-CN',
      'Arabic': 'ar-SA',
      'French': 'fr-FR',
      'Spanish': 'es-ES'
    };
    
    recognition.lang = langMap[userLanguage] || 'en-US'; 

    recognition.onstart = () => {
      setStatus('listening');
    };

    // Welcome message based on language
    const welcomeMessages: Record<string, string> = {
      'Japanese': 'こんにちは！もちです。一緒に日本語を練習しましょう！ ✨',
      'Korean': '안녕하세요! 모치입니다. 같이 한국어를 연습해요! 🌸',
      'Chinese': '你好！我是 Mochi。我们要开始练习中文了吗？ 🍡',
      'Spanish': '¡Hola! Soy Mochi. ¿Estás listo para practicar español? 🎀',
      'French': 'Salut ! C\'est Mochi. On pratique le français ensemble ? 🫧',
      'Urdu': 'ہیلو! میں موچی ہوں۔ کیا ہم اردو کی مشق کریں؟ ✨',
      'Hindi': 'नमस्ते! मैं मोची हूँ। क्या हम हिंदी का अभ्यास करें? 🌸',
      'Arabic': 'مرحباً! أنا موشي. هل نتدرب على اللغة العربية معاً؟ 🍡'
    };

    const welcome = welcomeMessages[userLanguage] || "Hi! I'm Mochi! ✨ I'm ready to talk. What should we study together? 🎀";
    setTimeout(() => handleAIResponse(welcome), 1000);

    recognition.onresult = (event: any) => {
      if (isMuted) return;

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => [...prev, `You: ${finalTranscript}`]);
        processUserInput(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('STT Error', event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied! 🥺");
        onClose();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const processUserInput = async (text: string) => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setStatus('thinking');
    
    try {
      let aiResponse = "";
      await onSendMessage(text, (chunk) => {
        aiResponse += chunk;
        setCurrentSpeech(prev => prev + chunk);
      });
      
      setTranscript(prev => [...prev, `Mochi: ${aiResponse}`]);
      handleAIResponse(aiResponse);
    } catch (error: any) {
      console.error(error);
      if (error.message === 'API_KEY_INVALID') {
        alert("Mochi needs your AI magic! ✨ Please go to Settings -> Secrets and ensure your Gemini API key is set correctly. 🎀");
        onClose();
        return;
      }
      handleAIResponse("Mochi had a little hiccup... 🥺 Can you say that again? 🎀");
    }
  };

  const handleAIResponse = (text: string) => {
    if (!isSpeakerOn) {
      setStatus('listening');
      if (recognitionRef.current) recognitionRef.current.start();
      return;
    }

    setStatus('speaking');
    window.speechSynthesis.cancel();

    // Clean text from emojis for smoother speech
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Auto detect language for TTS if possible or just use speech synthesis logic
    // For now, we'll try to match voice to detected language
    const voices = window.speechSynthesis.getVoices();
    
    // Simple language detection logic (very basic)
    if (/[ぁ-んァ-ン]/.test(text)) utterance.lang = 'ja-JP';
    else if (/[가-힣]/.test(text)) utterance.lang = 'ko-KR';
    else if (/[一-龠]/.test(text)) utterance.lang = 'zh-CN';
    else if (/[ا-ي]/.test(text)) utterance.lang = 'ar-SA';
    else if (/[à-ÿ]/.test(text)) utterance.lang = 'fr-FR';
    else utterance.lang = 'en-US';

    setDetectedLang(utterance.lang);

    const preferredVoice = voices.find(v => v.lang.startsWith(utterance.lang) && (v.name.includes('Female') || v.name.includes('Google')));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.pitch = 1.2;
    utterance.rate = 1.0;

    utterance.onend = () => {
      setCurrentSpeech('');
      setStatus('listening');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started or other error
        }
      }
    };

    window.speechSynthesis.speak(utterance);
    synthesisRef.current = utterance;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      if (recognitionRef.current) recognitionRef.current.start();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-mochi-lavender/40 backdrop-blur-2xl flex flex-col items-center justify-between p-8 text-white overflow-hidden"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 -left-20 w-80 h-80 bg-mochi-pink/30 rounded-full blur-[100px]"
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, -5, 0],
                opacity: [0.3, 0.4, 0.3]
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 -right-20 w-80 h-80 bg-mochi-blue/30 rounded-full blur-[100px]"
            />
          </div>

          {/* Top Bar */}
          <div className="w-full max-w-md flex items-center justify-between">
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full border-white/20">
              <Globe className="w-4 h-4 text-mochi-mint" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {detectedLang ? `Mode: ${userLanguage} (${detectedLang})` : `Speaking: ${userLanguage}...`}
              </span>
            </div>
            <button 
              onClick={() => onClose(transcript)}
              className="p-2 glass rounded-full hover:bg-red-500/20 transition-all border-white/20"
            >
              <Languages className="w-4 h-4" />
            </button>
          </div>

          {/* Center Mascot & Visualizer */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-md">
            <div className="relative group">
              <motion.div 
                animate={status === 'speaking' ? {
                  scale: [1, 1.05, 1],
                  rotate: [-1, 1, -1]
                } : status === 'listening' ? {
                   scale: [1, 1.02, 1]
                } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <MochiMascot size="xl" className="drop-shadow-2xl" />
              </motion.div>
              
              {/* Visualizer Rings */}
              {status === 'listening' && (
                <div className="absolute inset-0 -z-10 flex items-center justify-center">
                  {[1, 2, 3].map((i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                      className="absolute w-32 h-32 border-2 border-white/30 rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="text-center space-y-4 max-w-xs">
              <motion.h3 
                key={status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold font-heading"
              >
                {status === 'connecting' && "Connecting to Mochi... ✨"}
                {status === 'listening' && "Listening to you... 🎤"}
                {status === 'thinking' && "Mochi is thinking... 🍡"}
                {status === 'speaking' && "Mochi is speaking... 🌸"}
              </motion.h3>

              <p className="text-sm opacity-80 leading-relaxed italic min-h-[3rem]">
                {status === 'speaking' ? currentSpeech : (status === 'listening' ? "Go ahead, say something! 🎀" : "")}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-[2.5rem] p-6 flex items-center justify-around shadow-2xl relative">
            
            {/* Audio Waveform (Simulated) */}
            {status === 'speaking' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 h-6 items-end">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [4, Math.random() * 20 + 4, 4] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    className="w-1 bg-white rounded-full"
                  />
                ))}
              </div>
            )}

            <button 
              onClick={toggleMute}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isMuted ? "bg-red-400 text-white" : "glass text-white border-white/20"
              )}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => onClose(transcript)}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-xl hover:bg-red-600 transition-all transform hover:scale-110 active:scale-95"
            >
              <PhoneOff className="w-8 h-8 text-white rotate-[135deg]" />
            </button>

            <button 
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                !isSpeakerOn ? "bg-mochi-pink text-white" : "glass text-white border-white/20"
              )}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {/* Hint */}
          <div className="mt-4 flex items-center gap-2 opacity-40">
            <Heart className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Mochi loves talking with you</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
