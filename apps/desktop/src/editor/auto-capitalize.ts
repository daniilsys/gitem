import { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";

export const autoCapitalize = EditorView.inputHandler.of(
  (view, from, to, text) => {
    if (text.length !== 1) return false;
    if (text === text.toUpperCase()) return false;
    if (!/[a-zà-ÿ]/i.test(text)) return false;

    const line = view.state.doc.lineAt(from);

    if (/^[#\-*>|`!\[1-9]/.test(line.text.trimStart())) return false;

    const beforeOnLine = view.state.sliceDoc(line.from, from);

    if (beforeOnLine.includes("@@") && !beforeOnLine.includes("@@", beforeOnLine.indexOf("@@") + 2)) return false;
    if ((beforeOnLine.match(/`/g) || []).length % 2 === 1) return false;

    const isLineStart = beforeOnLine.trim() === "";

    const before2 = view.state.sliceDoc(Math.max(0, from - 2), from);
    const isAfterSentence = /[.!?]\s$/.test(before2);

    if (isLineStart || isAfterSentence) {
      view.dispatch({
        changes: { from, to, insert: text.toUpperCase() },
        selection: EditorSelection.cursor(from + 1),
      });
      return true;
    }

    return false;
  },
);
