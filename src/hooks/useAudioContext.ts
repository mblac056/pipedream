import { useState } from "react";

export function useAudioContext() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [droneOscillator, setDroneOscillator] = useState<OscillatorNode | null>(null);

  // Ensure AudioContext is created only once
  const getContext = async () => {
    if (audioContext) {
      // If context is suspended, resume it
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      return audioContext;
    }
    
    try {
      const ctx = new window.AudioContext();
      setAudioContext(ctx);
      return ctx;
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
      throw error;
    }
  };

  // Play a note with given frequency and duration
  const playNote = async (frequency: number, duration: number) => {
    try {
      const context = await getContext();
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
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  };

  // Toggle drones (on/off)
  const toggleDrones = async (play: boolean, frequency: number) => {
    try {
      const context = await getContext();
      if (play && !droneOscillator) {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gainNode.gain.setValueAtTime(0.15, context.currentTime); // Half volume
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start();
        setDroneOscillator(oscillator);
      } else if (!play && droneOscillator) {
        droneOscillator.stop();
        setDroneOscillator(null);
      }
    } catch (error) {
      console.error('Failed to toggle drones:', error);
    }
  };

  return { playNote, toggleDrones };
} 