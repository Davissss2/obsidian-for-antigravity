<p align="center">
  <img src="https://raw.githubusercontent.com/Davissss2/obsidian-for-antigravity/main/logo.png" width="160" alt="Obsidian for Antigravity Logo" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);" />
</p>

<h1 align="center">Obsidian for Antigravity</h1>

<p align="center">
  <strong>Autonomous Second Brain & Low-Context Persistent Memory for Antigravity AI</strong><br>
  <em>Connect your local Obsidian vault to all Antigravity chats with intelligent low-context triage, selective solution retrieval, and automatic graph-linked persistence.</em>
</p>

<p align="center">
  <a href="https://github.com/Davissss2/obsidian-for-antigravity"><img src="https://img.shields.io/badge/version-1.5.0-8b5cf6.svg?style=flat-square" alt="Version 1.5.0"></a>
  <a href="https://open-vsx.org"><img src="https://img.shields.io/badge/Open%20VSX-available-blue.svg?style=flat-square" alt="Open VSX"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-purple.svg?style=flat-square" alt="License"></a>
  <a href="https://github.com/Davissss2"><img src="https://img.shields.io/badge/author-Davissss2-emerald.svg?style=flat-square" alt="Author Davissss2"></a>
  <img src="https://img.shields.io/badge/platform-Windows%20|%20macOS%20|%20Linux-gray.svg?style=flat-square" alt="Platforms">
</p>

---

## Overview

