# Changelog

All notable changes to the **Obsidian for Antigravity** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-10-05

### Added
- **Continuity Memory & Session Checkpoints Subsystem**:
  - `node obsidian.js session save --summary "..." --content "..." [--project "..."]`: Creates atomic session checkpoints in `Antigravity/Sesiones/<date>_<time> - <project>.md`.
  - `node obsidian.js session last [--project "..."]`: Sub-250ms continuity recall consuming <50 tokens, giving the AI immediate context of recent decisions and progress.
  - `node obsidian.js session list [--limit N]`: Chronological listing of sessions and milestones across all projects.
  - Maintained `00 Indice de Sesiones.md` and bi-directional session log table in project blueprints (`## Bitácora de Sesiones y Avances Recientes`).
  - Added chat slash commands `/obsidian session save`, `/obsidian session last`, and `/obsidian session list`.
  - Added VS Code commands `antigravityObsidian.saveSession` and `antigravityObsidian.showSessions`.
- **Living Architectural Blueprints & Deep Scanning**:
  - `node obsidian.js project scan [path]`: Deep recursive structural scanner that maps directories, architectural roles (`src/`, `components/`, `controllers/`, `services/`, `models/`, `routes/`, `views/`, etc.), key entrypoints (`extension.js`, `index.ts`, `main.py`, etc.), npm scripts, and databases/ORMs (Prisma, Drizzle, SQLite, Mongo, Postgres).
  - Automatically updates project notes in `Antigravity/Proyectos/<Project>.md` preserving custom rules, anti-patterns, backlog, sessions, and linked memories.
  - Added VS Code command `antigravityObsidian.scanProject`.
- **Anti-Patterns & Repository Traps Registry**:
  - `node obsidian.js project antipattern add "<trap/rule>" [--project "..."]`: Permanently records forbidden coding patterns, quirks, and repository gotchas to avoid repeating mistakes.
  - `node obsidian.js project antipattern list [--project "..."]`: Distilled overview of known traps.
- **Bi-Directional Backlog Synchronization**:
  - `node obsidian.js project backlog add "<task>" [--project "..."]`: Adds tasks directly into Markdown notes with `- [ ] <task>`.
  - `node obsidian.js project backlog done "<task>" [--project "..."]`: Marks tasks as completed (`- [x] <task>`).
  - `node obsidian.js project backlog list [--project "..."]`: Inspects open and closed tasks.
- **Balanced 50/50 Persistence Policy**:
  - Recalibrated AI agent recording filter in `obsidian-brain.md`, `GEMINI.md`, and `AGENTS.md` from hyper-strict (which caused AI amnesia by rejecting 95% of knowledge) to a balanced policy that actively records structural milestones, architectural decisions, and session continuity checkpoints alongside non-trivial bugfixes.
- **Enhanced Webview Dashboard**:
  - Expanded stats row to 4 interactive metric boxes: Memorias, Skills, Sesiones, and Proyectos.
  - Added quick action buttons in webview for Escanear Proyecto and Guardar Sesión.

---

## [1.6.0] - 2026-10-02

### Added
- **Autonomous AI Skill Management Suite (Zero Token Waste)**:
  - First-class CLI and slash commands designed specifically for AI agents to create, inspect, modify, and manage skills in one atomic execution without manual directory creation or token-heavy file searches:
    - `node obsidian.js skill list [--scope global|project]`: Instant listing of all skills across global (`~/.gemini/config/skills`), workspace (`.agents/skills`), and Obsidian Vault (`Antigravity/Skills/`), including script and reference file counts.
    - `node obsidian.js skill view <name> [--full|--scripts|--files]`: Low-context distilled peek of operational skill instructions (<1200 characters), with options to inspect helper scripts or view raw contents.
    - `node obsidian.js skill create <name> --desc "<desc>" --content "<instructions>" [--scope global|project]`: Atomic creation of compliant Antigravity skills with YAML frontmatter, directory scaffolding (`scripts/`, `references/`), bidirectional sync into Obsidian Vault (`Antigravity/Skills/`), and automatic index regeneration (`00 Indice de Skills.md`, `00 Antigravity Hub.md`).
    - `node obsidian.js skill edit <name> [--desc "..."] [--content "..."] [--append "..."]`: Clean modification of skill metadata, body replacement, or incremental instruction appending.
    - `node obsidian.js skill delete <name>`: Safe deletion of skill directory and clean unlinking of Obsidian mirror notes.
    - `node obsidian.js skill script <skill> add <file> --code "..."`: Direct helper script attachment with automatic executable permissions (`chmod 755`).
