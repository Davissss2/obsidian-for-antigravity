const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { detectVaults, getActiveOrConfiguredVault } = require('./src/vault-detector');
const syncEngine = require('./src/sync-engine');
const { installSkillAndRules } = require('./src/skill-installer');

let statusBarItem;
let currentWebviewView = null;

function getWorkspaceRoot() {
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  }
  return null;
}

function openInObsidianApp(vaultName, notePath) {
  const encVault = encodeURIComponent(vaultName);
  let cleanNote = (notePath || 'Antigravity/00 Antigravity Hub').replace(/\\/g, '/');
  if (cleanNote.endsWith('.md')) cleanNote = cleanNote.slice(0, -3);
  const encFile = encodeURIComponent(cleanNote);
  const uri = `obsidian://open?vault=${encVault}&file=${encFile}`;

  if (process.platform === 'win32') {
    exec(`start "" "${uri}"`);
  } else if (process.platform === 'darwin') {
    exec(`open "${uri}"`);
  } else {
    exec(`xdg-open "${uri}"`);
  }
}

function updateStatusBar(vault) {
  if (!statusBarItem) return;
  if (vault && vault.exists) {
    statusBarItem.text = `$(book) Obsidian: ${vault.name}`;
    statusBarItem.tooltip = `Conectado a Obsidian: ${vault.path}`;
    statusBarItem.command = 'antigravityObsidian.openHub';
    statusBarItem.show();
  } else {
    statusBarItem.text = `$(book) Obsidian: Offline`;
    statusBarItem.tooltip = 'No se encontró ningún Vault activo.';
    statusBarItem.command = 'antigravityObsidian.selectVault';
    statusBarItem.show();
  }
}

// Inline SVGs (Zero emojis)
const SVGS = {
  crystal: `<svg class="svg-icon" viewBox="0 0 24 24"><polygon points="12,2 18,7 15,22 12,18 9,22 6,7"/></svg>`,
  vault: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><polygon points="6 2 18 2 22 8 12 22 2 8 6 2"/><line x1="2" y1="8" x2="22" y2="8"/><polyline points="12 22 8 8 10 2"/><polyline points="12 22 16 8 14 2"/></svg>`,
  brain: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 .7.16 1.37.45 1.96A4.5 4.5 0 0 0 4 12.5a4.5 4.5 0 0 0 2.2 3.9A4.5 4.5 0 0 0 10.5 21a4.5 4.5 0 0 0 1.5-.26A4.5 4.5 0 0 0 13.5 21a4.5 4.5 0 0 0 4.3-4.6 4.5 4.5 0 0 0 2.2-3.9 4.5 4.5 0 0 0-3.95-4.04c.29-.59.45-1.26.45-1.96A4.5 4.5 0 0 0 12 2z"/></svg>`,
  zap: `<svg class="svg-icon" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  network: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  sync: `<svg class="svg-icon" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  open: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  copy: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  plus: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  search: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  settings: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  globe: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  save: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  dashboard: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
};

async function promptSelectVault(onSuccess) {
  const folderUri = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Seleccionar Bóveda de Obsidian',
  });

  if (folderUri && folderUri[0]) {
    const selectedPath = folderUri[0].fsPath;
    await vscode.workspace.getConfiguration('antigravityObsidian').update('vaultPath', selectedPath, vscode.ConfigurationTarget.Global);
    const newVault = getActiveOrConfiguredVault(selectedPath);
    installSkillAndRules(selectedPath);
    syncEngine.syncAll(selectedPath, getWorkspaceRoot());
    updateStatusBar(newVault);
    if (onSuccess) onSuccess();
    vscode.window.showInformationMessage(`Bóveda de Obsidian configurada: ${newVault ? newVault.name : selectedPath}`);
    return newVault;
  }
  return null;
}

class ObsidianPanelProvider {
  constructor(extensionUri, context) {
    this._extensionUri = extensionUri;
    this._context = context;
  }

