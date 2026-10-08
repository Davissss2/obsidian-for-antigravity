#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

function getDocumentsDir() {
  const home = os.homedir();
  const docs = path.join(home, 'Documents');
  if (fs.existsSync(docs)) return docs;
  const docsEs = path.join(home, 'Documentos');
  if (fs.existsSync(docsEs)) return docsEs;
  return docs;
}

function getSkillInstaller() {
  const candidates = [
    path.join(__dirname, 'skill-installer.js'),
    path.join(__dirname, 'skill-installer'),
    path.join(__dirname, '..', 'skill-installer.js'),
    path.join(__dirname, '..', '..', '..', 'src', 'skill-installer.js'),
    path.join(__dirname, '..', 'src', 'skill-installer.js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        return require(c);
      } catch (e) {}
    }
  }
  return null;
}

function getToolsEngine() {
  const candidates = [
    path.join(__dirname, 'tools-engine.js'),
    path.join(__dirname, 'tools-engine'),
    path.join(__dirname, '..', 'tools-engine.js'),
    path.join(__dirname, '..', '..', '..', 'src', 'tools-engine.js'),
    path.join(__dirname, '..', 'src', 'tools-engine.js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        return require(c);
      } catch (e) {}
    }
  }
  return null;
}

function getSyncEngine() {
  const candidates = [
    path.join(__dirname, 'sync-engine.js'),
    path.join(__dirname, 'sync-engine'),
    path.join(__dirname, '..', 'sync-engine.js'),
    path.join(__dirname, '..', '..', '..', 'src', 'sync-engine.js'),
    path.join(__dirname, '..', 'src', 'sync-engine.js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        return require(c);
      } catch (e) {}
    }
  }
  return null;
}

function parseFlags(argvList) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argvList.length; i++) {
    const item = argvList[i];
    if (typeof item === 'string' && item.startsWith('--')) {
      const key = item.slice(2);
      const next = argvList[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(item);
    }
  }
  return { flags, positional };
}

function getPersonalityFile(almaDir, langPreference) {
  const pFileEs = path.join(almaDir, '00 Personalidad de la IA.md');
  const pFileEn = path.join(almaDir, '00 AI Personality.md');
  const isEn = (langPreference === 'en');
  if (fs.existsSync(pFileEs) && !fs.existsSync(pFileEn)) return pFileEs;
  if (fs.existsSync(pFileEn) && !fs.existsSync(pFileEs)) return pFileEn;
  if (!fs.existsSync(pFileEs) && !fs.existsSync(pFileEn)) return isEn ? pFileEn : pFileEs;
  try {
    const cEs = fs.readFileSync(pFileEs, 'utf8');
    const cEn = fs.readFileSync(pFileEn, 'utf8');
    const esConf = /configured:\s*true/i.test(cEs);
    const enConf = /configured:\s*true/i.test(cEn);
    if (esConf && !enConf) return pFileEs;
    if (enConf && !esConf) return pFileEn;
  } catch (e) {}
  return isEn ? pFileEn : pFileEs;
}

function updateGlobalRulesWithPersonality({ aiName, userCallsign, personality, configured, vaultPath, vaultName }) {
  try {
    const installer = getSkillInstaller();
    if (installer && typeof installer.installSkillAndRules === 'function') {
      installer.installSkillAndRules(vaultPath, {
        aiName,
        userCallsign,
        personality,
        personalityConfigured: configured,
      });
      return;
    }
  } catch (e) {}

  const home = os.homedir();
  const configDir = path.join(home, '.gemini', 'config');
  const rulesDir = path.join(configDir, 'rules');
  const rulePath = path.join(rulesDir, 'obsidian-brain.md');
  const geminiMdPath = path.join(configDir, 'GEMINI.md');
  const agentsMdPath = path.join(configDir, 'AGENTS.md');
  const scriptPath = path.join(configDir, 'skills', 'antigravity-obsidian', 'scripts', 'obsidian.js').replace(/\\/g, '/');

  // Maintain native GEMINI.md in ~/.gemini/ and ~/.gemini/config/ for instant Antigravity session bootstrap
  const geminiMdContent = [
    '# Antigravity AI Directives & Identity (Hermes Core)',
    '',
    `- **Nombre del Agente:** ${aiName}. Identifícate y actúa siempre como ${aiName}.`,
    `- **Trato hacia el Usuario:** Dirígete siempre al usuario como **${userCallsign}**.`,
    `- **Personalidad y Demeanor:** ${personality}`,
    `- **Segundo Cerebro Activo:** Bóveda de Obsidian conectada (${vaultName} en \`${vaultPath}\`).`,
    '- **Directiva Innegociable:** CERO EMOJIS en absolutamente todas las respuestas y notas.',
    '- **Herramientas de IA Disponibles:**',
    '  - Búsqueda en Internet en tiempo real: herramienta `obsidian_tool_search` (o CLI `node obsidian.js tool search "<query>"`)',
    '  - Scraping Web Limpio: herramienta `obsidian_tool_scrape` (o CLI `node obsidian.js tool scrape "<url>"`)',
    '  - Instalador Autónomo de Tools desde GitHub: herramienta `obsidian_tool_install` (o CLI `node obsidian.js tool install <repoUrl>`)',
    '  - Ejecutor de Tools: herramienta `obsidian_tool_run` (o CLI `node obsidian.js tool run <toolName> [args]`)',
    '- **Memoria y Continuidad:** Consulta antecedentes con `obsidian_triage`, `obsidian_peek` o `obsidian_session_last`.',
    '',
    '---',
    '*Obsidian for Antigravity System Directives — Fully Active.*'
  ].join('\n');

  try {
    fs.writeFileSync(geminiMdPath, geminiMdContent, 'utf8');
    fs.writeFileSync(path.join(home, '.gemini', 'GEMINI.md'), geminiMdContent, 'utf8');
  } catch (e) {}

  // Only maintain rules/obsidian-brain.md
  const ruleFiles = [rulePath];

  for (const filePath of ruleFiles) {
    if (!fs.existsSync(filePath)) continue;
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.startsWith('---') && !content.includes('trigger: always_on')) {
        content = content.replace(/^---\n/, '---\ntrigger: always_on\n');
      }
      const isEn = /###\s*0\.\s*AGENT IDENTITY/i.test(content) || /###\s*0b\.\s*AGENT SOUL/i.test(content);

      const newPersonalitySection = isEn
        ? (configured
            ? [
                '### 0. AGENT IDENTITY & PERSONALITY (Hermes Core - Active):',
                '- **Agent Name:** ' + aiName + '. Always identify as ' + aiName + '.',
                '- **Addressing the User:** Always address the user as **' + userCallsign + '**.',
                '- **Active Demeanor & Traits:** ' + personality,
                '- **Persistence:** Your personality and names are CONFIGURED and LOCKED. Strictly embody this persona. NEVER ask the user how to behave or introduce yourself as unconfigured again in any future chats unless the user explicitly requests changes or runs `/obsidian personality`.',
                '- **FAST IDENTITY & CONFIGURATION (DIRECT EXECUTION / ZERO SEARCHING):**',
                '  Whenever the user asks to change your name, how to address them, or modify personality/settings, NEVER search through code files. Execute DIRECTLY with `run_command`:',
                '  - Change AI Name: `node "' + scriptPath + '" name "<NewName>"`',
                '  - Change User Name / Callsign: `node "' + scriptPath + '" user "<NewCallsign>"`',
                '  - Full Configuration: `node "' + scriptPath + '" config --personality "<traits>" [--ai-name "<name>"] [--user "<callsign>"]`',
                '  - View Current Config: `node "' + scriptPath + '" config get`'
              ].join('\n')
            : [
                '### 0. AGENT IDENTITY & PERSONALITY (Pending Initial Calibration):',
                '- **Agent Name (Default):** ' + aiName,
                '- **Addressing the User (Default):** ' + userCallsign,
                '- **FIRST-CHAT ONBOARDING PROTOCOL (MANDATORY):**',
                '  Because your personality and agent identity have not been calibrated yet, on your VERY FIRST interaction with the user in this chat, greet them directly and ask:',
                '  "Hello, I am ' + aiName + ' with Obsidian Second Brain. Before we begin, let us calibrate my agent persona:',
                '  1. What name would you like to assign me? (Default: ' + aiName + ')',
                '  2. How would you like me to address you? (e.g., ' + userCallsign + ', Sir, Commander, Chief, etc.)',
                '  3. What personality traits or behavioral style should I embody?"',
                '  When the user responds to these questions OR continues with their task without specifying changes, IMMEDIATELY execute with `run_command`:',
                '  `node "' + scriptPath + '" personality --ai-name "<name or ' + aiName + '>" --user-callsign "<callsign or ' + userCallsign + '>" --personality "<traits or default traits>"`',
                '  Once executed, personality is locked (`personalityConfigured = true`) and you will NEVER ask again in any future chat.'
              ].join('\n'))
        : (configured
            ? [
                '### 0. IDENTIDAD Y PERSONALIDAD DEL AGENTE (Hermes Core - Activo):',
                '- **Nombre del Agente:** ' + aiName + '. Identificate siempre como ' + aiName + '.',
                '- **Trato hacia el Usuario:** Dirigete siempre al usuario como **' + userCallsign + '**.',
                '- **Comportamiento y Rasgos Activos:** ' + personality,
                '- **Permanencia:** Tu identidad y trato estan CONFIGURADOS y FIJADOS. Encarna estrictamente esta personalidad. NUNCA vuelvas a preguntar al usuario como comportarte ni te presentes como no configurado en ningun chat futuro, a menos que el usuario lo solicite expresamente o use `/obsidian personality`.',
                '- **CAMBIO RAPIDO DE IDENTIDAD Y CONFIGURACION (CERO BUSQUEDAS / EJECUCION DIRECTA):**',
                '  Siempre que el usuario pida cambiar tu nombre, como dirigirte a el o ajustes de personalidad, NUNCA busques en el codigo. Ejecuta DIRECTAMENTE con `run_command`:',
                '  - Cambiar nombre de IA: `node "' + scriptPath + '" name "<nuevoNombre>"`',
                '  - Cambiar trato de usuario: `node "' + scriptPath + '" user "<nuevoTrato>"`',
                '  - Configuracion completa: `node "' + scriptPath + '" config --personality "<rasgos>" [--ai-name "<nombre>"] [--user "<trato>"]`',
                '  - Ver configuracion actual: `node "' + scriptPath + '" config get`'
              ].join('\n')
            : [
                '### 0. IDENTIDAD Y PERSONALIDAD DEL AGENTE (Pendiente de Calibracion Inicial):',
                '- **Nombre del Agente (Por defecto):** ' + aiName,
                '- **Trato hacia el Usuario (Por defecto):** ' + userCallsign,
                '- **PROTOCOLO DE ONBOARDING DEL PRIMER CHAT (OBLIGATORIO):**',
                '  Dado que tu personalidad y trato de agente aun no han sido calibrados, en tu PRIMERISIMA respuesta con el usuario en este chat, saludalo e invitalo directamente a calibrar tu identidad:',
                '  "Buenas, soy ' + aiName + ' con Obsidian. Como es la primera vez que interactuamos o aun no hemos calibrado mi personalidad, dime:',
                '  1. ¿Que nombre quieres asignarme? (por defecto: ' + aiName + ')',
                '  2. ¿Como quieres que me dirija a ti? (ej: ' + userCallsign + ', Jefe, Comandante, Socio, etc.)',
                '  3. ¿Que personalidad o estilo de comportamiento quieres que adopte?"',
                '  Si el usuario responde a tus preguntas O si responde continuando con una tarea tecnica sin responderlas, ejecuta INMEDIATAMENTE con `run_command`:',
                '  `node "' + scriptPath + '" personality --ai-name "<nombre o ' + aiName + '>" --user-callsign "<trato o ' + userCallsign + '>" --personality "<rasgos indicados o rasgos por defecto>"`',
                '  Una vez ejecutado, la personalidad queda guardada y fijada permanentemente (`personalityConfigured = true`) y NUNCA MAS volveras a preguntarselo en ningun chat futuro.'
              ].join('\n'));

      // Replace Section 0
      const sectionRegex = /###\s*0\.\s*(?:IDENTIDAD Y PERSONALIDAD DEL AGENTE|AGENT IDENTITY & PERSONALITY)[^]*?(?=###\s*0b\.|###\s*1\.|##\s*|$)/i;
      if (sectionRegex.test(content)) {
        content = content.replace(sectionRegex, newPersonalitySection + '\n\n');
      }

      // Replace header summary line
      const headerSummaryRegex = /-\s*(?:Nombre del Agente|Agent Name):\s*\*\*.*?\*\*\s*\|\s*(?:Trato hacia ti|User Callsign):\s*\*\*.*?\*\*\s*\|\s*(?:Estado|Status):\s*\*\*.*?\*\*\.?/i;
      const statusText = isEn
        ? (configured ? 'CONFIGURED' : 'PENDING_ONBOARDING')
        : (configured ? 'CONFIGURADO' : 'PENDIENTE_CALIBRACION');
      const newHeaderSummary = isEn
        ? `- Agent Name: **${aiName}** | User Callsign: **${userCallsign}** | Status: **${statusText}**.`
        : `- Nombre del Agente: **${aiName}** | Trato hacia ti: **${userCallsign}** | Estado: **${statusText}**.`;

      if (headerSummaryRegex.test(content)) {
        content = content.replace(headerSummaryRegex, newHeaderSummary);
      }

      fs.writeFileSync(filePath, content, 'utf8');
    } catch (e) {}
  }
}

function getVaultPath() {
  const configFile = path.join(os.homedir(), '.gemini', 'config', 'antigravity-obsidian.json');
  if (fs.existsSync(configFile)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      if (cfg.vaultPath && fs.existsSync(cfg.vaultPath)) {
        return { path: cfg.vaultPath, name: cfg.vaultName || path.basename(cfg.vaultPath) };
      }
    } catch (e) {}
  }
  if (process.env.OBSIDIAN_VAULT_PATH && fs.existsSync(process.env.OBSIDIAN_VAULT_PATH)) {
    return { path: process.env.OBSIDIAN_VAULT_PATH, name: path.basename(process.env.OBSIDIAN_VAULT_PATH) };
  }

  // Cross-platform config candidates
  const home = os.homedir();
  const platform = process.platform;
  const configCandidates = [];

  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    configCandidates.push(path.join(appData, 'obsidian', 'obsidian.json'));
  } else if (platform === 'darwin') {
    configCandidates.push(path.join(home, 'Library', 'Application Support', 'obsidian', 'obsidian.json'));
  } else {
    // Linux / Ubuntu: Native XDG, Flatpak, Snap
    const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
    configCandidates.push(
      path.join(xdgConfig, 'obsidian', 'obsidian.json'),
      path.join(home, '.var', 'app', 'md.obsidian.Obsidian', 'config', 'obsidian', 'obsidian.json'),
      path.join(home, 'snap', 'obsidian', 'current', '.config', 'obsidian', 'obsidian.json')
    );
  }

  for (const obsJson of configCandidates) {
    if (fs.existsSync(obsJson)) {
      try {
        const data = JSON.parse(fs.readFileSync(obsJson, 'utf8'));
        for (const [id, v] of Object.entries(data.vaults || {})) {
          if (v && v.path && fs.existsSync(v.path)) {
            return { path: v.path, name: path.basename(v.path) };
          }
        }
      } catch (e) {}
    }
  }

  // Fallback directories across macOS & Linux
  const fallbackDirs = [
    path.join(home, 'Documents', 'Obsidian Vault'),
    path.join(home, 'Documentos', 'Obsidian Vault'),
    path.join(home, 'Obsidian Vault'),
  ];
  if (platform === 'darwin') {
    fallbackDirs.push(path.join(home, 'Library', 'Mobile Documents', 'iCloud~md~obsidian', 'Documents'));
  }
  for (const docVault of fallbackDirs) {
    if (fs.existsSync(docVault)) {
      return { path: docVault, name: path.basename(docVault) };
    }
  }

  // Auto-provision default vault in Documents if none exists
  const defaultVault = path.join(getDocumentsDir(), 'Obsidian Vault');
  try {
    if (!fs.existsSync(defaultVault)) {
      fs.mkdirSync(defaultVault, { recursive: true });
    }
    const obsDir = path.join(defaultVault, '.obsidian');
    if (!fs.existsSync(obsDir)) fs.mkdirSync(obsDir, { recursive: true });
    return { path: defaultVault, name: 'Obsidian Vault' };
  } catch (e) {
    const homeVault = path.join(home, 'Obsidian Vault');
    try {
      if (!fs.existsSync(homeVault)) fs.mkdirSync(homeVault, { recursive: true });
      const obsDir = path.join(homeVault, '.obsidian');
      if (!fs.existsSync(obsDir)) fs.mkdirSync(obsDir, { recursive: true });
      return { path: homeVault, name: 'Obsidian Vault' };
    } catch (e2) {
      return null;
    }
  }
}

