import { useRef, useCallback, useEffect, useState } from "react";
import { Tree, NodeRendererProps, NodeApi } from "react-arborist";
import { ChevronRight, FileText, Folder, ArrowUpToLine } from "lucide-react";
import type { TreeNode } from "./types";
import { useT, type TFunction } from "./i18n";

export interface PendingCreate {
  type: "file" | "dir";
  parentPath: string;
}

interface ArboristNode {
  id: string;
  name: string;
  isDir: boolean;
  children?: ArboristNode[];
}

function toArborist(nodes: TreeNode[]): ArboristNode[] {
  return nodes.map((n) => ({
    id: n.path,
    name: n.name,
    isDir: n.is_dir,
    children: n.is_dir ? toArborist(n.children ?? []) : undefined,
  }));
}

interface FileTreeProps {
  tree: TreeNode[];
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  onMove?: (sourcePath: string, destDir: string) => void;
  onRename?: (path: string, newName: string) => void;
  onDelete?: (path: string) => void;
  onRequestCreate?: (type: "file" | "dir", parentPath: string) => void;
  rootPath: string;
  height: number;
  dndManager?: any;
}

function Row({
  node,
  attrs,
  innerRef,
  children,
}: {
  node: NodeApi<ArboristNode>;
  attrs: React.HTMLAttributes<any>;
  innerRef: (el: HTMLDivElement | null) => void;
  children: React.ReactElement;
}) {
  const isSelected = node.isSelected;
  const isDir = node.data.isDir;
  const willDrop = node.willReceiveDrop;

  let bg = "";
  if (willDrop) {
    bg = "bg-accent/10";
  } else if (isSelected) {
    bg = isDir ? "bg-white/[0.05]" : "bg-accent/10";
  }

  return (
    <div
      {...attrs}
      ref={innerRef}
      className={`${bg} rounded-md transition-colors duration-100`}
      onFocus={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function Node({ node, style, dragHandle }: NodeRendererProps<ArboristNode>) {
  const isDir = node.data.isDir;
  const isSelected = node.isSelected;
  const willDrop = node.willReceiveDrop;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (node.isEditing && inputRef.current) {
      inputRef.current.focus();
      const name = node.data.name;
      const dot = name.lastIndexOf(".");
      inputRef.current.setSelectionRange(0, dot > 0 ? dot : name.length);
    }
  }, [node.isEditing]);

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`group flex h-full cursor-pointer select-none items-center gap-2 pr-2 text-[13px] ${
        willDrop
          ? "text-accent-hover"
          : isSelected
            ? isDir
              ? "text-text-primary"
              : "text-accent-hover"
            : "text-text-secondary hover:text-text-primary"
      } ${isDir ? "font-medium" : ""}`}
      onClick={(e) => {
        if (isDir) node.toggle();
        node.handleClick(e);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        node.select();
        node.tree.props.onContextMenu?.(e);
      }}
    >
      {isDir ? (
        <>
          <ChevronRight
            size={14}
            strokeWidth={2}
            className={`pointer-events-none shrink-0 text-text-muted transition-transform duration-150 ${node.isOpen ? "rotate-90" : ""}`}
          />
          <Folder
            size={14}
            strokeWidth={1.8}
            className={`pointer-events-none shrink-0 ${
              willDrop ? "text-accent" : "text-accent/60"
            }`}
          />
        </>
      ) : (
        <FileText
          size={14}
          strokeWidth={1.8}
          className={`pointer-events-none ml-[22px] shrink-0 ${isSelected ? "text-accent" : "text-text-muted"}`}
        />
      )}
      {node.isEditing ? (
        <input
          ref={inputRef}
          defaultValue={node.data.name}
          className="min-w-0 flex-1 rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-text-primary outline-none ring-1 ring-accent/40"
          onBlur={() => node.reset()}
          onKeyDown={(e) => {
            if (e.key === "Enter") node.submit(e.currentTarget.value);
            if (e.key === "Escape") node.reset();
          }}
        />
      ) : (
        <span className="pointer-events-none truncate">
          {isDir ? node.data.name : node.data.name.replace(/\.md$/, "")}
        </span>
      )}
    </div>
  );
}

function getParentDir(filePath: string): string {
  const idx = filePath.lastIndexOf("/");
  return idx > 0 ? filePath.substring(0, idx) : filePath;
}

