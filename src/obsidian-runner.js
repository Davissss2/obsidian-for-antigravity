#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

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

  return null;
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

function ensureDirs(vaultPath) {
  const dirs = [
    path.join(vaultPath, 'Antigravity'),
    path.join(vaultPath, 'Antigravity', 'Memoria'),
    path.join(vaultPath, 'Antigravity', 'Skills'),
    path.join(vaultPath, 'Antigravity', 'Proyectos'),
  ];
  for (const d of dirs) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

// -------------------------------------------------------------
// Manifest Cache & Compact Index
// -------------------------------------------------------------
const MANIFEST_FILE = path.join(vault.path, 'Antigravity', 'context-manifest.json');

function buildManifest(vaultPath) {
  ensureDirs(vaultPath);
  const memDir = path.join(vaultPath, 'Antigravity', 'Memoria');
  const skiDir = path.join(vaultPath, 'Antigravity', 'Skills');
  const proDir = path.join(vaultPath, 'Antigravity', 'Proyectos');

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
        memories.push({
          title,
          category,
          summary: summary.slice(0, 130),
          tags,
          relPath: `Antigravity/Memoria/${f}`,
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
          relPath: `Antigravity/Skills/${f}`,
        });
      } catch (e) {}
    }
  }

  const projects = [];
  if (fs.existsSync(proDir)) {
    for (const f of fs.readdirSync(proDir)) {
      if (!f.endsWith('.md') || f.startsWith('00')) continue;
      projects.push(f.replace(/\.md$/, ''));
    }
  }

  const manifest = {
    updatedAt: new Date().toISOString(),
    vaultName: vault.name,
    stats: { memories: memories.length, skills: skills.length, projects: projects.length },
    skills,
    memories,
    projects,
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
    target = find(path.join(vaultPath, 'Antigravity'));
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
    else if (a === '--content' && argsList[i+1]) { content = argsList[i+1]; i++; }
    else if (a === '--summary' && argsList[i+1]) { summary = cleanText(argsList[i+1]); i++; }
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
  const memFolder = path.join(vaultPath, 'Antigravity', 'Memoria');
  const cleanTitle = sanitize(title);
  const filePath = path.join(memFolder, cleanTitle + '.md');
  const now = new Date().toISOString().split('T')[0];

  let relatedLinks = '';
  if (project) {
    relatedLinks = `\n### Proyecto: [[${project}]]\n`;
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

## Solucion Tecnica

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

  case 'skills':
  case 'list-skills': {
    const manifest = getManifest(vault.path);
    const compactSkills = manifest.skills.map(s => ({ name: s.name, desc: s.description }));
    console.log(JSON.stringify(compactSkills, null, 2));
    break;
  }

  case 'memories': {
    const manifest = getManifest(vault.path);
    const compactMem = manifest.memories.map(m => ({ title: m.title, cat: m.category, desc: m.summary }));
    console.log(JSON.stringify(compactMem, null, 2));
    break;
  }

  case 'personality': {
    const almaDir = path.join(vault.path, 'Antigravity', 'Alma');
    if (!fs.existsSync(almaDir)) fs.mkdirSync(almaDir, { recursive: true });

    const pFileEs = path.join(almaDir, '00 Personalidad de la IA.md');
    const pFileEn = path.join(almaDir, '00 AI Personality.md');
    let pFile = fs.existsSync(pFileEn) ? pFileEn : pFileEs;

    const cfgFile = path.join(os.homedir(), '.gemini', 'config', 'antigravity-obsidian.json');
    let existingCfg = {};
    if (fs.existsSync(cfgFile)) {
      try { existingCfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8')); } catch (e) {}
    }

    // Parse flags
    let aiName = null;
    let userCallsign = null;
    let personality = null;
    let reset = false;

    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === '--ai-name' && args[i + 1]) {
        aiName = args[++i];
      } else if (a === '--user-callsign' && args[i + 1]) {
        userCallsign = args[++i];
      } else if (a === '--personality' && args[i + 1]) {
        personality = args[++i];
      } else if (a === '--reset' || a === 'reset') {
        reset = true;
      }
    }

    // If positional arguments passed without flags
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
      existingCfg.personalityConfigured = false;
      fs.writeFileSync(cfgFile, JSON.stringify(existingCfg, null, 2), 'utf8');

      if (fs.existsSync(pFile)) {
        let content = fs.readFileSync(pFile, 'utf8');
        content = content.replace(/^configured:\s*(?:true|false)/m, 'configured: false')
          .replace(/^status:\s*["']?[^"'\r\n]+["']?/m, 'status: "pending_onboarding"');
        fs.writeFileSync(pFile, content, 'utf8');
      }

      try {
        const { installSkillAndRules } = require(path.join(__dirname, 'skill-installer'));
        installSkillAndRules(vault.path, { personalityConfigured: false });
      } catch (e) {}

      console.log(JSON.stringify({
        status: 'ok',
        configured: false,
        message: 'Personalidad reiniciada. Se solicitará calibración en la primera interacción del chat.',
      }, null, 2));
      break;
    }

    const isUpdating = (aiName !== null || userCallsign !== null || personality !== null);

    if (isUpdating) {
      const finalAiName = (aiName || existingCfg.aiName || 'Hermes').trim();
      const finalCallsign = (userCallsign || existingCfg.userCallsign || existingCfg.userName || process.env.USERNAME || 'User').trim();
      const finalPersonality = (personality || existingCfg.personality || 'Ingeniero senior de élite, autónomo, pragmático y de precisión quirúrgica. Respuestas técnicas, directas, sin paja corporativa y estrictamente CERO emojis.').trim();

      existingCfg.aiName = finalAiName;
      existingCfg.userCallsign = finalCallsign;
      existingCfg.personality = finalPersonality;
      existingCfg.personalityConfigured = true;
      existingCfg.lastUpdated = new Date().toISOString();
      fs.writeFileSync(cfgFile, JSON.stringify(existingCfg, null, 2), 'utf8');

      const isEn = existingCfg.language === 'en';
      const now = new Date().toISOString().split('T')[0];
      const targetNotePath = isEn ? pFileEn : pFileEs;

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

      // Refresh rules and Hub immediately
      try {
        const { installSkillAndRules } = require(path.join(__dirname, 'skill-installer'));
        installSkillAndRules(vault.path, {
          aiName: finalAiName,
          userCallsign: finalCallsign,
          personality: finalPersonality,
          personalityConfigured: true,
        });
      } catch (e) {}

      console.log(JSON.stringify({
        status: 'ok',
        configured: true,
        aiName: finalAiName,
        userCallsign: finalCallsign,
        personality: finalPersonality,
        notePath: targetNotePath,
        message: 'Personalidad del agente calibrada y fijada con éxito. Ya no se volverá a preguntar en ningún chat.',
      }, null, 2));
      break;
    }

    // Read current personality
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
        if (mConf) curConf = mConf[1] === 'true';
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
    const almaDir = path.join(vault.path, 'Antigravity', 'Alma');
    const soulFile = path.join(almaDir, '00 Soul de Antigravity.md');
    const userFile = path.join(almaDir, '00 Perfil de Usuario.md');
    const pFile = fs.existsSync(path.join(almaDir, '00 AI Personality.md'))
      ? path.join(almaDir, '00 AI Personality.md')
      : path.join(almaDir, '00 Personalidad de la IA.md');

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
    if (learnArgs[0] === '--project' && learnArgs[1]) {
      project = cleanText(learnArgs[1]);
      learnArgs = learnArgs.slice(2);
    }
    const learning = learnArgs.join(' ').trim();
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

    const almaDir = path.join(vault.path, 'Antigravity', 'Alma');
    if (!fs.existsSync(almaDir)) fs.mkdirSync(almaDir, { recursive: true });
    const userFile = path.join(almaDir, '00 Perfil de Usuario.md');
    const now = new Date().toISOString().split('T')[0];
    const entry = `- \`[${now}]\` ${learning}`;

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

    // Also persist in Project note if a project was targeted
    let projectNoteUpdated = null;
    if (project) {
      const projDir = path.join(vault.path, 'Antigravity', 'Proyectos');
      if (fs.existsSync(projDir)) {
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
            pContent = pContent.replace('---', `## Reglas y Condiciones Obligatorias del Proyecto\n${entry}\n\n---`);
          }
          fs.writeFileSync(projFile, pContent, 'utf8');
          projectNoteUpdated = projFile;
        }
      }
    }

    // Also update global GEMINI.md & AGENTS.md rules immediately
    try {
      const { installSkillAndRules } = require(path.join(__dirname, 'skill-installer'));
      installSkillAndRules(vault.path);
    } catch (e) {}

    console.log(JSON.stringify({
      status: 'ok',
      message: 'Aprendizaje registrado en Perfil de Usuario' + (projectNoteUpdated ? ' y en la ficha del Proyecto' : '') + '.',
      entry,
      projectNoteUpdated,
    }, null, 2));
    break;
  }

  case 'status': {
    const manifest = getManifest(vault.path);
    const almaDir = path.join(vault.path, 'Antigravity', 'Alma');
    const pFile = fs.existsSync(path.join(almaDir, '00 AI Personality.md'))
      ? path.join(almaDir, '00 AI Personality.md')
      : path.join(almaDir, '00 Personalidad de la IA.md');
    let aiName = 'Hermes';
    let userCallsign = 'User';
    let personalityConfigured = false;
    if (fs.existsSync(pFile)) {
      try {
        const c = fs.readFileSync(pFile, 'utf8');
        const mAi = c.match(/^ai_name:\s*["']?([^"'\r\n]+)["']?/m);
        if (mAi) aiName = mAi[1].trim();
        const mCall = c.match(/^user_callsign:\s*["']?([^"'\r\n]+)["']?/m);
        if (mCall) userCallsign = mCall[1].trim();
        const mConf = c.match(/^configured:\s*(true|false)/m);
        if (mConf) personalityConfigured = mConf[1] === 'true';
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
    const memDir = path.join(vault.path, 'Antigravity', 'Memoria');
    const skiDir = path.join(vault.path, 'Antigravity', 'Skills');
    const proDir = path.join(vault.path, 'Antigravity', 'Proyectos');
    const sesDir = path.join(vault.path, 'Antigravity', 'Sesiones');

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
    const sub = (args[0] || 'list').toLowerCase();
    const targetDir = args[1] ? path.resolve(args[1]) : process.cwd();
    const projFolder = path.join(vault.path, 'Antigravity', 'Proyectos');
    if (!fs.existsSync(projFolder)) fs.mkdirSync(projFolder, { recursive: true });

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
      for (const f of fs.readdirSync(projFolder)) {
        if (!f.endsWith('.md') || f.startsWith('00')) continue;
        try {
          const content = fs.readFileSync(path.join(projFolder, f), 'utf8');
          const base = f.replace(/\.md$/, '');
          let name = base;
          let pPath = '—';
          let stack = '—';
          let summary = '—';
          let skill = '—';
          const mN = content.match(/>\s*-\s*\*\*Nombre\*\*:\s*`([^`]+)`/i);
          if (mN) name = mN[1].trim();
          const mP = content.match(/>\s*-\s*\*\*Ruta local\*\*:\s*`([^`]+)`/i);
          if (mP) pPath = mP[1].trim();
          const mS = content.match(/>\s*-\s*\*\*Stack\*\*:\s*([^\r\n]+)/i);
          if (mS) stack = mS[1].trim();
          const mSum = content.match(/>\s*-\s*\*\*Resumen\*\*:\s*([^\r\n]+)/i);
          if (mSum) summary = mSum[1].trim();
          const mSk = content.match(/>\s*-\s*\*\*Skill Asociada\*\*:\s*\[\[?([^\]\r\n]+)\]\]?/i);
          if (mSk) skill = mSk[1].replace(/^\[\[|\]\]$/g, '').trim();
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

    if (sub === 'register') {
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
      let existingMemories = '';
      let existingSkills = '';
      if (fs.existsSync(noteFile)) {
        try {
          const ex = fs.readFileSync(noteFile, 'utf8');
          const rM = ex.match(/##\s*Reglas y Condiciones Obligatorias del Proyecto[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
          if (rM && rM[1].trim()) existingRules = rM[1].trim();
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

## Reglas y Condiciones Obligatorias del Proyecto
${existingRules || '<!-- Reglas operativas y condiciones obligatorias para este proyecto (commits, empaquetado, workflows, etc.) -->'}

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
        action: 'registered',
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
Comandos de Obsidian for Antigravity (Zero Emojis, Ultra-Bajo Contexto):
  node obsidian.js status               (Estado de conexion, stats y personalidad)
  node obsidian.js personality [args]   (Ver o configurar personalidad, nombre de IA y trato)
  node obsidian.js project [register|list|status] [path] (Indice unificado y deteccion de proyectos)
  node obsidian.js triage "<query>"     (Triage ultra-compacto: Skill vs Memoria vs Nada)
  node obsidian.js peek "<nota>"        (Solucion tecnica directa sin metadatos)
  node obsidian.js save --title "..." --summary "..." --content "..." (Guardado atomico)
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
