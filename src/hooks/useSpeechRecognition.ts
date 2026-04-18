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
  const recognitionRef = useRef<any>(null);
  const permissionGrantedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Use Chrome, Edge, or Safari.');
      return;
    }

    // Check for secure context
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setError('Microphone requires HTTPS. Current connection is not secure.');
      return;
    }

    setIsSupported(true);
    
    // Pre-request microphone permission on mount to avoid later issues
    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        permissionGrantedRef.current = true;
        console.log('[SpeechRecognition] Microphone permission granted');
      } catch (err: any) {
        console.warn('[SpeechRecognition] Permission not granted yet:', err.name);
        permissionGrantedRef.current = false;
      }
    };
    requestPermission();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const startRecognition = async () => {
      try {
        // Ensure we have microphone permission before starting
        if (!permissionGrantedRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            permissionGrantedRef.current = true;
          } catch (permErr: any) {
            if (permErr.name === 'NotAllowedError') {
              setError('Microphone access denied. Click the padlock icon in the address bar and allow microphone access, then refresh.');
            } else {
              setError('Cannot access microphone. Please allow microphone access.');
            }
            return;
          }
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceState('listening');
          setError(null);
          console.log('[SpeechRecognition] Recognition started');
        };

        recognition.onresult = (event: any) => {
          const results = event.results;
          let finalTranscript = '';
          
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.isFinal) {
              finalTranscript = result[0].transcript;
            } else {
              setTranscript(result[0].transcript);
            }
          }
          
          if (finalTranscript) {
            setTranscript(finalTranscript);
            if (finalTranscript.trim()) {
              // Stop after getting final result
              try {
                recognition.stop();
              } catch (e) {}
              setVoiceState('processing');
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.log('[SpeechRecognition] Error:', event.error);
          let errorMessage = event.error;
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Speak clearly into your microphone (within 6 inches).';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone found. Connect a microphone and refresh.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Click the padlock icon → Microphone → Allow, then refresh.';
              break;
            case 'network':
              errorMessage = 'Network error. Check your connection.';
              break;
            default:
              errorMessage = `Error: ${event.error}`;
          }
          setError(errorMessage);
          setIsListening(false);
          setVoiceState('idle');
        };

        recognition.onend = () => {
          console.log('[SpeechRecognition] Recognition ended, transcript length:', transcript.length);
          setIsListening(false);
          if (transcript.trim() && voiceState !== 'processing') {
            setVoiceState('processing');
            setTimeout(() => setVoiceState('idle'), 1000);
          } else if (voiceState !== 'processing') {
            setVoiceState('idle');
          }
        };

        recognition.onsoundstart = () => console.log('[SpeechRecognition] Sound level detected');
        recognition.onspeechstart = () => console.log('[SpeechRecognition] Speech detected!');

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('[SpeechRecognition] Start failed:', err);
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
          setError('Microphone permission denied. Allow microphone in browser settings.');
        } else if (err.name !== 'AlreadyStartedError') {
          setError('Failed to start: ' + err.message);
        }
      }
    };

    startRecognition();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setVoiceState('idle');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setVoiceState('idle');
    setError(null);
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