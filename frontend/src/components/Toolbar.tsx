import type { HistoryEntry } from "./Scene";
import { useState } from "react";
import { createPortal } from "react-dom";

type ToolbarProps = {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
};

export default function Toolbar({ history, onSelect }: ToolbarProps) {
  const [hovered, setHovered] = useState<{
    entry: HistoryEntry;
    rect: DOMRect;
    left: number;
  } | null>(null);

  function handleEntryEnter(
    entry: HistoryEntry,
    event: React.MouseEvent<HTMLDivElement>,
  ): void {
    const coordinates = event.currentTarget.getBoundingClientRect();
    const previewHalfWidth = 160;
    const rawLeft = coordinates.left + coordinates.width / 2;
    const left = Math.min(
      Math.max(rawLeft, previewHalfWidth),
      window.innerWidth - previewHalfWidth,
    );
    setHovered({ entry, rect: coordinates, left });
  }

  function handleEntryLeave(): void {
    setHovered(null);
  }
  return (
    <>
      <div className="toolbar">
        <span className="toolbar-label">History</span>
        <div className="history-list">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="history-entry"
              onClick={() => onSelect(entry)}
              onMouseEnter={(event) => handleEntryEnter(entry, event)}
              onMouseLeave={handleEntryLeave}
            >
              <img
                className="history-thumb"
                src={`data:image/png;base64,${entry.image}`}
                alt={entry.prompt}
              />
            </div>
          ))}
        </div>
      </div>
      {hovered &&
        createPortal(
          <div
            className="history-preview"
            style={{
              top: hovered.rect.bottom + 10,
              left: hovered.left,
            }}
          >
            <img
              src={`data:image/png;base64,${hovered.entry.image}`}
              alt={hovered.entry.prompt}
            />
            <p>{hovered.entry.prompt}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
