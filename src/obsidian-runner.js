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
  // Fallback to process.env.OBSIDIAN_VAULT_PATH
  if (process.env.OBSIDIAN_VAULT_PATH && fs.existsSync(process.env.OBSIDIAN_VAULT_PATH)) {
    return { path: process.env.OBSIDIAN_VAULT_PATH, name: path.basename(process.env.OBSIDIAN_VAULT_PATH) };
  }
  // Fallback to obsidian.json
  const obsJson = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'obsidian', 'obsidian.json');
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
  // Fallback to Documents/Obsidian Vault
  const docVault = path.join(os.homedir(), 'Documents', 'Obsidian Vault');
  if (fs.existsSync(docVault)) {
    return { path: docVault, name: 'Obsidian Vault' };
  }
  return null;
}

const vault = getVaultPath();
if (!vault) {
  console.error(JSON.stringify({ error: 'No se detectó ninguna bóveda (vault) de Obsidian activa.' }));
  process.exit(1);
}

function sanitize(n) {
  return (n || '').replace(/[\/:*?"<>|\\]/g, '-').trim();
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
// Ultra-Low Context Index & Manifest Cache
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
        const titleMatch = txt.match(/^title:\s*"([^"\r\n]+)"/m) || txt.match(/^#+\s*🧠?\s*(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : f.replace(/\.md$/, '');

        const catMatch = txt.match(/^category:\s*"?([^"\r\n]+)"?/m);
        const category = catMatch ? catMatch[1].trim() : 'general';

        const sumMatch = txt.match(/>\s*\[!(?:NOTE|ABSTRACT|INFO)\][^\r\n]*\r?\n>\s*([^\r\n]+)/i);
        let summary = sumMatch ? sumMatch[1].trim() : '';
        if (!summary) {
          summary = txt.replace(/---[\s\S]*?---/, '').replace(/#+[^\r\n]+/g, '').replace(/\r?\n/g, ' ').trim().slice(0, 140);
        }

        const tagsMatch = txt.match(/^tags:\s*\r?\n((?:\s*-\s*[^\r\n]+\r?\n)+)/m);
        const tags = [];
        if (tagsMatch) {
          const lines = tagsMatch[1].split('\n');
          for (const l of lines) {
            const tm = l.match(/-\s*([^\r\n]+)/);
            if (tm) tags.push(tm[1].trim().toLowerCase());
          }
        }

        const stat = fs.statSync(fp);
        memories.push({
          title,
          category,
          summary: summary.slice(0, 160),
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
        const nameMatch = txt.match(/^title:\s*"Skill:\s*([^"\r\n]+)"/m) || txt.match(/^#+\s*⚡?\s*Skill:\s*\[\[([^\]]+)\]\]/m);
        const name = nameMatch ? nameMatch[1].trim() : f.replace(/\.md$/, '').replace(/^\[Proyecto\]\s*/, '');

        const scopeMatch = txt.match(/^scope:\s*(\w+)/m);
        const scope = scopeMatch ? scopeMatch[1].trim() : 'global';

        const descMatch = txt.match(/>\s*-\s*\*\*Descripción\*\*:\s*([^\r\n]+)/i);
        const description = descMatch ? descMatch[1].trim() : '';

        skills.push({
          name,
          scope,
          description: description.slice(0, 160),
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
      // Invalidate if older than 2 hours
      const diffMs = Date.now() - new Date(data.updatedAt || 0).getTime();
      if (diffMs < 7200000) return data;
    } catch (e) {}
  }
  return buildManifest(vaultPath);
}

// -------------------------------------------------------------
// Ultra-Low Context Triage Command
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
    return {
      hasAntecedents: false,
      recommendation: 'Consulta vacía. Procede normalmente con tu tarea.',
    };
  }

  const manifest = getManifest(vaultPath);
  const keywords = extractKeywords(query);

  if (keywords.length === 0) {
    return {
      hasAntecedents: false,
      recommendation: 'Consulta sin palabras clave relevantes. Procede normalmente.',
    };
  }

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
        scope: s.scope,
        summary: s.description || 'Procedimiento especializado',
        advice: `Usa la Skill [[${s.name}]] para este flujo de trabajo. Lee su SKILL.md en el prompt para las instrucciones operativas.`,
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
        peekCmd: `node "${path.join(__dirname, 'obsidian.js').replace(/\\/g, '/')}" peek "${m.title}"`,
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
    recommendation = 'Antecedente encontrado: Usa directamente el resumen arriba indicado. Ejecuta "peek" SOLO si requieres código detallado o comandos paso a paso.';
  } else if (skillMatch) {
    recommendation = `Flujo técnico cubierto por la Skill [[${skillMatch.name}]]. Consulta sus instrucciones operativas.`;
  } else {
    recommendation = 'Sin antecedentes previos en el Vault. Procede con la solución sin consumir más contexto.';
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
// Ultra-Low Context Peek Command (Extracts only essential solution)
// -------------------------------------------------------------
function runPeek(vaultPath, noteName) {
  if (!noteName) {
    return { error: 'Especifica la nota a inspeccionar.' };
  }

  const cleanName = sanitize(noteName.endsWith('.md') ? noteName.slice(0, -3) : noteName);
  let target = path.join(vaultPath, 'Antigravity', 'Memoria', cleanName + '.md');

  if (!fs.existsSync(target)) {
    // Scan recursively
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

  // Extract frontmatter meta
  const catMatch = raw.match(/^category:\s*"?([^"\r\n]+)"?/m);
  const category = catMatch ? catMatch[1].trim() : 'general';

  const sumMatch = raw.match(/>\s*\[!(?:NOTE|ABSTRACT|INFO)\][^\r\n]*\r?\n>\s*([^\r\n]+)/i);
  const summary = sumMatch ? sumMatch[1].trim() : '';

  // Extract Solution body (strip frontmatter and strip footer wikilinks)
  let body = raw.replace(/^---[\s\S]*?---\r?\n/, '');
  body = body.replace(/---[\s\S]*?\*Conexiones del Grafo:\*[\s\S]*$/, '');
  body = body.replace(/^#+\s*[^\r\n]+/gm, '').trim();

  // If there are multiple documents appended, isolate the core technical details
  const detailsMatch = raw.match(/##\s*📝\s*Detalles y Solución\r?\n([\s\S]*?)(?:---|###\s*📄|$)/i);
  let solutionText = detailsMatch ? detailsMatch[1].trim() : body;

  // Compact: Limit to max 1200 characters to prevent context bloat
  if (solutionText.length > 1200) {
    solutionText = solutionText.slice(0, 1200) + '\n\n*(Extracto resumido para ahorrar contexto. Usa "read" solo si necesitas el código completo).*';
  }

  return {
    title: path.basename(target, '.md'),
    category,
    summary,
    solution: solutionText || 'Sin detalles adicionales registrados.',
  };
}

// -------------------------------------------------------------
// Save Memory & Auto-Update All Indexes Atomically
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
    if (a === '--title' && argsList[i+1]) { title = argsList[i+1]; i++; }
    else if (a === '--content' && argsList[i+1]) { content = argsList[i+1]; i++; }
    else if (a === '--summary' && argsList[i+1]) { summary = argsList[i+1]; i++; }
    else if (a === '--category' && argsList[i+1]) { category = argsList[i+1]; i++; }
    else if (a === '--tags' && argsList[i+1]) {
      tags = argsList[i+1].split(',').map(t => t.trim().toLowerCase());
      if (!tags.includes('antigravity/memoria')) tags.push('antigravity/memoria');
      i++;
    }
    else if (a === '--project' && argsList[i+1]) { project = argsList[i+1]; i++; }
  }

  ensureDirs(vaultPath);
  const memFolder = path.join(vaultPath, 'Antigravity', 'Memoria');
  const cleanTitle = sanitize(title);
  const filePath = path.join(memFolder, cleanTitle + '.md');
  const now = new Date().toISOString().split('T')[0];

  let relatedLinks = '';
  if (project) {
    relatedLinks = `\n### 📁 Proyecto: [[${project}]]\n`;
  }

  const md = `---
title: "${title}"
type: antigravity-memory
category: "${category}"
tags:
${tags.map(t => `  - ${t}`).join('\n')}
created: ${now}
updated: ${now}
---

# 🧠 ${title}

> [!NOTE] **Memoria Registrada por Antigravity**
> ${summary || title}

## 📝 Detalles y Solución

${content || '*Sin contenido adicional registrado.*'}

${relatedLinks}
---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Memoria]]
`;

  fs.writeFileSync(filePath, md, 'utf8');

  // 1. Update 00 Indice de Memoria.md
  try {
    const indexFile = path.join(memFolder, '00 Indice de Memoria.md');
    const allFiles = fs.readdirSync(memFolder).filter(f => f.endsWith('.md') && !f.startsWith('00'));
    let indexMd = `---
title: "Índice de Memoria de Antigravity"
type: antigravity-index
tags:
  - antigravity/indice
  - antigravity/memoria
updated: ${now}
---

# 🧠 Banco de Memoria & Knowledge Items

Total de memorias registradas: **${allFiles.length}**

| Memoria / Proyecto | Categoría | Resumen | Enlace Obsidian |
|---|---|---|---|
`;
    for (const f of allFiles) {
      const fp = path.join(memFolder, f);
      const txt = fs.readFileSync(fp, 'utf8');
      const catM = txt.match(/^category:\s*"?([^"\r\n]+)"?/m);
      const cat = catM ? catM[1] : 'general';
      const sumM = txt.match(/>\s*\[!(?:NOTE|ABSTRACT|INFO)\][^\r\n]*\r?\n>\s*([^\r\n]+)/i);
      const sum = sumM ? sumM[1].slice(0, 100) : 'Sin resumen';
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
        summary: summary || content.slice(0, 200),
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
    console.log(`# ${result.title} [${result.category.toUpperCase()}]\n> **Resumen:** ${result.summary}\n\n### Solución / Detalles:\n${result.solution}`);
    break;
  }

  case 'status': {
    const manifest = getManifest(vault.path);
    console.log(JSON.stringify({
      connected: true,
      vaultName: vault.name,
      vaultPath: vault.path,
      stats: manifest.stats,
      lastIndexed: manifest.updatedAt,
    }, null, 2));
    break;
  }

  case 'manifest': {
    const manifest = buildManifest(vault.path);
    console.log(JSON.stringify({ status: 'ok', stats: manifest.stats, updatedAt: manifest.updatedAt }, null, 2));
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
          summary: m.summary,
          peekCmd: `node "${path.join(__dirname, 'obsidian.js').replace(/\\/g, '/')}" peek "${m.title}"`,
        });
      }
    }

    for (const s of manifest.skills) {
      if (s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)) {
        matches.push({
          type: 'skill',
          title: s.name,
          scope: s.scope,
          summary: s.description,
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

  case 'save-memory': {
    const res = runSaveMemory(vault.path, args);
    console.log(JSON.stringify(res, null, 2));
    break;
  }

  case 'list-skills': {
    const manifest = getManifest(vault.path);
    console.log(JSON.stringify(manifest.skills, null, 2));
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

  default:
    console.log(`
Uso de Obsidian for Antigravity Runner (Bajo Consumo de Contexto):
  node obsidian.js triage "<query o contexto>"  (Recomendado: ultra-bajo contexto, detecta Skills vs Memoria)
  node obsidian.js peek "<nota>"               (Extrae solo resumen y solución técnica sin ruido)
  node obsidian.js save-memory --title "..." --content "..." [--summary "..."] [--category "..."] [--tags "..."]
  node obsidian.js search "<query>"            (Búsqueda compacta)
  node obsidian.js read "<nota>"               (Lectura completa sin filtros)
  node obsidian.js list-skills                 (Catálogo de skills disponibles)
  node obsidian.js status                      (Estado de conexión y estadísticas)
  node obsidian.js manifest                    (Reconstruir caché de contexto)
  node obsidian.js open [nota]                 (Abrir en Obsidian Desktop)
    `);
    break;
}