**Obsidian for Antigravity** bridges Google Antigravity with your local [Obsidian](https://obsidian.md) vault. It provides autonomous learning, persistent cross-chat memory, and an intelligent **Ultra-Low-Context Triage Engine** that saves tokens by preventing unnecessary full-document reading.

Instead of burning thousands of tokens re-reading old logs, your AI assistant autonomously distinguishes between **Skills** (procedural workflows) and **Memories** (past bugfixes & architecture facts) using compact triage (<80 tokens) and selective solution peek.

---

## Key Features

### 1. Ultra-Low-Context Triage Engine
- **Fast Decision Gate**: The AI checks if a technical question or bug was solved previously in <80 tokens via `context-manifest.json`.
- **Zero Token Waste**: 80% of lookups resolve immediately using the 1-sentence executive summary without opening or reading full markdown files.

### 2. Selective Technical Solution Peek
- **Noise-Free Extraction**: `peek` extracts strictly the root cause and applied code solution from any memory note.
- **Context Economy**: Drops YAML frontmatter, giant graph footers, and decorative boilerplate, reducing token consumption by ~90%.

### 3. Autonomous & Atomic Memory Recording
- **Proactive Learning**: When the AI resolves a complex bug or defines a backend architecture, it records a technical memory without waiting for manual user prompts.
- **One-Step Multi-Index Sync**: Automatically creates the note, updates `00 Indice de Memoria.md`, refreshes `00 Antigravity Hub.md`, re-indexes `context-manifest.json`, and registers a bidirectional Antigravity Knowledge Item.

### 4. Zero-Config Local Vault Detection
- Automatically detects active Obsidian vaults in Windows (`%APPDATA%\obsidian\obsidian.json`), macOS, and Linux in <5 ms.
- Zero API tokens, zero paid services, and 100% offline local file synchronization.

### 5. Interactive Graph View Integration
- Generates a central Map of Content (**`00 Antigravity Hub.md`**).
- Connects memories, skills, and projects bidirectionally with wikilinks (`[[...]]`), lighting up Obsidian's native **Graph View** without broken or phantom nodes.

### 6. Native Sidebar Activity Bar Panel
- Dedicated Antigravity IDE panel with live stats, search filters, one-click manual synchronization, and instant deep-links to the desktop Obsidian application (`obsidian://open`).

### 7. Wipe & Start Fresh ("Empezar de Cero")
- Need to reset memory completely? A single click in the **Danger Zone** wipes accumulated memories, eliminates duplicates, and resets AI context to start 100% fresh with Obsidian while safely preserving your Soul & User Profile.

### 8. Hermes Core (Agent Soul & User Profile)
- **Agent Soul**: Dedicated identity guidelines (`00 Soul de Antigravity.md`) defining the assistant as a senior, pragmatic, pair-programming engineer who diagnoses root causes and executes with precision.
- **User Profile & Working Habits**: Persistent profile (`00 Perfil de Usuario.md`) memorizing how you like to work, your preferred style, and project conventions.
- **Dynamic Learning Loop**: As you correct or guide the agent, new habits are automatically memorized with `learn` and injected across all future sessions.

### 9. Chat Slash Commands (`/obsidian`)
- Control Obsidian directly from any conversation using fast slash shortcuts: `/obsidian status`, `/obsidian save`, `/obsidian soul`, `/obsidian learn`, `/obsidian triage`, `/obsidian peek`, `/obsidian catalog`, `/obsidian skills`, `/obsidian memories`, and `/obsidian open`.

### 10. Dynamic Multilingual & User Adaptation
- Works seamlessly in English, Spanish, French, German, Chinese, and Japanese. The assistant dynamically adapts to the user's active language and IDE locale, generating native instructions with zero language mismatch.
- Dynamic user name resolution across VS Code settings, bridge state, vault profile, Git config, and OS environment.

### 11. AI Agent Personality & Custom Callsign
- Dedicated personality note (`00 Personalidad de la IA.md` / `00 AI Personality.md`) in `Antigravity/Alma/`.
- Customize your AI agent's name (e.g. Hermes, Jarvis) and how it addresses you (e.g. Davissss2, Chief, Commander), alongside custom tone and demeanor traits.
- Calibrate interactively from Command Palette with `Obsidian: Configure AI Agent Personality` or `/obsidian personality`.

### 12. First-Chat Onboarding Protocol
- The AI autonomously checks if personality is configured. If unconfigured on chat #1, it introduces itself and asks for your preferred name and callsign.
- Once saved, choices are permanently locked (`personalityConfigured = true`) and the assistant will never ask again.

### 13. Consolidated Projects Registry (Zero Token Waste)
- Replaced 20 fragmented memory files with a single unified Knowledge Item (`proyectos-antigravity`) and master note (`00 Indice de Proyectos.md`).
- Ultra-dense table mapping Project Name, Local Path, Tech Stack, 1-Line Summary, and Associated Skill.
- Prevents system prompt bloat while allowing instant deep-dive via note peek or linked skills.

### 14. Autonomous Workspace Detection & Missing Obsidian Alert
- Detects project stack automatically from `package.json`, `pyproject.toml`, `Cargo.toml`, `composer.json`, `go.mod`, and `README.md`.
- If Obsidian or a vault is not detected on the machine, the extension displays a helpful onboarding banner with a one-click Obsidian download link and a folder picker.

---

## Cognitive Decision Matrix: Skill vs Memory vs None

To maximize reasoning efficiency and preserve the model's context window, the assistant adheres to this decision hierarchy:

| Category | Primary Purpose | When to Consult | Where to Look | Token Impact |
|---|---|---|---|---|
| **SKILL** | **HOW to execute** (Workflows, APIs, procedural tools) | Specialized proprietary workflows (e.g., ERP integration, PrestaShop diagnostic) | Prompt `<skills>` section or `SKILL.md` | Minimal (Procedural) |
| **MEMORY** | **WHAT happened before** (Past bugfixes, architectures, server configs) | Unknown errors, bugs, architecture questions, or repo history | Obsidian Vault via `triage` and `peek` | Ultra-Low (<80 tokens) |
| **NONE** | General code edits & syntax | Greetings, general programming questions, or self-contained code | **Skip vault lookups completely** | **0 tokens (100% saved)** |

---

## Vault Directory Structure

All files are structured cleanly inside your vault under the `Antigravity/` folder:

```text
📁 Obsidian Vault/
└── 📁 Antigravity/
    ├── 📄 00 Antigravity Hub.md        <-- Central Brain & Graph View MOC
    ├── 📄 context-manifest.json         <-- High-speed indexed cache for low-context triage
    ├── 📁 Alma/                         <-- Agent Soul, User Profile & AI Personality
    │   ├── 📄 00 Soul de Antigravity.md
    │   ├── 📄 00 Perfil de Usuario.md
    │   └── 📄 00 Personalidad de la IA.md
    ├── 📁 Memoria/                      <-- Recorded solutions, bugfixes, and architectures
    │   ├── 📄 00 Indice de Memoria.md   <-- Central memory index
    │   └── ...
    ├── 📁 Skills/                       <-- Synced global and project skills (deduplicated)
    │   ├── 📄 00 Indice de Skills.md    <-- Central skills catalog
    │   └── ...
    └── 📁 Proyectos/                    <-- Workspaces & Consolidated Registry
        ├── 📄 00 Indice de Proyectos.md <-- Consolidated project table
        └── ...
```

---

## CLI & Agent Commands

The AI agent and developer can interact directly with the vault using the runner script:

```powershell
# 1. AI Personality & Callsign Configuration
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js personality --ai-name "Hermes" --user-callsign "Davissss2" --personality "Senior engineer, pragmatic, surgical, zero fluff"

# 2. Unified Projects Registry & Autonomous Workspace Detection
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js project register "C:\Path\To\Project"
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js project list
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js project status

# 3. Ultra-Low-Context Triage (<80 tokens)
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js triage "sqlite database locked"

# 4. Extract technical solution without noise
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js peek "SQLite WAL Concurrency Bugfix"

# 5. Fast atomic save (Zero emojis, technical format)
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js save --title "Plesk Nginx Proxy Timeout" --category "configuracion" --summary "Timeout 504 -> proxy_read_timeout 300s applied" --content "Root cause: Long-running script. Solution: Directiva nginx proxy_read_timeout 300s."

# 6. Active Soul, User Profile & Personality
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js soul

# 7. Learn new preference or habit
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js learn "Always package vsix and run tests"

# 8. 1-Line overview catalog of all skills and memories
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js catalog

# 9. Connection status, stats and personality
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js status

# 10. Open note in Obsidian desktop app
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js open "Antigravity/00 Antigravity Hub"
```

---

## Installation

### From Open VSX Registry
Search for **Obsidian for Antigravity** in the Extensions marketplace or install via CLI:
```bash
ovsx install Davissss2.obsidian-for-antigravity
```

### Manual VSIX Installation
Download the packaged release from the repository and install it in Antigravity IDE / VS Code:
```bash
code --install-extension obsidian-for-antigravity-1.5.0.vsix
```

---

## Author & Repository

- **Author**: **[Davissss2 (David)](https://github.com/Davissss2)**
- **GitHub Repository**: **[https://github.com/Davissss2/obsidian-for-antigravity](https://github.com/Davissss2/obsidian-for-antigravity)**
- **Issue Tracker**: **[https://github.com/Davissss2/obsidian-for-antigravity/issues](https://github.com/Davissss2/obsidian-for-antigravity/issues)**

Contributions and bug reports are welcome via Pull Requests and Issues!

---

## License

Copyright (c) 2026 Davissss2.

Released under the **MIT License**. See [`LICENSE`](LICENSE) for complete terms.