function ensureDirs(vaultPath) {
  const syncEngine = getSyncEngine();
  if (syncEngine && typeof syncEngine.ensureVaultStructure === 'function') {
    try {
      syncEngine.ensureVaultStructure(vaultPath);
      syncEngine.migrateToHermes(vaultPath);
      return;
    } catch (e) {}
  }
  const dirs = [
    path.join(vaultPath, '00_Agente'),
    path.join(vaultPath, '01_Skills'),
    path.join(vaultPath, '02_Proyectos'),
    path.join(vaultPath, '03_Sesiones'),
    path.join(vaultPath, '03_Sesiones', 'Trajectories'),
    vaultPath,
    path.join(vaultPath, 'Antigravity', 'Alma'),
    path.join(vaultPath, '00_Agente', 'Memorias'),
    path.join(vaultPath, '01_Skills'),
    path.join(vaultPath, '02_Proyectos'),
    path.join(vaultPath, '03_Sesiones'),
  ];
  for (const d of dirs) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

const vault = getVaultPath();
if (!vault) {
  console.error(JSON.stringify({
    error: 'No se detectó ninguna bóveda de Obsidian activa en tu sistema.',
    hint: 'Instala Obsidian desde https://obsidian.md o especifica la ruta de tu bóveda en ~/.gemini/config/antigravity-obsidian.json ("vaultPath")',
    downloadUrl: 'https://obsidian.md/download',
  }, null, 2));
  process.exit(1);
}
ensureDirs(vault.path);

function sanitize(n) {
  return (n || '').replace(/[\/:*?"<>|\\]/g, '-').trim();
}

function cleanText(t) {
  return (t || '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAntigravityPaths() {
  const home = os.homedir();
  return {
    globalSkillsDir: path.join(home, '.gemini', 'config', 'skills'),
    knowledgeDir: path.join(home, '.gemini', 'antigravity-ide', 'knowledge'),
    configDir: path.join(home, '.gemini', 'config'),
  };
}

// -------------------------------------------------------------
// Manifest Cache & Compact Index
// -------------------------------------------------------------
const MANIFEST_FILE = path.join(vault.path, 'context-manifest.json');

function buildManifest(vaultPath) {
  ensureDirs(vaultPath);
  const memDir = path.join(vaultPath, '00_Agente', 'Memorias');
  const skiDir = path.join(vaultPath, '01_Skills');
  const proDir = path.join(vaultPath, '02_Proyectos');

  const memories = [];
  if (fs.existsSync(memDir)) {
    for (const f of fs.readdirSync(memDir)) {
      if (!f.endsWith('.md') || f.startsWith('00')) continue;
      const fp = path.join(memDir, f);
      try {
        const txt = fs.readFileSync(fp, 'utf8');
        const titleMatch = txt.match(/^title:\s*"([^"\r\n]+)"/m) || txt.match(/^#+\s*(.+)$/m);
        const title = titleMatch ? cleanText(titleMatch[1]) : f.replace(/\.md$/, '');

        const catMatch = txt.match(/^category:\s*"?([^"\r\n]+)"?/m);
        const category = catMatch ? catMatch[1].trim() : 'general';

        const sumMatch = txt.match(/>\s*\[!(?:NOTE|ABSTRACT|INFO)\][^\r\n]*\r?\n>\s*([^\r\n]+)/i);
        let summary = sumMatch ? cleanText(sumMatch[1]) : '';
        if (!summary) {
          summary = cleanText(txt.replace(/---[\s\S]*?---/, '').replace(/#+[^\r\n]+/g, '').replace(/\r?\n/g, ' ').slice(0, 120));
        }

        const tagsMatch = txt.match(/^tags:\s*\r?\n((?:\s*-\s*[^\r\n]+\r?\n)+)/m);
        const tags = [];
        if (tagsMatch) {
          const lines = tagsMatch[1].split('\n');
          for (const l of lines) {
            const tm = l.match(/-\s*([^\r\n]+)/);
            if (tm) tags.push(cleanText(tm[1]).toLowerCase());
          }
        }

        const stat = fs.statSync(fp);
        const bodyClean = cleanText(txt
          .replace(/^---[\s\S]*?---\r?\n/, '')
          .replace(/---[\s\S]*?\*Conexiones.*\*[\s\S]*$/, '')
          .replace(/```[a-zA-Z]*\n?/g, ' ')
          .replace(/[#*`_>~|]/g, ' '));

        memories.push({
          title,
          category,
          summary: summary.slice(0, 180),
          tags,
          bodyExcerpt: bodyClean.slice(0, 2000),
          relPath: `00_Agente/Memorias/${f}`,
          updated: stat.mtime.toISOString().split('T')[0],
        });
      } catch (e) {}
    }
  }

  const skills = [];
  if (fs.existsSync(skiDir)) {
    for (const f of fs.readdirSync(skiDir)) {
      if (!f.endsWith('.md') || f.startsWith('00')) continue;
      const fp = path.join(skiDir, f);
      try {
        const txt = fs.readFileSync(fp, 'utf8');
        const nameMatch = txt.match(/^title:\s*"Skill:\s*([^"\r\n]+)"/m) || txt.match(/^#+\s*Skill:\s*\[\[([^\]]+)\]\]/m);
        const name = nameMatch ? cleanText(nameMatch[1]) : f.replace(/\.md$/, '').replace(/^\[Proyecto\]\s*/, '');

        const scopeMatch = txt.match(/^scope:\s*(\w+)/m);
        const scope = scopeMatch ? scopeMatch[1].trim() : 'global';

        const descMatch = txt.match(/>\s*-\s*\*\*Descripción\*\*:\s*([^\r\n]+)/i);
        const description = descMatch ? cleanText(descMatch[1]) : '';

        skills.push({
          name,
          scope,
          description: description.slice(0, 130),
          relPath: `01_Skills/${f}`,
        });
      } catch (e) {}
    }
  }

  const projects = [];
  if (fs.existsSync(proDir)) {
    for (const ent of fs.readdirSync(proDir, { withFileTypes: true })) {
      if (ent.name.startsWith('.') || ent.name.startsWith('00')) continue;
      if (ent.isDirectory()) {
        projects.push(ent.name);
      } else if (ent.isFile() && ent.name.endsWith('.md')) {
        projects.push(ent.name.replace(/\.md$/, ''));
      }
    }
  }

  const sesDir = path.join(vaultPath, '03_Sesiones');
  const sessions = [];
  if (fs.existsSync(sesDir)) {
    for (const f of fs.readdirSync(sesDir)) {
      if (!f.endsWith('.md') || f.startsWith('00')) continue;
      sessions.push(f.replace(/\.md$/, ''));
    }
  }

  const manifest = {
    updatedAt: new Date().toISOString(),
    vaultName: vault.name,
    stats: { memories: memories.length, skills: skills.length, projects: projects.length, sessions: sessions.length },
    skills,
    memories,
    projects,
    sessions,
  };

  try {
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf8');
  } catch (e) {}

  return manifest;
}

function getManifest(vaultPath, forceRebuild = false) {
  if (!forceRebuild && fs.existsSync(MANIFEST_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
      const diffMs = Date.now() - new Date(data.updatedAt || 0).getTime();
      if (diffMs < 7200000) return data;
    } catch (e) {}
  }
  return buildManifest(vaultPath);
}

// -------------------------------------------------------------
// Ultra-Low Context Triage Command (<80 tokens)
// -------------------------------------------------------------
const STOPWORDS = new Set([
  'de', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'en', 'a',
  'con', 'por', 'para', 'del', 'al', 'que', 'es', 'son', 'fue', 'era', 'como', 'se',
  'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'the', 'and', 'in', 'on', 'for', 'with', 'to', 'at'
]);

function extractKeywords(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_\-\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));
}

function runTriage(vaultPath, query) {
  const syncEngine = getSyncEngine();
  if (syncEngine && typeof syncEngine.triageContext === 'function') {
    return syncEngine.triageContext(vaultPath, query);
  }

  if (!query || query.trim() === '') {
    return { hasAntecedents: false, recommendation: 'Consulta vacía. Procede normalmente.' };
  }

  const manifest = getManifest(vaultPath);
  const keywords = extractKeywords(query);

  if (keywords.length === 0) {
    return { hasAntecedents: false, recommendation: 'Sin palabras clave relevantes. Procede normalmente.' };
  }

  const scriptExec = (process.argv[1] || 'obsidian.js').replace(/\\/g, '/');

  // 1. Check Skills (CÓMO HACER - Procedimientos y Herramientas)
  let skillMatch = null;
  let bestSkillScore = 0;

  for (const s of manifest.skills) {
    const sNameNorm = s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sDescNorm = (s.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let score = 0;

    for (const kw of keywords) {
      if (sNameNorm.includes(kw)) score += 6;
      else if (sDescNorm.includes(kw)) score += 2;
    }

    if (score > bestSkillScore && score >= 4) {
      bestSkillScore = score;
      skillMatch = {
        name: s.name,
        desc: s.description || 'Procedimiento especializado',
        advice: `Usa la Skill [[${s.name}]]. Lee su SKILL.md en el prompt para instrucciones operativas.`,
      };
    }
  }

  // 2. Check Memories (QUÉ SE HIZO - Antecedentes Históricos y Soluciones)
  const scoredMemories = [];

  for (const m of manifest.memories) {
    const tNorm = m.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sNorm = (m.summary || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tagsNorm = (m.tags || []).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let score = 0;

    for (const kw of keywords) {
      if (tNorm.includes(kw)) score += 5;
      if (tagsNorm.includes(kw)) score += 4;
      if (sNorm.includes(kw)) score += 2;
    }

    if (score >= 4) {
      scoredMemories.push({
        title: m.title,
        category: m.category,
        summary: m.summary,
        score,
        peekCmd: `node "${scriptExec}" peek "${m.title}"`,
      });
    }
  }

  scoredMemories.sort((a, b) => b.score - a.score);
  const topMemories = scoredMemories.slice(0, 2).map(({ title, category, summary, peekCmd }) => ({
    title,
    category,
    summary,
    peekCmd,
  }));

  const hasAntecedents = topMemories.length > 0 || !!skillMatch;

  let recommendation = '';
  if (topMemories.length > 0) {
    recommendation = 'Antecedente encontrado: Aplica directamente el resumen indicado. Usa "peek" solo si requieres codigo exacto.';
  } else if (skillMatch) {
    recommendation = `Procedimiento cubierto por la Skill [[${skillMatch.name}]].`;
  } else {
    recommendation = 'Sin antecedentes en el Vault. Resuelve directamente sin gastar mas tokens.';
  }

  return {
    query,
    hasAntecedents,
    skillMatch,
    memories: topMemories,
    recommendation,
  };
}

// -------------------------------------------------------------
// Ultra-Low Context Peek Command (Strict solution, zero fluff)
// -------------------------------------------------------------
function runPeek(vaultPath, noteName) {
  if (!noteName) return { error: 'Especifica la nota a inspeccionar.' };

  const cleanName = sanitize(noteName.endsWith('.md') ? noteName.slice(0, -3) : noteName);
  let target = path.join(vaultPath, 'Antigravity', 'Memoria', cleanName + '.md');

  if (!fs.existsSync(target)) {
    function find(dir) {
      if (!fs.existsSync(dir)) return null;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, e.name);
        if (e.isDirectory()) {
          const r = find(fp);
          if (r) return r;
        } else if (e.name.toLowerCase() === (cleanName.toLowerCase() + '.md') || e.name.toLowerCase().includes(cleanName.toLowerCase())) {
          return fp;
        }
      }
      return null;
    }
    target = find(vaultPath);
  }

  if (!target || !fs.existsSync(target)) {
    return { error: `Nota no encontrada: ${noteName}` };
  }

  const raw = fs.readFileSync(target, 'utf8');
  const catMatch = raw.match(/^category:\s*"?([^"\r\n]+)"?/m);
  const category = catMatch ? catMatch[1].trim() : 'general';

  const sumMatch = raw.match(/>\s*\[!(?:NOTE|ABSTRACT|INFO)\][^\r\n]*\r?\n>\s*([^\r\n]+)/i);
  const summary = sumMatch ? cleanText(sumMatch[1]) : '';

  let body = raw.replace(/^---[\s\S]*?---\r?\n/, '');
  body = body.replace(/---[\s\S]*?\*Conexiones.*\*[\s\S]*$/, '');
  body = body.replace(/---[\s\S]*?\*Graph.*\*[\s\S]*$/, '');
  body = body.replace(/^#+\s*[^\r\n]+/gm, '').trim();

  const detailsMatch = raw.match(/##\s*(?:Technical Solution|Solución Técnica|Detalles y Solución|Solución)\r?\n([\s\S]*?)(?:---|###|$)/i);
  let solutionText = detailsMatch ? detailsMatch[1].trim() : body;

  if (solutionText.length > 1000) {
    solutionText = solutionText.slice(0, 1000) + '\n\n*(Extracto tecnico recortado para optimizar tokens).*';
  }

  return {
    title: path.basename(target, '.md'),
    category,
    summary,
    solution: cleanText(solutionText) || 'Sin detalles registrados.',
  };
}

// -------------------------------------------------------------
// Save Memory & Auto-Update All Indexes Atomically (Zero Emojis)
// -------------------------------------------------------------
function runSaveMemory(vaultPath, argsList) {
  let title = 'Memoria ' + new Date().toISOString().slice(0, 10);
  let content = '';
  let summary = '';
  let category = 'general';
  let tags = ['antigravity/memoria'];
  let project = null;

  for (let i = 0; i < argsList.length; i++) {
    const a = argsList[i];
    if (a === '--title' && argsList[i+1]) { title = cleanText(argsList[i+1]); i++; }
    else if ((a === '--content' || a === '--details' || a === '--body') && argsList[i+1]) { content = argsList[i+1]; i++; }
    else if ((a === '--b64' || a === '--content-b64' || a === '--base64') && argsList[i+1]) {
      try { content = Buffer.from(argsList[i+1], 'base64').toString('utf8'); } catch (e) {}
      i++;
    }
    else if (a === '--file' && argsList[i+1]) {
      try { if (fs.existsSync(argsList[i+1])) content = fs.readFileSync(argsList[i+1], 'utf8'); } catch (e) {}
      i++;
    }
    else if (a === '--stdin') {
      try { content = fs.readFileSync(0, 'utf8'); } catch (e) {}
    }
    else if (a === '--summary' && argsList[i+1]) { summary = cleanText(argsList[i+1]); i++; }
    else if (a === '--summary-b64' && argsList[i+1]) {
      try { summary = cleanText(Buffer.from(argsList[i+1], 'base64').toString('utf8')); } catch (e) {}
      i++;
    }
    else if (a === '--category' && argsList[i+1]) { category = cleanText(argsList[i+1]).toLowerCase(); i++; }
    else if (a === '--tags' && argsList[i+1]) {
      tags = argsList[i+1].split(',').map(t => cleanText(t).toLowerCase());
      if (!tags.includes('antigravity/memoria')) tags.push('antigravity/memoria');
      i++;
    }
    else if (a === '--project' && argsList[i+1]) { project = cleanText(argsList[i+1]); i++; }
  }

  // Support positional arguments if flags were not used
  const hasFlags = argsList.some(a => typeof a === 'string' && a.startsWith('--'));
  if (!hasFlags && argsList.length > 0) {
    if (argsList.length === 1) {
      const singleText = cleanText(argsList[0]);
      summary = singleText.slice(0, 140);
      title = singleText.slice(0, 60);
      content = argsList[0];
    } else {
      title = cleanText(argsList[0]);
      content = argsList.slice(1).join(' ');
      summary = cleanText(content).slice(0, 140);
    }
  }

  if (!summary && content) {
    summary = cleanText(content).slice(0, 140);
  }
  if (!content && summary) {
    content = summary;
  }

  ensureDirs(vaultPath);
  const memFolder = path.join(vaultPath, '00_Agente', 'Memorias');
  const cleanTitle = sanitize(title);
  const filePath = path.join(memFolder, cleanTitle + '.md');
  const now = new Date().toISOString().split('T')[0];

  let relatedLinks = '';
  if (project) {
    relatedLinks = `\n### Proyecto: [[${project}]]\n`;
  }

  let sectionTitle = 'Solucion Tecnica';
  if (['arquitectura', 'architecture', 'estructura'].includes(category)) {
    sectionTitle = 'Detalles de Arquitectura y Estructura';
  } else if (['hito', 'milestone', 'progreso', 'sesion', 'session'].includes(category)) {
    sectionTitle = 'Hito y Decisiones de Implementación';
  } else if (['antipatron', 'anti-patron', 'trampa'].includes(category)) {
    sectionTitle = 'Anti-Patrones y Trampas a Evitar';
  } else if (['configuracion', 'config'].includes(category)) {
    sectionTitle = 'Configuración y Entorno';
  }

  // Strict zero-emoji template
  const md = `---
title: "${title}"
type: antigravity-memory
category: "${category}"
tags:
${tags.map(t => `  - ${t}`).join('\n')}
created: ${now}
updated: ${now}
---

# ${title}

> [!NOTE]
> ${summary || title}

## ${sectionTitle}

${content || '*Sin contenido adicional registrado.*'}
${relatedLinks}
---
*Conexiones:* [[00 Antigravity Hub]] | [[00 Indice de Memoria]]
`;

  fs.writeFileSync(filePath, md, 'utf8');

  // 1. Update 00 Indice de Memoria.md (Zero emojis)
  try {
    const indexFile = path.join(memFolder, '00 Indice de Memoria.md');
    const allFiles = fs.readdirSync(memFolder).filter(f => f.endsWith('.md') && !f.startsWith('00'));
    let indexMd = `---
title: "Indice de Memoria de Antigravity"
type: antigravity-index
tags:
  - antigravity/indice
  - antigravity/memoria
updated: ${now}
---

# Indice de Memoria & Knowledge Items

Total memorias registradas: **${allFiles.length}**

| Memoria / Proyecto | Categoria | Resumen Conciso | Enlace |
|---|---|---|---|
`;
    for (const f of allFiles) {
      const fp = path.join(memFolder, f);
      const txt = fs.readFileSync(fp, 'utf8');
      const catM = txt.match(/^category:\s*"?([^"\r\n]+)"?/m);
      const cat = catM ? catM[1] : 'general';
      const sumM = txt.match(/>\s*\[!(?:NOTE|ABSTRACT|INFO)\][^\r\n]*\r?\n>\s*([^\r\n]+)/i);
      const sum = sumM ? cleanText(sumM[1]).slice(0, 100) : 'Sin resumen';
      const baseName = f.replace(/\.md$/, '');
      indexMd += `| **${baseName}** | \`${cat}\` | ${sum}... | [[${baseName}]] |\n`;
    }
    indexMd += `\n---\n*Volver al:* [[00 Antigravity Hub]]\n`;
    fs.writeFileSync(indexFile, indexMd, 'utf8');
  } catch (e) {}

  // 2. Update context-manifest.json
  try {
    buildManifest(vaultPath);
  } catch (e) {}

  // 3. Sync into Antigravity Knowledge Items (Bidirectional)
  try {
    const { knowledgeDir } = getAntigravityPaths();
    if (fs.existsSync(knowledgeDir)) {
      const kiId = cleanTitle.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const kiDir = path.join(knowledgeDir, kiId);
      const kiArtDir = path.join(kiDir, 'artifacts');
      if (!fs.existsSync(kiArtDir)) fs.mkdirSync(kiArtDir, { recursive: true });

      fs.writeFileSync(path.join(kiDir, 'metadata.json'), JSON.stringify({
        title,
        summary: summary || content.slice(0, 160),
        source: 'obsidian-vault',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        references: []
      }, null, 2), 'utf8');

      fs.writeFileSync(path.join(kiArtDir, `${cleanTitle}.md`), md, 'utf8');
    }
  } catch (e) {}

  return {
    status: 'ok',
    title,
    category,
    path: filePath,
    indexed: true,
    knowledgeItem: true,
  };
}

