import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  EditorView,
  ViewUpdate,
  WidgetType,
  hoverTooltip,
  Tooltip,
} from "@codemirror/view";
import { EditorState, Range } from "@codemirror/state";

class HrWidget extends WidgetType {
  toDOM() {
    const el = document.createElement("div");
    el.className = "cm-hr";
    return el;
  }
  ignoreEvent() {
    return false;
  }
}

const headingStyles: Record<number, string> = {
  1: "cm-wysiwyg-h1",
  2: "cm-wysiwyg-h2",
  3: "cm-wysiwyg-h3",
  4: "cm-wysiwyg-h4",
  5: "cm-wysiwyg-h5",
  6: "cm-wysiwyg-h6",
};

function cursorLines(state: EditorState): Set<number> {
  const lines = new Set<number>();
  for (const range of state.selection.ranges) {
    const startLine = state.doc.lineAt(range.from).number;
    const endLine = state.doc.lineAt(range.to).number;
    for (let i = startLine; i <= endLine; i++) {
      lines.add(i);
    }
  }
  return lines;
}

function isTableLine(text: string): boolean {
  const t = text.trim();
  return t.startsWith("|") && t.split("|").length >= 3;
}

function isTableSeparator(text: string): boolean {
  return /^\|[\s\-:|]+\|[\s\-:|]*$/.test(text.trim()) && text.includes("-");
}

function decorateTableLine(
  text: string,
  lineFrom: number,
  rangeDecos: Range<Decoration>[],
  lineDecos: Range<Decoration>[],
  isHeader: boolean,
) {
  if (isTableSeparator(text)) {
    lineDecos.push(
      Decoration.line({ class: "cm-table-sep" }).range(lineFrom),
    );
    return;
  }

  lineDecos.push(
    Decoration.line({ class: isHeader ? "cm-table-header" : "cm-table-row" }).range(lineFrom),
  );

  let i = 0;
  while (i < text.length) {
    if (text[i] === "|") {
      rangeDecos.push(
        Decoration.mark({ class: "cm-table-pipe" }).range(lineFrom + i, lineFrom + i + 1),
      );
    }
    i++;
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const active = cursorLines(state);
  const lineDecos: Range<Decoration>[] = [];
  const rangeDecos: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = state.doc.lineAt(pos);

      if (!active.has(line.number)) {
        if (isTableLine(line.text)) {
          let isHeader = false;
          if (!isTableSeparator(line.text) && line.number < state.doc.lines) {
            const nextLine = state.doc.line(line.number + 1);
            isHeader = isTableSeparator(nextLine.text);
          }
          decorateTableLine(line.text, line.from, rangeDecos, lineDecos, isHeader);
        } else {
          decorateLineAway(line.text, line.from, rangeDecos, lineDecos);
        }
      }

      pos = line.to + 1;
    }
  }

  lineDecos.sort((a, b) => a.from - b.from);
  rangeDecos.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);
  const all = [...lineDecos, ...rangeDecos];
  all.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);
  return Decoration.set(all, true);
}

function decorateLineAway(
  text: string,
  lineFrom: number,
  rangeDecos: Range<Decoration>[],
  lineDecos: Range<Decoration>[],
) {
  const headingMatch = text.match(/^(#{1,6})\s/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const hashEnd = lineFrom + headingMatch[0].length;
    const cls = headingStyles[level];
    if (cls) {
      rangeDecos.push(
        Decoration.replace({}).range(lineFrom, hashEnd),
      );
      rangeDecos.push(
        Decoration.mark({ class: cls }).range(hashEnd, lineFrom + text.length),
      );
    }
    return;
  }

  const quoteMatch = text.match(/^>\s?/);
  if (quoteMatch) {
    rangeDecos.push(
      Decoration.replace({}).range(lineFrom, lineFrom + quoteMatch[0].length),
    );
    if (text.length > quoteMatch[0].length) {
      rangeDecos.push(
        Decoration.mark({ class: "cm-wysiwyg-blockquote" }).range(
          lineFrom + quoteMatch[0].length,
          lineFrom + text.length,
        ),
      );
    }
    lineDecos.push(
      Decoration.line({ class: "cm-wysiwyg-blockquote-line" }).range(lineFrom),
    );
    return;
  }

  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(text)) {
    rangeDecos.push(
      Decoration.replace({ widget: new HrWidget() }).range(
        lineFrom,
        lineFrom + text.length,
      ),
    );
    return;
  }

  decorateInline(text, lineFrom, rangeDecos);
}