- **Rule Inspection & Management Subsystem**:
  - `node obsidian.js rule list`: Lists active global (`rules/obsidian-brain.md`, `GEMINI.md`), workspace (`.agents/rules/`), and dynamic learned conditions.
  - `node obsidian.js rule view <name>`: Direct inspection of specific rule files without context pollution.
  - `node obsidian.js rule add "[<Project>] <rule>"`: Direct shortcut to learn and persist mandatory folder and workflow conditions.
- **Agent Rules & Slash Commands Expansion**:
  - Injected Section `2b. Autonomous Skill & Rule Management` into global rules (`obsidian-brain.md`, `GEMINI.md`, `AGENTS.md`) and `SKILL.md` to instruct the AI agent to execute skill operations directly with zero searching.
  - Added chat slash commands `/obsidian skill [list|view|create|edit|delete]` and `/obsidian rule [list|view|add]`.
  - Added VS Code commands `antigravityObsidian.newSkill` and `antigravityObsidian.listSkills`.

---

## [1.5.2] - 2026-10-02

### Added
- **Fast 1-Line Identity & Configuration Commands (Zero Code Searching)**:
  - Added dedicated CLI subcommands:
    - `node obsidian.js name "<newName>"`: Updates AI agent name immediately in 1 line.
    - `node obsidian.js user "<newCallsign>"`: Updates user callsign / title immediately in 1 line.
    - `node obsidian.js config get`: Instant JSON dump of active configuration.
    - `node obsidian.js config set <key> <val>`: Update any configuration parameter.
  - Added chat slash commands: `/obsidian name <name>`, `/obsidian user <callsign>`, `/obsidian config [get|set]`.
  - Injected explicit 1-line execution instructions into Section 0 of global rules (`GEMINI.md`, `AGENTS.md`, `obsidian-brain.md`) and `SKILL.md`, allowing any AI agent in any session to execute identity modifications without hesitation, guesswork, or searching through code files.
- **Universal Zero-Config Out-of-the-Box Experience Across All Machines**:
  - Removed blocking modal alerts if Obsidian desktop is not installed. The Second Brain provisions and operates autonomously with local markdown files, Knowledge Items, and rules without requiring any manual setup.
  - Hardened auto-provisioning in `vault-detector.js` and `obsidian-runner.js` with fallback to user home directory (`~/Obsidian Vault`) and automatic creation of all core folders (`Alma`, `Memoria`, `Skills`, `Proyectos`, `Sesiones`, `.obsidian`).
  - Automatic bridge registration: `antigravity-obsidian.json` is created immediately on startup if missing.

### Fixed
- **Node.js Deprecation Warning `[DEP0187]`**: Fixed `getAntigravityPaths()` return object to include `skillsDir`, preventing undefined from being passed to `fs.existsSync`.
- **Dual-Language Personality Note Resolution & Cleanup**: Fixed logic where both English and Spanish personality notes could coexist; the updater now cleans up opposite language notes and prefers configured notes across `status`, `soul`, and `personality`.

---

## [1.5.1] - 2026-10-02

### Fixed
- **Persistent AI Personality Calibration (One-Time Setup)**:
  - Fixed an issue where the AI agent asked for personality calibration multiple times (asking in the first chat and then asking again in subsequent chats instead of retaining the configuration).
  - Deployed all required helper modules (`skill-installer.js`, `sync-engine.js`, `vault-detector.js`) alongside `obsidian.js` in `~/.gemini/config/skills/antigravity-obsidian/scripts/` so script executions are fully self-contained and never fail with missing module errors.
  - Built direct, immediate rule rewriting in `obsidian-runner.js`: `rules/obsidian-brain.md`, `GEMINI.md`, and `AGENTS.md` are now immediately rewritten upon personality calibration, completely replacing onboarding prompts with the active Hermes persona and locked state.
  - Hardened state persistence in `syncEngine.resolvePersonality` and `syncEngine.ensurePersonality`: prevents periodic or startup sync operations from reverting `personalityConfigured` to false once calibrated.
  - Added robust vault path detection and default vault auto-provisioning in `obsidian-runner.js`.
  - Fixed syntax error in `cli.js` (`case 'skills'`).

