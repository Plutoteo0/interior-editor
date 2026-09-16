import type { HistoryEntry } from "../types";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelectEntry: (entry: HistoryEntry) => void;
}

export default function HistoryPanel({
  entries,
  onSelectEntry,
}: HistoryPanelProps) {
  return (
    <div className="history-panel">
      {entries.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.id}
            className="history-entry"
            onClick={() => onSelectEntry(entry)}
          >
            <img
              src={`data:image/png;base64,${entry.imageBase64}`}
              alt={entry.prompt}
            />
            <span>{entry.prompt}</span>
          </div>
        ))
      )}
    </div>
  );
}
