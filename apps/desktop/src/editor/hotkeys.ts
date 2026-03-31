import { KeyBinding, EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import {
  indentMore,
  indentLess,
} from "@codemirror/commands";

export function wrapSelection(view: EditorView, before: string, after: string) {
  const { state } = view;
  const changes = state.changeByRange((range) => {
    const selected = state.sliceDoc(range.from, range.to);
    const replacement = before + selected + after;
    return {
      range: EditorSelection.range(
        range.from + before.length,
        range.from + before.length + selected.length,
      ),
      changes: { from: range.from, to: range.to, insert: replacement },
    };
  });
  view.dispatch(changes);
  return true;
}

export function insertAtCursor(view: EditorView, text: string, cursorOffset: number) {
  const pos = view.state.selection.main.head;
  view.dispatch({
    changes: { from: pos, to: pos, insert: text },
    selection: EditorSelection.cursor(pos + cursorOffset),
  });
  return true;
}

export function prefixLine(view: EditorView, prefix: string) {
  const { state } = view;
  const pos = state.selection.main.head;
  const line = state.doc.lineAt(pos);
  if (line.text.startsWith(prefix)) {
    view.dispatch({
      changes: { from: line.from, to: line.from + prefix.length, insert: "" },
      selection: EditorSelection.cursor(Math.max(line.from, pos - prefix.length)),
    });
  } else {
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: prefix },
      selection: EditorSelection.cursor(pos + prefix.length),
    });
  }
  return true;
}

export function toggleHeading(view: EditorView, level: number) {
  const { state } = view;
  const pos = state.selection.main.head;
  const line = state.doc.lineAt(pos);
  const prefix = "#".repeat(level) + " ";
  const headingMatch = line.text.match(/^#{1,6}\s/);
  if (headingMatch) {
    if (headingMatch[0] === prefix) {
      const offset = prefix.length;
      view.dispatch({
        changes: { from: line.from, to: line.from + offset, insert: "" },
        selection: EditorSelection.cursor(Math.max(line.from, pos - offset)),
      });
    } else {
      const diff = prefix.length - headingMatch[0].length;
      view.dispatch({
        changes: { from: line.from, to: line.from + headingMatch[0].length, insert: prefix },
        selection: EditorSelection.cursor(pos + diff),
      });
    }
  } else {
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: prefix },
      selection: EditorSelection.cursor(pos + prefix.length),
    });
  }
  return true;
}

export function insertTable(view: EditorView, cols = 3, rows = 2) {
  const header = "| " + Array.from({ length: cols }, (_, i) => `Column ${i + 1}`).join(" | ") + " |";
  const sep = "| " + Array.from({ length: cols }, () => "---").join(" | ") + " |";
  const body = Array.from({ length: rows }, () =>
    "| " + Array.from({ length: cols }, () => "  ").join(" | ") + " |",
  ).join("\n");
  const table = `\n${header}\n${sep}\n${body}\n`;
  const pos = view.state.selection.main.head;
  view.dispatch({
    changes: { from: pos, to: pos, insert: table },
    selection: EditorSelection.cursor(pos + table.indexOf("  ") + 1),
  });
  return true;
}

function isTableLine(text: string): boolean {
  const t = text.trim();
  return t.startsWith("|") && t.split("|").length >= 3;
}

function isSepLine(text: string): boolean {
  return /^\|[\s\-:|]+\|/.test(text.trim()) && text.includes("-");
}

interface CellPos { start: number; end: number; contentFrom: number }

function getCells(text: string, lineFrom: number): CellPos[] {
  const pipes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "|") pipes.push(i);
  }
  const cells: CellPos[] = [];
  for (let i = 0; i < pipes.length - 1; i++) {
    const rawStart = pipes[i] + 1;
    const rawEnd = pipes[i + 1];
    if (rawEnd <= rawStart) continue;
    const slice = text.substring(rawStart, rawEnd);
    const trimmed = slice.trimStart();
    const contentFrom = rawStart + (slice.length - trimmed.length);
    cells.push({
      start: lineFrom + rawStart,
      end: lineFrom + rawEnd,
      contentFrom: lineFrom + contentFrom,
    });
  }
  return cells;
}

