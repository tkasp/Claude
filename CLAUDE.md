# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repo contains two related projects:

- **`SwissCheese/`** — the original Electron desktop app (Windows `.exe` installer). Source of truth for business logic and UI. Built with `electron-vite`.
- **`SwissCheesePWA/`** — a browser PWA port of the same app, deployed to GitHub Pages at `https://tkasp.github.io/Claude/`. The active development target. Built with Vite + `vite-plugin-pwa`.

There is no monorepo tooling — each is a completely independent `npm` project with its own `node_modules`.

---

## SwissCheesePWA — Commands

Run from inside `SwissCheesePWA/`:

```bash
npm run dev        # Vite dev server (hot reload) — use Edge/Chrome for File System Access API
npm run build      # tsc type-check + Vite production build → dist/
npm run preview    # Serve dist/ locally to verify the build before pushing
```

There are no tests. TypeScript is the only correctness gate (`tsc` runs as part of `build`).

**GitHub Pages deploy** is automatic: any push to `claude/focused-pascal-ms8q8e` that touches `SwissCheesePWA/**` triggers `.github/workflows/deploy-pwa.yml`, which builds and publishes to Pages. The `VITE_BASE` env var is injected from the repo name — do not hard-code it.

---

## SwissCheese (Electron) — Commands

Run from inside `SwissCheese/`:

```bash
npm run dev     # electron-vite dev (opens the Electron window)
npm run build   # electron-vite build (compile only, no installer)
npm run dist    # build + electron-builder (produces Windows NSIS .exe in out/)
npm run pack    # build + unpackaged dir (faster, for local testing)
```

---

## Architecture: SwissCheesePWA

### State — `src/store/`

The entire app state lives in a single **Zustand + Immer** store (`projectStore.ts`). State is not persisted to `localStorage` — persistence is manual: the user explicitly saves to a `.bowtie` JSON file via the File System Access API.

One important exception: **`FileSystemFileHandle` objects** cannot be serialized, so they live outside Zustand in a module-level `Map<string, FileSystemFileHandle>` exported from `projectStore.ts` as `projectFileHandles`. This map must be updated whenever a project is opened or saved for the first time so that subsequent saves overwrite the same file without re-prompting.

All type definitions are in `src/store/types.ts`. Key types: `Project → Bowtie → Cause → Barrier` (left side) and `Consequence → Mitigation` (right side). `Barrier` and `Mitigation` share the same interface. `BarrierAction` belongs to both.

### Browser API layer — `src/lib/browserAPI.ts`

This is the PWA replacement for the Electron IPC bridge. All file I/O, export, and HAZID parse calls go through here:

- `saveProject` / `openProject` — File System Access API (`showSaveFilePicker` / `showOpenFilePicker`), with `AbortError` handling for user cancellation.
- `pickAttachment` / `openAttachment` — pick reads file bytes into base64; open triggers a `<a download>` blob URL.
- `exportPng`, `savePdf`, `exportExcel` — all trigger `<a download>` blob URL clicks.
- `parseHazid` — thin wrapper around `hazidParser.ts`.

> When porting anything from `SwissCheese/src/main/`, replace `Buffer.from(base64, 'base64')` with `atob()` + `Uint8Array`, and replace `Buffer` return types with `ArrayBuffer`.

### Diagram canvas — `src/components/BowtieCanvas.tsx`

Wraps ReactFlow in a `ReactFlowProvider`. The inner `CanvasInner` component:
- Calls `useBowtieLayout` to compute node/edge positions deterministically.
- Registers a capture function with `exportRegistry` (used by the PDF/PNG export pipeline) via `registerCapturer`.
- Persists manual vertical drag positions (`manualY`) back to the store for causes and consequences only.

### Layout algorithm — `src/hooks/useBowtieLayout.ts`

Pure `useMemo` — no side effects. Implements a butterfly/bowtie layout:
- Top event (circle) is pinned at a fixed X computed from the deepest barrier column + a gap constant.
- Causes fan vertically on the left; each cause row gets barriers stacked leftward from a fixed offset.
- Consequences mirror on the right.
- If a cause/consequence has a `manualY`, that overrides the auto-computed Y for the whole row (including its barriers/mitigations).
- All layout constants (spacing, widths) are at the top of the file — edit them there, not inline.

### Export pipeline

PNG capture uses `html-to-image` (`captureBowtieDataUrl` in `exportImage.ts`) which requires the ReactFlow instance and the wrapper DOM node. The `exportRegistry` module holds a single capturer function set by the active `BowtieCanvas` — only one bowtie is active at a time.

PDF report generation (`generateReport.ts`) uses `jsPDF` + `jspdf-autotable`. It calls back into `captureBowtie` (passed from `ExportReportModal`) which temporarily switches the active bowtie view to capture each diagram as PNG, then restores the original view.

Excel export (`excelExporter.ts`) uses ExcelJS and returns `ArrayBuffer` (browser-compatible — do not use `Buffer`).

HAZID parser (`hazidParser.ts`) uses ExcelJS to parse `.xlsx` files from base64. Column detection is heuristic — it scans the header row for keyword matches. `HazidRow` and `HazidParseResult` are exported from this file and imported directly by `HazidImportModal`.

### Toolbar / Sidebar data flow

`App.tsx` owns `handleOpenProject` (which updates `projectFileHandles`) and passes `onNewProject` / `onOpenProject` / `onImportHazid` callbacks down to `Toolbar` and `ProjectSidebar`. Neither component fetches or mutates projects directly — they call store actions or the browser API and let the store re-render.

---

## Architecture: SwissCheese (Electron)

The Electron app is structured as three processes:

- **`src/main/index.ts`** — 8 IPC handlers: `save-project`, `open-project`, `pick-attachment`, `open-attachment`, `export-png`, `export-excel`, `save-pdf`, `parse-hazid`. File I/O and exports happen here (Node.js `fs`, `ExcelJS`, `electron.dialog`).
- **`src/preload/index.ts`** — exposes `window.electronAPI` with the same 8 methods as typed wrappers around `ipcRenderer.invoke`.
- **`src/renderer/`** — identical React components to the PWA, except they call `window.electronAPI` instead of `browserAPI.ts`.

> The Electron app is the reference implementation. When adding a feature, implement it in `SwissCheese` first (easier to test), then port to `SwissCheesePWA/src/lib/browserAPI.ts`.

---

## Key Conventions

- **No tests** in either project. TypeScript strict mode is the only guardrail.
- **Tailwind CSS** for all styling. No CSS modules or styled-components.
- **No comments** on obvious code; comments exist only for non-obvious invariants (e.g., the `manualY` layout override, the `projectFileHandles` map rationale).
- **`Barrier` and `Mitigation` are the same type** — `Mitigation = Barrier` in `types.ts`. Any change to one applies to both.
- **Base path for Pages** is controlled by `VITE_BASE` env var (default `/Claude/`). The CI workflow injects it from the repo name. If the repo is renamed, update the workflow — the `vite.config.ts` will pick it up automatically.
- **File System Access API** (`showSaveFilePicker`, `showOpenFilePicker`) requires **Edge or Chrome**. Firefox and Safari do not support it. The PWA will not function for project save/open in those browsers.
