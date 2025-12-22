/**
 * Хук для управления аудио эффектами.
 * Воспроизводит звуки при выполнении задач и получении достижений.
 */

import React, { useRef, useCallback } from 'react';

/** Хук аудио движка для воспроизведения звуков */
export const useAudioEngine = (enabled: boolean) => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const initCtx = useCallback(() => {
        if (!audioContextRef.current) {
            const CtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            audioContextRef.current = new CtxClass();
        }
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);

    /** Воспроизводит звук успешного выполнения с вариациями */
    const playSuccess = useCallback((options?: { isStreak?: boolean; isFirstOfDay?: boolean }) => {
        if (!enabled) return;
        try {
            const ctx = initCtx();
            if (!ctx) return;

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = 'sine';

            // Higher pitch for streaks, special tone for first task
            let baseFreq = 800;
            let endFreq = 300;
            let duration = 0.15;

            if (options?.isStreak) {
                baseFreq = 1000; // Higher pitch for streak
                endFreq = 500;
            }
            if (options?.isFirstOfDay) {
                baseFreq = 600; // Warmer tone for first task
                endFreq = 800;
                duration = 0.25;
            }

            oscillator.frequency.setValueAtTime(baseFreq, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

            gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.start();
            oscillator.stop(ctx.currentTime + duration);
        } catch {
            // Audio context may not be available
        }
    }, [enabled, initCtx]);

    /** Воспроизводит мелодию при получении достижения */
    const playAchievement = useCallback(() => {
        if (!enabled) return;
        try {
            const ctx = initCtx();
            if (!ctx) return;

            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, index) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

                oscillator.start(ctx.currentTime + index * 0.1);
                oscillator.stop(ctx.currentTime + index * 0.1 + 0.3);
            });
        } catch {
            // Achievement sound may fail silently
        }
    }, [enabled, initCtx]);

    // --- Ambient Sound Logic ---
    const [isAmbientPlaying, setIsAmbientPlaying] = React.useState(false);
    const ambientNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const ambientGainRef = useRef<GainNode | null>(null);

    const stopAmbient = useCallback(() => {
        if (ambientGainRef.current && audioContextRef.current) {
            const ctx = audioContextRef.current;
            // Smooth fade out
            ambientGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
            setIsAmbientPlaying(false);
            setTimeout(() => {
                if (ambientNodeRef.current) {
                    try { ambientNodeRef.current.stop(); } catch (e) { /* ignore */ }
                    ambientNodeRef.current = null;
                }
            }, 1000);
        }
    }, []);

    const playAmbient = useCallback((type: 'brown' | 'pink' = 'brown') => {
        if (!enabled) return;
        try {
            const ctx = initCtx();
            if (!ctx) return;

            // Stop existing if any
            if (ambientNodeRef.current) stopAmbient();

            const bufferSize = 2 * ctx.sampleRate;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate Brownian Noise
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                lastOut *= 3.5;
                data[i] = lastOut;
            }

            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = buffer;
            noiseSource.loop = true;

            const gainNode = ctx.createGain();
            // Low volume for ambient
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2); // 2s fade in

            // Lowpass filter for "warm" sound
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            noiseSource.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(ctx.destination);

            noiseSource.start();
            ambientNodeRef.current = noiseSource;
            ambientGainRef.current = gainNode;
            setIsAmbientPlaying(true);

        } catch {
            // Ambient sound may fail silently
        }
    }, [enabled, initCtx, stopAmbient]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (ambientNodeRef.current) {
                try { ambientNodeRef.current.stop(); } catch { /* ignore */ }
            }
        };
    }, []);

    return { playSuccess, playAchievement, playAmbient, stopAmbient, isAmbientPlaying };
};