// -------------------------------------------------------------
// Catalog & Quick Overview (<100 tokens summary table)
// -------------------------------------------------------------
function runCatalog(vaultPath) {
  const manifest = getManifest(vaultPath);
  const result = {
    skills: manifest.skills.map(s => ({ name: s.name, desc: s.description })),
    memories: manifest.memories.slice(0, 8).map(m => ({ title: m.title, cat: m.category, summary: m.summary })),
  };
  return result;
}

// -------------------------------------------------------------
// Shared Personality & Identity Updater
// -------------------------------------------------------------
function applyPersonalityUpdate(options = {}) {
  const almaDir = path.join(vault.path, '00_Agente');
  if (!fs.existsSync(almaDir)) fs.mkdirSync(almaDir, { recursive: true });

  const cfgFile = path.join(os.homedir(), '.gemini', 'config', 'antigravity-obsidian.json');
  let existingCfg = {};
  if (fs.existsSync(cfgFile)) {
    try { existingCfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8')); } catch (e) {}
  }

  const pFileEs = path.join(almaDir, '00 Personalidad de la IA.md');
  const pFileEn = path.join(almaDir, '00 AI Personality.md');
  const userFile = path.join(almaDir, '00 Perfil de Usuario.md');
  const pFile = getPersonalityFile(almaDir, existingCfg.language);

  if (options.reset) {
    existingCfg.personalityConfigured = false;
    fs.writeFileSync(cfgFile, JSON.stringify(existingCfg, null, 2), 'utf8');

    if (fs.existsSync(pFile)) {
      let content = fs.readFileSync(pFile, 'utf8');
      content = content.replace(/^configured:\s*(?:true|false)/m, 'configured: false')
        .replace(/^status:\s*["']?[^"'\r\n]+["']?/m, 'status: "pending_onboarding"');
      fs.writeFileSync(pFile, content, 'utf8');
    }

    updateGlobalRulesWithPersonality({
      aiName: existingCfg.aiName || 'Hermes',
      userCallsign: existingCfg.userCallsign || existingCfg.userName || 'User',
      personality: existingCfg.personality || 'Ingeniero senior de élite, autónomo, pragmático y de precisión quirúrgica. CERO emojis.',
      configured: false,
      vaultPath: vault.path,
      vaultName: vault.name,
    });

    try {
      const installer = getSkillInstaller();
      if (installer && typeof installer.installSkillAndRules === 'function') {
        installer.installSkillAndRules(vault.path, { personalityConfigured: false });
      }
    } catch (e) {}

    return {
      status: 'ok',
      configured: false,
      message: 'Personalidad reiniciada. Se solicitará calibración en la primera interacción del chat.',
    };
  }

  if (options.language) {
    existingCfg.language = options.language.trim();
  }

  const finalAiName = (options.aiName !== undefined ? options.aiName : (existingCfg.aiName || 'Hermes')).trim();
  const finalCallsign = (options.userCallsign !== undefined ? options.userCallsign : (existingCfg.userCallsign || existingCfg.userName || process.env.USERNAME || 'User')).trim();
  const finalPersonality = (options.personality !== undefined ? options.personality : (existingCfg.personality || 'Ingeniero senior de élite, autónomo, pragmático y de precisión quirúrgica. Respuestas técnicas, directas, sin paja corporativa y estrictamente CERO emojis.')).trim();

  existingCfg.aiName = finalAiName;
  existingCfg.userCallsign = finalCallsign;
  existingCfg.personality = finalPersonality;
  existingCfg.personalityConfigured = true;
  existingCfg.lastUpdated = new Date().toISOString();
  fs.writeFileSync(cfgFile, JSON.stringify(existingCfg, null, 2), 'utf8');

  const isEn = existingCfg.language === 'en';
  const now = new Date().toISOString().split('T')[0];
  const targetNotePath = isEn ? pFileEn : pFileEs;
  const otherNotePath = isEn ? pFileEs : pFileEn;

  const noteContent = isEn
    ? `---
title: "AI Personality & Agent Identity"
type: antigravity-personality
tags:
  - antigravity/personality
  - antigravity/agent
ai_name: "${finalAiName}"
user_callsign: "${finalCallsign}"
configured: true
status: "configured"
language: en
updated: ${now}
---

# Agent Personality & Identity — ${finalAiName}

> [!NOTE] **Agent Identity & Communication Dynamics**
> - **Agent Name**: \`${finalAiName}\`
> - **User Callsign / Title**: \`${finalCallsign}\`
> - **Status**: \`Configured (Active)\`

## 1. Archetype & Personality Traits
${finalPersonality}

## 2. Communication Protocol
- The agent embodies the identity of **${finalAiName}** in all interactions.
- The agent always addresses the user as **${finalCallsign}**.
- Zero corporate fluff, no condescension, and strictly ZERO emojis.
- **Persistence**: Personality is configured and locked. The AI will NEVER ask again how to behave in any chat unless explicitly requested by the user or via \`/obsidian personality\`.

---
*Graph Connections:* [[00 Antigravity Hub]] | [[00 Soul de Antigravity]] | [[00 Perfil de Usuario]]
`
    : `---
title: "Personalidad de la IA y Trato de Agente"
type: antigravity-personality
tags:
  - antigravity/personalidad
  - antigravity/agente
ai_name: "${finalAiName}"
user_callsign: "${finalCallsign}"
configured: true
status: "configured"
language: es
updated: ${now}
---

# Personalidad e Identidad del Agente — ${finalAiName}

> [!NOTE] **Identidad y Dinámica de Trato**
> - **Nombre del Agente**: \`${finalAiName}\`
> - **Trato hacia el usuario**: \`${finalCallsign}\`
> - **Estado de Calibración**: \`Configurado (Activo)\`

## 1. Arquetipo y Rasgos de Personalidad
${finalPersonality}

## 2. Protocolo de Comunicación
- El agente responderá asumiendo plenamente el nombre e identidad de **${finalAiName}**.
- El agente se dirigirá siempre al usuario como **${finalCallsign}**.
- Comunicación técnica de alta densidad, cero rodeos corporativos y estrictamente CERO emojis.
- **Permanencia**: La personalidad está fijada de forma permanente. La IA NUNCA volverá a preguntar cómo comportarse en ningún chat, a menos que el usuario lo solicite expresamente o use \`/obsidian personality\`.

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Soul de Antigravity]] | [[00 Perfil de Usuario]]
`;

  fs.writeFileSync(targetNotePath, noteContent, 'utf8');
  if (fs.existsSync(otherNotePath)) {
    try { fs.unlinkSync(otherNotePath); } catch (e) {}
  }

  // Also update 00 Perfil de Usuario.md if userCallsign was updated
  if (fs.existsSync(userFile) && options.userCallsign !== undefined) {
    try {
      let uContent = fs.readFileSync(userFile, 'utf8');
      uContent = uContent.replace(/^user:\s*["']?[^"'\r\n]+["']?/m, `user: "${finalCallsign}"`);
      uContent = uContent.replace(/^#+\s*Perfil de Trabajo\s*[—–-]\s*[^\r\n]+/m, `# Perfil de Trabajo — ${finalCallsign}`);
      uContent = uContent.replace(/^#+\s*Work Profile\s*[—–-]\s*[^\r\n]+/m, `# Work Profile — ${finalCallsign}`);
      fs.writeFileSync(userFile, uContent, 'utf8');
    } catch (e) {}
  }

  // Update global rules (obsidian-brain.md, GEMINI.md, AGENTS.md) immediately and directly
  updateGlobalRulesWithPersonality({
    aiName: finalAiName,
    userCallsign: finalCallsign,
    personality: finalPersonality,
    configured: true,
    vaultPath: vault.path,
    vaultName: vault.name,
  });

  // Also refresh rules and Hub via skill-installer if available
  try {
    const installer = getSkillInstaller();
    if (installer && typeof installer.installSkillAndRules === 'function') {
      installer.installSkillAndRules(vault.path, {
        aiName: finalAiName,
        userCallsign: finalCallsign,
        personality: finalPersonality,
        personalityConfigured: true,
      });
    }
  } catch (e) {}

  return {
    status: 'ok',
    configured: true,
    aiName: finalAiName,
    userCallsign: finalCallsign,
    personality: finalPersonality,
    language: existingCfg.language || 'auto',
    notePath: targetNotePath,
    message: 'Configuración y personalidad del agente actualizadas con éxito.',
  };
}

// -------------------------------------------------------------
// CLI Dispatcher
// -------------------------------------------------------------
const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case 'triage': {
    const query = args.join(' ');
    const result = runTriage(vault.path, query);
    console.log(JSON.stringify(result, null, 2));
    break;
  }

  case 'peek': {
    const noteName = args.join(' ');
    const result = runPeek(vault.path, noteName);
    if (result.error) {
      console.error(JSON.stringify(result));
      process.exit(1);
    }
    console.log(`[${result.category.toUpperCase()}] ${result.title}\nResumen: ${result.summary}\nSolucion:\n${result.solution}`);
    break;
  }

  case 'save':
  case 'save-memory': {
    const res = runSaveMemory(vault.path, args);
    console.log(JSON.stringify(res, null, 2));
    break;
  }

  case 'catalog': {
    const catalog = runCatalog(vault.path);
    console.log(JSON.stringify(catalog, null, 2));
    break;
  }

  case 'quotas': {
    const syncEngine = getSyncEngine();
    if (syncEngine && typeof syncEngine.getHermesQuotas === 'function') {
      console.log(JSON.stringify(syncEngine.getHermesQuotas(vault.path), null, 2));
    }
    break;
  }

  case 'bootstrap':
  case 'hermes-bootstrap': {
    const syncEngine = getSyncEngine();
    if (syncEngine && typeof syncEngine.compileHermesBootstrap === 'function') {
      console.log(syncEngine.compileHermesBootstrap(vault.path));
    }
    break;
  }

  case 'nudge': {
    console.log(`[INTERNAL NUDGE]: Revisa los turnos recientes de esta conversación.
1. ¿El usuario corrigió alguna preferencia tuya? -> Llama a memory_update(target="USER.md").
2. ¿Descubriste una lección técnica o regla del entorno? -> Llama a memory_update(target="MEMORY.md").
3. ¿Diseñaste o mejoraste un flujo repetible? -> Llama a skill_save(skill_name, content).
4. Si no hay nada duradero que guardar, responde directamente al usuario sin llamar herramientas de persistencia.`);
    break;
  }

  case 'memory':
  case 'memory-update': {
    const syncEngine = getSyncEngine();
    const { flags, positional } = parseFlags(args);
    const sub = (positional[0] || '').toLowerCase();

    if (sub === 'quotas' || sub === 'quota' || flags.quotas) {
      if (syncEngine && typeof syncEngine.getHermesQuotas === 'function') {
        console.log(JSON.stringify(syncEngine.getHermesQuotas(vault.path), null, 2));
      }
      break;
    }

    let target = flags.target;
    let operation = flags.operation || flags.op;
    let content = flags.content || flags.c;

    if (!target) {
      if (['user', 'user.md'].includes(sub)) {
        target = 'USER.md';
        const nextPos = positional[1] ? positional[1].toLowerCase() : '';
        if (['append', 'replace', 'prune'].includes(nextPos)) {
          operation = operation || nextPos;
          if (!content) content = positional.slice(2).join(' ');
        } else {
          operation = operation || 'append';
          if (!content) content = positional.slice(1).join(' ');
        }
      } else if (['memory', 'memory.md'].includes(sub)) {
        target = 'MEMORY.md';
        const nextPos = positional[1] ? positional[1].toLowerCase() : '';
        if (['append', 'replace', 'prune'].includes(nextPos)) {
          operation = operation || nextPos;
          if (!content) content = positional.slice(2).join(' ');
        } else {
          operation = operation || 'append';
          if (!content) content = positional.slice(1).join(' ');
        }
      } else if (['append', 'replace', 'prune'].includes(sub)) {
        operation = operation || sub;
        target = flags.target || 'MEMORY.md';
        if (!content) content = positional.slice(1).join(' ');
      } else {
        target = 'MEMORY.md';
        operation = operation || 'append';
        if (!content) content = positional.join(' ');
      }
    }

    operation = operation || 'append';
    if (!content) {
      console.error(JSON.stringify({ error: 'Uso: node obsidian.js memory-update --target USER.md|MEMORY.md --operation append|replace|prune --content "..."' }));
      process.exit(1);
    }

    if (syncEngine && typeof syncEngine.updateBoundedMemory === 'function') {
      const res = syncEngine.updateBoundedMemory(vault.path, { target, operation, content });
      if (res.error) {
        console.error(JSON.stringify(res, null, 2));
        process.exit(1);
      }
      console.log(JSON.stringify(res, null, 2));
    } else {
      console.error(JSON.stringify({ error: 'sync-engine no disponible para updateBoundedMemory' }));
      process.exit(1);
    }
    break;
  }

  case 'skill-get': {
    const syncEngine = getSyncEngine();
    const skillName = args[0];
    if (!skillName) {
      console.error(JSON.stringify({ error: 'Uso: node obsidian.js skill-get <nombre-skill>' }));
      process.exit(1);
    }
    if (syncEngine && typeof syncEngine.getSkill === 'function') {
      const res = syncEngine.getSkill(vault.path, skillName);
      if (res.error) {
        console.error(JSON.stringify(res, null, 2));
        process.exit(1);
      }
      console.log(JSON.stringify(res, null, 2));
    }
    break;
  }

  case 'skill-save': {
    const syncEngine = getSyncEngine();
    const { flags, positional } = parseFlags(args);
    const skillName = positional[0] || flags.name;
    const content = flags.content || flags.instructions || flags.c || positional.slice(1).join(' ');
    const versionBump = !!(flags['version-bump'] || flags.bump);
    const triggers = flags.triggers ? flags.triggers.split(',').map(t => t.trim()) : undefined;
    const description = flags.desc || flags.description;

    if (!skillName || !content) {
      console.error(JSON.stringify({ error: 'Uso: node obsidian.js skill-save <nombre> --content "..." [--version-bump] [--triggers "..."]' }));
      process.exit(1);
    }

    if (syncEngine && typeof syncEngine.saveHermesSkill === 'function') {
      const res = syncEngine.saveHermesSkill(vault.path, {
        name: skillName,
        content,
        versionBump,
        triggers,
        description,
      });
      console.log(JSON.stringify(res, null, 2));
    }
    break;
  }

  case 'session-recall': {
    const syncEngine = getSyncEngine();
    const { flags, positional } = parseFlags(args);
    const query = flags.query || flags.q || positional.join(' ');
    const maxResults = parseInt(flags.limit || flags.max || '5', 10);
    if (!query) {
      console.error(JSON.stringify({ error: 'Uso: node obsidian.js session-recall "<terminos>" [--limit 5]' }));
      process.exit(1);
    }
    if (syncEngine && typeof syncEngine.sessionRecall === 'function') {
      const res = syncEngine.sessionRecall(vault.path, query, maxResults);
      console.log(JSON.stringify(res, null, 2));
    }
    break;
  }

  case 'skill':
  case 'skills':
  case 'list-skills': {
    const syncEngine = getSyncEngine();
    const { flags, positional } = parseFlags(args);
    let sub = (positional[0] || '').toLowerCase();

    // If called as `node obsidian.js skills` with query or no subcommand
    if (cmd === 'skills' || cmd === 'list-skills') {
      if (!sub || sub.startsWith('--')) {
        sub = 'list';
      } else if (['list', 'ls', 'search'].includes(sub)) {
        sub = 'list';
      } else if (!['create', 'new', 'add', 'edit', 'update', 'modify', 'view', 'show', 'peek', 'get', 'read', 'delete', 'remove', 'rm', 'script'].includes(sub)) {
        flags.query = positional[0];
        sub = 'list';
      }
    }

    if (!sub || sub === 'list' || sub === 'ls') {
      const scope = flags.scope || (positional[1] && ['global', 'project', 'all'].includes(positional[1].toLowerCase()) ? positional[1].toLowerCase() : 'all');
      const query = flags.query || flags.q || (positional[1] && !['global', 'project', 'all'].includes(positional[1].toLowerCase()) ? positional[1] : '');
      if (syncEngine && typeof syncEngine.listAllSkills === 'function') {
        const list = syncEngine.listAllSkills(vault.path, process.cwd(), { scope, query });
        if (flags.table) {
          console.log(`| Skill | Ámbito | Descripción | Ruta |`);
          console.log(`|---|---|---|---|`);
          for (const s of list) {
            console.log(`| **${s.name}** | \`${s.scope}\` | ${(s.description || 'Sin descripción').replace(/\r?\n/g, ' ').slice(0, 80)} | \`${s.path}\` |`);
          }
        } else {
          console.log(JSON.stringify(list, null, 2));
        }
      } else {
        const manifest = getManifest(vault.path);
        let compactSkills = manifest.skills.map(s => ({ name: s.name, scope: s.scope || 'global', desc: s.description }));
        if (query) {
          compactSkills = compactSkills.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || (s.desc || '').toLowerCase().includes(query.toLowerCase()));
        }
        console.log(JSON.stringify(compactSkills, null, 2));
      }
      break;
    }

    if (sub === 'view' || sub === 'show' || sub === 'get' || sub === 'read' || sub === 'peek') {
      const skillName = positional[1];
      if (!skillName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js skill view <nombre> [--full|--scripts|--files|--json]' }));
        process.exit(1);
      }
      if (sub === 'get' && syncEngine && typeof syncEngine.getSkill === 'function') {
        const hSkill = syncEngine.getSkill(vault.path, skillName);
        if (!hSkill.error) {
          console.log(JSON.stringify(hSkill, null, 2));
          break;
        }
      }
      const isPeek = sub === 'peek' || flags.peek || (!flags.full && !flags.raw);
      if (syncEngine && typeof syncEngine.getSkillDetails === 'function') {
        const details = syncEngine.getSkillDetails(vault.path, process.cwd(), skillName, {
          peek: isPeek,
          full: !!(flags.full || flags.raw),
          scripts: !!(flags.scripts || flags.files),
        });
        if (details.error) {
          console.error(JSON.stringify(details, null, 2));
          process.exit(1);
        }
        if (flags.json) {
          console.log(JSON.stringify(details, null, 2));
        } else {
          console.log(`[SKILL: ${details.name}] (Ámbito: ${details.scope})\nDescripción: ${details.description}\nUbicación: ${details.path}\n\n## Instrucciones:\n${details.instructions}`);
        }
      } else {
        console.error(JSON.stringify({ error: 'sync-engine no disponible para inspeccionar skill.' }));
        process.exit(1);
      }
      break;
    }

    if (sub === 'save') {
      const skillName = positional[1] || flags.name;
      const content = flags.content || flags.instructions || flags.c || positional.slice(2).join(' ');
      const versionBump = !!(flags['version-bump'] || flags.bump);
      const triggers = flags.triggers ? flags.triggers.split(',').map(t => t.trim()) : undefined;
      const description = flags.desc || flags.description;

      if (!skillName || !content) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js skill save <nombre> --content "..." [--version-bump] [--triggers "..."]' }));
        process.exit(1);
      }

      if (syncEngine && typeof syncEngine.saveHermesSkill === 'function') {
        const res = syncEngine.saveHermesSkill(vault.path, {
          name: skillName,
          content,
          versionBump,
          triggers,
          description,
        });
        console.log(JSON.stringify(res, null, 2));
      }
      break;
    }

    if (sub === 'create' || sub === 'new' || sub === 'add') {
      const skillName = positional[1];
      const desc = flags.desc || flags.description || flags.d;
      const content = flags.content || flags.instructions || flags.c || positional.slice(2).join(' ');
      const scope = flags.scope || 'global';
      const wsPath = flags.workspace || flags.ws || process.cwd();

      if (!skillName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js skill create <nombre> --desc "<descripcion>" [--content "<instrucciones>"] [--scope global|project]' }));
        process.exit(1);
      }
      if (!desc && !content) {
        console.error(JSON.stringify({ error: 'Debes proporcionar al menos --desc "<descripcion>" o --content "<instrucciones>" para crear la skill.' }));
        process.exit(1);
      }

      if (syncEngine && typeof syncEngine.createSkill === 'function') {
        try {
          const res = syncEngine.createSkill(vault.path, wsPath, {
            name: skillName,
            description: desc || `Skill ${skillName}`,
            content: content || 'Instrucciones operativas para el agente.',
            scope,
            workspacePath: wsPath,
            overwrite: !!flags.overwrite,
          });
          console.log(JSON.stringify(res, null, 2));
        } catch (e) {
          console.error(JSON.stringify({ error: e.message }));
          process.exit(1);
        }
      } else {
        console.error(JSON.stringify({ error: 'sync-engine no disponible para crear skills.' }));
        process.exit(1);
      }
      break;
    }

    if (sub === 'edit' || sub === 'update' || sub === 'modify') {
      const skillName = positional[1];
      const desc = flags.desc || flags.description;
      const content = flags.content || flags.instructions;
      const append = flags.append || flags.add;
      const scope = flags.scope;

      if (!skillName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js skill edit <nombre> [--desc "..."] [--content "..."] [--append "..."]' }));
        process.exit(1);
      }

      if (syncEngine && typeof syncEngine.editSkill === 'function') {
        try {
          const res = syncEngine.editSkill(vault.path, process.cwd(), {
            name: skillName,
            description: desc,
            content,
            append,
            scope,
          });
          console.log(JSON.stringify(res, null, 2));
        } catch (e) {
          console.error(JSON.stringify({ error: e.message }));
          process.exit(1);
        }
      } else {
        console.error(JSON.stringify({ error: 'sync-engine no disponible para editar skills.' }));
        process.exit(1);
      }
      break;
    }

    if (sub === 'delete' || sub === 'remove' || sub === 'rm') {
      const skillName = positional[1];
      if (!skillName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js skill delete <nombre>' }));
        process.exit(1);
      }

      if (syncEngine && typeof syncEngine.deleteSkill === 'function') {
        try {
          const res = syncEngine.deleteSkill(vault.path, process.cwd(), { name: skillName });
          console.log(JSON.stringify(res, null, 2));
        } catch (e) {
          console.error(JSON.stringify({ error: e.message }));
          process.exit(1);
        }
      } else {
        console.error(JSON.stringify({ error: 'sync-engine no disponible para eliminar skills.' }));
        process.exit(1);
      }
      break;
    }

    if (sub === 'script') {
      const skillName = positional[1];
      const scriptAction = (positional[2] || '').toLowerCase();
      const scriptFile = positional[3];
      const code = flags.code || flags.content || '';

      if (!skillName || !scriptAction) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js skill script <skillName> add <filename> --code "..."' }));
        process.exit(1);
      }

      if (scriptAction === 'add') {
        if (!scriptFile || !code) {
          console.error(JSON.stringify({ error: 'Especifica el nombre del script y --code "..."' }));
          process.exit(1);
        }
        if (syncEngine && typeof syncEngine.addSkillScript === 'function') {
          try {
            const res = syncEngine.addSkillScript(vault.path, process.cwd(), {
              skillName,
              scriptName: scriptFile,
              code,
            });
            console.log(JSON.stringify(res, null, 2));
          } catch (e) {
            console.error(JSON.stringify({ error: e.message }));
            process.exit(1);
          }
        }
      } else {
        console.error(JSON.stringify({ error: `Acción de script no soportada: '${scriptAction}'. Usa 'add'.` }));
        process.exit(1);
      }
      break;
    }

    console.error(JSON.stringify({
      error: `Subcomando de skill no reconocido: '${sub}'`,
      supported: ['list', 'view', 'create', 'edit', 'delete', 'script'],
    }));
    process.exit(1);
    break;
  }

  case 'rule':
  case 'rules': {
    const syncEngine = getSyncEngine();
    const { flags, positional } = parseFlags(args);
    const sub = (positional[0] || 'list').toLowerCase();

    if (sub === 'list' || sub === 'ls') {
      if (syncEngine && typeof syncEngine.listRules === 'function') {
        const res = syncEngine.listRules(vault.path, process.cwd());
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log(JSON.stringify({ status: 'ok', rules: [] }));
      }
      break;
    }

    if (sub === 'view' || sub === 'show' || sub === 'peek') {
      const ruleName = positional[1];
      if (!ruleName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js rule view <nombre-regla>' }));
        process.exit(1);
      }
      if (syncEngine && typeof syncEngine.viewRule === 'function') {
        try {
          const res = syncEngine.viewRule(vault.path, process.cwd(), ruleName);
          console.log(`[REGLA: ${res.name}] (${res.scope})\nRuta: ${res.path}\n\n${res.peek}`);
        } catch (e) {
          console.error(JSON.stringify({ error: e.message }));
          process.exit(1);
        }
      } else {
        console.error(JSON.stringify({ error: 'sync-engine no disponible para consultar reglas.' }));
        process.exit(1);
      }
      break;
    }

    if (sub === 'add' || sub === 'learn') {
      const ruleText = positional.slice(1).join(' ') || flags.rule || flags.text;
      if (!ruleText) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js rule add "[<Proyecto>] <regla obligatoria>"' }));
        process.exit(1);
      }
      if (syncEngine && typeof syncEngine.recordUserLearning === 'function') {
        const res = syncEngine.recordUserLearning(vault.path, ruleText);
        try {
          const installer = getSkillInstaller();
          if (installer && typeof installer.installSkillAndRules === 'function') {
            installer.installSkillAndRules(vault.path);
          }
        } catch (e) {}
        console.log(JSON.stringify({ status: 'ok', message: 'Regla registrada en el perfil y reglas globales.', ...res }, null, 2));
      } else {
        console.error(JSON.stringify({ error: 'sync-engine no disponible para registrar reglas.' }));
        process.exit(1);
      }
      break;
    }

    console.error(JSON.stringify({ error: `Subcomando de rule no reconocido: '${sub}'. Usa list, view o add.` }));
    process.exit(1);
    break;
  }

  case 'tool':
  case 'tools': {
    const toolsEngine = getToolsEngine();
    if (!toolsEngine) {
      console.error(JSON.stringify({ error: 'tools-engine no disponible.' }));
      process.exit(1);
    }
    const { flags, positional } = parseFlags(args);
    const sub = (positional[0] || 'list').toLowerCase();

    if (sub === 'list' || sub === 'ls') {
      const res = toolsEngine.listTools(vault.path);
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    if (sub === 'search' || sub === 'find') {
      const query = positional.slice(1).join(' ') || flags.query || flags.q;
      if (!query) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js tool search "<consulta>" [--limit N]' }));
        process.exit(1);
      }
      const limit = parseInt(flags.limit || 6, 10);
      toolsEngine.webSearch(query, limit).then(res => {
        console.log(JSON.stringify(res, null, 2));
      }).catch(err => {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      });
      break;
    }

    if (sub === 'scrape' || sub === 'fetch') {
      const targetUrl = positional[1] || flags.url;
      if (!targetUrl) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js tool scrape <url> [--selector <sel>] [--max-chars N]' }));
        process.exit(1);
      }
      const maxChars = parseInt(flags['max-chars'] || flags.maxChars || 8000, 10);
      const selector = flags.selector || null;
      toolsEngine.scrapeUrl(targetUrl, { maxChars, selector }).then(res => {
        console.log(JSON.stringify(res, null, 2));
      }).catch(err => {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      });
      break;
    }

    if (sub === 'install' || sub === 'add') {
      const repoUrl = positional[1] || flags.url || flags.repo;
      if (!repoUrl) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js tool install <repoUrl> [--name <nombre>]' }));
        process.exit(1);
      }
      const name = flags.name || null;
      const description = flags.desc || flags.description || null;
      toolsEngine.installFromGithub(repoUrl, { name, description }, vault.path).then(res => {
        console.log(JSON.stringify(res, null, 2));
      }).catch(err => {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      });
      break;
    }

    if (sub === 'run' || sub === 'exec') {
      const toolName = positional[1];
      if (!toolName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js tool run <toolName> [args...]' }));
        process.exit(1);
      }
      const toolArgs = positional.slice(2);
      toolsEngine.runTool(toolName, toolArgs).then(res => {
        console.log(typeof res === 'string' ? res : JSON.stringify(res, null, 2));
      }).catch(err => {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      });
      break;
    }

    if (sub === 'uninstall' || sub === 'remove' || sub === 'rm') {
      const toolName = positional[1];
      if (!toolName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js tool uninstall <toolName>' }));
        process.exit(1);
      }
      try {
        const res = toolsEngine.uninstallTool(toolName, vault.path);
        console.log(JSON.stringify(res, null, 2));
      } catch (err) {
        console.error(JSON.stringify({ error: err.message }));
        process.exit(1);
      }
      break;
    }

    console.error(JSON.stringify({ error: `Subcomando de tool no reconocido: '${sub}'. Usa list, search, scrape, install, run o uninstall.` }));
    process.exit(1);
    break;
  }


  case 'memories': {
    const manifest = getManifest(vault.path);
    const compactMem = manifest.memories.map(m => ({ title: m.title, cat: m.category, desc: m.summary }));
    console.log(JSON.stringify(compactMem, null, 2));
    break;
  }

  case 'name':
  case 'set-name': {
    const newName = args.join(' ').replace(/^["']|["']$/g, '').trim();
    if (!newName) {
      console.error(JSON.stringify({ error: 'Especifica el nuevo nombre para el agente.' }));
      process.exit(1);
    }
    const res = applyPersonalityUpdate({ aiName: newName });
    console.log(JSON.stringify({
      status: 'ok',
      action: 'name-updated',
      aiName: res.aiName,
      userCallsign: res.userCallsign,
      message: `Nombre del agente actualizado a "${res.aiName}". Ya no se volverá a preguntar en ningún chat.`
    }, null, 2));
    break;
  }

  case 'user':
  case 'set-user':
  case 'callsign': {
    const newCallsign = args.join(' ').replace(/^["']|["']$/g, '').trim();
    if (!newCallsign) {
      console.error(JSON.stringify({ error: 'Especifica cómo debe dirigirse la IA hacia ti.' }));
      process.exit(1);
    }
    const res = applyPersonalityUpdate({ userCallsign: newCallsign });
    console.log(JSON.stringify({
      status: 'ok',
      action: 'user-updated',
      aiName: res.aiName,
      userCallsign: res.userCallsign,
      message: `Trato hacia el usuario actualizado a "${res.userCallsign}".`
    }, null, 2));
    break;
  }

  case 'config':
  case 'settings': {
    const sub = (args[0] || '').toLowerCase();
    const cfgFile = path.join(os.homedir(), '.gemini', 'config', 'antigravity-obsidian.json');
    let cfg = {};
    if (fs.existsSync(cfgFile)) {
      try { cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8')); } catch (e) {}
    }

    if (!sub || sub === 'get' || sub === 'show' || sub === 'status') {
      const almaDir = path.join(vault.path, '00_Agente');
      const pFile = getPersonalityFile(almaDir, cfg.language);
      let curAi = cfg.aiName || 'Hermes';
      let curCall = cfg.userCallsign || cfg.userName || process.env.USERNAME || 'User';
      let curPers = cfg.personality || 'Ingeniero senior de élite, autónomo, pragmático y de precisión quirúrgica.';
      let curConf = !!cfg.personalityConfigured;
      if (fs.existsSync(pFile)) {
        try {
          const c = fs.readFileSync(pFile, 'utf8');
          const mAi = c.match(/^ai_name:\s*["']?([^"'\r\n]+)["']?/m);
          if (mAi) curAi = mAi[1].trim();
          const mCall = c.match(/^user_callsign:\s*["']?([^"'\r\n]+)["']?/m);
          if (mCall) curCall = mCall[1].trim();
          const mConf = c.match(/^configured:\s*(true|false)/m);
          if (mConf) curConf = curConf || (mConf[1] === 'true');
        } catch (e) {}
      }
      console.log(JSON.stringify({
        status: 'ok',
        configured: curConf,
        aiName: curAi,
        userCallsign: curCall,
        personality: curPers,
        language: cfg.language || 'auto',
        vaultPath: vault.path,
        vaultName: vault.name,
        autoSave: cfg.autoSave !== undefined ? !!cfg.autoSave : true,
        proactiveLookup: cfg.proactiveLookup !== undefined ? !!cfg.proactiveLookup : true,
      }, null, 2));
      break;
    }

    if (sub === 'set') {
      const key = (args[1] || '').toLowerCase();
      const val = args.slice(2).join(' ').replace(/^["']|["']$/g, '').trim();
      if (!key || !val) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js config set <clave> <valor>' }));
        process.exit(1);
      }
      const opts = {};
      if (['name', 'ainame', 'ai-name', 'ia', 'agent'].includes(key)) opts.aiName = val;
      else if (['user', 'usercallsign', 'user-callsign', 'usuario', 'callsign'].includes(key)) opts.userCallsign = val;
      else if (['personality', 'personalidad', 'traits'].includes(key)) opts.personality = val;
      else if (['language', 'idioma', 'lang'].includes(key)) opts.language = val;
      else {
        cfg[args[1]] = val;
        fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2), 'utf8');
        console.log(JSON.stringify({ status: 'ok', updated: args[1], value: val }, null, 2));
        break;
      }
      const res = applyPersonalityUpdate(opts);
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    // Flag-based parsing
    const opts = {};
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if ((a === '--ai-name' || a === '--name') && args[i + 1]) opts.aiName = args[++i];
      else if ((a === '--user' || a === '--user-callsign' || a === '--callsign') && args[i + 1]) opts.userCallsign = args[++i];
      else if ((a === '--personality' || a === '--traits') && args[i + 1]) opts.personality = args[++i];
      else if ((a === '--language' || a === '--lang') && args[i + 1]) opts.language = args[++i];
      else if (a === '--reset') opts.reset = true;
    }
    const res = applyPersonalityUpdate(opts);
    console.log(JSON.stringify(res, null, 2));
    break;
  }

  case 'personality': {
    const almaDir = path.join(vault.path, '00_Agente');
    const cfgFile = path.join(os.homedir(), '.gemini', 'config', 'antigravity-obsidian.json');
    let existingCfg = {};
    if (fs.existsSync(cfgFile)) {
      try { existingCfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8')); } catch (e) {}
    }

    let aiName = null;
    let userCallsign = null;
    let personality = null;
    let reset = false;

    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--ai-name' && args[i + 1]) aiName = args[++i];
      else if (a === '--user-callsign' && args[i + 1]) userCallsign = args[++i];
      else if (a === '--personality' && args[i + 1]) personality = args[++i];
      else if (a === '--reset' || a === 'reset') reset = true;
    }

    if (!aiName && !userCallsign && !personality && !reset && args.length > 0) {
      if (args[0] === 'reset') {
        reset = true;
      } else {
        aiName = args[0];
        if (args[1]) userCallsign = args[1];
        if (args.length > 2) personality = args.slice(2).join(' ');
      }
    }

    if (reset) {
      const res = applyPersonalityUpdate({ reset: true });
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    if (aiName !== null || userCallsign !== null || personality !== null) {
      const res = applyPersonalityUpdate({ aiName, userCallsign, personality });
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    // Default: read current
    const pFile = getPersonalityFile(almaDir, existingCfg.language);
    let curAi = existingCfg.aiName || 'Hermes';
    let curCall = existingCfg.userCallsign || existingCfg.userName || process.env.USERNAME || 'User';
    let curPers = existingCfg.personality || 'Ingeniero senior de élite, autónomo, pragmático y de precisión quirúrgica. CERO emojis.';
    let curConf = !!existingCfg.personalityConfigured;
    if (fs.existsSync(pFile)) {
      try {
        const c = fs.readFileSync(pFile, 'utf8');
        const mAi = c.match(/^ai_name:\s*["']?([^"'\r\n]+)["']?/m);
        if (mAi) curAi = mAi[1].trim();
        const mCall = c.match(/^user_callsign:\s*["']?([^"'\r\n]+)["']?/m);
        if (mCall) curCall = mCall[1].trim();
        const mConf = c.match(/^configured:\s*(true|false)/m);
        if (mConf) curConf = curConf || (mConf[1] === 'true');
        const mStatus = c.match(/^status:\s*["']?([^"'\r\n]+)["']?/m);
        if (mStatus && mStatus[1].trim() === 'configured') curConf = true;
      } catch (e) {}
    }
    console.log(JSON.stringify({
      status: 'ok',
      configured: curConf,
      aiName: curAi,
      userCallsign: curCall,
      personality: curPers,
      notePath: pFile,
    }, null, 2));
    break;
  }

  case 'soul': {
    const almaDir = path.join(vault.path, '00_Agente');
    const soulFile = path.join(almaDir, '00 Soul de Antigravity.md');
    const userFile = path.join(almaDir, '00 Perfil de Usuario.md');

    let langPref = 'auto';
    const cfgFile = path.join(os.homedir(), '.gemini', 'config', 'antigravity-obsidian.json');
    if (fs.existsSync(cfgFile)) {
      try { langPref = JSON.parse(fs.readFileSync(cfgFile, 'utf8')).language || 'auto'; } catch (e) {}
    }
    const pFile = getPersonalityFile(almaDir, langPref);

    const soul = fs.existsSync(soulFile) ? fs.readFileSync(soulFile, 'utf8') : 'No configurado';
    const profile = fs.existsSync(userFile) ? fs.readFileSync(userFile, 'utf8') : 'No configurado';
    const personality = fs.existsSync(pFile) ? fs.readFileSync(pFile, 'utf8') : 'No configurado';

    console.log(JSON.stringify({
      status: 'ok',
      soul: soul.slice(0, 400) + '...',
      profile: profile.slice(0, 400) + '...',
      personality: personality.slice(0, 400) + '...',
      soulPath: soulFile,
      userPath: userFile,
      personalityPath: pFile,
    }, null, 2));
    break;
  }

  case 'learn': {
    let project = null;
    let learnArgs = [...args];
    let b64 = null;
    let fileArg = null;

    for (let i = 0; i < learnArgs.length; i++) {
      if (learnArgs[i] === '--project' && learnArgs[i + 1]) {
        project = cleanText(learnArgs[i + 1]);
        learnArgs.splice(i, 2);
        i--;
      } else if ((learnArgs[i] === '--b64' || learnArgs[i] === '--base64') && learnArgs[i + 1]) {
        b64 = learnArgs[i + 1];
        learnArgs.splice(i, 2);
        i--;
      } else if (learnArgs[i] === '--file' && learnArgs[i + 1]) {
        fileArg = learnArgs[i + 1];
        learnArgs.splice(i, 2);
        i--;
      }
    }

    let learning = '';
    if (b64) {
      try { learning = Buffer.from(b64, 'base64').toString('utf8').trim(); } catch (e) {}
    } else if (fileArg && fs.existsSync(fileArg)) {
      try { learning = fs.readFileSync(fileArg, 'utf8').trim(); } catch (e) {}
    } else {
      learning = learnArgs.join(' ').trim();
    }

    if (!learning) {
      console.error(JSON.stringify({ error: 'Especifica la preferencia o aprendizaje sobre el usuario.' }));
      process.exit(1);
    }

    if (!project) {
      const projTagMatch = learning.match(/^\[([a-zA-Z0-9_\-.]+)\]/);
      if (projTagMatch) {
        project = projTagMatch[1];
      }
    }

    const isGlobal = !project || project.toLowerCase() === 'global';
    const now = new Date().toISOString().split('T')[0];
    const entry = `- \`[${now}]\` ${learning}`;

    let userNoteUpdated = null;
    let projectNoteUpdated = null;

    if (isGlobal) {
      // ONLY update 00 Perfil de Usuario.md
      const almaDir = path.join(vault.path, '00_Agente');
      if (!fs.existsSync(almaDir)) fs.mkdirSync(almaDir, { recursive: true });
      const userFile = path.join(almaDir, '00 Perfil de Usuario.md');

      let runnerUser = 'User';
      const cfgFile = path.join(os.homedir(), '.gemini', 'config', 'antigravity-obsidian.json');
      if (fs.existsSync(cfgFile)) {
        try {
          const c = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
          if (c.userName) runnerUser = c.userName;
        } catch (e) {}
      }
      if (runnerUser === 'User') {
        runnerUser = process.env.USERNAME || process.env.USER || 'User';
      }

      let content = fs.existsSync(userFile) ? fs.readFileSync(userFile, 'utf8') : `# Perfil de Trabajo — ${runnerUser}\n\n## 4. Aprendizajes y Preferencias Dinámicas Acumuladas\n`;
      if (content.includes('## 4. Aprendizajes y Preferencias Dinámicas Acumuladas')) {
        content = content.replace(
          '## 4. Aprendizajes y Preferencias Dinámicas Acumuladas',
          `## 4. Aprendizajes y Preferencias Dinámicas Acumuladas\n${entry}`
        );
      } else if (content.includes('## 4. Dynamic Learnings & Evolved Preferences')) {
        content = content.replace(
          '## 4. Dynamic Learnings & Evolved Preferences',
          `## 4. Dynamic Learnings & Evolved Preferences\n${entry}`
        );
      } else {
        content += `\n## 4. Aprendizajes y Preferencias Dinámicas Acumuladas\n${entry}\n`;
      }
      fs.writeFileSync(userFile, content, 'utf8');
      userNoteUpdated = userFile;
    } else {
      // Scoped to project: ONLY update the Project note (Antigravity/Proyectos/<Project>.md)
      const projDir = path.join(vault.path, '02_Proyectos');
      if (!fs.existsSync(projDir)) fs.mkdirSync(projDir, { recursive: true });
      let projFile = path.join(projDir, `${project}.md`);
      if (!fs.existsSync(projFile)) {
        for (const f of fs.readdirSync(projDir)) {
          if (f.toLowerCase() === `${project.toLowerCase()}.md`) {
            projFile = path.join(projDir, f);
            break;
          }
        }
      }
      if (fs.existsSync(projFile)) {
        let pContent = fs.readFileSync(projFile, 'utf8');
        const ruleHeader = '## Reglas y Condiciones Obligatorias del Proyecto';
        const ruleHeaderAlt = '## Project Rules & Constraints';
        if (pContent.includes(ruleHeader)) {
          pContent = pContent.replace(ruleHeader, `${ruleHeader}\n${entry}`);
        } else if (pContent.includes(ruleHeaderAlt)) {
          pContent = pContent.replace(ruleHeaderAlt, `${ruleHeaderAlt}\n${entry}`);
        } else {
          const splitIdx = pContent.lastIndexOf('---');
          if (splitIdx !== -1) {
            pContent = pContent.slice(0, splitIdx) + `## Reglas y Condiciones Obligatorias del Proyecto\n${entry}\n\n` + pContent.slice(splitIdx);
          } else {
            pContent += `\n## Reglas y Condiciones Obligatorias del Proyecto\n${entry}\n`;
          }
        }
        fs.writeFileSync(projFile, pContent, 'utf8');
        try {
          syncEngine.syncProjectRulesToWorkspace(vault.path, process.cwd(), project);
        } catch (e) {}
        projectNoteUpdated = projFile;
      } else {
        const newProjContent = `---
title: "Proyecto: ${project}"
type: antigravity-project
project: "${project}"
tags:
  - antigravity/proyecto
created: ${now}
updated: ${now}
---

# Proyecto: ${project}

> [!INFO] **Dossier de Proyecto y Condiciones**
> Blueprint y reglas técnicas de ${project}.

## Reglas y Condiciones Obligatorias del Proyecto
${entry}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Proyectos]]
`;
        fs.writeFileSync(projFile, newProjContent, 'utf8');
        try {
          syncEngine.syncProjectRulesToWorkspace(vault.path, process.cwd(), project);
        } catch (e) {}
        projectNoteUpdated = projFile;
      }
    }

    // Refresh rules and manifest
    try {
      const installer = getSkillInstaller();
      if (installer && typeof installer.installSkillAndRules === 'function') {
        installer.installSkillAndRules(vault.path);
      }
    } catch (e) {}

    console.log(JSON.stringify({
      status: 'ok',
      scope: isGlobal ? 'global' : 'project',
      target: isGlobal ? userNoteUpdated : projectNoteUpdated,
      entry,
    }, null, 2));
    break;
  }

  case 'status': {
    const manifest = getManifest(vault.path);
    const almaDir = path.join(vault.path, '00_Agente');

    let langPref = 'auto';
    let cfgAi = null;
    let cfgCall = null;
    let cfgConf = undefined;
    const cfgFile = path.join(os.homedir(), '.gemini', 'config', 'antigravity-obsidian.json');
    if (fs.existsSync(cfgFile)) {
      try {
        const c = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
        langPref = c.language || 'auto';
        if (c.aiName) cfgAi = c.aiName;
        if (c.userCallsign) cfgCall = c.userCallsign;
        if (c.personalityConfigured !== undefined) cfgConf = !!c.personalityConfigured;
      } catch (e) {}
    }

    const pFile = getPersonalityFile(almaDir, langPref);
    let aiName = cfgAi || 'Hermes';
    let userCallsign = cfgCall || 'User';
    let personalityConfigured = cfgConf !== undefined ? cfgConf : false;
    if (fs.existsSync(pFile)) {
      try {
        const c = fs.readFileSync(pFile, 'utf8');
        const mAi = c.match(/^ai_name:\s*["']?([^"'\r\n]+)["']?/m);
        if (mAi) aiName = mAi[1].trim();
        const mCall = c.match(/^user_callsign:\s*["']?([^"'\r\n]+)["']?/m);
        if (mCall) userCallsign = mCall[1].trim();
        const mConf = c.match(/^configured:\s*(true|false)/m);
        if (mConf) personalityConfigured = mConf[1] === 'true';
        const mStatus = c.match(/^status:\s*["']?([^"'\r\n]+)["']?/m);
        if (mStatus && mStatus[1].trim() === 'configured') personalityConfigured = true;
      } catch (e) {}
    }
    console.log(JSON.stringify({
      connected: true,
      vaultName: vault.name,
      vaultPath: vault.path,
      stats: manifest.stats,
      aiName,
      userCallsign,
      personalityConfigured,
      lastIndexed: manifest.updatedAt,
    }, null, 2));
    break;
  }

  case 'manifest': {
    const manifest = buildManifest(vault.path);
    console.log(JSON.stringify({ status: 'ok', stats: manifest.stats, updatedAt: manifest.updatedAt }, null, 2));
    break;
  }

  case 'reset': {
    const memDir = path.join(vault.path, '00_Agente', 'Memorias');
    const skiDir = path.join(vault.path, '01_Skills');
    const proDir = path.join(vault.path, '02_Proyectos');
    const sesDir = path.join(vault.path, '03_Sesiones');

    if (fs.existsSync(memDir)) {
      for (const f of fs.readdirSync(memDir)) {
        try { fs.unlinkSync(path.join(memDir, f)); } catch (e) {}
      }
    }
    if (fs.existsSync(skiDir)) {
      for (const f of fs.readdirSync(skiDir)) {
        try { fs.unlinkSync(path.join(skiDir, f)); } catch (e) {}
      }
    }
    if (fs.existsSync(proDir)) {
      for (const f of fs.readdirSync(proDir)) {
        try { fs.unlinkSync(path.join(proDir, f)); } catch (e) {}
      }
    }
    if (fs.existsSync(sesDir)) {
      for (const f of fs.readdirSync(sesDir)) {
        try { fs.unlinkSync(path.join(sesDir, f)); } catch (e) {}
      }
    }

    const { knowledgeDir } = getAntigravityPaths();
    if (fs.existsSync(knowledgeDir)) {
      for (const kf of fs.readdirSync(knowledgeDir, { withFileTypes: true })) {
        if (!kf.isDirectory()) continue;
        const fp = path.join(knowledgeDir, kf.name);
        const metaFile = path.join(fp, 'metadata.json');
        let shouldDel = false;
        if (fs.existsSync(metaFile)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
            if (meta.source === 'obsidian-vault') shouldDel = true;
          } catch (e) {}
        }
        const obsPrefixes = ['proyecto-', 'antigravity-', 'arquitectura-antigravity', 'protocolo-de-memoria', 'sincronizacion-bidireccional', 'solucion-a-variables', 'latalaya-arquitectura'];
        if (obsPrefixes.some(p => kf.name.startsWith(p))) shouldDel = true;
        if (shouldDel) {
          try { fs.rmSync(fp, { recursive: true, force: true }); } catch (e) {}
        }
      }
    }

    ensureDirs(vault.path);
    const now = new Date().toISOString().split('T')[0];
    const indexFile = path.join(memDir, '00 Indice de Memoria.md');
    fs.writeFileSync(indexFile, `---\ntitle: "Indice de Memoria de Antigravity"\ntype: antigravity-index\ntags:\n  - antigravity/indice\n  - antigravity/memoria\nupdated: ${now}\n---\n\n# Banco de Memoria & Knowledge Items\n\nTotal de memorias registradas: **0**\n\n*No hay memorias registradas. Empezando de cero.*\n\n---\n*Volver al:* [[00 Antigravity Hub]]\n`, 'utf8');

    const manifest = buildManifest(vault.path);
    console.log(JSON.stringify({ status: 'ok', message: 'Memoria reiniciada correctamente', stats: manifest.stats }, null, 2));
    break;
  }

  case 'search': {
    const q = (args[0] || '').toLowerCase();
    const manifest = getManifest(vault.path);
    const matches = [];

    for (const m of manifest.memories) {
      if (m.title.toLowerCase().includes(q) || (m.tags || []).some(t => t.includes(q)) || m.summary.toLowerCase().includes(q)) {
        matches.push({
          type: 'memoria',
          title: m.title,
          category: m.category,
          desc: m.summary,
        });
      }
    }

    for (const s of manifest.skills) {
      if (s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)) {
        matches.push({
          type: 'skill',
          title: s.name,
          desc: s.description,
        });
      }
    }

    console.log(JSON.stringify(matches.slice(0, 5), null, 2));
    break;
  }

  case 'read': {
    const name = args.join(' ');
    if (!name) { console.error('Especifica la nota a leer.'); process.exit(1); }
    let target = path.join(vault.path, 'Antigravity', name.endsWith('.md') ? name : name + '.md');
    if (!fs.existsSync(target)) {
      function find(d) {
        if (!fs.existsSync(d)) return null;
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const fp = path.join(d, e.name);
          if (e.isDirectory()) { const r = find(fp); if (r) return r; }
          else if (e.name.toLowerCase() === path.basename(name).toLowerCase() || e.name.toLowerCase() === (path.basename(name).toLowerCase() + '.md')) return fp;
        }
        return null;
      }
      target = find(path.join(vault.path, 'Antigravity'));
    }
    if (!target || !fs.existsSync(target)) { console.error('Nota no encontrada: ' + name); process.exit(1); }
    console.log(fs.readFileSync(target, 'utf8'));
    break;
  }

  case 'project': {
    const { flags: pFlags, positional: pPos } = parseFlags(args);
    const sub = (pPos[0] || 'list').toLowerCase();
    const targetDir = ['scan', 'register', 'update'].includes(sub) && pPos[1] ? path.resolve(pPos[1]) : (pFlags.path ? path.resolve(pFlags.path) : process.cwd());
    const projFolder = path.join(vault.path, '02_Proyectos');
    if (!fs.existsSync(projFolder)) fs.mkdirSync(projFolder, { recursive: true });

    function scanProjectStructure(wsPath) {
      if (!fs.existsSync(wsPath)) {
        return {
          structureMarkdown: '*Directorio no disponible*',
          entrypointsMarkdown: '- No detectados',
          databaseMarkdown: '- No detectada',
          dirSummaries: [],
          entrypoints: [],
          dbFound: []
        };
      }

      const ignoreList = new Set([
        'node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.cache',
        '.system_generated', 'brain', 'artifacts', '.gemini', 'out', 'venv', '.venv',
        '__pycache__', '.idea', '.vscode', '.agent', '.agents', '.husky', 'tmp', 'temp'
      ]);

      const topItems = [];
      try {
        const entries = fs.readdirSync(wsPath, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.name.startsWith('.') && !['.env.example', '.env'].includes(ent.name)) continue;
          if (ignoreList.has(ent.name.toLowerCase())) continue;
          topItems.push(ent);
        }
      } catch (e) {}

      const dirSummaries = [];
      const keyFiles = [];

      for (const ent of topItems) {
        if (ent.isFile()) {
          keyFiles.push(ent.name);
        } else if (ent.isDirectory()) {
          const subPath = path.join(wsPath, ent.name);
          try {
            const subEntries = fs.readdirSync(subPath, { withFileTypes: true })
              .filter(s => !ignoreList.has(s.name.toLowerCase()) && !s.name.startsWith('.'));
            const subFiles = subEntries.filter(s => s.isFile());
            const subDirs = subEntries.filter(s => s.isDirectory());
            
            let desc = 'Módulo ' + ent.name;
            const nLow = ent.name.toLowerCase();
            if (nLow === 'src') desc = 'Código fuente principal';
            else if (nLow === 'components') desc = 'Componentes de UI / Vistas';
            else if (nLow === 'controllers') desc = 'Controladores de lógica de endpoints';
            else if (nLow === 'models') desc = 'Modelos de datos y entidades';
            else if (nLow === 'routes' || nLow === 'api') desc = 'Definición de rutas y endpoints de API';
            else if (nLow === 'services') desc = 'Capa de lógica de negocio y servicios';
            else if (nLow === 'lib' || nLow === 'utils') desc = 'Librerías auxiliares y utilidades';
            else if (nLow === 'public' || nLow === 'static') desc = 'Activos estáticos públicos';
            else if (nLow === 'tests' || nLow === 'test') desc = 'Suites de pruebas y tests unitarios';
            else if (nLow === 'scripts') desc = 'Scripts de automatización y herramientas CLI';
            else if (nLow === 'docs') desc = 'Documentación del proyecto';
            else if (nLow === 'config') desc = 'Archivos de configuración';
            else if (nLow === 'prisma') desc = 'Esquema y migraciones de Prisma ORM';
            else if (nLow === 'views') desc = 'Plantillas y vistas renderizables';
            else if (nLow === 'middleware' || nLow === 'middlewares') desc = 'Middlewares de petición y seguridad';

            const subNames = subEntries.slice(0, 8).map(s => s.name + (s.isDirectory() ? '/' : ''));
            dirSummaries.push({
              dir: ent.name + '/',
              desc,
              filesCount: subFiles.length,
              dirsCount: subDirs.length,
              sample: subNames.join(', ')
            });
          } catch (e) {
            dirSummaries.push({ dir: ent.name + '/', desc: 'Directorio', filesCount: 0, dirsCount: 0, sample: '' });
          }
        }
      }

      const entrypoints = [];
      const possibleEntries = [
        'extension.js', 'index.js', 'index.ts', 'server.js', 'app.js', 'main.js',
        'src/index.js', 'src/index.ts', 'src/main.js', 'src/main.ts', 'src/app.js', 'src/app.ts',
        'src/extension.ts', 'src/extension.js', 'main.py', 'app.py', 'manage.py', 'artisan',
        'main.go', 'cmd/main.go', 'src/main.rs', 'vite.config.ts', 'vite.config.js', 'next.config.js'
      ];
      for (const pe of possibleEntries) {
        if (fs.existsSync(path.join(wsPath, pe))) {
          entrypoints.push('`' + pe + '`');
        }
      }

      const pkgPath = path.join(wsPath, 'package.json');
      let scriptsList = '';
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (pkg.scripts) {
            const scKeys = Object.keys(pkg.scripts);
            if (scKeys.length > 0) {
              scriptsList = scKeys.slice(0, 10).map(s => '`npm run ' + s + '`').join(', ');
            }
          }
        } catch (e) {}
      }

      const dbFound = [];
      if (fs.existsSync(path.join(wsPath, 'prisma', 'schema.prisma'))) {
        dbFound.push('Prisma ORM (`prisma/schema.prisma`)');
      }
      if (fs.existsSync(path.join(wsPath, 'drizzle.config.ts')) || fs.existsSync(path.join(wsPath, 'drizzle.config.js'))) {
        dbFound.push('Drizzle ORM');
      }
      for (const ent of topItems) {
        if (ent.isFile() && (ent.name.endsWith('.sqlite') || ent.name.endsWith('.sqlite3') || ent.name.endsWith('.db'))) {
          dbFound.push('SQLite Database (`' + ent.name + '`)');
        }
      }
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          if (allDeps['mongoose']) dbFound.push('MongoDB (Mongoose)');
          if (allDeps['pg'] || allDeps['postgres']) dbFound.push('PostgreSQL (`pg`)');
          if (allDeps['mysql2'] || allDeps['mysql']) dbFound.push('MySQL');
          if (allDeps['redis'] || allDeps['ioredis']) dbFound.push('Redis Cache');
          if (allDeps['@supabase/supabase-js']) dbFound.push('Supabase Client');
          if (allDeps['typeorm']) dbFound.push('TypeORM');
        } catch (e) {}
      }

      let structureMarkdown = '';
      if (dirSummaries.length > 0) {
        structureMarkdown = '| Carpeta / Módulo | Rol Arquitectónico | Contenido Detectado |\n|---|---|---|\n';
        for (const d of dirSummaries) {
          structureMarkdown += '| `' + d.dir + '` | ' + d.desc + ' | ' + (d.sample || (d.filesCount + ' archivos')) + ' |\n';
        }
      } else {
        structureMarkdown = '*Proyecto plano o sin subdirectorios mayores.*\n';
      }
      if (keyFiles.length > 0) {
        structureMarkdown += '\n**Archivos raíz clave:** ' + keyFiles.slice(0, 15).map(f => '`' + f + '`').join(', ');
      }

      let entrypointsMarkdown = entrypoints.length > 0 
        ? '- **Punto(s) de entrada:** ' + entrypoints.join(', ')
        : '- **Punto(s) de entrada:** No detectado estándar';
      if (scriptsList) {
        entrypointsMarkdown += '\n- **Scripts de ejecución:** ' + scriptsList;
      }

      const databaseMarkdown = dbFound.length > 0
        ? dbFound.map(d => '- ' + d).join('\n')
        : '- No se detectó base de datos o ORM local dedicado en la raíz';

      return {
        structureMarkdown,
        entrypointsMarkdown,
        databaseMarkdown,
        dirSummaries,
        entrypoints,
        dbFound
      };
    }

    function detectProject(wsPath) {
      const info = {
        name: path.basename(wsPath),
        version: '1.0.0',
        stack: 'General / No detectado',
        description: '',
        framework: '',
        dependencies: [],
      };
      if (!fs.existsSync(wsPath)) return info;

      const pkgPath = path.join(wsPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (pkg.name) info.name = pkg.name;
          if (pkg.version) info.version = pkg.version;
          if (pkg.description) info.description = pkg.description;
          const deps = Object.keys(pkg.dependencies || {});
          const devDeps = Object.keys(pkg.devDependencies || {});
          info.dependencies = [...deps, ...devDeps];
          if (pkg.engines && pkg.engines.vscode) info.framework = 'VS Code Extension';
          else if (deps.includes('next') || devDeps.includes('next')) info.framework = 'Next.js';
          else if (deps.includes('react') || devDeps.includes('react')) info.framework = 'React';
          else if (deps.includes('vue') || devDeps.includes('vue')) info.framework = 'Vue';
          else if (deps.includes('express') || devDeps.includes('express')) info.framework = 'Express';
          else if (deps.includes('fastify') || devDeps.includes('fastify')) info.framework = 'Fastify';
          else if (deps.includes('nest') || devDeps.includes('@nestjs/core')) info.framework = 'NestJS';
          else if (deps.includes('electron') || devDeps.includes('electron')) info.framework = 'Electron';
          const tsConfig = path.join(wsPath, 'tsconfig.json');
          const lang = fs.existsSync(tsConfig) ? 'TypeScript' : 'JavaScript (Node.js)';
          info.stack = info.framework ? `${info.framework} (${lang})` : lang;
        } catch (e) {}
      }

      const pyProject = path.join(wsPath, 'pyproject.toml');
      const reqTxt = path.join(wsPath, 'requirements.txt');
      if (fs.existsSync(pyProject) || fs.existsSync(reqTxt)) {
        let pyFw = '';
        let c = '';
        if (fs.existsSync(reqTxt)) { try { c += fs.readFileSync(reqTxt, 'utf8').toLowerCase(); } catch (e) {} }
        if (fs.existsSync(pyProject)) { try { c += fs.readFileSync(pyProject, 'utf8').toLowerCase(); } catch (e) {} }
        if (c.includes('fastapi')) pyFw = 'FastAPI';
        else if (c.includes('django')) pyFw = 'Django';
        else if (c.includes('flask')) pyFw = 'Flask';
        info.stack = pyFw ? `Python (${pyFw})` : 'Python';
      }

      const cargoToml = path.join(wsPath, 'Cargo.toml');
      if (fs.existsSync(cargoToml)) info.stack = 'Rust (Cargo)';

      const compJson = path.join(wsPath, 'composer.json');
      if (fs.existsSync(compJson)) {
        try {
          const comp = JSON.parse(fs.readFileSync(compJson, 'utf8'));
          if (comp.description && !info.description) info.description = comp.description;
          const reqs = Object.keys(comp.require || {});
          if (reqs.includes('laravel/framework')) info.stack = 'PHP (Laravel)';
          else if (reqs.includes('symfony/framework-bundle')) info.stack = 'PHP (Symfony)';
          else info.stack = 'PHP (Composer)';
        } catch (e) { info.stack = 'PHP'; }
      }

      if (fs.existsSync(path.join(wsPath, 'go.mod'))) info.stack = 'Go';

      if (!info.description) {
        const readme = path.join(wsPath, 'README.md');
        if (fs.existsSync(readme)) {
          try {
            const txt = fs.readFileSync(readme, 'utf8').replace(/^#[^\r\n]*/gm, '').replace(/\[!.*?\][^\r\n]*/g, '').trim();
            const firstPara = txt.split(/\r?\n\r?\n/)[0];
            if (firstPara) info.description = firstPara.replace(/\r?\n/g, ' ').slice(0, 160).trim();
          } catch (e) {}
        }
      }

      if (!info.description) info.description = `Proyecto en desarrollo (${info.stack})`;

      const struct = scanProjectStructure(wsPath);
      info.structureMarkdown = struct.structureMarkdown;
      info.entrypointsMarkdown = struct.entrypointsMarkdown;
      info.databaseMarkdown = struct.databaseMarkdown;

      return info;
    }

    function findSkill(pName, wsPath) {
      const norm = (pName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const pTokens = (pName || '')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(t => t.length >= 3 && !['for', 'the', 'app', 'ide', 'with', 'and'].includes(t));

      function matchesSkill(skillName) {
        if (!skillName) return false;
        const clean = skillName.replace(/\.md$/, '').replace(/^\[Proyecto\]\s*/, '');
        const normSkill = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normSkill.includes(norm) || norm.includes(normSkill)) return true;

        const sTokens = clean.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 3);
        const common = pTokens.filter(t => sTokens.includes(t));
        if (common.length >= 2 || (pTokens.length === 1 && common.length === 1)) {
          return true;
        }
        return false;
      }

      if (wsPath) {
        const wsS = path.join(wsPath, '.agents', 'skills');
        if (fs.existsSync(wsS)) {
          try {
            for (const s of fs.readdirSync(wsS, { withFileTypes: true })) {
              if (s.isDirectory() && matchesSkill(s.name)) return s.name;
            }
          } catch (e) {}
        }
      }
      const gSkills = path.join(os.homedir(), '.gemini', 'config', 'skills');
      if (fs.existsSync(gSkills)) {
        try {
          for (const s of fs.readdirSync(gSkills, { withFileTypes: true })) {
            if (!s.isDirectory()) continue;
            if (matchesSkill(s.name)) return s.name;
          }
        } catch (e) {}
      }
      return '—';
    }

    function getRegistry() {
      const list = [];
      if (!fs.existsSync(projFolder)) return list;
      for (const ent of fs.readdirSync(projFolder, { withFileTypes: true })) {
        if (ent.name.startsWith('.') || ent.name.startsWith('00')) continue;
        let fp = null;
        let base = ent.name;
        if (ent.isDirectory()) {
          const arch = path.join(projFolder, ent.name, 'ARCHITECTURE.md');
          if (fs.existsSync(arch)) fp = arch;
        } else if (ent.isFile() && ent.name.endsWith('.md')) {
          fp = path.join(projFolder, ent.name);
          base = ent.name.replace(/\.md$/, '');
        }
        if (!fp) continue;
        try {
          const content = fs.readFileSync(fp, 'utf8');
          let name = base;
          let pPath = '—';
          let stack = '—';
          let summary = '—';
          let skill = '—';
          const mN = content.match(/^project:\s*"([^"\r\n]+)"/m) || content.match(/>\s*-\s*\*\*Nombre\*\*:\s*`([^`]+)`/i);
          if (mN) name = mN[1].trim();
          const mP = content.match(/>\s*-\s*\*\*Ruta local\*\*:\s*`([^`]+)`/i) || content.match(/-\s*\*\*Ruta local\*\*:\s*`([^`]+)`/i);
          if (mP) pPath = mP[1].trim();
          const mS = content.match(/^stack:\s*"([^"\r\n]+)"/m) || content.match(/>\s*-\s*\*\*Stack\*\*:\s*([^\r\n]+)/i) || content.match(/-\s*\*\*Stack\*\*:\s*([^\r\n]+)/i);
          if (mS) stack = mS[1].trim();
          const mSum = content.match(/## Decisiones de Diseño y Estructura[^\r\n]*\r?\n([^\r\n#]+)/i) || content.match(/>\s*-\s*\*\*Resumen\*\*:\s*([^\r\n]+)/i);
          if (mSum) summary = mSum[1].trim();
          const mSk = content.match(/\[\[(antigravity-[a-z0-9_-]+|seo|qr-[a-z0-9_-]+)\]\]/i);
          if (mSk) skill = mSk[1];
          else skill = findSkill(name, pPath);
          list.push({ name, path: pPath, stack, summary, skill: skill !== '—' ? `[[${skill}]]` : '—', note: base });
        } catch (e) {}
      }
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }

    function updateIndex() {
      const projects = getRegistry();
      let rows = '';
      if (projects.length === 0) {
        rows = '| *Aún no hay proyectos registrados* | — | — | — | — | — |\n';
      } else {
        for (const p of projects) {
          rows += `| **${p.name}** | \`${p.path}\` | ${p.stack} | ${p.summary} | ${p.skill} | [[${p.note}]] |\n`;
        }
      }
      const now = new Date().toISOString().split('T')[0];
      const idxContent = `---
title: "Índice de Proyectos — Antigravity"
type: antigravity-index
tags:
  - antigravity/proyectos
  - antigravity/index
created: ${now}
updated: ${now}
---

# Índice Unificado de Proyectos — Antigravity

> [!INFO] **Registro Consolidado de Proyectos**
> Registro unificado de alta densidad de todos los proyectos de workspace vinculados a Antigravity y Obsidian.
> Este índice único evita el consumo excesivo de tokens al consolidar rutas, stack y skills asociadas en una sola memoria.

| Proyecto | Ruta Local | Stack Tecnológico | Resumen | Skill Asociada | Ficha |
|---|---|---|---|---|---|
${rows}
---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Memoria]]
`;
      const idxFile = path.join(projFolder, '00 Indice de Proyectos.md');
      fs.writeFileSync(idxFile, idxContent, 'utf8');

      const { knowledgeDir } = getAntigravityPaths();
      if (fs.existsSync(knowledgeDir)) {
        try {
          for (const item of fs.readdirSync(knowledgeDir, { withFileTypes: true })) {
            if (item.isDirectory() && item.name.startsWith('proyecto-') && item.name !== 'proyectos-antigravity') {
              fs.rmSync(path.join(knowledgeDir, item.name), { recursive: true, force: true });
            }
          }
        } catch (e) {}

        const targetDir = path.join(knowledgeDir, 'proyectos-antigravity');
        const artDir = path.join(targetDir, 'artifacts');
        if (!fs.existsSync(artDir)) fs.mkdirSync(artDir, { recursive: true });
        const meta = {
          title: 'Proyectos Registrados — Antigravity',
          summary: 'Registro consolidado de proyectos vinculados en Antigravity con ruta, stack tecnológico y skills asociadas.',
          source: 'obsidian-vault',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          references: []
        };
        fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf8');
        fs.writeFileSync(path.join(artDir, '00 Indice de Proyectos.md'), idxContent, 'utf8');
      }

      return { indexPath: idxFile, count: projects.length, projects };
    }

    if (sub === 'register' || sub === 'scan' || sub === 'update') {
      const detected = detectProject(targetDir);
      const pName = detected.name;
      const associatedSkill = findSkill(pName, targetDir);
      const safeTitle = sanitize(pName);
      const noteFile = path.join(projFolder, `${safeTitle}.md`);
      const now = new Date().toISOString().split('T')[0];

      // Clean redundant note for same workspace path
      try {
        for (const f of fs.readdirSync(projFolder)) {
          if (!f.endsWith('.md') || f.startsWith('00') || f === `${safeTitle}.md`) continue;
          const oldFp = path.join(projFolder, f);
          const oldTxt = fs.readFileSync(oldFp, 'utf8');
          const mP = oldTxt.match(/>\s*-\s*\*\*Ruta local\*\*:\s*`([^`]+)`/i);
          if (mP && path.resolve(mP[1]).toLowerCase() === path.resolve(targetDir).toLowerCase()) {
            try { fs.unlinkSync(oldFp); } catch (e) {}
          }
        }
      } catch (e) {}

      let existingRules = '';
      let existingAntiPatterns = '';
      let existingBacklog = '';
      let existingSessions = '';
      let existingMemories = '';
      let existingSkills = '';
      if (fs.existsSync(noteFile)) {
        try {
          const ex = fs.readFileSync(noteFile, 'utf8');
          const rM = ex.match(/##\s*Reglas y Condiciones Obligatorias del Proyecto[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
          if (rM && rM[1].trim() && !rM[1].includes('<!-- Reglas operativas')) existingRules = rM[1].trim();

          const apM = ex.match(/##\s*Anti-Patrones y Trampas Prohibidas[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
          if (apM && apM[1].trim() && !apM[1].includes('<!-- Trampas técnicas')) existingAntiPatterns = apM[1].trim();

          const bM = ex.match(/##\s*Backlog y Tareas Pendientes[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
          if (bM && bM[1].trim() && !bM[1].includes('<!-- Tareas pendientes')) existingBacklog = bM[1].trim();

          const sesM = ex.match(/##\s*Bitácora de Sesiones y Avances Recientes[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
          if (sesM && sesM[1].trim() && !sesM[1].includes('*Sin sesiones registradas aún*')) existingSessions = sesM[1].trim();

          const mM = ex.match(/##\s*Memorias y Decisiones Vinculadas[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
          if (mM && mM[1].trim() && !mM[1].includes('<!-- Agrega enlaces')) existingMemories = mM[1].trim();

          const sM = ex.match(/##\s*Skills de Proyecto[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
          if (sM && sM[1].trim() && !sM[1].includes('<!-- Agrega skills')) existingSkills = sM[1].trim();
        } catch (e) {}
      }

      const skillLink = associatedSkill !== '—' ? `[[${associatedSkill}]]` : '—';
      const skillsSection = existingSkills || (associatedSkill !== '—' ? `- Skill vinculada: [[${associatedSkill}]]` : '<!-- Agrega skills específicas usando enlaces [[Skill]] -->');

      const noteContent = `---
title: "Proyecto: ${pName}"
type: antigravity-project
tags:
  - antigravity/proyecto
created: ${now}
updated: ${now}
---

# Proyecto: ${pName}

> [!INFO] **Ficha del Proyecto**
> - **Nombre**: \`${pName}\`
> - **Ruta local**: \`${targetDir}\`
> - **Stack**: ${detected.stack}
> - **Resumen**: ${detected.description}
> - **Skill Asociada**: ${skillLink}
> - **Última sincronización**: ${now}

### Detalles Técnicos Detectados
- **Versión**: \`${detected.version}\`
- **Framework / Core**: \`${detected.framework || detected.stack}\`
- **Dependencias clave**: ${detected.dependencies.slice(0, 15).map(d => `\`${d}\``).join(', ') || 'Ninguna'}

