# Changelog

All notable changes to the **Obsidian for Antigravity** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
