import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { EditorState, Compartment, EditorSelection } from "@codemirror/state";
import { EditorView, keymap, drawSelection, rectangularSelection } from "@codemirror/view";
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
import { autoCapitalize as autoCapExt } from "./auto-capitalize";
import { headingFold } from "./heading-fold";
import { Toolbar } from "./Toolbar";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useAppStore } from "../store";

const gitemHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: "700", class: "cm-syn-heading" },
  { tag: tags.heading2, fontWeight: "600", class: "cm-syn-heading" },
  { tag: tags.heading3, fontWeight: "600", class: "cm-syn-heading" },
  { tag: tags.heading4, fontWeight: "600", class: "cm-syn-heading" },
  { tag: tags.heading5, fontWeight: "600", class: "cm-syn-secondary" },
  { tag: tags.heading6, fontWeight: "600", class: "cm-syn-muted" },
  { tag: tags.strong, fontWeight: "700", class: "cm-syn-heading" },
  { tag: tags.emphasis, fontStyle: "italic", class: "cm-syn-secondary" },
  { tag: tags.strikethrough, textDecoration: "line-through", class: "cm-syn-muted" },
  { tag: tags.link, textDecoration: "none", class: "cm-syn-accent" },
  { tag: tags.url, class: "cm-syn-muted" },
  { tag: tags.meta, class: "cm-syn-accent-muted" },
  { tag: tags.comment, class: "cm-syn-muted" },
  { tag: tags.contentSeparator, class: "cm-syn-accent-muted" },
  { tag: tags.processingInstruction, class: "cm-syn-accent-muted" },
  { tag: tags.monospace, class: "cm-syn-accent" },
  { tag: tags.keyword, class: "cm-syn-muted" },
  { tag: tags.operator, class: "cm-syn-muted" },
  { tag: tags.punctuation, class: "cm-syn-muted" },
  { tag: tags.quote, fontStyle: "italic", class: "cm-syn-secondary" },
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
  const spellcheckCompartment = useRef(new Compartment());
  const autoCapCompartment = useRef(new Compartment());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentFileRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [, forceUpdate] = useState(0);

  const { selectedFile, setFileContent, setDirty, syncCards, editorZoom, spellcheck, autoCapitalize, locale } = useAppStore();

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
        drawSelection({ cursorBlinkRate: 1000 }),
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
        spellcheckCompartment.current.of(
          EditorView.contentAttributes.of({
            spellcheck: spellcheck ? "true" : "false",
            autocorrect: "on",
            autocapitalize: "sentences",
            lang: locale ?? navigator.language,
          }),
        ),
        autoCapCompartment.current.of(autoCapitalize ? autoCapExt : []),
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
    view.dispatch({
      effects: spellcheckCompartment.current.reconfigure(
        EditorView.contentAttributes.of({
          spellcheck: spellcheck ? "true" : "false",
          autocorrect: "on",
          autocapitalize: "sentences",
          lang: locale ?? navigator.language,
        }),
      ),
    });
  }, [spellcheck, locale]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: autoCapCompartment.current.reconfigure(
        autoCapitalize ? autoCapExt : [],
      ),
    });
  }, [autoCapitalize]);

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
    if (!view) return;

    if (!selectedFile) {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      currentFileRef.current = null;
      setReady(false);
      return;
    }

    setReady(false);

    if (currentFileRef.current && currentFileRef.current !== selectedFile) {
      saveCursorState(view, currentFileRef.current);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        const prevContent = view.state.doc.toString();
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
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar view={viewRef.current} />
      <div
        ref={containerRef}
        className={`min-h-0 flex-1 overflow-hidden transition-opacity duration-300 ease-out [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:overflow-auto ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
