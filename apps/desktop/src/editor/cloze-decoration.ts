import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  EditorView,
  ViewUpdate,
  MatchDecorator,
} from "@codemirror/view";

const clozeMark = Decoration.mark({ class: "cm-cloze" });

const clozeDecorator = new MatchDecorator({
  regexp: /@@([^@]+?)(?:::([^@]+?))?@@/g,
  decoration: () => clozeMark,
});

export const clozeHighlight = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = clozeDecorator.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.decorations = clozeDecorator.updateDeco(update, this.decorations);
    }
  },
  { decorations: (v) => v.decorations },
);
