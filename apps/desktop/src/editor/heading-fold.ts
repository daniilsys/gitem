import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  WidgetType,
} from "@codemirror/view";
import { EditorState, StateField, StateEffect, Range } from "@codemirror/state";

const toggleFold = StateEffect.define<number>();

const foldState = StateField.define<Set<number>>({
  create: () => new Set(),
  update(folds, tr) {
    let next = folds;
    for (const e of tr.effects) {
      if (e.is(toggleFold)) {
        next = new Set(next);
        if (next.has(e.value)) {
          next.delete(e.value);
        } else {
          next.add(e.value);
        }
      }
    }
    if (tr.docChanged) {
      const updated = new Set<number>();
      for (const lineNum of next) {
        if (lineNum <= tr.state.doc.lines) {
          const line = tr.state.doc.line(lineNum);
          if (/^#{1,6}\s/.test(line.text)) {
            updated.add(lineNum);
          }
        }
      }
      return updated;
    }
    return next;
  },
});

function getHeadingLevel(text: string): number {
  const m = text.match(/^(#{1,6})\s/);
  return m ? m[1].length : 0;
}

function getFoldRange(state: EditorState, lineNum: number): { from: number; to: number } | null {
  const line = state.doc.line(lineNum);
  const level = getHeadingLevel(line.text);
  if (level === 0) return null;

  let endLine = lineNum;
  for (let i = lineNum + 1; i <= state.doc.lines; i++) {
    const nextLine = state.doc.line(i);
    const nextLevel = getHeadingLevel(nextLine.text);
    if (nextLevel > 0 && nextLevel <= level) break;
    endLine = i;
  }

  if (endLine === lineNum) return null;
  return { from: state.doc.line(lineNum + 1).from, to: state.doc.line(endLine).to };
}

class FoldChevron extends WidgetType {
  constructor(readonly lineNum: number, readonly folded: boolean) {
    super();
  }

  eq(other: FoldChevron) {
    return this.lineNum === other.lineNum && this.folded === other.folded;
  }

  toDOM(view: EditorView) {
    const span = document.createElement("span");
    span.className = "cm-heading-chevron";
    span.textContent = this.folded ? "▶" : "▼";
    if (this.folded) span.classList.add("cm-heading-chevron-folded");
    span.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      view.dispatch({ effects: toggleFold.of(this.lineNum) });
    });
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

const chevronPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.startState.field(foldState) !== update.state.field(foldState)) {
        this.decorations = this.build(update.view);
      }
    }
    build(view: EditorView): DecorationSet {
      const { state } = view;
      const folds = state.field(foldState);
      const decos: Range<Decoration>[] = [];

      for (const { from, to } of view.visibleRanges) {
        let pos = from;
        while (pos <= to) {
          const line = state.doc.lineAt(pos);
          const level = getHeadingLevel(line.text);
          if (level > 0) {
            const range = getFoldRange(state, line.number);
            if (range) {
              const folded = folds.has(line.number);
              decos.push(
                Decoration.widget({
                  widget: new FoldChevron(line.number, folded),
                  side: -1,
                }).range(line.from),
              );
            }
          }
          pos = line.to + 1;
        }
      }

      return Decoration.set(decos, true);
    }
  },
  { decorations: (v) => v.decorations },
);

const foldPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.startState.field(foldState) !== update.state.field(foldState)) {
        this.decorations = this.build(update.view);
      }
    }
    build(view: EditorView): DecorationSet {
      const { state } = view;
      const folds = state.field(foldState);
      const decos: Range<Decoration>[] = [];

      for (const lineNum of folds) {
        const range = getFoldRange(state, lineNum);
        if (range) {
          for (let i = state.doc.lineAt(range.from).number; i <= state.doc.lineAt(range.to).number; i++) {
            const ln = state.doc.line(i);
            decos.push(
              Decoration.line({ class: "cm-heading-folded-line" }).range(ln.from),
            );
            if (ln.text.length > 0) {
              decos.push(
                Decoration.replace({}).range(ln.from, ln.to),
              );
            }
          }
        }
      }

      decos.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);
      return Decoration.set(decos, true);
    }
  },
  { decorations: (v) => v.decorations },
);

export const headingFold = [foldState, chevronPlugin, foldPlugin];