  resolveWebviewView(webviewView) {
    currentWebviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    const updateView = () => {
      webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    };

    // Auto-sync on panel open so everything is fresh immediately
    const config = vscode.workspace.getConfiguration('antigravityObsidian');
    const configuredPath = config.get('vaultPath');
    const { ensureOrCreateDefaultVault } = require('./src/vault-detector');
    const vault = ensureOrCreateDefaultVault(configuredPath);
    const workspaceRoot = getWorkspaceRoot();

    if (vault && vault.exists) {
      try {
        syncEngine.syncAll(vault.path, workspaceRoot);
      } catch (e) {}
    }

    updateView();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      const currentVault = ensureOrCreateDefaultVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      const currentRoot = getWorkspaceRoot();

      switch (message.type) {
        case 'syncNow': {
          if (currentVault && currentVault.path) {
            syncEngine.syncAll(currentVault.path, currentRoot);
            installSkillAndRules(currentVault.path);
            updateStatusBar(currentVault);
            updateView();
            webviewView.webview.postMessage({ type: 'syncComplete' });
          } else {
            vscode.window.showErrorMessage('No hay ninguna bóveda de Obsidian conectada.');
          }
          break;
        }

        case 'openHub': {
          if (currentVault && currentVault.path) {
            openInObsidianApp(currentVault.name, 'Antigravity/00 Antigravity Hub');
          }
          break;
        }

        case 'openNote': {
          if (currentVault && currentVault.path && message.path) {
            openInObsidianApp(currentVault.name, message.path);
          }
          break;
        }

        case 'saveMemory': {
          if (currentVault && currentVault.path && message.data) {
            const saved = syncEngine.saveNewMemory(currentVault.path, {
              ...message.data,
              project: currentRoot ? path.basename(currentRoot) : null,
            });
            syncEngine.generateHub(currentVault.path, currentRoot);
            updateView();
            webviewView.webview.postMessage({ type: 'memorySaved', title: saved.title });
          }
          break;
        }

        case 'selectVault': {
          await promptSelectVault(() => {
            updateView();
          });
          break;
        }

        case 'reinstallSkill': {
          if (currentVault && currentVault.path) {
            installSkillAndRules(currentVault.path);
            vscode.window.showInformationMessage('Skill de Obsidian actualizada para todos los chats.');
            updateView();
          }
          break;
        }

        case 'updateAiConfig': {
          const proactiveLookup = !!data.proactiveLookup;
          const autoSave = !!data.autoSave;
          if (currentVault && currentVault.path) {
            installSkillAndRules(currentVault.path, { proactiveLookup, autoSave });
            vscode.window.showInformationMessage('Configuración de IA y Segundo Cerebro actualizada.');
            updateView();
          }
          break;
        }

        case 'refresh': {
          updateView();
          break;
        }
      }
    });
  }

  _getHtmlForWebview(webview) {
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

    const config = vscode.workspace.getConfiguration('antigravityObsidian');
    const configuredPath = config.get('vaultPath');
    const detection = detectVaults();
    const { ensureOrCreateDefaultVault } = require('./src/vault-detector');
    const vault = ensureOrCreateDefaultVault(configuredPath);
    const workspaceRoot = getWorkspaceRoot();

    let stats = { memories: 0, skills: 0, projects: 0, sessions: 0, hubExists: false };
    let memoryList = [];
    let skillList = [];

    if (vault && vault.path && fs.existsSync(vault.path)) {
      stats = syncEngine.getVaultStats(vault.path);

      // Read memory list
      const memFolder = path.join(vault.path, 'Antigravity', 'Memoria');
      if (fs.existsSync(memFolder)) {
        memoryList = fs.readdirSync(memFolder)
          .filter(f => f.endsWith('.md') && !f.startsWith('00'))
          .map(f => {
            const fp = path.join(memFolder, f);
            const content = fs.readFileSync(fp, 'utf8');
            const title = f.replace(/\.md$/, '');
            
            const catMatch = content.match(/category:\s*["']?([^"'\n]+)["']?/i);
            const category = catMatch ? catMatch[1] : 'general';

            const sumMatch = content.match(/> \[!NOTE\][^\n]*\n>\s*([^\n]+)/i) || content.match(/> \[!ABSTRACT\][^\n]*\n>\s*([^\n]+)/i);
            const summary = sumMatch ? sumMatch[1] : content.replace(/---[\s\S]*?---/, '').replace(/#+[^\n]+/g, '').trim().slice(0, 150);
            
            const fileStat = fs.statSync(fp);
            const dateStr = fileStat.mtime.toISOString().split('T')[0];

            return { title, summary, category, date: dateStr, relPath: `Antigravity/Memoria/${title}` };
          });
      }

      // Read skill list
      const skiFolder = path.join(vault.path, 'Antigravity', 'Skills');
      if (fs.existsSync(skiFolder)) {
        skillList = fs.readdirSync(skiFolder)
          .filter(f => f.endsWith('.md') && !f.startsWith('00'))
          .map(f => {
            const fp = path.join(skiFolder, f);
            const content = fs.readFileSync(fp, 'utf8');
            const title = f.replace(/\.md$/, '');
            const scopeMatch = content.match(/scope:\s*(\w+)/);
            const scope = scopeMatch ? scopeMatch[1] : 'global';
            const descMatch = content.match(/> - \*\*Descripción\*\*:\s*([^\n]+)/);
            const desc = descMatch ? descMatch[1] : 'Skill activa';
            return { title, desc, scope, relPath: `Antigravity/Skills/${title}` };
          });
      }
    }

    const isConnected = !!(vault && vault.exists);
    const vaultName = isConnected ? vault.name : 'Offline';
    const vaultPath = isConnected ? vault.path : 'Seleccionar carpeta';

    let proactiveLookup = true;
    let autoSave = true;
    const os = require('os');
    const globalConfigPath = path.join(os.homedir(), '.gemini', 'config', 'antigravity-obsidian.json');
    if (fs.existsSync(globalConfigPath)) {
      try {
        const gc = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
        if (gc.proactiveLookup !== undefined) proactiveLookup = !!gc.proactiveLookup;
        if (gc.autoSave !== undefined) autoSave = !!gc.autoSave;
      } catch (e) {}
    }

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Obsidian for Antigravity</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <!-- Header -->
  <div class="app-header">
    <div class="brand-wrapper">
      <div class="brand-badge">
        ${SVGS.crystal}
      </div>
      <div class="brand-info">
        <h1 data-i18n="brand_title">Obsidian for Antigravity</h1>
        <p data-i18n="brand_subtitle">Segundo Cerebro de Antigravity</p>
      </div>
    </div>
    <div class="header-right">
      <select class="lang-selector-compact lang-select" title="Language / Idioma">
        <option value="es">ES</option>
        <option value="en">EN</option>
        <option value="fr">FR</option>
        <option value="de">DE</option>
        <option value="zh">ZH</option>
        <option value="ja">JA</option>
      </select>
      <div class="status-badge" title="Status">
        <div class="status-pulse" style="${isConnected ? '' : 'background:#ef4444;box-shadow:none;'}"></div>
        <span data-i18n="${isConnected ? 'online' : 'offline'}">${isConnected ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  </div>

  <!-- Vault Connection Banner -->
  <div class="vault-card">
    <div class="vault-top">
      <div class="vault-title">
        ${SVGS.vault} <span>${vaultName}</span>
      </div>
      <div class="vault-actions">
        <button class="icon-btn" id="btn-copy-path" data-path="${vaultPath}" title="Copiar ruta">${SVGS.copy}</button>
        <button class="icon-btn" id="btn-change-vault" title="Configurar">${SVGS.settings}</button>
      </div>
    </div>
    <div class="vault-path-badge" title="${vaultPath}">
      <span>${vaultPath}</span>
    </div>
  </div>

  <!-- Stats Row -->
  <div class="stats-row">
    <div class="stat-box active" data-tab="memoria">
      <div class="stat-num">${stats.memories}</div>
      <div class="stat-meta">${SVGS.brain} <span data-i18n="memories">Memorias</span></div>
    </div>
    <div class="stat-box" data-tab="skills">
      <div class="stat-num">${stats.skills}</div>
      <div class="stat-meta">${SVGS.zap} <span data-i18n="skills">Skills</span></div>
    </div>
    <div class="stat-box" data-tab="panel">
      <div class="stat-num">Hub</div>
      <div class="stat-meta">${SVGS.network} <span data-i18n="graph">Grafo</span></div>
    </div>
  </div>

  <!-- Pill Tabs -->
  <div class="tabs-nav">
    <button class="tab-pill active" data-tab="panel">
      ${SVGS.dashboard}
      <span class="tab-text" data-i18n="tab_panel">Panel</span>
    </button>
    <button class="tab-pill" data-tab="memoria">
      ${SVGS.brain}
      <span class="tab-text" data-i18n="tab_memories">Memorias</span>
      <span class="tab-badge">${memoryList.length}</span>
    </button>
    <button class="tab-pill" data-tab="skills">
      ${SVGS.zap}
      <span class="tab-text" data-i18n="tab_skills">Skills</span>
      <span class="tab-badge">${skillList.length}</span>
    </button>
    <button class="tab-pill" data-tab="crear">
      ${SVGS.plus}
      <span class="tab-text" data-i18n="tab_create">Crear</span>
    </button>
    <button class="tab-pill" data-tab="ajustes">
      ${SVGS.settings}
      <span class="tab-text" data-i18n="tab_settings">Ajustes</span>
    </button>
  </div>

  <!-- TAB 1: PANEL / RESUMEN -->
  <div class="tab-pane active" id="pane-panel">
    <!-- Interactive Graph Card -->
    <div class="graph-preview-card" id="card-open-graph">
      <div class="graph-icon-wrap">${SVGS.network}</div>
      <div class="graph-title" data-i18n="graph_title">Explorar Grafo de Conocimiento</div>
      <div class="graph-desc" data-i18n="graph_desc">Abre Obsidian Graph View con todas tus notas interconectadas.</div>
    </div>

    <div class="action-grid">
      <button class="btn-action btn-gradient" id="btn-sync">
        ${SVGS.sync} <span class="btn-label" data-i18n="btn_sync">Sincronizar Bóveda</span>
      </button>
      <button class="btn-action btn-outline" id="btn-open-hub">
        ${SVGS.open} <span data-i18n="btn_open_hub">Abrir 00 Antigravity Hub</span>
      </button>
    </div>

    <div class="info-banner">
      <strong data-i18n="info_title">Sincronización Autónoma Activa</strong><br>
      <span data-i18n="info_desc">Antigravity aprende de tus conversaciones y guarda lecciones en tu Vault automáticamente sin pedir confirmación.</span>
    </div>
  </div>

  <!-- TAB 2: MEMORIAS -->
  <div class="tab-pane" id="pane-memoria">
    <div class="search-wrapper">
      <span class="search-icon-pos">${SVGS.search}</span>
      <input type="text" class="search-input" id="search-memories" data-i18n-ph="search_memories" placeholder="Buscar en memorias...">
    </div>

    <div class="filter-chips">
      <div class="chip active" data-category="all" data-i18n="filter_all">Todos</div>
      <div class="chip" data-category="arquitectura" data-i18n="filter_arch">Arquitectura</div>
      <div class="chip" data-category="bugfix" data-i18n="filter_bugfix">Bugfix</div>
      <div class="chip" data-category="knowledge-item" data-i18n="filter_knowledge">Knowledge</div>
      <div class="chip" data-category="general" data-i18n="filter_general">General</div>
    </div>

    <div class="cards-scroll-container" id="memories-list">
      ${memoryList.length === 0 ? `<div style="color:var(--text-muted);text-align:center;padding:20px;" data-i18n="no_memories">Sin memorias registradas aún</div>` : ''}
      ${memoryList.map(m => `
        <div class="note-item" data-title="${m.title}" data-cat="${m.category}">
          <div class="note-top">
            <span class="note-name">${m.title}</span>
            <span class="tag-badge">${m.category}</span>
          </div>
          <div class="note-snippet">${m.summary}</div>
          <div class="note-foot">
            <span class="note-date">${m.date}</span>
            <div style="display:flex;gap:6px;">
              <button class="btn-open-link btn-copy-wikilink" data-title="${m.title}">
                ${SVGS.copy} <span data-i18n="btn_copy">Copiar</span>
              </button>
              <button class="btn-open-link btn-open-note" data-note="${m.relPath}">
                ${SVGS.open} <span data-i18n="btn_open">Abrir</span>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- TAB 3: SKILLS -->
  <div class="tab-pane" id="pane-skills">
    <div class="search-wrapper">
      <span class="search-icon-pos">${SVGS.search}</span>
      <input type="text" class="search-input" id="search-skills" data-i18n-ph="search_skills" placeholder="Filtrar skills...">
    </div>

    <div class="cards-scroll-container" id="skills-list">
      ${skillList.length === 0 ? `<div style="color:var(--text-muted);text-align:center;padding:20px;" data-i18n="no_skills">Sin skills sincronizadas aún</div>` : ''}
      ${skillList.map(s => `
        <div class="note-item" data-title="${s.title}">
          <div class="note-top">
            <span class="note-name">${s.title}</span>
            <span class="tag-badge ${s.scope === 'global' ? 'skill-global' : ''}">${s.scope}</span>
          </div>
          <div class="note-snippet">${s.desc}</div>
          <div class="note-foot">
            <span class="note-date">Active</span>
            <button class="btn-open-link btn-open-note" data-note="${s.relPath}">
              ${SVGS.open} <span data-i18n="btn_open">Abrir</span>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- TAB 4: NUEVA MEMORIA -->
  <div class="tab-pane" id="pane-crear">
    <div class="form-panel">
      <form id="memory-form">
        <div class="field">
          <label data-i18n="form_title">Título de la Memoria / Solución</label>
          <input type="text" class="input-ctrl" id="mem-title" data-i18n-ph="form_title_ph" placeholder="Ej: Optimización SQLite WAL" required>
        </div>
        <div class="field">
          <label data-i18n="form_cat">Categoría</label>
          <select class="select-ctrl" id="mem-category">
            <option value="arquitectura" data-i18n="filter_arch">Arquitectura</option>
            <option value="bugfix" data-i18n="filter_bugfix">Bugfix</option>
            <option value="general" data-i18n="filter_general" selected>General</option>
          </select>
        </div>
        <div class="field">
          <label data-i18n="form_details">Detalles / Solución Técnica</label>
          <textarea class="textarea-ctrl" id="mem-content" data-i18n-ph="form_details_ph" placeholder="Escribe aquí los pasos..." required></textarea>
        </div>
        <div class="field">
          <label data-i18n="form_tags">Etiquetas (separadas por coma)</label>
          <input type="text" class="input-ctrl" id="mem-tags" data-i18n-ph="form_tags_ph" placeholder="ej: sqlite, backend">
        </div>
        <button type="submit" class="btn-action btn-gradient" style="margin-top:6px;">
          ${SVGS.save} <span data-i18n="btn_save">Guardar en Obsidian Vault</span>
        </button>
      </form>
    </div>
  </div>

  <!-- TAB 5: AJUSTES -->
  <div class="tab-pane" id="pane-ajustes">
    <div class="field">
      <label data-i18n="language_label">Idioma / Language:</label>
      <select class="select-ctrl lang-select" style="margin-bottom:12px;">
        <option value="es">Español (ES)</option>
        <option value="en">English (EN)</option>
        <option value="fr">Français (FR)</option>
        <option value="de">Deutsch (DE)</option>
        <option value="zh">中文 (ZH)</option>
        <option value="ja">日本語 (JA)</option>
      </select>
    </div>

    <div class="info-banner" style="margin-top:0;margin-bottom:12px;">
      <strong data-i18n="settings_mode_title">Modo Nativo Directo Activo</strong><br>
      <span data-i18n="settings_mode_desc">La extensión sincroniza directamente tus archivos Markdown locales. Cero configuración, cero API keys.</span>
    </div>

    <!-- AI Conversations Proactive Memory Settings -->
    <div class="settings-section">
      <div class="settings-section-title">
        ${SVGS.brain} <span data-i18n="settings_ai_title">Comportamiento en Conversaciones de IA:</span>
      </div>

      <div class="toggle-card">
        <div class="toggle-info">
          <div class="toggle-title" data-i18n="settings_proactive_title">Consultar Vault al Iniciar Tareas</div>
          <div class="toggle-desc" data-i18n="settings_proactive_desc">La IA revisará si hay notas previas que le sirvan antes de investigar o asumir soluciones.</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="toggle-proactive" ${proactiveLookup ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>

      <div class="toggle-card">
        <div class="toggle-info">
          <div class="toggle-title" data-i18n="settings_autosave_title">Aprender y Guardar Automáticamente</div>
          <div class="toggle-desc" data-i18n="settings_autosave_desc">Guarda lecciones de bugs resueltos y decisiones arquitectónicas sin pedir confirmación.</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="toggle-autosave" ${autoSave ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>

      <button class="btn-action btn-gradient" id="btn-save-ai-settings" style="margin-top:8px;">
        ${SVGS.check} <span data-i18n="btn_save_ai_settings">Guardar y Aplicar a Todos los Chats</span>
      </button>
    </div>

    <div class="field">
      <label data-i18n="settings_vaults_detected">Bóvedas detectadas en este equipo:</label>
      <div style="font-size:11px; color:var(--text-muted); margin-bottom:8px; line-height:1.6;">
        ${detection.vaults.map(v => `• <strong>${v.name}</strong><br><span style="font-family:monospace;font-size:10px;color:var(--text-dim);">${v.path}</span>`).join('<br><br>') || 'Ninguna'}
      </div>
      <button class="btn-action btn-outline" id="btn-select-another">
        ${SVGS.settings} <span data-i18n="btn_select_another">Seleccionar otra carpeta...</span>
      </button>
    </div>

    <div class="field" style="margin-top:14px; border-top:1px solid var(--card-border); padding-top:12px;">
      <label data-i18n="settings_reinstall_title">Inyección en Chats de IA:</label>
      <button class="btn-action btn-outline" id="btn-reinstall">
        ${SVGS.sync} <span data-i18n="btn_reinstall">Refrescar Skill y Reglas Globales</span>
      </button>
      <div style="font-size:10px; color:var(--text-dim); margin-top:5px;" data-i18n="settings_reinstall_desc">
        Vuelve a comprobar que ~/.gemini/config/skills/ tenga la skill lista para todos los chats.
      </div>
    </div>
  </div>

  <!-- Toast Bar -->
  <div class="toast-bar" id="toast"></div>

  <script src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function activate(context) {
  const config = vscode.workspace.getConfiguration('antigravityObsidian');
  const configuredPath = config.get('vaultPath');
  
  // 1. Auto-provision vault: finds existing open vault or automatically creates one in Documents
  const { ensureOrCreateDefaultVault } = require('./src/vault-detector');
  const vault = ensureOrCreateDefaultVault(configuredPath);
  const workspaceRoot = getWorkspaceRoot();

  // Instantiate Webview provider
  const provider = new ObsidianPanelProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('antigravityObsidian.panel', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  // 2. Automatically install skill, global rules, and run full sync
  try {
    installSkillAndRules(vault ? vault.path : null);
    if (vault && vault.exists) {
      syncEngine.syncAll(vault.path, workspaceRoot);
    }
  } catch (err) {
    console.error('Error auto-installing Obsidian skill:', err);
  }

  // 3. Automatic background sync & file watchers
  let syncTimeout = null;
  const triggerDebouncedSync = () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      if (vault && vault.exists) {
        try {
          syncEngine.syncAll(vault.path, getWorkspaceRoot());
          if (currentWebviewView) {
            currentWebviewView.webview.html = provider._getHtmlForWebview(currentWebviewView.webview);
          }
        } catch (e) {}
      }
    }, 2500);
  };

  if (vault && vault.exists) {
    // Watch Antigravity Global Skills directory
    const globalSkillsDir = path.join(os.homedir(), '.gemini', 'config', 'skills');
    if (fs.existsSync(globalSkillsDir)) {
      try {
        const watcher = fs.watch(globalSkillsDir, { recursive: true }, (event, filename) => {
          if (filename && !filename.includes('antigravity-obsidian')) {
            triggerDebouncedSync();
          }
        });
        context.subscriptions.push({ dispose: () => watcher.close() });
      } catch (e) {}
    }

    // Periodic auto-sync every 3 minutes
    const periodicTimer = setInterval(() => {
      try {
        syncEngine.syncAll(vault.path, getWorkspaceRoot());
      } catch (e) {}
    }, 180000);
    context.subscriptions.push({ dispose: () => clearInterval(periodicTimer) });
  }

  // 4. First-launch welcoming notification
  const initialized = context.globalState.get('obsidian_auto_initialized');
  if (!initialized && vault && vault.exists) {
    vscode.window.showInformationMessage(
      `✨ Obsidian for Antigravity: Configurado y conectado automáticamente (${vault.name}). Tu Segundo Cerebro de IA ya está activo en todos tus chats.`
    );
    context.globalState.update('obsidian_auto_initialized', true);
  }

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  updateStatusBar(vault);
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.openHub', () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (activeVault && activeVault.exists) {
        openInObsidianApp(activeVault.name, 'Antigravity/00 Antigravity Hub');
      } else {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.syncNow', () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (activeVault && activeVault.exists) {
        syncEngine.syncAll(activeVault.path, getWorkspaceRoot());
        installSkillAndRules(activeVault.path);
        updateStatusBar(activeVault);
        vscode.window.showInformationMessage(`Sincronización con Obsidian completada (${activeVault.name}).`);
      } else {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.selectVault', async () => {
      await promptSelectVault(() => {
        if (currentWebviewView) {
          currentWebviewView.webview.html = provider._getHtmlForWebview(currentWebviewView.webview);
        }
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.newMemory', async () => {
      if (currentWebviewView) {
        currentWebviewView.webview.postMessage({ type: 'switchTab', tab: 'crear' });
      }
      const title = await vscode.window.showInputBox({
        prompt: 'Título de la Memoria / Solución Técnica',
        placeHolder: 'Ej: Optimización SQLite WAL y concurrencia',
      });
      if (!title) return;

      const content = await vscode.window.showInputBox({
        prompt: 'Contenido / Detalles de la Solución',
        placeHolder: 'Escribe aquí los pasos o solución...',
      });
      if (!content) return;

      const { ensureOrCreateDefaultVault } = require('./src/vault-detector');
      const activeVault = ensureOrCreateDefaultVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (activeVault && activeVault.exists) {
        syncEngine.saveNewMemory(activeVault.path, {
          title,
          content,
          project: getWorkspaceRoot() ? path.basename(getWorkspaceRoot()) : null,
        });
        syncEngine.generateHub(activeVault.path, getWorkspaceRoot());
        if (currentWebviewView) {
          currentWebviewView.webview.html = provider._getHtmlForWebview(currentWebviewView.webview);
        }
        vscode.window.showInformationMessage(`Memoria "${title}" guardada en Obsidian.`);
      }
    })
  );
}

function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}

module.exports = {
  activate,
  deactivate,
};
