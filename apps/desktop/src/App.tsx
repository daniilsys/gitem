import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { load } from "@tauri-apps/plugin-store";
import { FileText, ChevronRight } from "lucide-react";
import { EmptyState, ConfirmDialog, CreateDialog, useT } from "@gitem/ui";
import { Editor } from "./editor/Editor";
import { ReviewSession } from "./ReviewSession";
import { Settings } from "./Settings";
import { Onboarding } from "./Onboarding";
import type { TreeNode, PendingCreate } from "@gitem/ui";
import { useAppStore } from "./store";
import { Sidebar } from "./Sidebar";
import { getTheme, getAccent, applyTheme } from "./themes";

function getParentDir(filePath: string): string {
  const idx = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  return idx > 0 ? filePath.substring(0, idx) : filePath;
}

function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).filter(Boolean).pop() ?? filePath;
}

function getBreadcrumb(filePath: string, rootPath: string): string[] {
  const relative = filePath.replace(rootPath, "").replace(/^[/\\]/, "");
  const parts = relative.split(/[/\\]/);
  return parts.map((p) => p.replace(/\.md$/, ""));
}

export function App() {
  const t = useT();
  const { rootPath, selectedFile, isDirty, viewMode, fileContents, editorZoom, themeId, accentId, lastOpenedFile, setRootPath, setSelectedFile, syncCards, zoomIn, zoomOut, zoomReset, setTheme, setAccent, setLocale, setSpellcheck, setAutoCapitalize, setLastOpenedFile } =
    useAppStore();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null);

  const refreshTree = useCallback(async () => {
    if (!rootPath) return;
    const result = await invoke<TreeNode[]>("get_tree", { path: rootPath });
    setTree(result);
  }, [rootPath]);

  useEffect(() => {
    load("settings.json").then(async (store) => {
      const saved = await store.get<string>("rootPath");
      if (saved) {
        setRootPath(saved);
      }
      const savedTheme = await store.get<string>("themeId");
      const savedAccent = await store.get<string>("accentId");
      const savedLocale = await store.get<string>("locale");
      if (savedTheme) setTheme(savedTheme);
      if (savedAccent) setAccent(savedAccent);
      if (savedLocale) setLocale(savedLocale);
      applyTheme(getTheme(savedTheme ?? "midnight"), getAccent(savedAccent ?? "violet"));
      const savedSpellcheck = await store.get<boolean>("spellcheck");
      const savedAutoCap = await store.get<boolean>("autoCapitalize");
      if (savedSpellcheck !== null && savedSpellcheck !== undefined) setSpellcheck(savedSpellcheck);
      if (savedAutoCap !== null && savedAutoCap !== undefined) setAutoCapitalize(savedAutoCap);
      const savedLastFile = await store.get<string>("lastOpenedFile");
      if (savedLastFile) setLastOpenedFile(savedLastFile);
      const hasOnboarded = await store.get<boolean>("hasOnboarded");
      if (!hasOnboarded && !saved) {
        setShowOnboarding(true);
      }
      setLoading(false);
    });
  }, [setRootPath, setTheme, setAccent, setLocale]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "=") { e.preventDefault(); zoomIn(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") { e.preventDefault(); zoomOut(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") { e.preventDefault(); zoomReset(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomIn, zoomOut, zoomReset]);

  useEffect(() => {
    if (!rootPath) {
      setTree([]);
      return;
    }
    refreshTree();
    syncCards();
  }, [rootPath, refreshTree, syncCards]);

  const handleOpenFolder = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      const store = await load("settings.json");
      await store.set("rootPath", selected);
      await store.save();
      setRootPath(selected);
    }
  }, [setRootPath]);

  const handleFileSelect = useCallback(async (path: string | null) => {
    setSelectedFile(path);
    if (path) {
      setLastOpenedFile(path);
      const store = await load("settings.json");
      await store.set("lastOpenedFile", path);
      await store.save();
    }
  }, [setSelectedFile, setLastOpenedFile]);

  const getActiveDir = useCallback((): string => {
    if (!rootPath) return "";
    if (!selectedFile) return rootPath;
    return getParentDir(selectedFile);
  }, [rootPath, selectedFile]);

  const handleMove = useCallback(
    async (sourcePath: string, destDir: string) => {
      if (getParentDir(sourcePath) === destDir) return;
      try {
        const newPath = await invoke<string>("move_entry", {
          source: sourcePath,
          destDir,
        });
        await refreshTree();
        if (selectedFile === sourcePath) {
          setSelectedFile(newPath);
        }
      } catch {
        await refreshTree();
      }
    },
    [refreshTree, selectedFile, setSelectedFile],
  );

  const handleRename = useCallback(
    async (path: string, newName: string) => {
      try {
        const newPath = await invoke<string>("rename_entry", {
          path,
          newName,
        });
        invoke("delete_file_state", { filePath: path }).catch(() => {});
        await refreshTree();
        if (selectedFile === path) {
          setSelectedFile(newPath);
        }
      } catch {
        await refreshTree();
      }
    },
    [refreshTree, selectedFile, setSelectedFile],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      if (selectedFile === pendingDelete) {
        setSelectedFile(null);
      }
      await invoke("delete_entry", { path: pendingDelete });
      invoke("delete_file_state", { filePath: pendingDelete }).catch(() => {});
      const { fileContents: fc } = useAppStore.getState();
      if (fc[pendingDelete]) {
        const next = { ...fc };
        delete next[pendingDelete];
        useAppStore.setState({ fileContents: next });
      }
      await refreshTree();
      syncCards();
    } finally {
      setPendingDelete(null);
    }
  }, [pendingDelete, refreshTree, selectedFile, setSelectedFile]);

  const handleRequestCreate = useCallback(
    (type: "file" | "dir", parentPath: string) => {
      setPendingCreate({ type, parentPath });
    },
    [],
  );

  const handleCreateSubmit = useCallback(
    async (name: string) => {
      if (!pendingCreate) return;
      try {
        if (pendingCreate.type === "file") {
          const filePath = await invoke<string>("create_file", {
            dir: pendingCreate.parentPath,
            name,
          });
          await refreshTree();
          setSelectedFile(filePath);
        } else {
          await invoke<string>("create_dir", {
            parent: pendingCreate.parentPath,
            name,
          });
          await refreshTree();
        }
      } catch {
        await refreshTree();
      } finally {
        setPendingCreate(null);
      }
    },
    [pendingCreate, refreshTree, setSelectedFile],
  );

  if (loading) {
    return <div className="h-full bg-bg" />;
  }

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={async () => {
          setShowOnboarding(false);
          const store = await load("settings.json");
          await store.set("hasOnboarded", true);
          await store.save();
        }}
        onOpenFolder={handleOpenFolder}
      />
    );
  }

  if (!rootPath) {
    return (
      <div className="h-full bg-bg">
        <EmptyState onOpenFolder={handleOpenFolder} />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-bg">
      <Sidebar
        tree={tree}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onChangeFolder={handleOpenFolder}
        onMove={handleMove}
        onRename={handleRename}
        onDelete={setPendingDelete}
        onRequestCreate={handleRequestCreate}
        rootPath={rootPath}
        onCreateNote={() => handleRequestCreate("file", getActiveDir())}
        onCreateFolder={() => handleRequestCreate("dir", getActiveDir())}
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {viewMode === "settings" ? (
          <Settings />
        ) : viewMode === "review" ? (
          <ReviewSession />
        ) : selectedFile ? (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-2">
              <div className="flex items-center gap-1.5 text-[12px]">
                {getBreadcrumb(selectedFile, rootPath).map((segment, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight size={10} strokeWidth={2} className="text-text-muted/50" />}
                    <span className={i === arr.length - 1 ? "text-text-secondary font-medium" : "text-text-muted"}>
                      {segment}
                    </span>
                  </span>
                ))}
                {isDirty && (
                  <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-accent/80" />
                )}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor />
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-1.5">
              <span className="text-[11px] text-text-muted/60">
                {(() => {
                  const content = fileContents[selectedFile] ?? "";
                  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
                  const chars = content.length;
                  return t("editor.wordCount", { words, chars });
                })()}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={zoomOut}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-[11px] text-text-muted/60 transition-colors hover:bg-white/[0.06] hover:text-text-secondary"
                  >
                    −
                  </button>
                  <button
                    onClick={zoomReset}
                    className={`w-[38px] cursor-pointer text-center text-[11px] tabular-nums transition-colors ${editorZoom !== 100 ? "text-accent hover:text-accent-hover" : "text-text-muted/60"}`}
                  >
                    {editorZoom}%
                  </button>
                  <button
                    onClick={zoomIn}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-[11px] text-text-muted/60 transition-colors hover:bg-white/[0.06] hover:text-text-secondary"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-text-muted/60">{t("editor.markdown")}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent blur-2xl" />
              <div className="animate-float relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/15 to-accent/10 ring-1 ring-white/[0.08]">
                <FileText size={26} strokeWidth={1.3} className="text-accent/80" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[15px] font-medium text-text-secondary">
                {t("editor.selectNote")}
              </p>
              <p className="text-[12px] text-text-muted">
                {t("editor.selectNoteHint")}
              </p>
            </div>
            {lastOpenedFile && (
              <button
                onClick={() => handleFileSelect(lastOpenedFile)}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-accent/20 bg-accent/[0.06] px-5 py-3 transition-all duration-150 hover:border-accent/30 hover:bg-accent/10 active:scale-[0.98]"
              >
                <FileText size={15} strokeWidth={1.8} className="text-accent" />
                <div className="flex flex-col items-start">
                  <span className="text-[13px] font-medium text-accent">{t("editor.continueEditing")}</span>
                  <span className="text-[11px] text-text-muted">{getFileName(lastOpenedFile).replace(/\.md$/, "")}</span>
                </div>
              </button>
            )}
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.02] px-4 py-2.5 ring-1 ring-white/[0.04]">
              <span className="text-[11px] font-medium text-accent">{t("editor.tip")}</span>
              <span className="text-[11px] text-text-muted">{t("editor.flashcardHint")}</span>
            </div>
          </div>
        )}
      </main>
      {pendingCreate && (
        <CreateDialog
          type={pendingCreate.type}
          onSubmit={handleCreateSubmit}
          onCancel={() => setPendingCreate(null)}
        />
      )}
      {pendingDelete && (
        <ConfirmDialog
          title={t("confirm.delete")}
          message={t("confirm.deleteMsg", { name: getFileName(pendingDelete) })}
          confirmLabel={t("confirm.delete")}
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
