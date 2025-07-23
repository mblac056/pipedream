// Pipe Dream - PWA to test if a tune is playable on bagpipes
// Tech Stack: React + Local Storage + Web Audio API

import { useEffect, useState } from "react";
import Drawer from "./components/Drawer";
import { NOTE_KEYS } from "./types";
import type { NoteKey, SavedTune } from "./types";
import useLocalStorage from "./hooks/useLocalStorage";
import { useAudioContext } from "./hooks/useAudioContext";
import { useShareableTune } from "./hooks/useShareableTune";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const PIPE_NOTES = ["Low G", "Low A", "B", "C", "D", "E", "F", "High G", "High A"];

// Bagpipe note frequencies (approximate, in Hz)
const NOTE_FREQUENCIES: Record<NoteKey, number> = {
  G: 414,  // Low G
  A: 466,  // Low A  
  B: 524, // B
  C: 583, // C
  D: 629, // D
  E: 699, // E
  F: 777, // F
  g: 839,  // High G
  a: 932   // High A
};

function App() {
  const [tune, setTune] = useLocalStorage<NoteKey[]>("pipeTune", []);
  const [songName, setSongName] = useLocalStorage<string>("songName", "");
  const [playDrones, setPlayDrones] = useState<boolean>(false);
  const { playNote: playNoteRaw, toggleDrones: toggleDronesRaw } = useAudioContext();
  const [noteDuration] = useState<number>(2); // Duration in seconds, fixed
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savedTunes, setSavedTunes] = useLocalStorage<SavedTune[]>("savedTunes", []);
  const { copyShareLink } = useShareableTune(tune, songName, setTune, setSongName);
  // Add state for note playing animation
  const [playingNote, setPlayingNote] = useState<NoteKey | null>(null);
  // Add state for tune playback
  const [currentPlayIndex, setCurrentPlayIndex] = useState<number>(-1);
  const [playbackTimeout, setPlaybackTimeout] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem("pipeTune", JSON.stringify(tune));
  }, [tune]);

  useEffect(() => {
    localStorage.setItem("songName", songName);
  }, [songName]);

  useEffect(() => {
    // Load saved tunes from localStorage on mount
    const tunes = JSON.parse(localStorage.getItem("savedTunes") || "[]");
    setSavedTunes(tunes);
  }, [setSavedTunes]);

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const closeDrawer = () => setDrawerOpen(false);

  const selectTune = (tuneObj: SavedTune) => {
    setSongName(tuneObj.name);
    setTune(tuneObj.tune);
    closeDrawer();
  };

  const playNote = (noteKey: NoteKey) => {
    setPlayingNote(noteKey);
    playNoteRaw(NOTE_FREQUENCIES[noteKey], noteDuration);
    setTimeout(() => setPlayingNote(null), 300); // Reset after animation
  };

  const handleKey = (noteKey: NoteKey) => {
    if (!NOTE_KEYS.includes(noteKey)) return;
    setTune((prev: NoteKey[]) => [...prev, noteKey]);
    playNote(noteKey);
  };

  const clearTune = () => {
    setTune([]);
    // clear the song name
    setSongName("");
    //Clear the tune from the URL
    window.history.replaceState({}, "", window.location.pathname);
  };

  // Add function to delete last note
  const deleteLastNote = () => {
    setTune((prev) => prev.slice(0, -1));
  };

  const toggleDrones = () => {
    toggleDronesRaw(!playDrones, 240.0); // 240Hz for A drone
    setPlayDrones((prev) => !prev);
  };

  const saveTune = () => {
    const savedTunes = JSON.parse(localStorage.getItem("savedTunes") || "[]");
    savedTunes.push({ name: songName, tune: tune });
    localStorage.setItem("savedTunes", JSON.stringify(savedTunes));
    setSavedTunes(savedTunes); // Update state so UI refreshes
    alert(`Tune "${songName}" saved!`);
    setSongName("");
  };

  const deleteTune = (idx: number) => {
    const savedTunesCopy = [...savedTunes];
    savedTunesCopy.splice(idx, 1);
    localStorage.setItem("savedTunes", JSON.stringify(savedTunesCopy));
    setSavedTunes(savedTunesCopy); // Update state so UI refreshes
  };

  // Add share functionality
  const handleShare = async () => {
    const success = await copyShareLink();
    if (success) {
      alert('Share link copied to clipboard!');
    } else {
      alert('Failed to copy link. Please try again.');
    }
  };

  // Function to play next note in sequence
  const playNextNote = () => {
    if (tune.length === 0) return;
    
    // Clear existing timeout
    if (playbackTimeout) {
      clearTimeout(playbackTimeout);
    }
    
    // Calculate next index (loop back to 0 if at end)
    const nextIndex = currentPlayIndex < 0 ? 0 : (currentPlayIndex + 1) % tune.length;
    setCurrentPlayIndex(nextIndex);
    
    // Play the note
    const noteToPlay = tune[nextIndex];
    if (noteToPlay) {
      playNote(noteToPlay);
    }
    
    // Set timeout to reset after 10 seconds
    const timeout = setTimeout(() => {
      setCurrentPlayIndex(-1);
    }, 10000);
    setPlaybackTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (playbackTimeout) {
        clearTimeout(playbackTimeout);
      }
    };
  }, [playbackTimeout]);

  // Reset playback when tune changes
  useEffect(() => {
    setCurrentPlayIndex(-1);
    if (playbackTimeout) {
      clearTimeout(playbackTimeout);
      setPlaybackTimeout(null);
    }
  }, [tune]);

  // Update keyboard shortcuts to include backspace
  useKeyboardShortcuts({
    noteKeys: NOTE_KEYS,
    onNoteKey: handleKey,
    onDeleteLast: deleteLastNote,
    enabled: true
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Side Drawer Button */}
      <button
        className="fixed top-4 left-4 z-50 px-3 py-2"
        onClick={toggleDrawer}
      >
        ☰ 
      </button>

      {/* Side Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        savedTunes={savedTunes}
        selectTune={selectTune}
        deleteTune={deleteTune}
        songName={songName}
        setSongName={setSongName}
        saveTune={saveTune}
        tune={tune}
      />

      {/* Overlay when drawer is open */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30"
          onClick={closeDrawer}
        ></div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Pipe Dream</h1>
          <p className="text-gray-500 text-lg">Create and test bagpipe tunes</p>
        </div>

        {/* Note Buttons - back in the card, responsive grid */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Bagpipe Notes</h2>
            <div className="relative group">
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <div className="absolute right-0 top-6 w-64 bg-gray-800 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="space-y-2">
                  <div>
                    <strong>Keyboard Shortcuts:</strong>
                    <div className="font-mono text-xs mt-1">A S D F G H J K L</div>
                  </div>
                  <div>
                    <strong>Features:</strong>
                    <ul className="text-xs mt-1 space-y-1">
                      <li>• Click notes or use keyboard to compose</li>
                      <li>• Click notes in your tune to play them</li>
                      <li>• Use Backspace to delete last note</li>
                      <li>• Toggle drones for authentic bagpipe sound</li>
                      <li>• Save tunes in the side drawer</li>
                      <li>• Share tunes with simple letter codes</li>
                    </ul>
                  </div>
                </div>
                <div className="absolute top-0 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800 transform -translate-y-1"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 md:grid-cols-9 gap-2 mb-4">
            {NOTE_KEYS.map((noteKey, idx) => {
              let label = PIPE_NOTES[idx];
              if (label.startsWith('Low ')) {
                label = label.replace('Low ', 'Low\n');
              } else if (label.startsWith('High ')) {
                label = label.replace('High ', 'High\n');
              }
              const keyboardKey = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'][idx];
              return (
                <button
                  key={noteKey}
                  className={`p-2 text-xs sm:text-sm bg-gray-100 hover:bg-blue-100 text-gray-800 font-semibold rounded border border-gray-300 shadow-sm transition-colors min-w-0 whitespace-pre-line button-pulse ${
                    playingNote === noteKey ? 'note-playing' : ''
                  }`}
                  onClick={() => handleKey(noteKey)}
                  title={`${PIPE_NOTES[idx]} (${keyboardKey.toUpperCase()})`}
                >
                  <div className="whitespace-pre-line">{label}</div>
                </button>
              );
            })}
          </div>
          <button
            onClick={toggleDrones}
            className={`w-full mb-2 px-4 py-2 font-semibold rounded border border-gray-300 shadow-sm transition-colors ${
              playDrones 
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {playDrones ? "Stop Drones" : "Start Drones"}
          </button>
        </div>

        {/* Tune Display */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          {/* Update the tune display section with redesigned buttons */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-700">Your Tune</h2>
            <div className="flex gap-2">
              {tune.length > 0 && (
                <button
                  onClick={handleShare}
                  title="Share Tune"
                  className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              )}
              {tune.length > 0 && (
                <button
                  onClick={deleteLastNote}
                  title="Delete Last Note (Backspace)"
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
              )}
              <button
                onClick={clearTune}
                title="Clear Tune"
                className="px-3 py-1 bg-gray-200 hover:bg-red-200 text-gray-700 font-semibold rounded border border-gray-300 shadow-sm transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          {tune.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-lg">No notes yet. Click the buttons above to start composing!</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {tune.map((n: NoteKey, i: number) => (
                  <button
                    key={i}
                    className={`px-4 py-2 border border-gray-300 rounded font-medium text-gray-700 shadow-sm whitespace-pre-line hover:bg-blue-100 focus:outline-none button-pulse ${
                      i === currentPlayIndex ? 'bg-yellow-200 border-yellow-400' : 'bg-gray-100'
                    }`}
                    onClick={() => playNote(n)}
                    title={`Play ${PIPE_NOTES[NOTE_KEYS.indexOf(n)]}`}
                  >
                    {PIPE_NOTES[NOTE_KEYS.indexOf(n)] || n}
                  </button>
                ))}
              </div>
              <div className="text-center">
                <button
                  onClick={playNextNote}
                  title="Play Next Note in Sequence"
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg border border-green-600 shadow-sm transition-colors"
                >
                  ▶ Play
                </button>
              </div>
            </>
          )}
          {tune.length > 0 && (
            <div className="text-center mt-4 text-sm text-gray-500">
              Total notes: {tune.length}
            </div>
          )}
        </div>

        {/* Pop-out menu for saved songs will be added at the top */}
      </div>
    </div>
  );
}

export default App;