---

## [1.5.0] - 2026-10-02

### Added
- **AI Agent Personality & Custom Identity Calibration**:
  - Introduced dedicated AI Personality note (`00 Personalidad de la IA.md` / `00 AI Personality.md`) in `Antigravity/Alma/` alongside Soul and User Profile.
  - Added full customization for Agent Name (e.g. Hermes, Jarvis) and User Callsign (e.g. Davissss2, Chief, Commander), with configurable tone and demeanor.
  - Added VS Code command `antigravityObsidian.configurePersonality` with interactive input dialogs.
  - Added slash command `/obsidian personality [args]` and CLI subcommand `node obsidian.js personality`.
- **First-Chat Onboarding Protocol**:
  - Autonomous calibration trigger: when `personalityConfigured` is false, the assistant greets the user on their first chat interaction to calibrate identity and behavior preferences.
  - Upon user response, preferences are saved immediately and locked (`personalityConfigured: true`), ensuring the assistant never asks again across future sessions.
- **Unified Consolidated Project Registry (Zero Token Waste)**:
  - Eliminated token pollution from fragmented per-project Knowledge Items. All tracked projects are aggregated into a single high-density Knowledge Item (`proyectos-antigravity`) and master index note (`00 Indice de Proyectos.md` / `00 Projects Index.md`).
  - Single compact table mapping Project Name, Local Path, Tech Stack, 1-Line Summary, Associated Skill, and Obsidian Note Link.
  - Automated cleanup of legacy individual `proyecto-*` Knowledge Item folders to maintain a minimal token footprint in all chat sessions.
- **Autonomous Workspace Project Detection & Stack Extraction**:
  - Intelligent stack inspection supporting Node.js (`package.json`), Python (`pyproject.toml`, `requirements.txt`), Rust (`Cargo.toml`), PHP (`composer.json`), Go (`go.mod`), and `README.md`.
  - Automatic detection of associated workspace and global skills (e.g. `antigravity-obsidian`, `control-integral-qr`, `tiendareco`).
  - Automated project registration via `/obsidian project register [path]` and CLI `node obsidian.js project register`.
- **Project Commands in Palette & Chat**:
  - Registered `antigravityObsidian.registerProject` and `antigravityObsidian.showProjects` in VS Code Command Palette.
  - Added `/obsidian project [register|list|status]` to Chat Slash Commands protocol.

---

## [1.4.1] - 2026-10-02

### Added
- **Automatic Project-Level Rules & Conditions Persistence**: The assistant now automatically captures project-specific constraints, workflow conditions, and directory guidelines when instructed by the user.
- **Bi-Level `learn` Persistence**: The `learn` command and Hermes Core now automatically detect project tags (e.g. `[obsi]` or `--project <name>`) and write the rule both into the User Profile (`00 Perfil de Usuario.md`) and into the Project's dedicated note (`Antigravity/Proyectos/<Project>.md`) under `## Reglas y Condiciones Obligatorias del Proyecto`.
- **Project Rules Preservation in Sync Engine**: `syncProject` now permanently preserves user-defined and assistant-learned project conditions during vault resynchronization cycles.
- **Mandatory Directive in Hermes Core**: Global rules (`GEMINI.md`, `AGENTS.md`, and `obsidian-brain.md`) now mandate immediate recording of any user workflow rule or condition without hesitation or waiting to be reminded.

---

## [1.4.0] - 2026-10-02

