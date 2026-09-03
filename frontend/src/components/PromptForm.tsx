type PromptFormProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
};

export default function PromptForm({
  prompt,
  onPromptChange,
  onGenerate,
  isLoading,
}: PromptFormProps) {
  return (
    <>
      <input
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Type your prompt here..."
      />
      <button onClick={onGenerate} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Texture"}
      </button>
    </>
  );
}
