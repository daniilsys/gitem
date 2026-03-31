import { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";

const replacements: [string, string][] = [
  ["<-->", "↔"],
  ["<==>", "⇔"],
  ["-->", "→"],
  ["<--", "←"],
  ["==>", "⇒"],
  ["<==", "⇐"],
  ["->", "→"],
  ["<-", "←"],
  ["=>", "⇒"],
  ["!=", "≠"],
  [">=", "≥"],
  ["...", "…"],
];

const maxLen = Math.max(...replacements.map(([p]) => p.length));

export const autoReplace = EditorView.inputHandler.of(
  (view, from, to, text) => {
    if (text.length !== 1) return false;

    const before = view.state.sliceDoc(
      Math.max(0, from - maxLen + 1),
      from,
    );
    const combined = before + text;

    for (const [pattern, replacement] of replacements) {
      if (combined.endsWith(pattern)) {
        const replaceFrom = from - (pattern.length - 1);
        view.dispatch({
          changes: { from: replaceFrom, to, insert: replacement },
          selection: EditorSelection.cursor(replaceFrom + replacement.length),
        });
        return true;
      }
    }

    return false;
  },
);
