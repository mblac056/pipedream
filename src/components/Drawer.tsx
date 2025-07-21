import React from "react";
import type { NoteKey } from "../types";

interface SavedTune {
  name: string;
  tune: NoteKey[];
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  savedTunes: SavedTune[];
  selectTune: (tuneObj: SavedTune) => void;
  deleteTune: (idx: number) => void;
  songName: string;
  setSongName: (name: string) => void;
  saveTune: () => void;
  tune: NoteKey[];
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  savedTunes,
  selectTune,
  deleteTune,
  songName,
  setSongName,
  saveTune,
  tune,
}) => {
  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
      role="complementary"
      aria-label="Saved tunes drawer"
      aria-hidden={!open}
    >

      <div className="flex flex-col h-full">
      <div className="flex items-center justify-end p-4 border-b gap-8">
        <span className="font-bold text-lg" id="saved-tunes-heading">Saved Tunes</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl" aria-label="Close saved tunes drawer">×</button>
      </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {savedTunes.length === 0 ? (
            <div className="text-gray-400 text-center">No saved tunes yet.</div>
          ) : (
            <ul aria-labelledby="saved-tunes-heading">
              {savedTunes.map((tuneObj, idx) => (
                <li key={idx} className="flex items-center justify-between group">
                  <button
                    className="w-full text-left px-2 py-2 rounded hover:bg-blue-100"
                    onClick={() => selectTune(tuneObj)}
                    aria-label={`Select tune: ${tuneObj.name || `Untitled Tune ${idx + 1}`}`}
                  >
                    {tuneObj.name || `Untitled Tune ${idx + 1}`}
                  </button>
                  <button
                    className="ml-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="Delete tune"
                    aria-label={`Delete tune: ${tuneObj.name || `Untitled Tune ${idx + 1}`}`}
                    onClick={() => deleteTune(idx)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-2 py-4 border-t">
          <div className="flex gap-2">
            <input
              className="flex-1 p-1 border border-gray-300 rounded"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              placeholder="Save this tune as..."
              aria-label="Tune name"
            />
            <button
              className="px-2 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded"
              onClick={saveTune}
              disabled={!songName || tune.length === 0}
              title={!songName ? 'Enter a name to save' : tune.length === 0 ? 'Add notes to save' : 'Save this tune'}
              aria-label="Save tune"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drawer; 