### Added
- **Chat Slash Commands (`/obsidian`)**: Direct chat control protocol in Antigravity. Users can type slash commands directly in any conversation (`/obsidian`, `/obsidian status`, `/obsidian save`, `/obsidian soul`, `/obsidian learn`, `/obsidian triage`, `/obsidian peek`, `/obsidian catalog`, `/obsidian skills`, `/obsidian memories`, `/obsidian open`, `/obsidian help`) to trigger instantaneous actions without conversational overhead.
- **Dynamic Multi-Language Adaptation**: Full multilingual engine supporting `auto`, `en`, `es`, `fr`, `de`, `zh`, and `ja`. In `auto` mode, the extension detects the active Antigravity IDE / VS Code display language or OS locale and generates language-tailored rules and Soul/Profile notes.
- **Dynamic User Name Resolution**: Removed static user name hardcoding. User identity dynamically resolves in cascade across extension settings (`antigravityObsidian.userName`), bridge state, vault profile, Git global config (`user.name`), and operating system username.
- **Bilingual Hermes Core Templates**: Native English and Spanish templates for `00 Soul de Antigravity.md` and `00 Perfil de Usuario.md`, ensuring fluent pair-programming in either language while preserving accumulated dynamic preferences.
- **Command Palette Expansion**: Registered new VS Code commands `antigravityObsidian.showSoul` (View Soul & User Profile), `antigravityObsidian.showStatus` (Connection Status & Stats), and `antigravityObsidian.openGraph` (Open Graph View in App).
- **Webview Internationalization & Settings**: Added user name configuration and language selection controls to the Settings panel with live reactive i18n translations across English, Spanish, French, German, Chinese, and Japanese.
- **Flexible Argument Parsing in CLI**: `obsidian.js save` now accepts freeform positional arguments and automatic summary/content fallbacks, allowing seamless natural language note recording.

### Changed
- Refactored global rule generators (`GEMINI.md`, `AGENTS.md`, and `rules/obsidian-brain.md`) to dynamically adjust language and user profile directives.
- Cleaned all legacy and regex emoji matches across all source code and sync templates to ensure strict zero-emoji technical formatting.

---

## [1.3.0] - 2026-10-02

### Added
- **Hermes Core Architecture (Agent Soul & User Profile)**: Introduced multi-tier memory replicating the Hermes agentic framework. Separates technical persistence (vault notes/skills) from the Agent's Soul (`00 Soul de Antigravity.md`) and the User's Profile (`00 Perfil de Usuario.md`).
- **Dynamic Learning Loop (`learn` Command)**: The agent continuously learns user preferences, working habits, and coding styles across chats. Any user correction or preferred guideline is permanently memorized into `00 Perfil de Usuario.md` and compiled into global IDE instructions.
- **Active Soul & Profile Dashboard Card**: Added a dedicated Hermes Core status card in the extension sidebar panel with quick navigation buttons to inspect and edit the Soul and User Profile in Obsidian with one click.
- **CLI Commands `soul` and `learn`**: Added `node obsidian.js soul` to display the active Soul & Profile, and `node obsidian.js learn "<learning>"` for instant atomic preference registration.
- **Memory Reset Safety Shield**: `resetAllData` now preserves `Antigravity/Alma` so user habits and identity are never lost when clearing temporary technical memories.

---

## [1.2.2] - 2026-10-02

### Added
- **Full Ubuntu & Linux Cross-Platform Compatibility**: Enhanced vault auto-detection to support native package/AppImage setups (`~/.config/obsidian`), Flatpak sandboxes (`~/.var/app/md.obsidian.Obsidian`), and Snap packages (`~/snap/obsidian/current`). Added support for localized Spanish `~/Documentos` directories and automatic `0o755` executable permissions for Linux CLI scripts.
- **Full macOS Cross-Platform Compatibility**: Added native support for macOS configuration path (`~/Library/Application Support/obsidian/obsidian.json`), iCloud Drive synced vaults (`~/Library/Mobile Documents/iCloud~md~obsidian/Documents`), and desktop document fallbacks.
- **Universal External URI Opening**: Upgraded Obsidian desktop URI dispatching in `extension.js` to prioritize `vscode.env.openExternal` with native fallback cascades, guaranteeing seamless `obsidian://open` deep-linking across Windows, macOS, and Linux (Wayland & X11).

---

## [1.2.1] - 2026-10-02

### Added
- **Strict High-Value Filter for Autonomous Recording**: Eliminated over-documentation and routine clutter. The autonomous memory engine now strictly prohibits saving trivial bugs, typos, standard syntax fixes, routine CSS adjustments, or solutions where the procedure was already known.
- **Selective Learning & Skill Expansion**: The agent now exclusively registers records when overcoming difficult technical blockers after investigation or trial-and-error, discovering tricky environment/tool gotchas, or crafting reusable workflows that improve Skills for future chats.
- **Global Directive Synchronization**: Updated rule generation templates in `src/skill-installer.js` so `GEMINI.md`, `AGENTS.md`, and `SKILL.md` enforce this high-density filter across all workspaces.

