'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { VoiceState } from '@/types';

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  voiceState: VoiceState;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognitionClass();
    recognitionRef.current = recognitionInstance;
    
    if (!recognitionInstance) return;
    
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setVoiceState('listening');
      setError(null);
    };

    recognitionInstance.onresult = (event: { results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } } }) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      if (lastResult.isFinal) {
        setTranscript(lastResult[0].transcript);
        setVoiceState('processing');
      } else {
        setTranscript(lastResult[0].transcript);
      }
    };

    recognitionInstance.onerror = (event: { error: string }) => {
      setError(event.error);
      setIsListening(false);
      setVoiceState('idle');
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      if (voiceState === 'listening') {
        setVoiceState('idle');
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        if ((err as Error).name !== 'AlreadyStartedError') {
          setError('Failed to start speech recognition');
        }
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setVoiceState('idle');
  }, []);

  return {
    transcript,
    isListening,
    voiceState,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}

interface SpeechRecognitionType {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: { results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionType;
    webkitSpeechRecognition: new () => SpeechRecognitionType;
  }
}