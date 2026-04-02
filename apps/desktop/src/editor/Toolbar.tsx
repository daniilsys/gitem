import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Minus,
  Zap,
  Table,
} from "lucide-react";
import type { EditorView } from "@codemirror/view";
import { useT } from "@gitem/ui";
import type { TKey } from "@gitem/ui";
import {
  wrapSelection,
  insertAtCursor,
  prefixLine,
  toggleHeading,
  insertTable,
} from "./hotkeys";

interface ToolbarProps {
  view: EditorView | null;
}

interface ToolbarItem {
  icon: React.ReactNode;
  labelKey: TKey;
  shortcut?: string;
  action: (view: EditorView) => void;
  separator?: boolean;
}

const items: ToolbarItem[] = [
  {
    icon: <Heading1 size={15} strokeWidth={1.8} />,
    labelKey: "editor.heading1",
    shortcut: "⌘1",
    action: (v) => toggleHeading(v, 1),
  },
  {
    icon: <Heading2 size={15} strokeWidth={1.8} />,
    labelKey: "editor.heading2",
    shortcut: "⌘2",
    action: (v) => toggleHeading(v, 2),
  },
  {
    icon: <Heading3 size={15} strokeWidth={1.8} />,
    labelKey: "editor.heading3",
    shortcut: "⌘3",
    action: (v) => toggleHeading(v, 3),
    separator: true,
  },
  {
    icon: <Bold size={15} strokeWidth={2} />,
    labelKey: "editor.bold",
    shortcut: "⌘B",
    action: (v) => wrapSelection(v, "**", "**"),
  },
  {
    icon: <Italic size={15} strokeWidth={2} />,
    labelKey: "editor.italic",
    shortcut: "⌘I",
    action: (v) => wrapSelection(v, "*", "*"),
  },
  {
    icon: <Strikethrough size={15} strokeWidth={1.8} />,
    labelKey: "editor.strikethrough",
    shortcut: "⌘⇧X",
    action: (v) => wrapSelection(v, "~~", "~~"),
  },
  {
    icon: <Highlighter size={15} strokeWidth={1.8} />,
    labelKey: "editor.highlight",
    shortcut: "⌘U",
    action: (v) => wrapSelection(v, "==", "=="),
    separator: true,
  },
  {
    icon: <List size={15} strokeWidth={1.8} />,
    labelKey: "editor.bulletList",
    action: (v) => prefixLine(v, "- "),
  },
  {
    icon: <ListOrdered size={15} strokeWidth={1.8} />,
    labelKey: "editor.numberedList",
    action: (v) => prefixLine(v, "1. "),
  },
  {
    icon: <Quote size={15} strokeWidth={1.8} />,
    labelKey: "editor.blockquote",
    shortcut: "⌘⇧.",
    action: (v) => prefixLine(v, "> "),
  },
  {
    icon: <Code size={15} strokeWidth={1.8} />,
    labelKey: "editor.inlineCode",
    action: (v) => wrapSelection(v, "`", "`"),
    separator: true,
  },
  {
    icon: <Link size={15} strokeWidth={1.8} />,
    labelKey: "editor.link",
    shortcut: "⌘K",
    action: (v) => {
      const selected = v.state.sliceDoc(
        v.state.selection.main.from,
        v.state.selection.main.to,
      );
      if (selected) {
        wrapSelection(v, "[", "](url)");
      } else {
        insertAtCursor(v, "[](url)", 1);
      }
    },
  },
  {
    icon: <Minus size={15} strokeWidth={1.8} />,
    labelKey: "editor.hr",
    action: (v) => insertAtCursor(v, "\n---\n", 5),
  },
  {
    icon: <Table size={15} strokeWidth={1.8} />,
    labelKey: "editor.table",
    action: (v) => insertTable(v),
    separator: true,
  },
  {
    icon: <Zap size={15} strokeWidth={1.8} />,
    labelKey: "editor.flashcard",
    shortcut: "⌘D",
    action: (v) => {
      const selected = v.state.sliceDoc(
        v.state.selection.main.from,
        v.state.selection.main.to,
      );
      if (selected) {
        wrapSelection(v, "@@", "::answer@@");
      } else {
        insertAtCursor(v, "@@question::answer@@", 2);
      }
    },
  },
];

function ToolbarButton({
  item,
  view,
}: {
  item: ToolbarItem;
  view: EditorView | null;
}) {
  const t = useT();
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), 400);
  };

  const handleLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(false);
  };

  const positionTip = (el: HTMLDivElement | null) => {
    tipRef.current = el;
    if (!el || !btnRef.current) return;
    const btn = btnRef.current.getBoundingClientRect();
    const tipW = el.offsetWidth;
    el.style.left = `${btn.left + btn.width / 2 - tipW / 2}px`;
    el.style.top = `${btn.bottom + 6}px`;
    el.style.opacity = "1";
  };

  return (
    <div onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        ref={btnRef}
        onClick={() => {
          if (view) {
            item.action(view);
            view.focus();
          }
          setShow(false);
        }}
        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors duration-100 hover:bg-white/[0.06] hover:text-text-secondary active:bg-white/[0.08]"
      >
        {item.icon}
      </button>
      {show && createPortal(
        <div
          ref={positionTip}
          className="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-lg border border-white/[0.08] bg-panel px-3 py-2 shadow-xl shadow-black/50"
          style={{ opacity: 0 }}
        >
          {item.shortcut && (
            <div className="text-center text-[12px] font-semibold text-violet-400">
              {item.shortcut}
            </div>
          )}
          <div className="text-center text-[11px] text-text-muted">
            {t(item.labelKey)}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export function Toolbar({ view }: ToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 border-b border-border px-3 py-1.5 overflow-x-auto">
      {items.map((item, i) => (
        <span key={i} className="contents">
          <ToolbarButton item={item} view={view} />
          {item.separator && (
            <div className="mx-1 h-4 w-px shrink-0 bg-white/[0.06]" />
          )}
        </span>
      ))}
    </div>
  );
}
