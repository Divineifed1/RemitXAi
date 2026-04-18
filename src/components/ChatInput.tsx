'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isDarkMode: boolean;
  isVoiceEnabled: boolean;
}

export function ChatInput({ onSubmit, isDarkMode, isVoiceEnabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const { transcript, voiceState, startListening, stopListening, error, isSupported, isListening } = useSpeechRecognition();
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  const isNoSpeechError = error?.includes('No speech detected');

  // Derive display value: prioritize transcript when listening, otherwise use typed message
  const displayMessage = (voiceState === 'listening' && transcript) ? transcript : message;
  const isTyping = voiceState !== 'listening' || !transcript;

  const handleInputChange = (value: string) => {
    if (isTyping) {
      setMessage(value);
    }
  };

  useEffect(() => {
    // Sync input value when switching from listening to typing
    // This effect updates local state from voice transcript - required for UX
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isListening && transcript) {
      setMessage(transcript);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isListening, transcript]);

  useEffect(() => {
    if (voiceState === 'processing' && transcript && !submittedRef.current) {
      submittedRef.current = true;
      onSubmit(transcript);
      // Clear message after submission - allowed in effect side-effect
      /* eslint-disable react-hooks/set-state-in-effect */
      setMessage('');
      /* eslint-enable react-hooks/set-state-in-effect */
      setTimeout(() => {
        submittedRef.current = false;
      }, 1500);
    }
  }, [voiceState, transcript, onSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = message.trim();
    if (textToSend) {
      onSubmit(textToSend);
      setMessage('');
    }
  };

  const handleVoiceClick = () => {
    if (!isSupported) return;
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all duration-200',
        isListening
          ? isDarkMode
            ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/20'
            : 'bg-red-50 border-red-300 shadow-lg shadow-red-200'
          : isDarkMode
            ? 'bg-white/5 border-white/10 focus-within:border-[#9B7EE9] focus-within:bg-white/10 focus-within:shadow-lg focus-within:shadow-[#9B7EE9]/20'
            : 'bg-white border-[#BCC3EE] focus-within:border-[#9B7EE9] focus-within:shadow-lg focus-within:shadow-[#9B7EE9]/20'
      )}
    >
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white flex items-center gap-2"
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-white"
            />
            Listening...
            <button
              onClick={() => {
                stopListening();
              }}
              className="ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

       <AnimatePresence>
         {error && !isListening && (
           <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="absolute -top-14 left-4 right-4 px-2 py-2 rounded text-xs bg-red-500/10 border border-red-500/30 text-red-500 flex flex-col gap-2"
           >
             <div className="flex items-center justify-between">
               <span>{error}</span>
             </div>
             {isNoSpeechError && (
               <div className="flex gap-2 mt-1">
                 <button
                   onClick={handleVoiceClick}
                   className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-xs font-medium transition-colors"
                 >
                   Try Again
                 </button>
                 <span className="text-red-400/70 text-xs self-center">
                   Speak clearly or check microphone settings
                 </span>
               </div>
             )}
           </motion.div>
         )}
       </AnimatePresence>

      {!isSupported && (
        <div className="absolute -top-10 left-4 right-4 px-2 py-1 rounded text-xs bg-amber-500/10 border border-amber-500/30 text-amber-500">
          Voice input requires Chrome, Edge, or Safari browser
        </div>
      )}

      <input
        ref={inputRef}
        type="text"
        value={displayMessage}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          !isSupported 
            ? 'Speech recognition not supported. Use Chrome/Edge/Safari.' 
            : 'Type or speak a command...'
        }
        className={cn(
          'flex-1 bg-transparent outline-none text-sm',
          isDarkMode
            ? 'text-white placeholder:text-slate-500'
            : 'text-slate-900 placeholder:text-slate-400'
        )}
      />

      {isSupported && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleVoiceClick}
          className={cn(
            'p-2 rounded-full transition-all duration-200',
            isListening
              ? 'bg-red-500 text-white'
              : isDarkMode
                ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
          )}
          title={isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        disabled={!message.trim()}
        onClick={handleSubmit}
        className={cn(
          'p-2 rounded-full transition-all duration-200',
          message.trim()
            ? 'gradient-bg text-white hover:shadow-lg hover:shadow-[#9B7EE9]/30'
            : isDarkMode
              ? 'bg-white/5 text-slate-600 cursor-not-allowed'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        )}
      >
        <Send className="w-5 h-5" />
      </motion.button>
    </motion.div>
  );
}