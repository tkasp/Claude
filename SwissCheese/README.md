# Swiss Cheese

A simplified, purpose-built Windows desktop app for creating and managing
**bowtie risk diagrams** — a clean, fit-for-purpose alternative to BowtieXP.

Built with Electron + React + ReactFlow.

## Features

- **Multi-facility workspace** — manage many bowties across projects from one window
- **Bowtie canvas** — threats, barriers, top event, mitigations and consequences with
  effectiveness colour-coding, severity ratings, and SECE tagging
- **Dynamic layout** — barriers and mitigations stack outward so the top event is never
  crowded; threat/consequence rows can be dragged vertically
- **HAZID import** — generate bowtie stubs directly from a HAZID workbook
- **Actions register** — track actions against any barrier or mitigation
- **Exports** — full-resolution PNG with title block, Excel workbook, and a polished
  tabloid/ledger PDF report
- **Single-file projects** — everything (including attachments) saved in one `.bowtie`
  bundle

## Development

```bash
cd SwissCheese
npm install
npm run dev      # launch in development
npm run build    # type-check + bundle
npm run dist     # build the Windows NSIS installer (SwissCheese-<version>-setup.exe)
```

> Windows only. Install into a path **without spaces** to avoid Electron tooling issues.
