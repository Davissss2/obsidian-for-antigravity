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
  const docVault = path.join(os.homedir(), 'Documents', 'Obsidian Vault');
  if (fs.existsSync(docVault)) {
    return { path: docVault, name: 'Obsidian Vault' };
  }
  return null;
}

const vault = getVaultPath();
if (!vault) {
  console.error(JSON.stringify({ error: 'No se detectó ninguna bóveda de Obsidian activa.' }));
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

  const detailsMatch = raw.match(/##\s*(?:Technical Solution|Solución Técnica|Detalles y Solución|Solución)\r?\n([\s\S]*?)(?:---|###\s*📄|$)/i);
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
Comandos de Obsidian for Antigravity (Zero Emojis, Ultra-Bajo Contexto):
  node obsidian.js triage "<query>"     (Triage ultra-compacto: Skill vs Memoria vs Nada)
  node obsidian.js peek "<nota>"        (Solucion tecnica directa sin metadatos)
  node obsidian.js save --title "..." --summary "..." --content "..." (Guardado atomico)
  node obsidian.js catalog              (Resumen 1-linea de skills y memorias)
  node obsidian.js skills               (Lista rapida de skills con descripcion corta)
  node obsidian.js memories             (Lista rapida de memorias con resumen corto)
  node obsidian.js status               (Estado de conexion)
  node obsidian.js search "<query>"     (Busqueda compacta)
  node obsidian.js read "<nota>"        (Lectura completa de archivo)
  node obsidian.js open [nota]          (Abrir en Obsidian Desktop)
    `);
    break;
}
