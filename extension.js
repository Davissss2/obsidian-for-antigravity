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

  try {
    vscode.env.openExternal(vscode.Uri.parse(uri)).then(success => {
      if (!success) {
        fallbackOpenUri(uri);
      }
    }, () => {
      fallbackOpenUri(uri);
    });
  } catch (e) {
    fallbackOpenUri(uri);
  }
}

function fallbackOpenUri(uri) {
  if (process.platform === 'win32') {
    exec(`start "" "${uri}"`, () => {});
  } else if (process.platform === 'darwin') {
    exec(`open "${uri}"`, () => {});
  } else {
    exec(`xdg-open "${uri}"`, () => {});
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
  check: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  trash: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  alert: `<svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  history: `<svg class="svg-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  folder: `<svg class="svg-icon" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
};

function runObsidianCli(cliArgs, cwd) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(os.homedir(), '.gemini', 'config', 'skills', 'antigravity-obsidian', 'scripts', 'obsidian.js');
    const runnerSource = path.join(__dirname, 'src', 'obsidian-runner.js');
    const targetScript = fs.existsSync(scriptPath) ? scriptPath : runnerSource;
    const cmd = `node "${targetScript}" ${cliArgs}`;
    exec(cmd, { cwd: cwd || getWorkspaceRoot() || process.cwd() }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout || (err && err.message) || 'Error ejecutando CLI'));
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        resolve({ stdout, raw: true });
      }
    });
  });
}

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
    const config = vscode.workspace.getConfiguration('antigravityObsidian');
    const configuredLang = config.get('language') || 'auto';
    const configuredUser = config.get('userName') || '';
    installSkillAndRules(selectedPath, { language: configuredLang, userName: configuredUser });
    syncEngine.syncAll(selectedPath, getWorkspaceRoot(), { language: configuredLang, userName: configuredUser });
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
    const configuredLang = config.get('language') || 'auto';
    const configuredUser = config.get('userName') || '';
    const { ensureOrCreateDefaultVault } = require('./src/vault-detector');
    const vault = ensureOrCreateDefaultVault(configuredPath);
    const workspaceRoot = getWorkspaceRoot();

    if (vault && vault.exists) {
      try {
        syncEngine.syncAll(vault.path, workspaceRoot, { language: configuredLang, userName: configuredUser });
      } catch (e) {}
    }

    updateView();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      const currentVault = ensureOrCreateDefaultVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      const currentRoot = getWorkspaceRoot();
      const currentConfig = vscode.workspace.getConfiguration('antigravityObsidian');
      const activeLang = currentConfig.get('language') || 'auto';
      const activeUser = currentConfig.get('userName') || '';

      switch (message.type) {
        case 'syncNow': {
          if (currentVault && currentVault.path) {
            syncEngine.syncAll(currentVault.path, currentRoot, { language: activeLang, userName: activeUser });
            installSkillAndRules(currentVault.path, { language: activeLang, userName: activeUser });
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
            syncEngine.generateHub(currentVault.path, currentRoot, { language: activeLang, userName: activeUser });
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
            installSkillAndRules(currentVault.path, { language: activeLang, userName: activeUser });
            vscode.window.showInformationMessage('Skill de Obsidian actualizada para todos los chats.');
            updateView();
          }
          break;
        }

        case 'setLanguage': {
          const newLang = message.language || 'auto';
          await vscode.workspace.getConfiguration('antigravityObsidian').update('language', newLang, vscode.ConfigurationTarget.Global);
          if (currentVault && currentVault.path) {
            syncEngine.ensureSoulAndProfile(currentVault.path, { language: newLang, userName: activeUser, forceUpdate: true });
            installSkillAndRules(currentVault.path, { language: newLang, userName: activeUser });
            syncEngine.generateHub(currentVault.path, currentRoot, { language: newLang, userName: activeUser });
            updateView();
            vscode.window.showInformationMessage(newLang === 'en' ? 'Language switched to English. Soul, Profile, and AI rules updated.' : `Idioma cambiado a ${newLang.toUpperCase()}. Soul, Perfil y reglas de IA actualizadas.`);
          }
          break;
        }

        case 'updateAiConfig': {
          const cfgData = message.data || message || {};
          const proactiveLookup = cfgData.proactiveLookup !== undefined ? !!cfgData.proactiveLookup : true;
          const autoSave = cfgData.autoSave !== undefined ? !!cfgData.autoSave : true;
          const language = cfgData.language !== undefined ? cfgData.language : activeLang;
          const userName = cfgData.userName !== undefined ? cfgData.userName : activeUser;

          await vscode.workspace.getConfiguration('antigravityObsidian').update('language', language, vscode.ConfigurationTarget.Global);
          if (userName !== undefined) {
            await vscode.workspace.getConfiguration('antigravityObsidian').update('userName', userName, vscode.ConfigurationTarget.Global);
          }

          if (currentVault && currentVault.path) {
            syncEngine.ensureSoulAndProfile(currentVault.path, { language, userName, forceUpdate: true });
            installSkillAndRules(currentVault.path, { proactiveLookup, autoSave, language, userName });
            syncEngine.generateHub(currentVault.path, currentRoot, { language, userName });
            vscode.window.showInformationMessage('Configuración de IA, idioma y perfil actualizados.');
            updateView();
          }
          break;
        }

        case 'resetAllData': {
          if (currentVault && currentVault.path) {
            const answer = await vscode.window.showWarningMessage(
              '¿Estás seguro de que deseas borrar toda la memoria y notas sincronizadas en Obsidian para empezar de cero? Esta acción eliminará las memorias anteriores y limpiará el contexto acumulado de la IA.',
              { modal: true },
              'Borrar Todo y Empezar de Cero',
              'Cancelar'
            );
            if (answer === 'Borrar Todo y Empezar de Cero') {
              syncEngine.resetAllData(currentVault.path, currentRoot);
              installSkillAndRules(currentVault.path);
              updateStatusBar(currentVault);
              updateView();
              vscode.window.showInformationMessage('Memoria de Obsidian y contexto de IA reiniciados correctamente. Empezando de cero.');
              webviewView.webview.postMessage({ type: 'resetComplete' });
            }
          } else {
            vscode.window.showErrorMessage('No hay ninguna bóveda de Obsidian conectada.');
          }
          break;
        }

        case 'showSessions': {
          if (currentVault && currentVault.path) {
            const idx = path.join(currentVault.path, 'Antigravity', 'Sesiones', '00 Indice de Sesiones.md');
            if (fs.existsSync(idx)) {
              vscode.workspace.openTextDocument(idx).then(doc => vscode.window.showTextDocument(doc, { preview: false }));
            } else {
              openInObsidianApp(currentVault.name, 'Antigravity/Sesiones/00 Indice de Sesiones');
            }
          }
          break;
        }

        case 'showProjects': {
          if (currentVault && currentVault.path) {
            const idx = path.join(currentVault.path, 'Antigravity', 'Proyectos', '00 Indice de Proyectos.md');
            if (fs.existsSync(idx)) {
              vscode.workspace.openTextDocument(idx).then(doc => vscode.window.showTextDocument(doc, { preview: false }));
            } else {
              openInObsidianApp(currentVault.name, 'Antigravity/Proyectos/00 Indice de Proyectos');
            }
          }
          break;
        }

        case 'scanProject': {
          vscode.commands.executeCommand('antigravityObsidian.scanProject');
          break;
        }

        case 'saveSession': {
          vscode.commands.executeCommand('antigravityObsidian.saveSession');
          break;
        }

        case 'openExternal': {
          if (message.url) {
            vscode.env.openExternal(vscode.Uri.parse(message.url));
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

    const configuredLang = config.get('language') || 'auto';
    const configuredUser = config.get('userName') || '';
    const ideLang = (vscode.env.language || 'en').toLowerCase();
    const effectiveLang = configuredLang === 'auto'
      ? (ideLang.startsWith('en') ? 'en' : (ideLang.startsWith('es') ? 'es' : 'en'))
      : configuredLang;
    const effectiveUser = syncEngine.resolveUserName(vault ? vault.path : null, configuredUser);

    return `<!DOCTYPE html>
<html lang="${effectiveLang}">
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
        <option value="auto" ${configuredLang === 'auto' ? 'selected' : ''}>Auto (${ideLang.toUpperCase()})</option>
        <option value="es" ${configuredLang === 'es' ? 'selected' : ''}>ES</option>
        <option value="en" ${configuredLang === 'en' ? 'selected' : ''}>EN</option>
        <option value="fr" ${configuredLang === 'fr' ? 'selected' : ''}>FR</option>
        <option value="de" ${configuredLang === 'de' ? 'selected' : ''}>DE</option>
        <option value="zh" ${configuredLang === 'zh' ? 'selected' : ''}>ZH</option>
        <option value="ja" ${configuredLang === 'ja' ? 'selected' : ''}>JA</option>
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

  ${!isConnected ? `
  <div class="obsidian-install-banner" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:14px;margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:8px;font-weight:600;color:#f87171;margin-bottom:6px;">
      ${SVGS.alert}
      <span>Obsidian no detectado en tu sistema</span>
    </div>
    <div style="font-size:12px;line-height:1.5;color:var(--text-muted);margin-bottom:12px;">
      Para habilitar el Segundo Cerebro de IA y memoria persistente, instala Obsidian en tu equipo o selecciona manualmente la carpeta de tu Bóveda.
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn-action btn-gradient" id="btn-install-obsidian" style="flex:1;">
        ${SVGS.globe} <span>Instalar Obsidian</span>
      </button>
      <button class="btn-action btn-outline" id="btn-select-vault-card" style="flex:1;">
        ${SVGS.vault} <span>Seleccionar Bóveda...</span>
      </button>
    </div>
  </div>
  ` : ''}

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
    <div class="stat-box" id="stat-sessions" title="Bitácora de Sesiones">
      <div class="stat-num">${stats.sessions || 0}</div>
      <div class="stat-meta">${SVGS.history} <span data-i18n="sessions">Sesiones</span></div>
    </div>
    <div class="stat-box" id="stat-projects" title="Índice de Proyectos">
      <div class="stat-num">${stats.projects || 0}</div>
      <div class="stat-meta">${SVGS.folder} <span data-i18n="projects">Proyectos</span></div>
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
    <div class="action-grid" style="margin-top:6px;">
      <button class="btn-action btn-outline" id="btn-scan-project">
        ${SVGS.search} <span data-i18n="btn_scan_project">Escanear Proyecto</span>
      </button>
      <button class="btn-action btn-outline" id="btn-save-session">
        ${SVGS.history} <span data-i18n="btn_save_session">Guardar Sesión</span>
      </button>
    </div>

    <div class="soul-card" id="card-soul">
      <div class="soul-header">
        <div class="soul-badge-wrap">
          ${SVGS.brain}
          <span class="soul-title" data-i18n="soul_title">Hermes Core — Alma & Perfil</span>
        </div>
        <span class="status-badge" style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3);" data-i18n="soul_status_active">Activo</span>
      </div>
      <div class="soul-body">
        <div class="soul-row">
          <strong data-i18n="soul_label">Soul de Antigravity:</strong>
          <span data-i18n="soul_desc">Ingeniero de software senior autónomo, resolutivo, sin rodeos y CERO emojis.</span>
        </div>
        <div class="soul-row">
          <strong><span data-i18n="profile_label_prefix">Perfil de Usuario</span> (${effectiveUser}):</strong>
          <span data-i18n="profile_desc">Español/Inglés directo según entorno, filtro anti-ruido estricto y rigor multiplataforma (Windows/Ubuntu/Mac).</span>
        </div>
      </div>
      <div class="soul-actions">
        <button class="btn-open-link btn-open-note" data-note="Antigravity/Alma/00 Soul de Antigravity.md">
          ${SVGS.open} <span data-i18n="soul_view_soul">Ver Soul</span>
        </button>
        <button class="btn-open-link btn-open-note" data-note="Antigravity/Alma/00 Perfil de Usuario.md">
          ${SVGS.open} <span data-i18n="soul_view_profile">Ver Perfil</span>
        </button>
      </div>
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
      <label data-i18n="settings_user_name_label">Nombre de Usuario (Perfil Hermes):</label>
      <input type="text" class="input-ctrl" id="setting-user-name" value="${configuredUser || effectiveUser}" data-i18n-ph="settings_user_name_ph" placeholder="Davissss2 o tu alias" style="margin-bottom:12px;">
    </div>

    <div class="field">
      <label data-i18n="language_label">Idioma / Language:</label>
      <select class="select-ctrl lang-select" id="setting-language" style="margin-bottom:12px;">
        <option value="auto" ${configuredLang === 'auto' ? 'selected' : ''}>Automático / Detect (${ideLang.toUpperCase()})</option>
        <option value="es" ${configuredLang === 'es' ? 'selected' : ''}>Español (ES)</option>
        <option value="en" ${configuredLang === 'en' ? 'selected' : ''}>English (EN)</option>
        <option value="fr" ${configuredLang === 'fr' ? 'selected' : ''}>Français (FR)</option>
        <option value="de" ${configuredLang === 'de' ? 'selected' : ''}>Deutsch (DE)</option>
        <option value="zh" ${configuredLang === 'zh' ? 'selected' : ''}>中文 (ZH)</option>
        <option value="ja" ${configuredLang === 'ja' ? 'selected' : ''}>日本語 (JA)</option>
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
    <div class="danger-zone">
      <div class="danger-title">${SVGS.alert} <span data-i18n="settings_danger_title">Zona de Peligro / Empezar de Cero</span></div>
      <div class="danger-desc" data-i18n="settings_danger_desc">
        Borra todas las memorias acumuladas, limpia duplicados y resetea el contexto de la IA para empezar completamente limpio desde cero con Obsidian.
      </div>
      <button class="btn-action btn-danger" id="btn-reset-data">
        ${SVGS.trash} <span data-i18n="btn_reset_data">Borrar Todo y Empezar de Cero</span>
      </button>
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
    const pConfig = vscode.workspace.getConfiguration('antigravityObsidian');
    const pConfigured = pConfig.get('personalityConfigured');
    installSkillAndRules(vault ? vault.path : null, {
      personalityConfigured: pConfigured ? true : undefined,
    });
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

  // 4. Status Bar and notification (Zero config, immediate out-of-the-box readiness)
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  updateStatusBar(vault);
  context.subscriptions.push(statusBarItem);

  if (vault && vault.exists) {
    const initialized = context.globalState.get('obsidian_auto_initialized');
    if (!initialized) {
      vscode.window.showInformationMessage(
        `Obsidian for Antigravity: Conectado automáticamente (${vault.name}). Tu Segundo Cerebro y memoria persistente están listos en todos tus chats.`
      );
      context.globalState.update('obsidian_auto_initialized', true);
    }
  } else {
    vscode.window.showWarningMessage(
      'Obsidian for Antigravity: No se pudo conectar a una bóveda automáticamente. Selecciona tu carpeta de bóveda para empezar.',
      'Seleccionar Bóveda...'
    ).then(choice => {
      if (choice) promptSelectVault();
    });
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.openHub', () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (activeVault && activeVault.exists) {
        const { isObsidianAppInstalled } = require('./src/vault-detector');
        if (!isObsidianAppInstalled()) {
          vscode.window.showInformationMessage(
            `Tus notas están guardadas en "${activeVault.path}". Si deseas visualizarlas en la app oficial de Obsidian, puedes descargarla gratis.`,
            'Descargar Obsidian',
            'Abrir Carpeta de Notas'
          ).then(choice => {
            if (choice === 'Descargar Obsidian') {
              vscode.env.openExternal(vscode.Uri.parse('https://obsidian.md/download'));
            } else if (choice === 'Abrir Carpeta de Notas') {
              vscode.env.openExternal(vscode.Uri.file(activeVault.path));
            }
          });
        } else {
          openInObsidianApp(activeVault.name, 'Antigravity/00 Antigravity Hub');
        }
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

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.newSkill', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
        return;
      }
      const name = await vscode.window.showInputBox({
        title: 'Crear Nueva Skill de IA',
        prompt: 'Nombre de la skill (ej: docker-deploy, nextjs-expert)',
        placeHolder: 'nombre-de-la-skill',
      });
      if (!name) return;

      const desc = await vscode.window.showInputBox({
        title: 'Descripción de la Skill',
        prompt: '¿Qué hace esta skill y cuándo debe activarse?',
        placeHolder: 'Guía y procedimientos para...',
      });
      if (!desc) return;

      const scopeChoice = await vscode.window.showQuickPick([
        { label: 'Global (~/.gemini/config/skills/)', value: 'global' },
        { label: 'Proyecto (.agents/skills/)', value: 'project' },
      ], { title: 'Ámbito de la Skill' });
      if (!scopeChoice) return;

      try {
        const res = syncEngine.createSkill(activeVault.path, getWorkspaceRoot(), {
          name,
          description: desc,
          content: `# ${name}\n\nInstrucciones operativas para el agente.`,
          scope: scopeChoice.value,
        });
        if (currentWebviewView) {
          currentWebviewView.webview.html = provider._getHtmlForWebview(currentWebviewView.webview);
        }
        vscode.window.showInformationMessage(`Skill "${res.name}" creada exitosamente.`);
      } catch (e) {
        vscode.window.showErrorMessage(e.message);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.listSkills', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
        return;
      }
      const idxFile = path.join(activeVault.path, 'Antigravity', 'Skills', '00 Indice de Skills.md');
      if (fs.existsSync(idxFile)) {
        const doc = await vscode.workspace.openTextDocument(idxFile);
        await vscode.window.showTextDocument(doc, { preview: false });
      } else {
        vscode.window.showWarningMessage('El Índice de Skills aún no ha sido generado.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.showSoul', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
        return;
      }
      const almaDir = path.join(activeVault.path, 'Antigravity', 'Alma');
      const soulPath = path.join(almaDir, '00 Soul de Antigravity.md');
      const userPath = path.join(almaDir, '00 Perfil de Usuario.md');
      const personalityPath = fs.existsSync(path.join(almaDir, '00 AI Personality.md'))
        ? path.join(almaDir, '00 AI Personality.md')
        : path.join(almaDir, '00 Personalidad de la IA.md');

      const choice = await vscode.window.showQuickPick([
        { label: '$(sparkle) Ver Personalidad de la IA', description: path.basename(personalityPath), path: personalityPath },
        { label: '$(account) Ver Perfil de Usuario', description: '00 Perfil de Usuario.md', path: userPath },
        { label: '$(circuit-board) Ver Soul de Antigravity', description: '00 Soul de Antigravity.md', path: soulPath },
        { label: '$(eye) Abrir en Panel Lateral', description: 'Webview', action: 'webview' },
      ], { placeHolder: 'Selecciona qué vista de Soul, Perfil o Personalidad consultar' });

      if (!choice) return;
      if (choice.action === 'webview') {
        if (currentWebviewView) {
          currentWebviewView.show?.(true);
          currentWebviewView.webview.postMessage({ type: 'switchTab', tab: 'hub' });
        }
      } else if (fs.existsSync(choice.path)) {
        const doc = await vscode.workspace.openTextDocument(choice.path);
        await vscode.window.showTextDocument(doc, { preview: false });
      } else {
        vscode.window.showWarningMessage(`No se encontró el archivo: ${choice.description}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.configurePersonality', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
        return;
      }
      const current = syncEngine.getPersonality(activeVault.path);

      const aiName = await vscode.window.showInputBox({
        title: 'Calibrar Nombre del Agente IA',
        prompt: '¿Cómo quieres que se llame tu agente de IA? (ej: Hermes, Jarvis, Antigravity)',
        value: current.aiName || 'Hermes',
      });
      if (aiName === undefined) return;

      const userCallsign = await vscode.window.showInputBox({
        title: 'Calibrar Trato hacia Ti',
        prompt: '¿Cómo quieres que el agente se dirija a ti? (ej: Davis, Jefe, Comandante, Socio)',
        value: current.userCallsign || '',
      });
      if (userCallsign === undefined) return;

      const personality = await vscode.window.showInputBox({
        title: 'Calibrar Rasgos de Personalidad y Tono',
        prompt: 'Describe los rasgos o estilo de comportamiento del agente',
        value: current.personality || 'Elite senior software engineer, pragmático, quirúrgico, sin rodeos y cero emojis.',
      });
      if (personality === undefined) return;

      const saved = syncEngine.savePersonality(activeVault.path, {
        aiName: aiName.trim() || 'Hermes',
        userCallsign: userCallsign.trim() || 'User',
        personality: personality.trim(),
        configured: true,
      });

      const config = vscode.workspace.getConfiguration('antigravityObsidian');
      await config.update('aiName', saved.aiName, vscode.ConfigurationTarget.Global);
      await config.update('userCallsign', saved.userCallsign, vscode.ConfigurationTarget.Global);
      await config.update('personality', saved.personality, vscode.ConfigurationTarget.Global);
      await config.update('personalityConfigured', true, vscode.ConfigurationTarget.Global);

      installSkillAndRules(activeVault.path, {
        aiName: saved.aiName,
        userCallsign: saved.userCallsign,
        personality: saved.personality,
        personalityConfigured: true,
      });

      syncEngine.syncAll(activeVault.path, getWorkspaceRoot());

      if (currentWebviewView) {
        currentWebviewView.webview.html = provider._getHtmlForWebview(currentWebviewView.webview);
      }

      vscode.window.showInformationMessage(`Personalidad calibrada: "${saved.aiName}" te llamará "${saved.userCallsign}".`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.registerProject', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
        return;
      }
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showWarningMessage('No hay ningún espacio de trabajo (workspace) abierto en este momento.');
        return;
      }

      const res = syncEngine.syncProject(activeVault.path, root);
      syncEngine.syncVaultToKnowledge(activeVault.path);

      if (currentWebviewView) {
        currentWebviewView.webview.html = provider._getHtmlForWebview(currentWebviewView.webview);
      }

      vscode.window.showInformationMessage(`Proyecto "${res.projectName}" registrado en el Índice Unificado de Obsidian.`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.showProjects', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
        return;
      }
      const idxFile = path.join(activeVault.path, 'Antigravity', 'Proyectos', '00 Indice de Proyectos.md');
      if (fs.existsSync(idxFile)) {
        const doc = await vscode.workspace.openTextDocument(idxFile);
        await vscode.window.showTextDocument(doc, { preview: false });
      } else {
        vscode.window.showWarningMessage('El Índice de Proyectos aún no ha sido generado.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.scanProject', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
        return;
      }
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showWarningMessage('No hay ningún espacio de trabajo (workspace) abierto en este momento.');
        return;
      }

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Obsidian: Escaneando arquitectura viva del proyecto...',
        cancellable: false
      }, async () => {
        try {
          const res = await runObsidianCli(`project scan "${root}"`, root);
          if (currentWebviewView) {
            currentWebviewView.webview.html = provider._getHtmlForWebview(currentWebviewView.webview);
          }
          const pName = (res && res.project) || path.basename(root);
          vscode.window.showInformationMessage(`Blueprint y arquitectura viva de "${pName}" actualizados en Obsidian.`);
        } catch (e) {
          vscode.window.showErrorMessage('Error al escanear arquitectura: ' + (e.message || JSON.stringify(e)));
        }
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.saveSession', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
        return;
      }
      const root = getWorkspaceRoot();
      const pName = root ? path.basename(root) : 'General';

      const summary = await vscode.window.showInputBox({
        title: `Guardar Checkpoint de Sesión: ${pName}`,
        prompt: 'Resumen conciso en una frase de los avances y decisiones clave',
        placeHolder: 'Ej: Implementado soporte de sesiones y escaneo profundo de módulos',
      });
      if (!summary) return;

      const content = await vscode.window.showInputBox({
        title: 'Detalles Técnicos y Próximos Pasos (Opcional)',
        prompt: 'Decisiones clave, módulos modificados o siguientes pasos',
        placeHolder: 'Ej: Registrados nuevos comandos CLI, reglas actualizadas, empaquetado 1.7.0',
      });

      try {
        const cleanSum = summary.replace(/"/g, '\\"');
        const cleanContent = (content || '').replace(/"/g, '\\"');
        await runObsidianCli(`session save --project "${pName}" --summary "${cleanSum}" --content "${cleanContent}"`, root);
        if (currentWebviewView) {
          currentWebviewView.webview.html = provider._getHtmlForWebview(currentWebviewView.webview);
        }
        vscode.window.showInformationMessage(`Checkpoint de sesión guardado en Obsidian: "${pName}".`);
      } catch (e) {
        vscode.window.showErrorMessage('Error al guardar checkpoint de sesión: ' + (e.message || JSON.stringify(e)));
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.showSessions', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
        return;
      }
      const idxFile = path.join(activeVault.path, 'Antigravity', 'Sesiones', '00 Indice de Sesiones.md');
      if (fs.existsSync(idxFile)) {
        const doc = await vscode.workspace.openTextDocument(idxFile);
        await vscode.window.showTextDocument(doc, { preview: false });
      } else {
        openInObsidianApp(activeVault.name, 'Antigravity/Sesiones/00 Indice de Sesiones');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.showStatus', async () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (!activeVault || !activeVault.exists) {
        vscode.window.showWarningMessage('Obsidian: Desconectado. No se encontró ninguna bóveda activa.');
        return;
      }
      const manifestPath = path.join(activeVault.path, 'Antigravity', 'context-manifest.json');
      let statsText = '';
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          statsText = ` | Memorias: ${manifest.stats.memories} | Skills: ${manifest.stats.skills}`;
        } catch (e) {}
      }
      const action = await vscode.window.showInformationMessage(
        `Obsidian Conectado: ${activeVault.name}${statsText}`,
        'Abrir Hub',
        'Sincronizar'
      );
      if (action === 'Abrir Hub') {
        vscode.commands.executeCommand('antigravityObsidian.openHub');
      } else if (action === 'Sincronizar') {
        vscode.commands.executeCommand('antigravityObsidian.syncNow');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.openGraph', () => {
      const activeVault = getActiveOrConfiguredVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (activeVault && activeVault.exists) {
        openInObsidianApp(activeVault.name, 'Antigravity/00 Antigravity Hub');
      } else {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('antigravityObsidian.resetData', async () => {
      const { ensureOrCreateDefaultVault } = require('./src/vault-detector');
      const activeVault = ensureOrCreateDefaultVault(vscode.workspace.getConfiguration('antigravityObsidian').get('vaultPath'));
      if (activeVault && activeVault.exists) {
        const answer = await vscode.window.showWarningMessage(
          '¿Estás seguro de que deseas borrar toda la memoria y notas sincronizadas en Obsidian para empezar de cero? Esta acción eliminará las memorias anteriores y limpiará el contexto acumulado de la IA.',
          { modal: true },
          'Borrar Todo y Empezar de Cero',
          'Cancelar'
        );
        if (answer === 'Borrar Todo y Empezar de Cero') {
          syncEngine.resetAllData(activeVault.path, getWorkspaceRoot());
          installSkillAndRules(activeVault.path);
          updateStatusBar(activeVault);
          if (currentWebviewView) {
            currentWebviewView.webview.html = provider._getHtmlForWebview(currentWebviewView.webview);
          }
          vscode.window.showInformationMessage('Memoria de Obsidian y contexto de IA reiniciados correctamente. Empezando de cero.');
        }
      } else {
        vscode.window.showWarningMessage('No hay ninguna bóveda de Obsidian conectada.');
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
