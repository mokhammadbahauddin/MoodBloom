import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Plus, Sparkles, X } from "lucide-react";
import toast from "react-hot-toast";
import { AIAvatar } from "./AIInsight";

type BlockType = "p" | "h1" | "h2" | "h3" | "ul" | "code" | "quote";

interface Block {
  id: string;
  type: BlockType;
  content: string;
}

export default function NotesEditor() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "h1", content: "Advanced Algorithms" },
    { id: "2", type: "p", content: "Dynamic Programming - L10" },
    { id: "3", type: "h3", content: "Key Concepts" },
    { id: "4", type: "ul", content: "Overlapping Subproblems" },
    { id: "5", type: "ul", content: "Optimal Substructure" },
    { id: "6", type: "ul", content: "Memoization (Top-down)" },
    { id: "7", type: "ul", content: "Tabulation (Bottom-up)" },
    { id: "8", type: "h3", content: "Bellman-Ford Algorithm" },
    {
      id: "9",
      type: "p",
      content:
        "Computes shortest paths from a single source vertex to all of the other vertices in a weighted digraph. Slower than Dijkstra's but more versatile (handles negative weights).",
    },
    {
      id: "10",
      type: "code",
      content:
        "for i from 1 to |V|-1:\n  for each edge (u, v) with weight w:\n    if dist[u] + w < dist[v]:\n      dist[v] = dist[u] + w",
    },
    {
      id: "11",
      type: "quote",
      content: "Remember: Dynamic programming is just recursion with caching.",
    },
    { id: "12", type: "p", content: "" },
  ]);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleMagicSummary = async () => {
    const fullText = blocks.map((b) => b.content).join("\n");
    if (fullText.trim().length < 10) {
      toast.error("Catatan terlalu pendek untuk diringkas.");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("AI sedang meringkas catatan...");

    try {
      const { aiService } = await import("../services/aiService");
      const summary = await aiService.summarizeNotes(fullText);
      setAiSummary(summary);
      toast.success("Ringkasan berhasil dibuat!", { id: toastId });
    } catch (err) {
      toast.error("Gagal menghubungi AI.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateBlock = (index: number, content: string) => {
    let newType: BlockType | null = null;
    let actualContent = content;

    // Markdown triggers
    if (content.startsWith("# ")) {
      newType = "h1";
      actualContent = content.substring(2);
    } else if (content.startsWith("## ")) {
      newType = "h2";
      actualContent = content.substring(3);
    } else if (content.startsWith("### ")) {
      newType = "h3";
      actualContent = content.substring(4);
    } else if (content.startsWith("- ")) {
      newType = "ul";
      actualContent = content.substring(2);
    } else if (content.startsWith("> ")) {
      newType = "quote";
      actualContent = content.substring(2);
    } else if (content.startsWith("``` ")) {
      newType = "code";
      actualContent = content.substring(4);
    }

    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      content: actualContent,
      type: newType || newBlocks[index].type,
    };

    if (actualContent === "" && newBlocks[index].type !== "p") {
      newBlocks[index].type = "p"; // Revert back to p if emptied back
    }

    setBlocks(newBlocks);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // If code block, enter adds newline. Escape from code block with Shift+Enter or a button...
      // but actually for code block it's easier to just allow Enter.
      if (blocks[index].type === "code") {
        const newBlocks = [...blocks];
        newBlocks[index].content += "\n";
        setBlocks(newBlocks);
        return;
      }

      const newBlock: Block = {
        id: crypto.randomUUID(),
        type: "p",
        content: "",
      };

      // Inherit list
      if (blocks[index].type === "ul") {
        newBlock.type = "ul";
      }

      // If we press Enter on an empty list item, exit list
      if (blocks[index].type === "ul" && blocks[index].content === "") {
        const newBlocks = [...blocks];
        newBlocks[index].type = "p";
        setBlocks(newBlocks);
        return;
      }

      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);

      setTimeout(() => {
        const next = document.getElementById(`block-${newBlock.id}`);
        next?.focus();
      }, 10);
    } else if (e.key === "Backspace" && blocks[index].content === "") {
      e.preventDefault();
      // If the current block is not an empty p block, backspace resets it to p
      if (blocks[index].type !== "p") {
        const newBlocks = [...blocks];
        newBlocks[index].type = "p";
        setBlocks(newBlocks);
        return;
      }

      if (blocks.length > 1) {
        const newBlocks = [...blocks];
        newBlocks.splice(index, 1);
        setBlocks(newBlocks);
        setTimeout(() => {
          const prev = document.getElementById(
            `block-${newBlocks[Math.max(0, index - 1)].id}`,
          );
          if (prev instanceof HTMLTextAreaElement) {
            prev.focus();
            prev.setSelectionRange(prev.value.length, prev.value.length);
          }
        }, 10);
      }
    } else if (e.key === "ArrowUp") {
      const el = e.target as HTMLTextAreaElement;
      if (el.selectionStart === 0 && index > 0) {
        e.preventDefault();
        const prev = document.getElementById(
          `block-${blocks[index - 1].id}`,
        ) as HTMLTextAreaElement;
        if (prev) {
          prev.focus();
          prev.setSelectionRange(prev.value.length, prev.value.length);
        }
      }
    } else if (e.key === "ArrowDown") {
      const el = e.target as HTMLTextAreaElement;
      if (el.selectionEnd === el.value.length && index < blocks.length - 1) {
        e.preventDefault();
        const next = document.getElementById(
          `block-${blocks[index + 1].id}`,
        ) as HTMLTextAreaElement;
        if (next) {
          next.focus();
          next.setSelectionRange(0, 0);
        }
      }
    }
  };

  const addBlockBlock = (index: number) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type: "p",
      content: "",
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setTimeout(() => {
      document.getElementById(`block-${newBlock.id}`)?.focus();
    }, 10);
  };

  return (
    <div className="flex flex-col w-full pb-32 pt-2 px-1 gap-0.5 relative">
      {aiSummary && (
        <div className="mx-4 mb-6 relative bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800/50 p-4 rounded-2xl shadow-sm flex items-start gap-4">
          <AIAvatar className="w-12 h-12" />
          <div className="flex-1">
            <button
              onClick={() => setAiSummary(null)}
              className="absolute top-3 right-3 text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 bg-white/50 dark:bg-black/20 rounded-full p-1"
            >
              <X size={14} />
            </button>
            <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-300">
              <Sparkles size={16} className="text-purple-500" />
              <h4 className="font-headline font-bold text-sm">Ringkasan AI</h4>
            </div>
            <div className="text-sm text-purple-900 dark:text-purple-100/80 leading-relaxed font-medium whitespace-pre-wrap">
              {aiSummary.split("\n").map((line, i) => (
                <p key={`summary-line-${i}`} className="mb-1">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {blocks.map((block, i) => (
        <BlockEditor
          key={block.id}
          block={block}
          onChange={(val) => updateBlock(i, val)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onAdd={() => addBlockBlock(i)}
          isFirst={i === 0}
        />
      ))}
    </div>
  );
}

const BlockEditor: React.FC<{
  block: Block;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onAdd: () => void;
  isFirst: boolean;
}> = ({ block, onChange, onKeyDown, onAdd, isFirst }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [block.content, block.type]);

  let typeClasses = "";
  switch (block.type) {
    case "h1":
      typeClasses =
        "text-3xl font-headline font-extrabold mt-6 mb-2 text-on-surface tracking-tight";
      break;
    case "h2":
      typeClasses =
        "text-2xl font-headline font-bold mt-4 mb-2 text-on-surface tracking-tight";
      break;
    case "h3":
      typeClasses =
        "text-xl font-headline font-bold mt-3 mb-1 text-on-surface tracking-tight";
      break;
    case "ul":
      typeClasses = "text-sm text-on-surface-variant font-medium py-1";
      break;
    case "quote":
      typeClasses =
        "text-sm italic border-l-4 border-primary/40 pl-4 py-2 my-2 text-on-surface-variant bg-gradient-to-r from-primary/5 to-transparent rounded-r-lg font-medium";
      break;
    case "code":
      typeClasses =
        "font-mono text-xs bg-surface-container-high border border-outline-variant text-on-surface p-4 rounded-xl my-2 leading-relaxed whitespace-pre-wrap shadow-inner";
      break;
    case "p":
    default:
      typeClasses = "text-[15px] leading-relaxed text-on-surface-variant my-1";
      break;
  }

  return (
    <div className="flex items-start group relative -ml-8 pl-8 rounded-lg hover:bg-surface-container-low transition-colors duration-200 focus-within:bg-surface-container-low py-0.5">
      <div className="absolute left-0 top-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
        <button
          onClick={onAdd}
          className="p-0.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded cursor-pointer transition-colors"
          title="Add block below"
        >
          <Plus size={16} />
        </button>
        <button
          className="p-0.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded cursor-grab transition-colors"
          title="Drag to move"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {block.type === "ul" && (
        <div className="mr-3 select-none text-on-surface mt-[6px] text-[10px]">
          ●
        </div>
      )}

      <textarea
        id={`block-${block.id}`}
        ref={textareaRef}
        value={block.content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={`w-full outline-none resize-none bg-transparent overflow-hidden ${typeClasses}`}
        rows={1}
        placeholder={
          isFirst && block.type === "h1"
            ? "Untitled"
            : block.type === "p" && block.content === ""
              ? "Type '/' for commands"
              : ""
        }
      />
    </div>
  );
};
