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
  const [isRecording, setIsRecording] = useState(false);
  const { transcript, voiceState, startListening, stopListening, error, isSupported } = useSpeechRecognition();
  const inputRef = useRef<HTMLInputElement>(null);

  const submittedRef = useRef(false);

  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (voiceState === 'processing' && transcript && !submittedRef.current) {
      submittedRef.current = true;
      onSubmit(transcript);
      setMessage('');
      setTimeout(() => {
        submittedRef.current = false;
      }, 100);
    }
  }, [voiceState, transcript, onSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  const handleVoiceClick = () => {
    if (!isSupported) return;
    
    if (isRecording) {
      stopListening();
      setIsRecording(false);
    } else {
      startListening();
      setIsRecording(true);
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
        isRecording
          ? isDarkMode
            ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/20'
            : 'bg-red-50 border-red-300 shadow-lg shadow-red-200'
          : isDarkMode
            ? 'bg-white/5 border-white/10 focus-within:border-[#9B7EE9] focus-within:bg-white/10 focus-within:shadow-lg focus-within:shadow-[#9B7EE9]/20'
            : 'bg-white border-[#BCC3EE] focus-within:border-[#9B7EE9] focus-within:shadow-lg focus-within:shadow-[#9B7EE9]/20'
      )}
    >
      <AnimatePresence>
        {isRecording && (
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
                setIsRecording(false);
              }}
              className="ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type or speak a command..."
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
            isRecording
              ? 'bg-red-500 text-white'
              : isDarkMode
                ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                : 'hover:bg-[#BCC3EE]/30 text-slate-500 hover:text-[#234A80]'
          )}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
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