import { useEffect } from "react";
import type { NoteKey } from "../types";

export function useShareableTune(
  tune: NoteKey[],
  songName: string,
  setTune: (tune: NoteKey[]) => void,
  setSongName: (name: string) => void
) {
  // Encode tune to URL when tune or songName changes
  useEffect(() => {
    if (tune.length > 0 || songName) {
      const tuneData = { tune, songName };
      const encoded = btoa(JSON.stringify(tuneData));
      const url = new URL(window.location.href);
      url.searchParams.set('tune', encoded);
      window.history.replaceState({}, '', url.toString());
    }
  }, [tune, songName]);

  // Decode tune from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const encodedTune = url.searchParams.get('tune');
    
    if (encodedTune) {
      try {
        const tuneData = JSON.parse(atob(encodedTune));
        if (tuneData.tune && Array.isArray(tuneData.tune)) {
          setTune(tuneData.tune);
          if (tuneData.songName) {
            setSongName(tuneData.songName);
          }
        }
      } catch (error) {
        console.error('Failed to decode tune from URL:', error);
      }
    }
  }, []);

  // Function to generate shareable link
  const generateShareLink = () => {
    const tuneData = { tune, songName };
    const encoded = btoa(JSON.stringify(tuneData));
    const url = new URL(window.location.href);
    url.searchParams.set('tune', encoded);
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