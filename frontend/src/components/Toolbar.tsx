import { MousePointer2, Wand2, History, Move, RotateCcw } from "lucide-react";

interface ToolbarProps {
  isGenerateOpen: boolean;
  onGenerateClick: () => void;
  isHistoryOpen: boolean;
  onHistoryClick: () => void;
  hasSelection: boolean;
  onResetClick: () => void;
  activeTool: "select" | "move";
  onMoveClick: () => void;
  onSelectClick: () => void;
}

export default function Toolbar({
  isGenerateOpen,
  onGenerateClick,
  isHistoryOpen,
  onHistoryClick,
  hasSelection,
  onResetClick,
  activeTool,
  onSelectClick,
  onMoveClick,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <button
        className={`toolbar-button${activeTool === "select" ? " active" : ""}`}
        onClick={onSelectClick}
        title="Select"
      >
        <MousePointer2 size={20} />
      </button>

      <button
        className={`toolbar-button${isGenerateOpen ? " active" : ""}`}
        disabled={!hasSelection}
        onClick={onGenerateClick}
        title="Generate"
      >
        <Wand2 size={20} />
      </button>

      <button
        className={`toolbar-button${isHistoryOpen ? " active" : ""}`}
        disabled={!hasSelection}
        onClick={onHistoryClick}
        title="History"
      >
        <History size={20} />
      </button>

      <button
        className={`toolbar-button${activeTool === "move" ? " active" : ""}`}
        onClick={onMoveClick}
        title="Move"
      >
        <Move size={20} />
      </button>

      <button
        className="toolbar-button"
        disabled={!hasSelection}
        onClick={onResetClick}
        title="Reset material"
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
}
