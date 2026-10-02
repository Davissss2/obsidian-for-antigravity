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
      if (cfg.vaultPath && fs.existsSync(cfg.vaultPath)) return { path: cfg.vaultPath, name: cfg.vaultName || path.basename(cfg.vaultPath) };
    } catch (e) {}
  }
  // Fallback to obsidian.json
  const obsJson = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'obsidian', 'obsidian.json');
  if (fs.existsSync(obsJson)) {
    try {
      const data = JSON.parse(fs.readFileSync(obsJson, 'utf8'));
      for (const [id, v] of Object.entries(data.vaults || {})) {
        if (v && v.path && fs.existsSync(v.path)) return { path: v.path, name: path.basename(v.path) };
      }
    } catch (e) {}
  }
  return null;
}

const vault = getVaultPath();
if (!vault) {
  console.error(JSON.stringify({ error: 'No se detectó ninguna bóveda (vault) de Obsidian activa.' }));
  process.exit(1);
}

const [,, cmd, ...args] = process.argv;

function sanitize(n) {
  return n.replace(/[\/:*?"<>|]/g, '-').trim();
}

switch (cmd) {
  case 'status': {
    const memDir = path.join(vault.path, 'Antigravity', 'Memoria');
    const skiDir = path.join(vault.path, 'Antigravity', 'Skills');
    const count = (d) => fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.md') && !f.startsWith('00')).length : 0;
    console.log(JSON.stringify({
      connected: true,
      vaultName: vault.name,
      vaultPath: vault.path,
      stats: { memories: count(memDir), skills: count(skiDir) }
    }, null, 2));
    break;
  }

  case 'search': {
    const q = (args[0] || '').toLowerCase();
    const base = path.join(vault.path, 'Antigravity');
    const matches = [];
    function scan(d) {
      if (!fs.existsSync(d)) return;
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const fp = path.join(d, ent.name);
        if (ent.isDirectory()) scan(fp);
        else if (ent.isFile() && ent.name.endsWith('.md')) {
          const txt = fs.readFileSync(fp, 'utf8');
          if (ent.name.toLowerCase().includes(q) || txt.toLowerCase().includes(q)) {
            matches.push({ name: ent.name.replace(/\.md$/, ''), relative: path.relative(vault.path, fp).replace(/\\/g, '/'), preview: txt.slice(0, 180).replace(/\r?\n/g, ' ') });
          }
        }
      }
    }
    scan(base);
    console.log(JSON.stringify(matches.slice(0, 10), null, 2));
    break;
  }

  case 'read': {
    const name = args[0];
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
    let title = 'Memoria ' + new Date().toISOString().slice(0, 10);
    let content = '';
    let summary = '';
    let category = 'general';
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--title' && args[i+1]) { title = args[i+1]; i++; }
      else if (args[i] === '--content' && args[i+1]) { content = args[i+1]; i++; }
      else if (args[i] === '--summary' && args[i+1]) { summary = args[i+1]; i++; }
      else if (args[i] === '--category' && args[i+1]) { category = args[i+1]; i++; }
    }
    const memFolder = path.join(vault.path, 'Antigravity', 'Memoria');
    if (!fs.existsSync(memFolder)) fs.mkdirSync(memFolder, { recursive: true });
    const cleanTitle = sanitize(title);
    const filePath = path.join(memFolder, cleanTitle + '.md');
    const now = new Date().toISOString().split('T')[0];
    const md = `---
title: "${title}"
type: antigravity-memory
category: "${category}"
tags:
  - antigravity/memoria
created: ${now}
updated: ${now}
---

# 🧠 ${title}

> [!NOTE] **Memoria Registrada por Antigravity**
> ${summary || title}

## 📝 Detalles y Solución

${content}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Memoria]]
`;
    fs.writeFileSync(filePath, md, 'utf8');
    console.log(JSON.stringify({ status: 'ok', title, path: filePath }, null, 2));
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
    console.log('Comandos: status, search <q>, read <nota>, save-memory --title "..." --content "...", open [nota]');
    break;
}