function decorateInline(
  text: string,
  lineFrom: number,
  decorations: Range<Decoration>[],
) {
  const simplePatterns: {
    regex: RegExp;
    delimLen: number | [number, number];
    cls: string;
  }[] = [
    { regex: /\*\*(.+?)\*\*/g, delimLen: 2, cls: "cm-wysiwyg-bold" },
    { regex: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, delimLen: 1, cls: "cm-wysiwyg-italic" },
    { regex: /~~(.+?)~~/g, delimLen: 2, cls: "cm-wysiwyg-strike" },
    { regex: /==(.+?)==/g, delimLen: 2, cls: "cm-wysiwyg-highlight" },
    { regex: /`([^`]+)`/g, delimLen: 1, cls: "cm-wysiwyg-code" },
  ];

  for (const { regex, delimLen, cls } of simplePatterns) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(text))) {
      const matchStart = lineFrom + m.index;
      const matchEnd = matchStart + m[0].length;
      const [openLen, closeLen] =
        typeof delimLen === "number" ? [delimLen, delimLen] : delimLen;
      const contentStart = matchStart + openLen;
      const contentEnd = matchEnd - closeLen;

      if (contentStart >= contentEnd) continue;

      decorations.push(
        Decoration.replace({}).range(matchStart, contentStart),
      );
      decorations.push(
        Decoration.mark({ class: cls }).range(contentStart, contentEnd),
      );
      decorations.push(
        Decoration.replace({}).range(contentEnd, matchEnd),
      );
    }
  }

  const clozeRegex = /@@([^@]+?)(?:::([^@]+?))?@@/g;
  clozeRegex.lastIndex = 0;
  let cm;
  while ((cm = clozeRegex.exec(text))) {
    const matchStart = lineFrom + cm.index;
    const matchEnd = matchStart + cm[0].length;
    const question = cm[1];
    const hasAnswer = cm[2] !== undefined;

    decorations.push(
      Decoration.replace({}).range(matchStart, matchStart + 2),
    );

    const questionStart = matchStart + 2;
    const questionEnd = questionStart + question.length;
    decorations.push(
      Decoration.mark({ class: "cm-wysiwyg-cloze" }).range(questionStart, questionEnd),
    );

    if (hasAnswer) {
      decorations.push(
        Decoration.replace({}).range(questionEnd, matchEnd - 2),
      );
    }

    decorations.push(
      Decoration.replace({}).range(matchEnd - 2, matchEnd),
    );
  }
}

export const clozeAnswerTooltip = hoverTooltip(
  (view: EditorView, pos: number): Tooltip | null => {
    const line = view.state.doc.lineAt(pos);
    const text = line.text;
    const offset = pos - line.from;

    const clozeRegex = /@@([^@]+?)::([^@]+?)@@/g;
    let m;
    while ((m = clozeRegex.exec(text))) {
      const start = m.index;
      const end = start + m[0].length;
      if (offset >= start && offset <= end) {
        const answer = m[2].trim();
        const coords = view.coordsAtPos(line.from + start);
        const above = coords ? coords.top > 140 : false;
        return {
          pos: line.from + start,
          end: line.from + end,
          above,
          create: () => {
            const dom = document.createElement("div");
            dom.className = "cm-tooltip-cloze-answer";
            dom.innerHTML = `<div class="cloze-label">Answer</div><div class="cloze-text">${escapeHtml(answer)}</div>`;
            return { dom };
          },
        };
      }
    }
    return null;
  },
  { hoverTime: 300 },
);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const wysiwygPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.selectionSet
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);
