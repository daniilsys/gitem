import { EditorView } from "@codemirror/view";

export const gitemTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      backgroundColor: "var(--gitem-editor-bg, #080a0f)",
      color: "var(--color-text-primary, #d4d4d8)",
    },
    ".cm-content": {
      caretColor: "var(--color-accent, #8b5cf6)",
      lineHeight: "1.8",
      padding: "28px 40px 28px 40px",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--color-accent, #8b5cf6)",
      borderLeftWidth: "1.5px",
    },
    ".cm-gutters": {
      display: "none",
      backgroundColor: "var(--gitem-editor-bg, #080a0f)",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    ".cm-selectionBackground": {
      backgroundColor: "color-mix(in srgb, var(--color-accent) 18%, transparent) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "color-mix(in srgb, var(--color-accent) 25%, transparent) !important",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-matchingBracket": {
      backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
      color: "#d4d4d8",
      borderBottom: "1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)",
    },
    ".cm-searchMatch": {
      backgroundColor: "rgb(250 204 21 / 0.15)",
      borderRadius: "2px",
      border: "1px solid rgb(250 204 21 / 0.3)",
    },
    ".cm-searchMatch-selected": {
      backgroundColor: "rgb(250 204 21 / 0.3)",
    },
    ".cm-panels": {
      backgroundColor: "var(--color-surface, #0c0f16)",
      color: "var(--color-text-primary, #d4d4d8)",
      borderTop: "1px solid var(--color-border, rgba(255,255,255,0.06))",
    },
    ".cm-panels.cm-panels-top": {
      borderBottom: "1px solid var(--color-border, rgba(255,255,255,0.06))",
      borderTop: "none",
    },
    ".cm-panel.cm-search": {
      padding: "8px 16px",
    },
    ".cm-panel.cm-search input, .cm-panel.cm-search button": {
      fontSize: "13px",
      fontFamily: "'Inter', sans-serif",
    },
    ".cm-panel.cm-search input": {
      backgroundColor: "var(--gitem-hover, rgba(255,255,255,0.04))",
      border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
      borderRadius: "6px",
      color: "var(--color-text-primary, #d4d4d8)",
      padding: "5px 10px",
      outline: "none",
    },
    ".cm-panel.cm-search input:focus": {
      borderColor: "color-mix(in srgb, var(--color-accent) 40%, transparent)",
    },
    ".cm-panel.cm-search button": {
      backgroundColor: "rgb(255 255 255 / 0.04)",
      border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
      borderRadius: "6px",
      color: "var(--color-text-secondary, #94a3b8)",
      padding: "5px 12px",
      cursor: "pointer",
    },
    ".cm-panel.cm-search button:hover": {
      backgroundColor: "var(--gitem-hover-strong, rgba(255,255,255,0.08))",
      color: "var(--color-text-primary, #d4d4d8)",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--gitem-panel, #141820)",
      border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
      borderRadius: "8px",
      color: "var(--color-text-primary, #d4d4d8)",
      boxShadow: "0 8px 24px rgb(0 0 0 / 0.3)",
      zIndex: "100",
    },
    ".cm-tooltip-cloze-answer": {
      padding: "8px 12px",
      fontSize: "13px",
      lineHeight: "1.5",
      maxWidth: "320px",
    },
    ".cm-tooltip-cloze-answer .cloze-label": {
      fontSize: "10px",
      fontWeight: "600",
      fontFamily: "'Inter', sans-serif",
      color: "var(--color-accent, #8b5cf6)",
      marginBottom: "3px",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
    ".cm-tooltip-cloze-answer .cloze-text": {
      color: "#e2e8f0",
      fontFamily: "'Inter', sans-serif",
    },
    ".cm-cloze": {
      backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
      borderRadius: "3px",
      padding: "1px 3px",
    },
    ".cm-wysiwyg-h1": {
      fontSize: "1.5em",
      fontWeight: "700",
      lineHeight: "1.4",
      letterSpacing: "-0.02em",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-h2": {
      fontSize: "1.3em",
      fontWeight: "650",
      lineHeight: "1.4",
      letterSpacing: "-0.015em",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-h3": {
      fontSize: "1.12em",
      fontWeight: "600",
      lineHeight: "1.45",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-h4": {
      fontSize: "1.05em",
      fontWeight: "600",
      lineHeight: "1.5",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-h5": {
      fontSize: "1em",
      fontWeight: "600",
      color: "var(--color-text-secondary)",
    },
    ".cm-wysiwyg-h6": {
      fontSize: "0.92em",
      fontWeight: "600",
      color: "var(--color-text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    },
    ".cm-wysiwyg-bold": {
      fontWeight: "700",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-italic": {
      fontStyle: "italic",
      color: "var(--color-text-secondary)",
    },
    ".cm-wysiwyg-cloze": {
      backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
      borderRadius: "4px",
      padding: "2px 6px",
      color: "var(--color-accent-hover, #c4b5fd)",
    },
    ".cm-wysiwyg-highlight": {
      backgroundColor: "rgb(250 204 21 / 0.25)",
      borderRadius: "3px",
      padding: "1px 3px",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-highlight-r": {
      backgroundColor: "rgb(239 68 68 / 0.2)",
      borderRadius: "3px",
      padding: "1px 3px",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-highlight-g": {
      backgroundColor: "rgb(34 197 94 / 0.2)",
      borderRadius: "3px",
      padding: "1px 3px",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-highlight-b": {
      backgroundColor: "rgb(59 130 246 / 0.2)",
      borderRadius: "3px",
      padding: "1px 3px",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-highlight-p": {
      backgroundColor: "rgb(168 85 247 / 0.2)",
      borderRadius: "3px",
      padding: "1px 3px",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-highlight-o": {
      backgroundColor: "rgb(249 115 22 / 0.2)",
      borderRadius: "3px",
      padding: "1px 3px",
      color: "var(--color-text-primary)",
    },
    ".cm-wysiwyg-strike": {
      textDecoration: "line-through",
      color: "var(--color-text-muted)",
    },
    ".cm-wysiwyg-blockquote": {
      color: "var(--color-text-secondary)",
      fontStyle: "italic",
    },
    ".cm-wysiwyg-blockquote-line": {
      borderLeft: "2px solid color-mix(in srgb, var(--color-accent) 40%, transparent)",
      paddingLeft: "12px !important",
    },
    ".cm-wysiwyg-code": {
      fontFamily: "'JetBrains Mono', monospace",
      backgroundColor: "var(--gitem-hover, rgba(255,255,255,0.05))",
      borderRadius: "4px",
      padding: "2px 5px",
      fontSize: "0.88em",
      color: "var(--color-accent)",
    },
    ".cm-hr": {
      borderTop: "1px solid var(--color-border, rgba(255,255,255,0.06))",
      margin: "12px 0",
      height: "0",
    },
    ".cm-table-header": {
      backgroundColor: "color-mix(in srgb, var(--color-accent) 6%, transparent)",
      borderBottom: "2px solid color-mix(in srgb, var(--color-accent) 15%, transparent)",
      fontWeight: "700",
      fontSize: "13px",
      color: "#e2e8f0",
      letterSpacing: "0.01em",
    },
    ".cm-table-row": {
      backgroundColor: "rgb(255 255 255 / 0.015)",
      borderBottom: "1px solid rgb(255 255 255 / 0.04)",
    },
    ".cm-table-sep": {
      height: "1px !important",
      lineHeight: "1px !important",
      fontSize: "1px",
      overflow: "hidden",
      color: "transparent",
      backgroundColor: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
    },
    ".cm-table-pipe": {
      color: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
      fontWeight: "300",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    ".cm-foldGutter span": {
      color: "rgb(100 116 139 / 0.4)",
    },
    ".cm-syn-heading": {
      color: "var(--color-text-primary, #e8eaed)",
    },
    ".cm-syn-secondary": {
      color: "var(--color-text-secondary, #9aa5b4)",
    },
    ".cm-syn-muted": {
      color: "var(--color-text-muted, #4a5568)",
    },
    ".cm-syn-accent": {
      color: "var(--color-accent, #818cf8)",
    },
    ".cm-syn-accent-muted": {
      color: "var(--color-accent, #64748b)",
      opacity: "0.5",
    },
    ".cm-heading-chevron": {
      cursor: "pointer",
      fontSize: "9px",
      color: "var(--color-text-muted, #4a5568)",
      opacity: "0",
      marginLeft: "-18px",
      width: "18px",
      display: "inline-block",
      textAlign: "center",
      transition: "opacity 150ms, color 150ms",
      userSelect: "none",
      verticalAlign: "middle",
    },
    ".cm-line:hover .cm-heading-chevron, .cm-heading-chevron-folded": {
      opacity: "1",
    },
    ".cm-heading-chevron:hover": {
      color: "var(--color-accent, #8b5cf6)",
    },
    ".cm-heading-chevron-folded": {
      color: "var(--color-accent, #8b5cf6)",
      opacity: "0.7",
    },
    ".cm-heading-folded-line": {
      height: "0 !important",
      lineHeight: "0 !important",
      fontSize: "0 !important",
      overflow: "hidden",
      padding: "0 !important",
      margin: "0 !important",
      border: "none !important",
    },
  },
  { dark: true },
);
