import { useState } from "react";

export function useAudioContext() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [droneOscillator, setDroneOscillator] = useState<OscillatorNode | null>(null);

  // Ensure AudioContext is created only once
  const getContext = () => {
    if (audioContext) return audioContext;
    const ctx = new window.AudioContext();
    setAudioContext(ctx);
    return ctx;
  };

  // Play a note with given frequency and duration
  const playNote = (frequency: number, duration: number) => {
    const context = getContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  };

  // Toggle drones (on/off)
  const toggleDrones = (play: boolean, frequency: number) => {
    const context = getContext();
    if (play && !droneOscillator) {
      const oscillator = context.createOscillator();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.connect(context.destination);
      oscillator.start();
      setDroneOscillator(oscillator);
    } else if (!play && droneOscillator) {
      droneOscillator.stop();
      setDroneOscillator(null);
    }
  };

  return { playNote, toggleDrones };
} 