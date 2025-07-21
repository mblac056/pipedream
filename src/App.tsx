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
  };

  // Add a function to remove a note at a specific index
  const removeNoteAt = (index: number) => {
    setTune((prev) => prev.filter((_, i) => i !== index));
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

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    noteKeys: NOTE_KEYS,
    onNoteKey: handleKey,
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
                      <li>• Use × buttons to remove individual notes</li>
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-700">Your Tune</h2>
            <div className="flex gap-2">
              {tune.length > 0 && (
                <button
                  onClick={handleShare}
                  title="Share Tune"
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded border border-blue-600 shadow-sm transition-colors"
                >
                  Share
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
            <div className="flex flex-wrap gap-2 justify-center">
              {tune.map((n: NoteKey, i: number) => (
                <span key={i} className="relative inline-block tune-note">
                  <button
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded font-medium text-gray-700 shadow-sm whitespace-pre-line hover:bg-blue-100 focus:outline-none button-pulse"
                    onClick={() => playNote(n)}
                    title={`Play ${PIPE_NOTES[NOTE_KEYS.indexOf(n)]}`}
                  >
                    {PIPE_NOTES[NOTE_KEYS.indexOf(n)] || n}
                  </button>
                  <button
                    onClick={() => removeNoteAt(i)}
                    title="Remove Note"
                    className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 text-xs text-gray-500 hover:text-red-600 shadow button-pulse"
                    style={{ lineHeight: 1 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
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