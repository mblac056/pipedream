import { useEffect } from "react";
import type { NoteKey } from "../types";

export function useShareableTune(
  tune: NoteKey[],
  songName: string,
  setTune: (tune: NoteKey[]) => void,
  setSongName: (name: string) => void
) {
  // Map note keys to letters: asdfghjkl
  const noteToLetterMap: Record<NoteKey, string> = {
    'G': 'a', // Low G
    'A': 's', // Low A
    'B': 'd', // B
    'C': 'f', // C
    'D': 'g', // D
    'E': 'h', // E
    'F': 'j', // F
    'g': 'k', // High G
    'a': 'l', // High A
  };

  // Map letters back to note keys
  const letterToNoteMap: Record<string, NoteKey> = {
    'a': 'G',
    's': 'A',
    'd': 'B',
    'f': 'C',
    'g': 'D',
    'h': 'E',
    'j': 'F',
    'k': 'g',
    'l': 'a',
  };

  // Encode tune to URL when tune or songName changes
  useEffect(() => {
    if (tune.length > 0 || songName) {
      const tuneLetters = tune.map(note => noteToLetterMap[note]).join('');
      const url = new URL(window.location.href);
      url.searchParams.set('tune', tuneLetters);
      if (songName) {
        url.searchParams.set('name', songName);
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [tune, songName]);

  // Decode tune from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const tuneLetters = url.searchParams.get('tune');
    const name = url.searchParams.get('name');
    
    if (tuneLetters) {
      try {
        const decodedTune: NoteKey[] = [];
        for (const letter of tuneLetters) {
          const note = letterToNoteMap[letter];
          if (note) {
            decodedTune.push(note);
          }
        }
        if (decodedTune.length > 0) {
          setTune(decodedTune);
          if (name) {
            setSongName(name);
          }
        }
      } catch (error) {
        console.error('Failed to decode tune from URL:', error);
      }
    }
  }, []);

  // Function to generate shareable link
  const generateShareLink = () => {
    const tuneLetters = tune.map(note => noteToLetterMap[note]).join('');
    const url = new URL(window.location.href);
    url.searchParams.set('tune', tuneLetters);
    if (songName) {
      url.searchParams.set('name', songName);
    }
    return url.toString();
  };

  // Function to copy shareable link to clipboard
  const copyShareLink = async () => {
    try {
      const shareLink = generateShareLink();
      await navigator.clipboard.writeText(shareLink);
      return true;
    } catch (error) {
      console.error('Failed to copy link:', error);
      return false;
    }
  };

  return { generateShareLink, copyShareLink };
} 