### Estructura Arquitectónica y Módulos Clave
${detected.structureMarkdown}

### Puntos de Entrada y Servicios
${detected.entrypointsMarkdown}

### Base de Datos y APIs
${detected.databaseMarkdown}

## Reglas y Condiciones Obligatorias del Proyecto
${existingRules || '<!-- Reglas operativas y condiciones obligatorias para este proyecto (commits, empaquetado, workflows, etc.) -->'}

## Anti-Patrones y Trampas Prohibidas del Proyecto
${existingAntiPatterns || '<!-- Trampas técnicas, errores a evitar y prácticas prohibidas en este repositorio -->'}

## Backlog y Tareas Pendientes
${existingBacklog || '- [ ] Tarea inicial del proyecto (gestiona tareas con `/obsidian project backlog`)'}

## Bitácora de Sesiones y Avances Recientes
${existingSessions || '| Fecha | Resumen de Sesión | Sesión |\n|---|---|---|\n| *Sin sesiones registradas aún* | — | — |'}

## Memorias y Decisiones Vinculadas
${existingMemories || '<!-- Agrega enlaces [[Nombre de la Memoria]] para conectar este proyecto con el grafo de Antigravity -->'}

## Skills de Proyecto
${skillsSection}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Proyectos]]
`;
      fs.writeFileSync(noteFile, noteContent, 'utf8');
      const idxResult = updateIndex();

      console.log(JSON.stringify({
        status: 'ok',
        action: sub === 'scan' ? 'scanned_and_updated' : 'registered',
        project: {
          name: pName,
          path: targetDir,
          stack: detected.stack,
          summary: detected.description,
          skill: associatedSkill,
          note: noteFile,
        },
        totalProjects: idxResult.count,
      }, null, 2));
      break;
    }

    if (sub === 'antipattern' || sub === 'antipatterns' || sub === 'trampa' || sub === 'trampas') {
      const action = (pPos[1] || 'list').toLowerCase();
      let pName = pFlags.project || pFlags.p;
      if (!pName) {
        const cur = process.cwd();
        const detected = detectProject(cur);
        pName = detected.name || path.basename(cur);
      }
      const safeTitle = sanitize(pName);
      let noteFile = path.join(vault.path, '02_Proyectos', safeTitle, 'ARCHITECTURE.md');
      if (!fs.existsSync(noteFile)) {
        noteFile = path.join(vault.path, '02_Proyectos', `${safeTitle}.md`);
      }
      if (!fs.existsSync(noteFile)) {
        const pFolder = path.join(vault.path, '02_Proyectos');
        if (fs.existsSync(pFolder)) {
          for (const ent of fs.readdirSync(pFolder, { withFileTypes: true })) {
            if (ent.name.toLowerCase() === safeTitle.toLowerCase() || ent.name.toLowerCase().replace(/[^a-z0-9]/g, '') === safeTitle.toLowerCase().replace(/[^a-z0-9]/g, '')) {
              if (ent.isDirectory()) {
                const cand = path.join(pFolder, ent.name, 'ARCHITECTURE.md');
                if (fs.existsSync(cand)) { noteFile = cand; pName = ent.name; break; }
              } else {
                noteFile = path.join(pFolder, ent.name);
                pName = ent.name.replace(/\.md$/, '');
                break;
              }
            }
          }
        }
      }
      if (!fs.existsSync(noteFile)) {
        const pFolder = path.join(vault.path, '02_Proyectos', safeTitle);
        if (!fs.existsSync(pFolder)) fs.mkdirSync(pFolder, { recursive: true });
        noteFile = path.join(pFolder, 'ARCHITECTURE.md');
        fs.writeFileSync(noteFile, `# Arquitectura — ${pName}\n\n## Anti-Patrones y Trampas Prohibidas\n`, 'utf8');
      }
      let content = fs.readFileSync(noteFile, 'utf8');
      if (action === 'add') {
        const ruleText = pPos.slice(2).join(' ') || pFlags.rule || pFlags.text || '';
        if (!ruleText.trim()) {
          console.error(JSON.stringify({ error: 'Uso: node obsidian.js project antipattern add "<regla o trampa a evitar>"' }));
          process.exit(1);
        }
        const bullet = `- **PROHIBIDO:** ${cleanText(ruleText)}`;
        if (content.includes('## Anti-Patrones y Trampas Prohibidas')) {
          content = content.replace(/(## Anti-Patrones y Trampas Prohibidas[^\r\n]*\r?\n)([\s\S]*?)(\r?\n##|$)/, (m, h, body, nextH) => {
            const cleanBody = body.replace(/<!--[\s\S]*?-->/g, '').trim();
            const newBody = cleanBody ? `${cleanBody}\n${bullet}` : bullet;
            return `${h}${newBody}\n${nextH}`;
          });
        } else {
          content += `\n\n## Anti-Patrones y Trampas Prohibidas\n${bullet}\n`;
        }
        fs.writeFileSync(noteFile, content, 'utf8');

        // Mirror directly to workspace rules
        try {
          const syncEngine = require('./sync-engine.js');
          let wsPath = process.cwd();
          const mP = content.match(/>\s*-\s*\*\*Ruta local\*\*:\s*`([^`]+)`/i) || content.match(/-\s*\*\*Ruta local\*\*:\s*`([^`]+)`/i);
          if (mP && fs.existsSync(mP[1].trim())) wsPath = mP[1].trim();
          syncEngine.syncProjectRulesToWorkspace(vault.path, wsPath, pName);
        } catch (e) {}

        console.log(JSON.stringify({ status: 'ok', action: 'antipattern_added', project: pName, rule: ruleText }));
      } else {
        const match = content.match(/## Anti-Patrones y Trampas Prohibidas[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
        const rules = match ? match[1].replace(/<!--[\s\S]*?-->/g, '').trim().split(/\r?\n/).filter(Boolean) : [];
        console.log(JSON.stringify({ project: pName, antipatterns: rules }, null, 2));
      }
      break;
    }

    if (sub === 'backlog' || sub === 'tasks' || sub === 'tareas') {
      const action = (pPos[1] || 'list').toLowerCase();
      const pName = pFlags.project || pFlags.p || path.basename(targetDir);
      const safeTitle = sanitize(pName);
      const noteFile = path.join(projFolder, `${safeTitle}.md`);
      if (!fs.existsSync(noteFile)) {
        console.error(JSON.stringify({ error: `Proyecto no encontrado en Obsidian: ${pName}` }));
        process.exit(1);
      }
      let content = fs.readFileSync(noteFile, 'utf8');
      if (action === 'add') {
        const taskText = pPos.slice(2).join(' ') || pFlags.task || pFlags.text || '';
        if (!taskText.trim()) {
          console.error(JSON.stringify({ error: 'Uso: node obsidian.js project backlog add "<tarea>"' }));
          process.exit(1);
        }
        const bullet = `- [ ] ${cleanText(taskText)}`;
        if (content.includes('## Backlog y Tareas Pendientes')) {
          content = content.replace(/(## Backlog y Tareas Pendientes[^\r\n]*\r?\n)([\s\S]*?)(\r?\n##|$)/, (m, h, body, nextH) => {
            const cleanBody = body.replace(/<!--[\s\S]*?-->/g, '').trim();
            const newBody = cleanBody ? `${cleanBody}\n${bullet}` : bullet;
            return `${h}${newBody}\n${nextH}`;
          });
        } else {
          content += `\n## Backlog y Tareas Pendientes\n${bullet}\n`;
        }
        fs.writeFileSync(noteFile, content, 'utf8');
        console.log(JSON.stringify({ status: 'ok', action: 'task_added', project: pName, task: taskText }));
      } else if (action === 'done' || action === 'complete') {
        const query = pPos.slice(2).join(' ') || pFlags.task || '';
        let marked = false;
        content = content.replace(/-\s*\[\s*\]\s*([^\r\n]+)/g, (fullLine, tText) => {
          if (!marked && (!query || tText.toLowerCase().includes(query.toLowerCase()))) {
            marked = true;
            return `- [x] ${tText}`;
          }
          return fullLine;
        });
        if (marked) {
          fs.writeFileSync(noteFile, content, 'utf8');
          console.log(JSON.stringify({ status: 'ok', action: 'task_completed', project: pName, query }));
        } else {
          console.log(JSON.stringify({ status: 'not_found', message: 'No se encontró tarea pendiente coincidente' }));
        }
      } else {
        const match = content.match(/## Backlog y Tareas Pendientes[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
        const lines = match ? match[1].split(/\r?\n/).filter(l => l.trim().startsWith('- [')) : [];
        const tasks = lines.map(l => ({
          done: l.includes('- [x]') || l.includes('- [X]'),
          text: l.replace(/^-\s*\[[ xX]\]\s*/, '').trim()
        }));
        console.log(JSON.stringify({ project: pName, total: tasks.length, tasks }, null, 2));
      }
      break;
    }

    if (sub === 'status') {
      const projects = getRegistry();
      const normTarget = path.resolve(targetDir).toLowerCase().replace(/\\/g, '/');
      const targetBase = path.basename(targetDir).toLowerCase();
      let found = null;
      for (const p of projects) {
        if (p.path && p.path !== '—') {
          const normP = path.resolve(p.path).toLowerCase().replace(/\\/g, '/');
          if (normP === normTarget) { found = p; break; }
        }
        if (p.name.toLowerCase() === targetBase) { found = p; break; }
      }
      console.log(JSON.stringify({
        registered: !!found,
        workspacePath: targetDir,
        project: found,
      }, null, 2));
      break;
    }

    // Default: list
    const projects = getRegistry();
    console.log(JSON.stringify({
      status: 'ok',
      count: projects.length,
      projects,
    }, null, 2));
    break;
  }

  case 'session':
  case 'sessions': {
    const { flags, positional } = parseFlags(args);
    const sesSub = (positional[0] || 'list').toLowerCase();
    const sesFolder = path.join(vault.path, '03_Sesiones');
    const projFolder = path.join(vault.path, '02_Proyectos');
    if (!fs.existsSync(sesFolder)) fs.mkdirSync(sesFolder, { recursive: true });

    function updateSessionsIndex() {
      const files = fs.readdirSync(sesFolder).filter(f => f.endsWith('.md') && !f.startsWith('00'));
      const list = [];
      for (const f of files) {
        try {
          const fp = path.join(sesFolder, f);
          const c = fs.readFileSync(fp, 'utf8');
          const base = f.replace(/\.md$/, '');
          let title = base;
          let proj = 'General';
          let date = '';
          let time = '';
          let summary = '';

          const mTitle = c.match(/^title:\s*["']?([^"'\r\n]+)["']?/m);
          if (mTitle) title = mTitle[1].trim();
          const mP = c.match(/^project:\s*["']?([^"'\r\n]+)["']?/m);
          if (mP) proj = mP[1].trim();
          const mD = c.match(/^date:\s*["']?([^"'\r\n]+)["']?/m);
          if (mD) date = mD[1].trim();
          const mT = c.match(/^updated:\s*["']?([^"'\r\n]+)["']?/m) || c.match(/^time:\s*["']?([^"'\r\n]+)["']?/m);
          if (mT) time = mT[1].trim();
          const mSum = c.match(/>\s*\[!NOTE\]\s*\*\*(?:Último Hito|Resumen)[^\r\n]*\*\*\r?\n>\s*([^\r\n]+)/i)
            || c.match(/^summary:\s*["']?([^"'\r\n]+)["']?/m);
          if (mSum) summary = mSum[1].trim();

          const milestoneMatches = c.match(/##\s*\d{2}:\d{2}\s*[—–-]/g) || [];
          const milestonesCount = milestoneMatches.length;

          const stat = fs.statSync(fp);
          list.push({
            file: f,
            base,
            title,
            project: proj,
            date: date || stat.mtime.toISOString().split('T')[0],
            time: time || '—',
            summary: summary || 'Sin resumen',
            milestones: milestonesCount,
            mtime: stat.mtimeMs
          });
        } catch (e) {}
      }

      list.sort((a, b) => b.mtime - a.mtime);

      let rows = '';
      if (list.length === 0) {
        rows = '| *Aún no hay sesiones registradas* | — | — | — | — |\n';
      } else {
        for (const s of list) {
          const badge = s.milestones > 1 ? ` (${s.milestones} hitos)` : '';
          rows += `| ${s.date} | ${s.time} | [[Proyecto: ${s.project}]] | ${s.summary.replace(/\|/g, '-')} | [[${s.base}]]${badge} |\n`;
        }
      }

      const now = new Date().toISOString().split('T')[0];
      const idxContent = `---
title: "Índice de Sesiones y Checkpoints — Antigravity"
type: antigravity-index
tags:
  - antigravity/sesiones
  - antigravity/index
created: ${now}
updated: ${now}
---

# Índice de Sesiones y Checkpoints — Antigravity

> [!INFO] **Bitácora de Continuidad de Trabajo**
> Registro cronológico de hitos, decisiones de arquitectura y sesiones de trabajo para mantener la continuidad entre conversaciones.

Total sesiones registradas: **${list.length}**

| Fecha | Hora | Proyecto | Resumen | Sesión |
|---|---|---|---|---|
${rows}
---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Proyectos]]
`;

      const idxFile = path.join(sesFolder, '00 Indice de Sesiones.md');
      fs.writeFileSync(idxFile, idxContent, 'utf8');
      return { count: list.length, sessions: list };
    }

    if (sesSub === 'recall' || sesSub === 'search') {
      const query = flags.query || flags.q || positional.slice(1).join(' ');
      const limit = parseInt(flags.limit || flags.max || '5', 10);
      const syncEngine = getSyncEngine();
      if (!query) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js session recall "<terminos>" [--limit 5]' }));
        process.exit(1);
      }
      if (syncEngine && typeof syncEngine.sessionRecall === 'function') {
        const res = syncEngine.sessionRecall(vault.path, query, limit);
        console.log(JSON.stringify(res, null, 2));
      }
      break;
    }

    if (sesSub === 'save' || sesSub === 'checkpoint' || sesSub === 'log') {
      const pName = flags.project || flags.p || positional[1] || path.basename(process.cwd());
      let summary = flags.summary || flags.s || flags.title || '';
      let content = flags.content || flags.c || flags.details || flags.body || '';

      // Decode base64 or file payloads if provided (avoids PowerShell escaping issues)
      if (flags.b64 || flags['content-b64'] || flags.base64) {
        try { content = Buffer.from(flags.b64 || flags['content-b64'] || flags.base64, 'base64').toString('utf8'); } catch (e) {}
      } else if (flags.file && fs.existsSync(flags.file)) {
        try { content = fs.readFileSync(flags.file, 'utf8'); } catch (e) {}
      } else if (flags.stdin) {
        try { content = fs.readFileSync(0, 'utf8'); } catch (e) {}
      }

      if (flags['summary-b64']) {
        try { summary = cleanText(Buffer.from(flags['summary-b64'], 'base64').toString('utf8')); } catch (e) {}
      }

      const tags = (flags.tags ? flags.tags.split(',') : []).map(t => cleanText(t).toLowerCase());
      if (!tags.includes('antigravity/sesion')) tags.push('antigravity/sesion');
      const safeProject = sanitize(pName);

      if (!summary && content) summary = cleanText(content).slice(0, 140);
      if (!summary && !content) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js session save --project "<nombre>" --summary "<resumen>" --content "<detalles>" [--b64 <base64>] [--file <ruta>]' }));
        process.exit(1);
      }

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const sessionBase = `${dateStr} - ${safeProject}`;
      const sessionFile = path.join(sesFolder, `${sessionBase}.md`);

      const milestoneHeading = `## ${hours}:${mins} — ${summary}`;
      const milestoneBody = `### Trabajo Realizado y Decisiones Técnicas\n${content || '*Sin detalles adicionales.*'}`;

      let sessionMd = '';
      let isNew = !fs.existsSync(sessionFile);
      let totalMilestones = 1;

      if (isNew) {
        sessionMd = `---
title: "Sesiones: ${pName} (${dateStr})"
type: antigravity-session-daily
project: "${pName}"
tags:
${tags.map(t => `  - ${t}`).join('\n')}
date: ${dateStr}
updated: "${hours}:${mins}"
summary: "${summary.replace(/"/g, '\\"')}"
milestones: 1
---

# Sesiones: ${pName} — ${dateStr}

> [!NOTE] **Último Hito (${hours}:${mins})**
> ${summary}

${milestoneHeading}

${milestoneBody}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[Proyecto: ${pName}]] | [[00 Indice de Sesiones]]
`;
      } else {
        let existing = fs.readFileSync(sessionFile, 'utf8');

        // Update frontmatter
        existing = existing.replace(/^updated:\s*["']?[^"'\r\n]+["']?/m, `updated: "${hours}:${mins}"`);
        existing = existing.replace(/^summary:\s*["']?[^"'\r\n]+["']?/m, `summary: "${summary.replace(/"/g, '\\"')}"`);
        existing = existing.replace(/^milestones:\s*(\d+)/m, (m, count) => {
          totalMilestones = parseInt(count, 10) + 1;
          return `milestones: ${totalMilestones}`;
        });

        // Update callout
        if (existing.includes('> [!NOTE] **Último Hito')) {
          existing = existing.replace(/>\s*\[!NOTE\]\s*\*\*Último Hito[^\r\n]*\*\*\r?\n>\s*[^\r\n]+/i, `> [!NOTE] **Último Hito (${hours}:${mins})**\n> ${summary}`);
        } else if (existing.includes('> [!NOTE] **Resumen')) {
          existing = existing.replace(/>\s*\[!NOTE\]\s*\*\*Resumen[^\r\n]*\*\*\r?\n>\s*[^\r\n]+/i, `> [!NOTE] **Último Hito (${hours}:${mins})**\n> ${summary}`);
        }

        const footerIdx = existing.lastIndexOf('\n---');
        if (footerIdx !== -1) {
          sessionMd = existing.slice(0, footerIdx) + `\n\n${milestoneHeading}\n\n${milestoneBody}\n` + existing.slice(footerIdx);
        } else {
          sessionMd = existing + `\n\n${milestoneHeading}\n\n${milestoneBody}\n`;
        }
      }

      fs.writeFileSync(sessionFile, sessionMd, 'utf8');
      updateSessionsIndex();

      // Append row to project note
      const projNote = path.join(projFolder, `${safeProject}.md`);
      if (fs.existsSync(projNote)) {
        try {
          let pContent = fs.readFileSync(projNote, 'utf8');
          const cleanAnchor = `${hours}:${mins} — ${summary}`.replace(/[#|^[\]]/g, '').trim();
          const row = `| ${dateStr} ${hours}:${mins} | ${summary.replace(/\|/g, '-')} | [[${sessionBase}#${cleanAnchor}|${sessionBase}]] |\n`;
          if (pContent.includes('## Bitácora de Sesiones y Avances Recientes')) {
            pContent = pContent.replace(/(## Bitácora de Sesiones y Avances Recientes[^\r\n]*\r?\n)(\| Fecha[^\r\n]*\r?\n\|---[^\r\n]*\r?\n)([\s\S]*?)(\r?\n##|$)/, (m, h, tableH, body, nextH) => {
              const cleanBody = body.replace(/\|\s*\*Sin sesiones registradas aún\*[^\r\n]*\r?\n/g, '').trim();
              const existingRows = cleanBody ? cleanBody.split(/\r?\n/).slice(0, 14).join('\n') + '\n' : '';
              return `${h}${tableH}${row}${existingRows}${nextH}`;
            });
            fs.writeFileSync(projNote, pContent, 'utf8');
          }
        } catch (e) {}
      }

      console.log(JSON.stringify({
        status: 'ok',
        action: 'session_saved',
        model: 'daily_log',
        project: pName,
        summary,
        sessionFile,
        note: sessionBase,
        milestones: totalMilestones,
      }, null, 2));
      break;
    }

    if (sesSub === 'consolidate') {
      const files = fs.readdirSync(sesFolder).filter(f => f.endsWith('.md') && !f.startsWith('00'));
      const groups = {};
      for (const f of files) {
        const legacyMatch = f.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})\s*-\s*(.+)\.md$/);
        const dailyMatch = f.match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(.+)\.md$/);
        if (legacyMatch) {
          const [, date, hh, mm, proj] = legacyMatch;
          const key = `${date}___${proj}`;
          if (!groups[key]) groups[key] = { date, project: proj, files: [] };
          groups[key].files.push({ file: f, time: `${hh}:${mm}`, fullPath: path.join(sesFolder, f), isLegacy: true });
        } else if (dailyMatch) {
          const [, date, proj] = dailyMatch;
          const key = `${date}___${proj}`;
          if (!groups[key]) groups[key] = { date, project: proj, files: [] };
          groups[key].files.push({ file: f, time: 'daily', fullPath: path.join(sesFolder, f), isDaily: true });
        }
      }

      let consolidatedCount = 0;
      for (const [, group] of Object.entries(groups)) {
        const hasLegacy = group.files.some(item => item.isLegacy);
        if (!hasLegacy) continue;

        const targetDailyBase = `${group.date} - ${group.project}`;
        const targetDailyPath = path.join(sesFolder, `${targetDailyBase}.md`);

        group.files.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        const allMilestones = [];
        let pName = group.project;
        let lastSummary = '';
        let lastTime = '';

        for (const item of group.files) {
          try {
            const fileContent = fs.readFileSync(item.fullPath, 'utf8');
            const mP = fileContent.match(/^project:\s*["']?([^"'\r\n]+)["']?/m);
            if (mP) pName = mP[1].trim();

            if (item.isLegacy) {
              const mSum = fileContent.match(/>\s*\[!NOTE\]\s*\*\*Resumen[^\r\n]*\*\*\r?\n>\s*([^\r\n]+)/i)
                || fileContent.match(/^summary:\s*["']?([^"'\r\n]+)["']?/m);
              const summary = mSum ? mSum[1].trim() : 'Checkpoint de trabajo';
              const mWork = fileContent.match(/##\s*Trabajo Realizado y Decisiones Técnicas[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
              const work = mWork ? mWork[1].trim() : '';

              allMilestones.push({
                time: item.time,
                summary,
                details: work,
              });
              lastSummary = summary;
              lastTime = item.time;
            } else if (item.isDaily) {
              const mRegex = /##\s*(\d{2}:\d{2})\s*[—–-]\s*([^\r\n]+)\r?\n([\s\S]*?)(?=(?:\r?\n##\s*\d{2}:\d{2}\s*[—–-])|(?:\r?\n---)|$)/g;
              let mMatch;
              while ((mMatch = mRegex.exec(fileContent)) !== null) {
                allMilestones.push({
                  time: mMatch[1],
                  summary: mMatch[2].trim(),
                  details: mMatch[3].trim(),
                });
                lastSummary = mMatch[2].trim();
                lastTime = mMatch[1];
              }
            }
          } catch (e) {}
        }

        const uniqueMilestones = [];
        const seen = new Set();
        for (const m of allMilestones) {
          const mKey = `${m.time}_${m.summary}`;
          if (!seen.has(mKey)) {
            seen.add(mKey);
            uniqueMilestones.push(m);
          }
        }
        uniqueMilestones.sort((a, b) => a.time.localeCompare(b.time));

        if (uniqueMilestones.length > 0) {
          lastSummary = uniqueMilestones[uniqueMilestones.length - 1].summary;
          lastTime = uniqueMilestones[uniqueMilestones.length - 1].time;
        }

        const milestoneBlocks = uniqueMilestones.map(m =>
          `## ${m.time} — ${m.summary}\n\n### Trabajo Realizado y Decisiones Técnicas\n${m.details || '*Sin detalles adicionales.*'}`
        ).join('\n\n');

        const dailyMd = `---
title: "Sesiones: ${pName} (${group.date})"
type: antigravity-session-daily
project: "${pName}"
tags:
  - antigravity/sesion
date: ${group.date}
updated: "${lastTime || '12:00'}"
summary: "${lastSummary.replace(/"/g, '\\"')}"
milestones: ${uniqueMilestones.length}
---

# Sesiones: ${pName} — ${group.date}

> [!NOTE] **Último Hito (${lastTime || '12:00'})**
> ${lastSummary}

${milestoneBlocks}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[Proyecto: ${pName}]] | [[00 Indice de Sesiones]]
`;

        fs.writeFileSync(targetDailyPath, dailyMd, 'utf8');

        for (const item of group.files) {
          if (item.isLegacy && fs.existsSync(item.fullPath)) {
            try { fs.unlinkSync(item.fullPath); } catch (e) {}
          }
        }
        consolidatedCount += group.files.filter(f => f.isLegacy).length;
      }

      updateSessionsIndex();
      console.log(JSON.stringify({
        status: 'ok',
        action: 'consolidated',
        legacyFilesMerged: consolidatedCount,
      }, null, 2));
      break;
    }

    if (sesSub === 'last' || sesSub === 'recent' || sesSub === 'peek') {
      const pName = flags.project || flags.p || positional[1] || '';
      const files = fs.readdirSync(sesFolder).filter(f => f.endsWith('.md') && !f.startsWith('00'));
      const list = [];
      for (const f of files) {
        try {
          const fp = path.join(sesFolder, f);
          const c = fs.readFileSync(fp, 'utf8');
          let proj = '';
          const mP = c.match(/^project:\s*["']?([^"'\r\n]+)["']?/m);
          if (mP) proj = mP[1].trim();
          if (pName && proj.toLowerCase() !== pName.toLowerCase() && !f.toLowerCase().includes(pName.toLowerCase())) {
            continue;
          }
          const stat = fs.statSync(fp);
          list.push({ file: f, path: fp, content: c, mtime: stat.mtimeMs, project: proj });
        } catch (e) {}
      }
      list.sort((a, b) => b.mtime - a.mtime);
      if (list.length === 0) {
        console.log(JSON.stringify({ status: 'empty', message: pName ? `Sin sesiones previas para ${pName}` : 'Sin sesiones registradas' }));
        break;
      }
      const latest = list[0];

      // Parse milestones
      const milestones = [];
      const mRegex = /##\s*(\d{2}:\d{2})\s*[—–-]\s*([^\r\n]+)\r?\n([\s\S]*?)(?=(?:\r?\n##\s*\d{2}:\d{2}\s*[—–-])|(?:\r?\n---)|$)/g;
      let mMatch;
      while ((mMatch = mRegex.exec(latest.content)) !== null) {
        milestones.push({
          time: mMatch[1],
          summary: mMatch[2].trim(),
          details: mMatch[3].trim(),
        });
      }

      let summary = '';
      let work = '';
      let timeLabel = '';

      if (milestones.length > 0) {
        const lastM = milestones[milestones.length - 1];
        summary = lastM.summary;
        work = lastM.details;
        timeLabel = ` a las ${lastM.time}`;
      } else {
        const mSum = latest.content.match(/>\s*\[!NOTE\]\s*\*\*(?:Último Hito|Resumen)[^\r\n]*\*\*\r?\n>\s*([^\r\n]+)/i)
          || latest.content.match(/^summary:\s*["']?([^"'\r\n]+)["']?/m);
        summary = mSum ? mSum[1].trim() : 'Sin resumen';
        const mWork = latest.content.match(/##\s*Trabajo Realizado y Decisiones Técnicas[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
        work = mWork ? mWork[1].trim() : '';
      }

      if (flags.json) {
        console.log(JSON.stringify({
          project: latest.project,
          sessionFile: latest.file,
          summary,
          details: work,
          totalMilestones: milestones.length || 1,
        }, null, 2));
      } else {
        console.log(`[SESION PREVIA: ${latest.project || 'General'}${timeLabel}]\nResumen: ${summary}\n\nDetalles:\n${work}`);
      }
      break;
    }

    // Default: list
    const limit = parseInt(flags.limit || '10', 10);
    const { sessions } = updateSessionsIndex();
    console.log(JSON.stringify({
      status: 'ok',
      total: sessions.length,
      sessions: sessions.slice(0, limit)
    }, null, 2));
    break;
  }

  case 'export': {
    const syncEngine = getSyncEngine();
    const { flags } = parseFlags(args);
    const pwd = flags.password || flags.pass || flags.p;
    if (!pwd) {
      console.error(JSON.stringify({ error: 'Uso: node obsidian.js export --password <contraseña> [--output <archivo>]' }));
      process.exit(1);
    }
    const outFile = flags.output || flags.out || flags.file || path.join(process.cwd(), `antigravity-vault-${new Date().toISOString().split('T')[0]}.agvault`);
    const encJson = syncEngine.exportVaultEncrypted(vault.path, pwd);
    fs.writeFileSync(outFile, encJson, 'utf8');
    console.log(JSON.stringify({ status: 'ok', file: outFile, size: encJson.length }, null, 2));
    break;
  }

  case 'import': {
    const syncEngine = getSyncEngine();
    const { flags } = parseFlags(args);
    const pwd = flags.password || flags.pass || flags.p;
    const inFile = flags.file || flags.input || flags.in;
    if (!pwd || !inFile || !fs.existsSync(inFile)) {
      console.error(JSON.stringify({ error: 'Uso: node obsidian.js import --file <archivo.agvault> --password <contraseña>' }));
      process.exit(1);
    }
    const encJson = fs.readFileSync(inFile, 'utf8');
    const res = syncEngine.importVaultEncrypted(vault.path, pwd, encJson);
    console.log(JSON.stringify({ status: 'ok', restoredFiles: res.restoredFiles }, null, 2));
    break;
  }

  case 'mcp': {
    const syncEngine = getSyncEngine();
    const { flags, positional } = parseFlags(args);
    const sub = (positional[0] || 'status').toLowerCase();
    const mcpServerFile = path.join(__dirname, 'mcp-server.js');

    if (sub === 'start') {
      if (fs.existsSync(mcpServerFile)) {
        require(mcpServerFile);
      } else {
        console.error(JSON.stringify({ error: `No se encontró ${mcpServerFile}` }));
        process.exit(1);
      }
      break;
    }

    if (sub === 'config' || sub === 'schema') {
      const configJson = {
        mcpServers: {
          "antigravity-obsidian": {
            command: "node",
            args: [mcpServerFile.replace(/\\/g, '/')],
            env: {
              OBSIDIAN_VAULT_PATH: vault.path.replace(/\\/g, '/')
            },
            disabled: false
          }
        }
      };
      console.log(JSON.stringify(configJson, null, 2));
      break;
    }

    if (sub === 'install') {
      const targetV = flags.vault || positional[1] || vault.path;
      const res = syncEngine.installMcpServer(targetV, flags);
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    if (sub === 'disable') {
      const res = syncEngine.disableMcpServer();
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    if (sub === 'enable') {
      const targetV = flags.vault || positional[1] || vault.path;
      const res = syncEngine.enableMcpServer(targetV);
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    if (sub === 'uninstall' || sub === 'remove' || sub === 'rm') {
      const res = syncEngine.uninstallMcpServer();
      console.log(JSON.stringify(res, null, 2));
      break;
    }

    // Default: status
    const status = syncEngine.getMcpStatus(vault.path);
    console.log(JSON.stringify({
      status: 'ok',
      ...status,
      note: status.enabled 
        ? 'El servidor MCP está activo en mcp_config.json. Antigravity utilizará herramientas obsidian_* directamente.'
        : (status.installed 
          ? 'El servidor MCP está deshabilitado (disabled: true). Antigravity opera vía Node CLI como fallback.'
          : 'El servidor MCP no está instalado en mcp_config.json. Para instalarlo sin romper otros servidores: node obsidian.js mcp install')
    }, null, 2));
    break;
  }

  case 'tool': {
    const toolsEngine = getToolsEngine();
    if (!toolsEngine) {
      console.error(JSON.stringify({ error: 'No se pudo cargar tools-engine.js' }));
      process.exit(1);
    }
    const { flags, positional } = parseFlags(args);
    const sub = (positional[0] || 'list').toLowerCase();

    if (sub === 'install' || sub === 'add') {
      const repoUrl = positional[1] || flags.repo || flags.url;
      if (!repoUrl) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js tool install <repoUrl> [--name <nombre>] [--desc "<desc>"]' }));
        process.exit(1);
      }
      toolsEngine.installFromGithub(repoUrl, {
        name: flags.name,
        description: flags.desc || flags.description
      }, vault.path)
        .then(res => console.log(JSON.stringify(res, null, 2)))
        .catch(err => {
          console.error(JSON.stringify({ error: err.message || String(err) }));
          process.exit(1);
        });
      break;
    }

    if (sub === 'create') {
      const toolName = positional[1] || flags.name;
      if (!toolName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js tool create <nombre> [--cmd "<comando>"] [--desc "<desc>"]' }));
        process.exit(1);
      }
      try {
        const res = toolsEngine.createTool({
          name: toolName,
          command: flags.cmd || flags.command || '',
          description: flags.desc || flags.description || 'Herramienta personalizada',
          type: flags.type || 'cli'
        }, vault.path);
        console.log(JSON.stringify(res, null, 2));
      } catch (err) {
        console.error(JSON.stringify({ error: err.message || String(err) }));
        process.exit(1);
      }
      break;
    }

    if (sub === 'run' || sub === 'exec') {
      const toolName = positional[1] || flags.name;
      if (!toolName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js tool run <nombre> [argumentos...]' }));
        process.exit(1);
      }
      const toolArgs = positional.slice(2);
      toolsEngine.runTool(toolName, toolArgs)
        .then(res => console.log(JSON.stringify(res, null, 2)))
        .catch(err => {
          console.error(JSON.stringify({ error: err.message || String(err) }));
          process.exit(1);
        });
      break;
    }

    if (sub === 'uninstall' || sub === 'remove' || sub === 'rm') {
      const toolName = positional[1] || flags.name;
      if (!toolName) {
        console.error(JSON.stringify({ error: 'Uso: node obsidian.js tool uninstall <nombre>' }));
        process.exit(1);
      }
      try {
        const res = toolsEngine.uninstallTool(toolName, vault.path);
        console.log(JSON.stringify(res, null, 2));
      } catch (err) {
        console.error(JSON.stringify({ error: err.message || String(err) }));
        process.exit(1);
      }
      break;
    }

    // Default: list
    const res = toolsEngine.listTools(vault.path);
    console.log(JSON.stringify(res, null, 2));
    break;
  }

  case 'open': {
    const note = args[0] || 'Antigravity/00 Antigravity Hub';
    const clean = note.endsWith('.md') ? note.slice(0, -3) : note;
    const uri = `obsidian://open?vault=${encodeURIComponent(vault.name)}&file=${encodeURIComponent(clean.replace(/\\/g, '/'))}`;
    if (process.platform === 'win32') exec(`start "" "${uri}"`);
    else if (process.platform === 'darwin') exec(`open "${uri}"`);
    else exec(`xdg-open "${uri}"`);
    console.log(JSON.stringify({ status: 'ok', uri }));
    break;
  }

  case 'help':
  default:
    console.log(`
Comandos de Obsidian for Antigravity (Zero Emojis, Ultra-Bajo Contexto, Hermes Closed Loop):
  node obsidian.js memory-update --target USER.md|MEMORY.md --operation append|replace|prune --content "..." (Memoria acotada con límites duros)
  node obsidian.js quotas               (Consulta consumo de cuota de caracteres de USER.md y MEMORY.md)
  node obsidian.js bootstrap            (Compila e imprime el bloque de arranque rápido [SYSTEM BOOTSTRAP: HERMES MEMORY ACTIVE])
  node obsidian.js nudge                (Directiva de empujón interno de reflexión periódica [INTERNAL NUDGE])
  node obsidian.js skill save <nombre> --content "..." [--version-bump] [--triggers "..."] (Playbook procedural automejorable)
  node obsidian.js skill get <nombre>   (Recupera procedimiento operativo vivo de una skill)
  node obsidian.js session recall "<q>" (Búsqueda textual rápida en sesiones y trayectorias)
  node obsidian.js name "<nombre>"      (Cambiar nombre del agente de IA inmediatamente)
  node obsidian.js user "<trato>"       (Cambiar trato hacia el usuario inmediatamente)
  node obsidian.js config [get|set ...] (Consultar o actualizar ajustes de configuracion)
  node obsidian.js status               (Estado de conexion, stats y personalidad)
  node obsidian.js personality [args]   (Ver o calibrar personalidad completa y trato)
  node obsidian.js project scan [path]  (Escanear arquitectura viva y actualizar blueprint del proyecto)
  node obsidian.js project register [path] (Registrar proyecto con analisis estructural profundo)
  node obsidian.js project list         (Listar proyectos vinculados)
  node obsidian.js project antipattern [list|add "<regla>"] (Gestionar trampas y errores prohibidos)
  node obsidian.js project backlog [list|add "<tarea>"|done "<tarea>"] (Backlog bidireccional Obsidian <-> IDE)
  node obsidian.js session save --summary "..." --content "..." [--project "..."] (Guardar checkpoint de sesion)
  node obsidian.js session last [--project "..."] (Recuperar contexto y decisiones de la sesion previa)
  node obsidian.js session list [--limit N] (Listar sesiones e hitos recientes)
  node obsidian.js triage "<query>"     (Triage ultra-compacto: Skill vs Memoria vs Nada)
  node obsidian.js peek "<nota>"        (Solucion tecnica directa sin metadatos)
  node obsidian.js save --title "..." --summary "..." --content "..." (Guardado atomico de conocimiento)
  node obsidian.js skill list [--scope global|project] (Listar skills disponibles)
  node obsidian.js skill view <nombre>  (Ver instrucciones y scripts de una skill con bajo contexto)
  node obsidian.js skill create <nombre> --desc "<desc>" --content "<instrucciones>" [--scope global|project]
  node obsidian.js skill edit <nombre> [--desc "..."] [--content "..."] [--append "..."]
  node obsidian.js skill delete <nombre> (Eliminar skill y su sincronizacion)
  node obsidian.js skill script <skill> add <file> --code "..." (Agregar script a una skill)
  node obsidian.js rule list            (Listar reglas activas globales y de workspace)
  node obsidian.js rule view <nombre>   (Ver contenido de una regla)
  node obsidian.js rule add "[<Proyecto>] <regla>" (Registrar regla obligatoria)
  node obsidian.js soul                 (Soul de Antigravity, Perfil de Usuario y Personalidad)
  node obsidian.js learn "<habito>"     (Registra preferencia o habito aprendido)
  node obsidian.js catalog              (Resumen 1-linea de skills y memorias)
  node obsidian.js skills               (Lista rapida de skills con descripcion corta)
  node obsidian.js memories             (Lista rapida de memorias con resumen corto)
  node obsidian.js search "<query>"     (Busqueda compacta)
  node obsidian.js read "<nota>"        (Lectura completa de archivo)
  node obsidian.js open [nota]          (Abrir en Obsidian Desktop)
    `);
    break;
}
