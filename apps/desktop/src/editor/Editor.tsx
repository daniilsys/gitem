import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { EditorState, Compartment, EditorSelection } from "@codemirror/state";
import { EditorView, keymap, rectangularSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, HighlightStyle, bracketMatching } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { invoke } from "@tauri-apps/api/core";
import { gitemTheme } from "./theme";
import { clozeHighlight } from "./cloze-decoration";
import { wysiwygPlugin, clozeAnswerTooltip } from "./wysiwyg";
import { markdownKeymap } from "./hotkeys";
import { autoReplace } from "./auto-replace";
import { headingFold } from "./heading-fold";
import { Toolbar } from "./Toolbar";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useAppStore } from "../store";

const gitemHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: "700", color: "#f8fafc" },
  { tag: tags.heading2, fontWeight: "600", color: "#f1f5f9" },
  { tag: tags.heading3, fontWeight: "600", color: "#e2e8f0" },
  { tag: tags.heading4, fontWeight: "600", color: "#e2e8f0" },
  { tag: tags.heading5, fontWeight: "600", color: "#cbd5e1" },
  { tag: tags.heading6, fontWeight: "600", color: "#94a3b8" },
  { tag: tags.strong, fontWeight: "700", color: "#e2e8f0" },
  { tag: tags.emphasis, fontStyle: "italic", color: "#cbd5e1" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "#64748b" },
  { tag: tags.link, textDecoration: "none", class: "cm-syn-accent" },
  { tag: tags.url, color: "#64748b" },
  { tag: tags.meta, class: "cm-syn-accent-muted" },
  { tag: tags.comment, color: "#475569" },
  { tag: tags.contentSeparator, class: "cm-syn-accent-muted" },
  { tag: tags.processingInstruction, class: "cm-syn-accent-muted" },
  { tag: tags.monospace, class: "cm-syn-accent" },
  { tag: tags.keyword, color: "#64748b" },
  { tag: tags.operator, color: "#64748b" },
  { tag: tags.punctuation, color: "#475569" },
  { tag: tags.quote, color: "#94a3b8", fontStyle: "italic" },
]);

interface FileStateResult {
  filePath: string;
  cursorLine: number;
  cursorCh: number;
}

function saveCursorState(view: EditorView, filePath: string) {
  const pos = view.state.selection.main.head;
  const line = view.state.doc.lineAt(pos);
  invoke("save_file_state", {
    filePath,
    line: line.number,
    ch: pos - line.from,
  }).catch(() => {});
}

export function Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const docCompartment = useRef(new Compartment());
  const zoomCompartment = useRef(new Compartment());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFileRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [, forceUpdate] = useState(0);

  const { selectedFile, setFileContent, setDirty, syncCards, editorZoom } = useAppStore();

  const saveFile = useCallback(
    async (path: string, content: string) => {
      try {
        await writeTextFile(path, content);
        setFileContent(path, content);
        if (currentFileRef.current === path) {
          setDirty(false);
        }
        syncCards();
      } catch {}
    },
    [setFileContent, setDirty, syncCards],
  );

  const handleChange = useCallback(
    (path: string) => {
      return EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        setDirty(true);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          const content = update.state.doc.toString();
          saveFile(path, content);
        }, 500);
      });
    },
    [saveFile, setDirty],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: "",
      extensions: [
        rectangularSelection(),
        bracketMatching(),
        history(),
        highlightSelectionMatches(),
        markdown(),
        syntaxHighlighting(gitemHighlight),
        keymap.of([
          ...markdownKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
        ]),
        gitemTheme,
        clozeHighlight,
        wysiwygPlugin,
        clozeAnswerTooltip,
        autoReplace,
        headingFold,
        docCompartment.current.of([]),
        zoomCompartment.current.of(EditorView.theme({ "&": { fontSize: "14px" } })),
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    forceUpdate((n) => n + 1);

    return () => {
      if (currentFileRef.current && view) {
        saveCursorState(view, currentFileRef.current);
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        const content = view.state.doc.toString();
        if (currentFileRef.current) {
          useAppStore.getState().setFileContent(currentFileRef.current, content);
          writeTextFile(currentFileRef.current, content).catch(() => {});
        }
      }
      view.destroy();
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const px = Math.round(14 * (editorZoom / 100));
    view.dispatch({
      effects: zoomCompartment.current.reconfigure(
        EditorView.theme({ "&": { fontSize: `${px}px` } }),
      ),
    });
  }, [editorZoom]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !selectedFile) return;

    setReady(false);

    if (currentFileRef.current && currentFileRef.current !== selectedFile) {
      saveCursorState(view, currentFileRef.current);
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      const prevContent = view.state.doc.toString();
      if (currentFileRef.current && currentFileRef.current !== selectedFile) {
        setFileContent(currentFileRef.current, prevContent);
        writeTextFile(currentFileRef.current, prevContent).catch(() => {});
      }
    }

    currentFileRef.current = selectedFile;

    view.dispatch({
      effects: docCompartment.current.reconfigure([]),
    });

    const cached = useAppStore.getState().fileContents[selectedFile];
    if (cached !== undefined) {
      applyContent(view, cached, selectedFile);
    } else {
      readTextFile(selectedFile).then((content) => {
        setFileContent(selectedFile, content);
        if (currentFileRef.current === selectedFile) {
          applyContent(view, content, selectedFile);
        }
      });
    }

    setDirty(false);
  }, [selectedFile, setFileContent, setDirty]);

  async function applyContent(view: EditorView, content: string, path: string) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });

    view.dispatch({
      effects: docCompartment.current.reconfigure([handleChange(path)]),
    });

    try {
      const state = await invoke<FileStateResult | null>("get_file_state", { filePath: path });
      if (state) {
        const totalLines = view.state.doc.lines;
        const lineNum = state.cursorLine <= totalLines ? state.cursorLine : 1;
        const line = view.state.doc.line(lineNum);
        const ch = Math.min(state.cursorCh, line.length);
        const pos = line.from + ch;
        view.dispatch({
          selection: EditorSelection.cursor(pos),
          effects: EditorView.scrollIntoView(pos, { y: "center" }),
        });
      } else {
        view.dispatch({ selection: { anchor: 0 } });
        view.scrollDOM.scrollTop = 0;
      }
    } catch {
      view.dispatch({ selection: { anchor: 0 } });
      view.scrollDOM.scrollTop = 0;
    }

    view.focus();

    requestAnimationFrame(() => setReady(true));
  }

  return (
    <div className="flex h-full flex-col">
      <Toolbar view={viewRef.current} />
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden transition-opacity duration-300 ease-out [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:overflow-auto ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
