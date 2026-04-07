'use client';

import { useState, useCallback, useEffect } from 'react';

interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isEnabled: boolean;
  speak: (text: string) => void;
  cancel: () => void;
  toggleEnabled: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string) => {
    if (!speechSupported || !isEnabled) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [speechSupported, isEnabled, isSpeaking]);

  const cancel = useCallback(() => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSupported]);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => !prev);
    if (isSpeaking) {
      cancel();
    }
  }, [isSpeaking, cancel]);

  return {
    isSpeaking,
    isEnabled,
    speak,
    cancel,
    toggleEnabled,
  };
}