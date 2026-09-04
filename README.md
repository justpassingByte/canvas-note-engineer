# Canvas Note Engineer (Sổ tay Kỹ sư)

> **Interactive Engineering Knowledge Graph & Field Notebook Plugin for DeepSeek Harness & Antigravity**

[![GitHub](https://img.shields.io/badge/GitHub-justpassingByte%2Fcanvas--note--engineer-blue?logo=github)](https://github.com/justpassingByte/canvas-note-engineer)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Zustand%20%7C%20Express%20%7C%20SQLite-green)](#tech-stack)
[![Zero-Token Caching](https://img.shields.io/badge/AI-Zero--Token%20Cache-orange)](#core-architecture)

An interactive, spatial knowledge-learning and architecture-reasoning environment designed specifically for software engineers. Instead of reading static documentation or generic mindmaps, **Canvas Note Engineer** deconstructs real-world production incidents, concurrency hazards (Race Conditions, Deadlocks), and distributed systems patterns on an infinite engineering grid canvas.

---

## 🌟 Key Highlights

- **📐 Technical Grid Paper Aesthetic**: Designed with an authentic engineering notebook feel (`JetBrains Mono`, paper-grain grid, clean ink borders, and smooth cubic bezier curves).
- **🛡️ Zero-Pixel Edge Schema & Auto-Anchor Routing (Section 59.1)**: DeepSeek AI never calculates pixel coordinates. Pure logical relationship archetypes (`KICH_HOAT`, `HOA_GIAI`, `DEM_LOC`, `LUU_TRU`, `GIAO_THOA`) are dynamically resolved into 4 card boundary ports (`Top`, `Bottom`, `Left`, `Right`).
- **🔍 Instant Field Notes Drawer**: Click any concept node to immediately inspect core definitions, failure modes, real-world battle-tested production incidents, and code snippets.
- **⚡ Progressive Disclosure & Zero-Token Caching**: Start with high-level anchor concepts. Expand node neighborhoods on-demand with minimal LLM context payload (< 350 tokens).
- **🧠 Reflex Quiz & Recall Mode (Section 18)**: Test your engineering intuition by masking concept names into `[ ? ]` to practice mental model recall.
- **📑 Multi-Format Export (Section 47 & 48)**: One-click export to **Obsidian Markdown** (with `[[Wikilinks]]`), copyable **Mermaid diagrams**, and raw JSON graph states.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **pnpm**

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/justpassingByte/canvas-note-engineer.git
cd canvas-note-engineer

# Install dependencies for both frontend and backend
npm install
npm run --prefix frontend install
npm run --prefix backend install
```

### 3. Development
```bash
# Start both backend and frontend concurrently
npm run dev
```
- Frontend dev server: `http://localhost:5173`
- Backend server: `http://localhost:3000`

### 4. Production Build
```bash
npm run build
```
Generates a standalone single-file Webview bundle in `frontend/dist/index.html` ready for deployment into the DeepSeek Harness / Antigravity plugin ecosystem.

---

## 🏗️ Project Architecture

```text
canvas-note-engineer/
├── frontend/                     # React 18 + TypeScript + Vite Webview
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas/          # SvgGridCanvas & Cubic Bezier edge rendering
│   │   │   ├── Drawer/          # FieldNotesDrawer (520px detail view)
│   │   │   ├── NodePod/         # ConceptNode cards & port anchor badges
│   │   │   ├── Toolbar/         # FloatingToolbar with Zoom, Pan, Export, Search
│   │   │   └── Quiz/            # ReflexQuizCard (Mental recall mode)
│   │   ├── store/               # Zustand state management (useGraphStore)
│   │   ├── utils/               # geometry.ts (Auto-anchor), clusterEngine.ts
│   │   └── styles/              # canvas.css, drawer.css, node.css, tokens
├── backend/                      # Node.js + Express + SQLite Bridge
│   ├── src/
│   │   ├── data/                # Initial seed graphs & fallbacks
│   │   ├── tools/               # DeepSeek Harness plugin tool handlers
│   │   └── types/               # TypeScript graph & edge schemas
├── plugin_manifest.json          # DeepSeek Harness plugin manifest
└── package.json                  # Root runner script
```

---

## 📜 License

MIT License © 2026 [justpassingByte](https://github.com/justpassingByte). Built with pair engineering support from **Antigravity**.