---

## [1.2.0] - 2026-10-02

### Added
- **Complete Memory Reset & Start Fresh Button**: Added a dedicated danger zone action button in the Webview Settings panel (`btn-reset-data`) and VS Code command `antigravityObsidian.resetData` to wipe all accumulated memories, remove duplicate Knowledge Items, and reset AI context to start completely clean from scratch with Obsidian.
- **Native SVG Icon Set**: Added native inline SVGs for `check`, `trash`, and `alert` in `extension.js`.

### Fixed
- **Fixed Button Rendering `undefined`**: Resolved missing `SVGS.check` icon in the *Save & Apply to All Chats* button, which previously caused the button to render the literal text `undefined`.
- **Eliminated Duplicate Skills & Stale Project Notes**: `syncSkillsToVault` now avoids re-creating global skills under project names and automatically cleans up stale or orphaned skill notes from previous workspaces in `Antigravity/Skills/`.
- **Prevented Infinite Recursive Knowledge Sync Loop**: Eliminated recursive re-nesting between `syncKnowledgeToVault` and `syncVaultToKnowledge` by tagging exported notes with `source: 'obsidian-vault'` and stripping redundant nested frontmatters and headers.
- **Fixed Obsidian Graph View Links**: Replaced inconsistent emoji-bearing links (`[[00 🧠 Antigravity Hub]]`) with exact filename matches (`[[00 Antigravity Hub]]`, `[[00 Indice de Skills]]`, `[[00 Indice de Memoria]]`), ensuring the Graph View renders cleanly without phantom or broken nodes.

---

## [1.1.0] - 2026-10-02

### Added
- **Ultra-Low Context Triage (`triage`)**: Fast keyword evaluation (<80 tokens) determining whether a query maps to an active Skill, existing Memory, or requires no vault lookup, avoiding context window bloat.
- **Selective Solution Extraction (`peek`)**: Targeted solution inspection that extracts the exact technical fix and executive summary without leaking raw metadata, changelogs, or graph links (saving ~90% of tokens per lookup).
- **Atomic Multi-Index Persistence (`save` / `save-memory`)**: Automatically updates note files, `00 Indice de Memoria.md`, `00 Antigravity Hub.md`, `context-manifest.json`, and bidirectional Antigravity Knowledge Items simultaneously.
- **Short Capability Descriptions**: Dense 1-line capability summaries across all skills and memories to empower the agent to select the right tool with minimum token usage.
- **Zero-Emoji Technical Formatting**: Removed decorative emojis, conversational boilerplate, and redundant headers from all generated notes, indexes, rules, and prompts to guarantee high-density, professional technical records.
- **New CLI Shortcuts**: Added convenient commands `save`, `catalog`, `skills`, and `memories` for streamlined agent and developer workflows.

### Fixed
- Fixed undefined `data` parameter in `updateAiConfig` message handler in `extension.js`.
- Fixed template literal variable escaping in `skill-installer.js` for seamless Windows cross-platform compatibility.
- Fixed bidirectional Knowledge Item artifact generation and metadata referencing.

---

## [1.0.0] - 2026-10-02

### Initial Release
- **Autonomous Second Brain**: Automatic AI memory injection into all Antigravity chats via `~/.gemini/config/rules/obsidian-brain.md` and the `antigravity-obsidian` skill.
- **Zero-Config Vault Detection**: Auto-detects local Obsidian vaults on Windows (`%APPDATA%\obsidian\obsidian.json`), macOS, and Linux without requiring API keys or third-party servers.
- **Bidirectional Skill Synchronization**: Seamlessly mirrors skills between `~/.gemini/config/skills/` and `Antigravity/Skills/` with Obsidian frontmatter and wikilinks.
- **Graph View Integration**: Central Map of Content (`00 Antigravity Hub.md`) connecting memories, skills, and projects to illuminate Obsidian's interactive Graph View.
- **Activity Bar Webview Panel**: Dedicated sidebar panel with quick navigation, deep links (`obsidian://open`), search filters, and manual sync buttons.
- **Native Packaging**: Official VSIX package distribution and icon branding.