function tabInTable(view: EditorView, forward: boolean): boolean {
  const { state } = view;
  const pos = state.selection.main.head;
  const line = state.doc.lineAt(pos);
  if (!isTableLine(line.text)) return false;

  const cells = getCells(line.text, line.from);
  if (cells.length === 0) return false;

  let currentIdx = 0;
  for (let i = 0; i < cells.length; i++) {
    if (pos >= cells[i].start && pos < cells[i].end) {
      currentIdx = i;
      break;
    }
    if (i === cells.length - 1) currentIdx = i;
  }

  const moveTo = (cell: CellPos) => {
    view.dispatch({ selection: EditorSelection.cursor(cell.contentFrom) });
  };

  if (forward) {
    if (currentIdx < cells.length - 1) {
      moveTo(cells[currentIdx + 1]);
      return true;
    }
    let nextNum = line.number + 1;
    while (nextNum <= state.doc.lines) {
      const nextLine = state.doc.line(nextNum);
      if (!isTableLine(nextLine.text)) return true;
      if (!isSepLine(nextLine.text)) {
        const nextCells = getCells(nextLine.text, nextLine.from);
        if (nextCells.length > 0) {
          moveTo(nextCells[0]);
          return true;
        }
      }
      nextNum++;
    }
  } else {
    if (currentIdx > 0) {
      moveTo(cells[currentIdx - 1]);
      return true;
    }
    let prevNum = line.number - 1;
    while (prevNum >= 1) {
      const prevLine = state.doc.line(prevNum);
      if (!isTableLine(prevLine.text)) return true;
      if (!isSepLine(prevLine.text)) {
        const prevCells = getCells(prevLine.text, prevLine.from);
        if (prevCells.length > 0) {
          moveTo(prevCells[prevCells.length - 1]);
          return true;
        }
      }
      prevNum--;
    }
  }

  return false;
}

export const markdownKeymap: KeyBinding[] = [
  {
    key: "Mod-b",
    run: (view) => wrapSelection(view, "**", "**"),
  },
  {
    key: "Mod-i",
    run: (view) => wrapSelection(view, "*", "*"),
  },
  {
    key: "Mod-u",
    run: (view) => wrapSelection(view, "==", "=="),
  },
  {
    key: "Mod-k",
    run: (view) => {
      const { state } = view;
      const selected = state.sliceDoc(
        state.selection.main.from,
        state.selection.main.to,
      );
      if (selected) {
        return wrapSelection(view, "[", "](url)");
      }
      return insertAtCursor(view, "[](url)", 1);
    },
  },
  {
    key: "Mod-d",
    run: (view) => {
      const { state } = view;
      const selected = state.sliceDoc(
        state.selection.main.from,
        state.selection.main.to,
      );
      if (selected) {
        return wrapSelection(view, "@@", "::answer@@");
      }
      return insertAtCursor(view, "@@question::answer@@", 2);
    },
  },
  {
    key: "Mod-Shift-x",
    run: (view) => wrapSelection(view, "~~", "~~"),
  },
  {
    key: "Mod-Shift-.",
    run: (view) => prefixLine(view, "> "),
  },
  {
    key: "Mod-1",
    run: (view) => toggleHeading(view, 1),
  },
  {
    key: "Mod-&",
    run: (view) => toggleHeading(view, 1),
  },
  {
    key: "Mod-2",
    run: (view) => toggleHeading(view, 2),
  },
  {
    key: "Mod-é",
    run: (view) => toggleHeading(view, 2),
  },
  {
    key: "Mod-3",
    run: (view) => toggleHeading(view, 3),
  },
  {
    key: "Mod-\"",
    run: (view) => toggleHeading(view, 3),
  },
  {
    key: "Tab",
    run: (view) => tabInTable(view, true) || indentMore(view),
  },
  {
    key: "Shift-Tab",
    run: (view) => tabInTable(view, false) || indentLess(view),
  },
];
