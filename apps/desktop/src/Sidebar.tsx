import { useRef, useState, useEffect, useMemo } from "react";
import { BookOpen, Brain, Settings } from "lucide-react";
import { createDragDropManager } from "dnd-core";
import { TouchBackend } from "react-dnd-touch-backend";
import { FileTree, CreateMenu, useT } from "@gitem/ui";
import type { TreeNode } from "@gitem/ui";
import { useAppStore, type ViewMode } from "./store";

interface SidebarProps {
  tree: TreeNode[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  onChangeFolder: () => void;
  onMove: (sourcePath: string, destDir: string) => void;
  onRename: (path: string, newName: string) => void;
  onDelete: (path: string) => void;
  onRequestCreate: (type: "file" | "dir", parentPath: string) => void;
  rootPath: string;
  onCreateNote: () => void;
  onCreateFolder: () => void;
}

export function Sidebar({
  tree,
  selectedFile,
  onFileSelect,
  onChangeFolder,
  onMove,
  onRename,
  onDelete,
  onRequestCreate,
  rootPath,
  onCreateNote,
  onCreateFolder,
}: SidebarProps) {
  const t = useT();
  const folderName = rootPath.split("/").pop() ?? rootPath;
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const [treeHeight, setTreeHeight] = useState(400);
  const { viewMode, setViewMode, dueCards } = useAppStore();

  const dndManager = useMemo(
    () =>
      createDragDropManager(TouchBackend, undefined, {
        enableMouseEvents: true,
        enableKeyboardEvents: true,
        delayTouchStart: 200,
        ignoreContextMenu: true,
      }),
    [],
  );

  useEffect(() => {
    const el = treeContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setTreeHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <aside
      className="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-surface"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15">
            <span className="text-[11px] font-bold text-accent">G</span>
          </div>
          <span className="text-[13px] font-semibold tracking-tight text-text-primary">
            {folderName}
          </span>
        </div>
        <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <CreateMenu
            onCreateNote={onCreateNote}
            onCreateFolder={onCreateFolder}
            onChangeFolder={onChangeFolder}
          />
        </div>
      </div>
      <div className="mx-3 border-t border-border" />
      <div ref={treeContainerRef} className="flex-1 overflow-hidden px-2 pt-1.5">
        <FileTree
          tree={tree}
          rootPath={rootPath}
          selectedFile={selectedFile}
          onFileSelect={(path) => {
            setViewMode("notes");
            onFileSelect(path);
          }}
          onMove={onMove}
          onRename={onRename}
          onDelete={onDelete}
          onRequestCreate={onRequestCreate}
          height={treeHeight}
          dndManager={dndManager}
        />
      </div>
      <div className="mx-3 border-t border-border" />
      <div className="flex items-center gap-1 px-2 py-1.5">
        <NavTab
          active={viewMode === "notes"}
          onClick={() => setViewMode("notes")}
          icon={<BookOpen size={14} strokeWidth={1.8} />}
          label={t("nav.notes")}
        />
        <NavTab
          active={viewMode === "review"}
          onClick={() => setViewMode("review")}
          icon={<Brain size={14} strokeWidth={1.8} />}
          label={t("nav.review")}
          badge={dueCards.length > 0 ? dueCards.length : undefined}
        />
        <NavTab
          active={viewMode === "settings"}
          onClick={() => setViewMode("settings")}
          icon={<Settings size={14} strokeWidth={1.8} />}
          label=""
        />
      </div>
    </aside>
  );
}

function NavTab({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-medium transition-all duration-150 ${label ? "flex-1" : "w-9"} ${
        active
          ? "bg-white/[0.06] text-accent"
          : "text-text-muted hover:bg-white/[0.03] hover:text-text-secondary"
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/20 px-1 text-[10px] font-semibold text-accent">
          {badge}
        </span>
      )}
    </button>
  );
}
