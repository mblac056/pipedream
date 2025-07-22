import { useEffect } from "react";
import type { NoteKey } from "../types";

interface UseKeyboardShortcutsProps {
  noteKeys: readonly NoteKey[];
  onNoteKey: (noteKey: NoteKey) => void;
  onDeleteLast: () => void;
  enabled: boolean;
}

export function useKeyboardShortcuts({
  noteKeys,
  onNoteKey,
  onDeleteLast,
  enabled
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();

      // Map middle row keys to note keys: asdfghjkl
      const keyToNoteMap: Record<string, NoteKey> = {
        'a': noteKeys[0], // Low G
        's': noteKeys[1], // Low A
        'd': noteKeys[2], // B
        'f': noteKeys[3], // C
        'g': noteKeys[4], // D
        'h': noteKeys[5], // E
        'j': noteKeys[6], // F
        'k': noteKeys[7], // High G
        'l': noteKeys[8], // High A
      };

      // Handle note keys
      if (keyToNoteMap[key]) {
        event.preventDefault();
        onNoteKey(keyToNoteMap[key]);
        return;
      }

      // Handle backspace to delete last note
      if (key === 'backspace') {
        event.preventDefault();
        onDeleteLast();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [noteKeys, onNoteKey, onDeleteLast, enabled]);
} 