function buildContextMenu(
  e: React.MouseEvent,
  node: NodeApi<ArboristNode>,
  rootPath: string,
  onDelete?: (path: string) => void,
  onRequestCreate?: (type: "file" | "dir", parentPath: string) => void,
  onMove?: (sourcePath: string, destDir: string) => void,
  t?: TFunction,
) {
  const existing = document.querySelector("[data-gitem-ctx]");
  if (existing) existing.remove();

  const menu = document.createElement("div");
  menu.setAttribute("data-gitem-ctx", "");
  menu.className =
    "animate-menu fixed z-[999] w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-[#141820] py-1.5 shadow-2xl shadow-black/60";
  menu.style.left = `${e.clientX}px`;
  menu.style.top = `${e.clientY}px`;

  type Item = {
    label: string;
    danger?: boolean;
    separator?: boolean;
    action: () => void;
  };

  const items: Item[] = [];

  if (node.data.isDir) {
    items.push({
      label: t?.("ctx.newNote") ?? "New note",
      action: () => onRequestCreate?.("file", node.id),
    });
    items.push({
      label: t?.("ctx.newFolder") ?? "New folder",
      separator: true,
      action: () => onRequestCreate?.("dir", node.id),
    });
  }

  const parentDir = getParentDir(node.id);
  if (parentDir !== rootPath) {
    items.push({
      label: t?.("ctx.moveToRoot") ?? "Move to root",
      action: () => onMove?.(node.id, rootPath),
    });
  }

  items.push({
    label: t?.("ctx.rename") ?? "Rename",
    action: () => node.edit(),
  });
  items.push({
    label: t?.("ctx.delete") ?? "Delete",
    danger: true,
    action: () => onDelete?.(node.id),
  });

  for (const item of items) {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.className = `flex w-full cursor-pointer items-center px-3 py-2 text-[13px] transition-colors duration-75 ${
      item.danger
        ? "text-red-400 hover:bg-red-500/10"
        : "text-slate-300 hover:bg-white/[0.04]"
    }`;
    btn.onclick = () => {
      item.action();
      menu.remove();
    };
    menu.appendChild(btn);

    if (item.separator) {
      const sep = document.createElement("div");
      sep.className = "mx-2.5 my-1 border-t border-white/[0.06]";
      menu.appendChild(sep);
    }
  }

  document.body.appendChild(menu);

  requestAnimationFrame(() => {
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - menuRect.width - 8}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - menuRect.height - 8}px`;
    }
  });

  const close = (ev: MouseEvent) => {
    if (!menu.contains(ev.target as globalThis.Node)) {
      menu.remove();
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeKey);
    }
  };
  const closeKey = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") {
      menu.remove();
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeKey);
    }
  };
  setTimeout(() => {
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeKey);
  }, 0);
}

export function FileTree({
  tree,
  selectedFile,
  onFileSelect,
  onMove,
  onRename,
  onDelete,
  onRequestCreate,
  rootPath,
  height,
  dndManager,
}: FileTreeProps) {
  const treeRef = useRef<any>(null);
  const data = toArborist(tree);
  const [rootDragOver, setRootDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const t = useT();

  const handleMove = useCallback(
    ({ dragIds, parentId }: { dragIds: string[]; parentId: string | null }) => {
      const destDir = parentId ?? rootPath;
      for (const sourcePath of dragIds) {
        onMove?.(sourcePath, destDir);
      }
    },
    [onMove, rootPath],
  );

  const handleRename = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      onRename?.(id, name);
    },
    [onRename],
  );

  const handleDelete = useCallback(
    ({ ids }: { ids: string[] }) => {
      for (const id of ids) {
        onDelete?.(id);
      }
    },
    [onDelete],
  );

  const handleSelect = useCallback(
    (nodes: NodeApi<ArboristNode>[]) => {
      const selected = nodes[0];
      if (selected && !selected.data.isDir) {
        onFileSelect(selected.id);
      }
    },
    [onFileSelect],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const tree = treeRef.current;
      if (!tree) return;
      const node = tree.selectedNodes[0];
      if (!node) return;
      buildContextMenu(e, node, rootPath, onDelete, onRequestCreate, onMove, t);
    },
    [onDelete, onRequestCreate, onMove, rootPath, t],
  );

  if (data.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
        <FileText size={24} strokeWidth={1.5} className="text-text-muted" />
        <p className="text-center text-[13px] leading-relaxed text-text-muted">
          {t("tree.noFiles")}
          <br />
          {t("tree.createHint")}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative h-full rounded-md transition-colors duration-150 ${rootDragOver ? "bg-accent/5 ring-1 ring-inset ring-accent/30" : ""}`}
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounterRef.current++;
        setRootDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) setRootDragOver(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragCounterRef.current = 0;
        setRootDragOver(false);
        const sourcePath = e.dataTransfer.getData("text/plain");
        if (sourcePath && onMove) {
          onMove(sourcePath, rootPath);
        }
      }}
    >
      <Tree<ArboristNode>
        ref={treeRef}
        data={data}
        width="100%"
        height={height}
        indent={16}
        rowHeight={32}
        openByDefault={false}
        disableMultiSelection
        paddingTop={4}
        paddingBottom={4}
        selection={selectedFile ?? undefined}
        onMove={handleMove}
        onRename={handleRename}
        onDelete={handleDelete}
        onSelect={handleSelect}
        onContextMenu={handleContextMenu}
        renderRow={Row}
        dndManager={dndManager}
        disableDrop={({
          parentNode,
        }: {
          parentNode: NodeApi<ArboristNode>;
        }) => {
          if (!parentNode) return false;
          return !parentNode.data.isDir;
        }}
      >
        {Node}
      </Tree>
    </div>
  );
}
