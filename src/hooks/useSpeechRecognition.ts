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
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionClass) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    setIsSupported(true);
    const recognitionInstance = new SpeechRecognitionClass();
    recognitionRef.current = recognitionInstance;
    
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      console.log('Recognition started!');
      setIsListening(true);
      setVoiceState('listening');
      setError(null);
    };

    recognitionInstance.onresult = (event: { results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } } }) => {
      console.log('Got result:', event.results);
      const results = event.results;
      const lastResult = results[results.length - 1];
      console.log('Last result:', lastResult[0].transcript);
      
      if (lastResult.isFinal) {
        setTranscript(lastResult[0].transcript);
        setVoiceState('processing');
      } else {
        setTranscript(lastResult[0].transcript);
      }
    };

    recognitionInstance.onerror = (event: { error: string }) => {
      console.log('recognition error:', event.error);
      setError(event.error);
      setIsListening(false);
      setVoiceState('idle');
    };

    recognitionInstance.onend = () => {
      console.log('Recognition ended');
      setIsListening(false);
      const currentTranscript = transcript;
      if (currentTranscript.trim().length > 0) {
        setVoiceState('processing');
        setTimeout(() => {
          setVoiceState('idle');
        }, 1000);
      } else {
        setVoiceState('idle');
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    console.log('startListening called, isSupported:', isSupported, 'isListening:', isListening);
    if (recognitionRef.current && !isListening) {
      try {
        console.log('Starting recognition...');
        recognitionRef.current.start();
      } catch (err) {
        console.log('Start error:', err);
        if ((err as Error).name !== 'AlreadyStartedError') {
          setError('Failed to start speech recognition');
        }
      }
    }
  }, [isSupported, isListening]);

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