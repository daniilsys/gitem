<p align="center">
  <img src="apps/desktop/src-tauri/icons/icon.png" width="128" height="128" alt="Gitem" />
</p>

<h1 align="center">Gitem</h1>

<p align="center">
  <strong>Local-first note taking with spaced repetition</strong>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/SRS-FSRS_v2-8b5cf6?style=flat-square" alt="FSRS v2" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Built_with-Tauri_2-24C8D8?style=flat-square&logo=tauri&logoColor=white" alt="Tauri 2" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="#tech-stack"><img src="https://img.shields.io/badge/Rust-2021-f74c00?style=flat-square&logo=rust&logoColor=white" alt="Rust" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#features">Features</a> •
  <a href="#flashcard-syntax">Flashcard Syntax</a> •
  <a href="#keyboard-shortcuts">Shortcuts</a> •
  <a href="#development">Development</a>
</p>

---

## What is Gitem?

Gitem is a **desktop note-taking app** that turns your Markdown notes into flashcards using spaced repetition. Your notes stay as plain `.md` files — no vendor lock-in, no cloud, no account. Everything runs locally on your machine.

Write `@@question::answer@@` anywhere in your notes and Gitem automatically creates flashcards scheduled with the **FSRS** algorithm — the same algorithm used by Anki.

## Installation

### Download

Download the latest release for your platform from [**GitHub Releases**](https://github.com/daniilsys/gitem/releases).

| Platform              | File                         |
| --------------------- | ---------------------------- |
| macOS (Apple Silicon) | `Gitem_x.x.x_aarch64.dmg`    |
| macOS (Intel)         | `Gitem_x.x.x_x64.dmg`        |
| Windows               | `Gitem_x.x.x_x64-setup.exe`  |
| Linux                 | `Gitem_x.x.x_amd64.AppImage` |

### macOS (unsigned app)

After downloading or building the `.app`, macOS will block it because it's not signed. To allow it:

```bash
# Remove the quarantine attribute
xattr -cr /Applications/Gitem.app

# Or if you built from source:
xattr -cr apps/desktop/src-tauri/target/release/bundle/macos/Gitem.app
```

Alternatively, go to **System Settings → Privacy & Security** and click **"Open Anyway"** after the first blocked launch.

### Build from source

**Prerequisites:** [Rust](https://rustup.rs/), [Node.js](https://nodejs.org/) 20+, [pnpm](https://pnpm.io/)

```bash
# Clone the repo
git clone https://github.com/daniilsys/gitem.git
cd gitem

# Install dependencies
pnpm install

# Run in development
pnpm tauri dev

# Build for production
pnpm tauri build
```

The built app will be in `apps/desktop/src-tauri/target/release/bundle/`.

## Features

### 📝 WYSIWYG Markdown Editor

- Inline rendering — headings, bold, italic, strikethrough, highlights, blockquotes, tables
- Syntax hides when cursor is away, reveals on focus (Obsidian-style)
- Formatting toolbar with keyboard shortcuts
- Auto-replace: `->` → `→`, `=>` → `⇒`, `...` → `…`
- Collapsible heading sections

### 🧠 Spaced Repetition (FSRS)

- `@@question::answer@@` syntax embedded in your notes
- Hover over a flashcard to peek at the answer
- Review sessions with deck filtering by folder
- FSRS v2 scheduling (same algorithm as Anki)
- Rating: Forgot / Hard / Good / Easy with interval estimates

### 📁 File Tree Sidebar

- Folder-based organization (subfolders = subjects)
- Drag & drop to move files between folders
- Right-click context menu (rename, delete, create)
- Cursor position restored per file

### 🎨 Themes & Customization

- 11 themes: 6 dark (Midnight, Obsidian, Ocean, Forest, Warm Night, Nord) + 5 light (Snow, Paper, Daylight, Sage, Rosé)
- 8 accent colors
- Editor zoom (⌘+/⌘-)
- Persistent settings

### 🌍 Internationalization

- English and French
- Auto-detects system language
- Manual override in settings

## Flashcard Syntax

Write flashcards directly in your Markdown notes:

```markdown
# Biology

The mitochondria is @@the powerhouse of the cell@@.

@@What is DNA::Deoxyribonucleic acid, a molecule that carries genetic instructions@@

@@Capital of France::Paris@@
```

- `@@term@@` — cloze card (term is both question and answer)
- `@@question::answer@@` — Q&A card with explicit question and answer

Cards are synced automatically when you save. FSRS state is stored in a local SQLite database — your `.md` files stay clean.

## Keyboard Shortcuts

| Shortcut    | Action                         |
| ----------- | ------------------------------ |
| `⌘ + B`     | Bold                           |
| `⌘ + I`     | Italic                         |
| `⌘ + U`     | Highlight                      |
| `⌘ + K`     | Insert link                    |
| `⌘ + D`     | Insert flashcard               |
| `⌘ + 1/2/3` | Heading 1/2/3                  |
| `⌘ + ⇧ + X` | Strikethrough                  |
| `⌘ + ⇧ + .` | Blockquote                     |
| `⌘ + F`     | Search                         |
| `⌘ + +`     | Zoom in                        |
| `⌘ + -`     | Zoom out                       |
| `⌘ + 0`     | Reset zoom                     |
| `Tab`       | Next table cell / Indent       |
| `⇧ + Tab`   | Previous table cell / Unindent |

## Tech Stack

| Layer      | Technology                                                      |
| ---------- | --------------------------------------------------------------- |
| Framework  | [Tauri 2](https://v2.tauri.app/)                                |
| Frontend   | React 19 + TypeScript                                           |
| Styling    | Tailwind CSS v4                                                 |
| Editor     | CodeMirror 6                                                    |
| State      | Zustand                                                         |
| SRS Engine | [fsrs-rs](https://github.com/open-spaced-repetition/fsrs-rs) v2 |
| Database   | SQLite (rusqlite)                                               |
| File Tree  | react-arborist                                                  |
| Monorepo   | pnpm workspaces                                                 |

## Project Structure

```
gitem/
├── apps/desktop/          # Tauri desktop app
│   ├── src/               # React frontend
│   │   ├── editor/        # CodeMirror editor, WYSIWYG, toolbar
│   │   ├── App.tsx        # Main app shell
│   │   ├── Sidebar.tsx    # File tree + navigation
│   │   ├── ReviewSession.tsx
│   │   ├── Settings.tsx
│   │   ├── Onboarding.tsx
│   │   ├── store.ts       # Zustand state
│   │   └── themes.ts      # Theme definitions
│   └── src-tauri/         # Rust backend
│       └── src/
│           ├── lib.rs     # Tauri setup
│           ├── srs.rs     # FSRS + SQLite + card sync
│           └── tree.rs    # Filesystem operations
├── packages/ui/           # Shared React components
│   └── src/
│       ├── i18n/          # Internationalization (EN/FR)
│       ├── FileTree.tsx
│       ├── EmptyState.tsx
│       ├── CreateMenu.tsx
│       ├── ConfirmDialog.tsx
│       └── CreateDialog.tsx
└── package.json           # pnpm monorepo root
```

## Philosophy

- **Your notes are yours.** Plain Markdown files, readable without Gitem.
- **100% local.** No cloud, no account, no network calls.
- **SRS built-in.** No need to export to Anki — study directly from your notes.
- **Fast.** Native app, not Electron. Rust backend, virtualized file tree.

## License

[MIT](LICENSE)

---

<p align="center">
  Made with Tauri, React, and Rust
</p>
