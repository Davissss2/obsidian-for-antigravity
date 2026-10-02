#!/usr/bin/env node
/**
 * Antigravity <-> Obsidian Bridge CLI
 * Interfaz de línea de comandos para que las Skills de Antigravity
 * interactúen con Obsidian sin necesidad de servidores MCP.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { detectVaults, getActiveOrConfiguredVault } = require('./vault-detector');
const syncEngine = require('./sync-engine');

function getVault() {
  const custom = process.env.OBSIDIAN_VAULT_PATH;
  const vault = getActiveOrConfiguredVault(custom);
  if (!vault || !vault.path || !fs.existsSync(vault.path)) {
    console.error(JSON.stringify({ error: 'No se encontró ningún Vault de Obsidian activo en el sistema.' }));
    process.exit(1);
  }
  return vault;
}

const [,, cmd, ...args] = process.argv;

function parseNamedArgs(argvList) {
  const params = {};
  for (let i = 0; i < argvList.length; i++) {
    const item = argvList[i];
    if (item.startsWith('--')) {
      const key = item.slice(2);
      const next = argvList[i + 1];
      if (next && !next.startsWith('--')) {
        params[key] = next;
        i++;
      } else {
        params[key] = true;
      }
    }
  }
  return params;
}

async function main() {
  const vault = getVault();
  const vaultPath = vault.path;

  switch (cmd) {
    case 'status': {
      const stats = syncEngine.getVaultStats(vaultPath);
      console.log(JSON.stringify({
        status: 'ok',
        vaultName: vault.name,
        vaultPath: vault.path,
        stats,
      }, null, 2));
      break;
    }

    case 'sync': {
      const workspaceRoot = process.cwd();
      const result = syncEngine.syncAll(vaultPath, workspaceRoot);
      console.log(JSON.stringify({
        status: 'ok',
        message: 'Sincronización completa finalizada',
        result,
      }, null, 2));
      break;
    }

    case 'search': {
      const query = (args[0] || '').toLowerCase();
      const baseDir = path.join(vaultPath, 'Antigravity');
      const results = [];

      function scan(dir) {
        if (!fs.existsSync(dir)) return;
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const fp = path.join(dir, item.name);
          if (item.isDirectory()) scan(fp);
          else if (item.isFile() && item.name.endsWith('.md')) {
            const content = fs.readFileSync(fp, 'utf8');
            if (item.name.toLowerCase().includes(query) || content.toLowerCase().includes(query)) {
              results.push({
                name: item.name.replace(/\.md$/, ''),
                relative: path.relative(vaultPath, fp).replace(/\\/g, '/'),
                preview: content.slice(0, 180).replace(/\r?\n/g, ' '),
              });
            }
          }
        }
      }

      scan(baseDir);
      console.log(JSON.stringify(results.slice(0, 10), null, 2));
      break;
    }

    case 'read': {
      const target = args[0];
      if (!target) {
        console.error(JSON.stringify({ error: 'Debes especificar el nombre o ruta de la nota.' }));
        process.exit(1);
      }
      let foundPath = null;
      let cleanTarget = target.endsWith('.md') ? target : target + '.md';

      function searchNote(dir) {
        if (!fs.existsSync(dir)) return;
        for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
          const fp = path.join(dir, item.name);
          if (item.isDirectory()) searchNote(fp);
          else if (item.isFile() && item.name.toLowerCase() === path.basename(cleanTarget).toLowerCase()) {
            foundPath = fp;
            return;
          }
        }
      }

      searchNote(path.join(vaultPath, 'Antigravity'));

      if (!foundPath || !fs.existsSync(foundPath)) {
        console.error(JSON.stringify({ error: `Nota no encontrada: ${target}` }));
        process.exit(1);
      }

      console.log(fs.readFileSync(foundPath, 'utf8'));
      break;
    }

    case 'save-memory': {
      const params = parseNamedArgs(args);
      if (!params.title || !params.content) {
        console.error(JSON.stringify({ error: 'Se requiere --title y --content' }));
        process.exit(1);
      }

      const tags = params.tags ? params.tags.split(',').map(t => t.trim()) : ['antigravity/memoria'];
      const relatedSkills = params.skills ? params.skills.split(',').map(s => s.trim()) : [];

      const saved = syncEngine.saveNewMemory(vaultPath, {
        title: params.title,
        content: params.content,
        summary: params.summary || params.title,
        category: params.category || 'general',
        tags,
        relatedSkills,
        project: params.project || null,
      });

      syncEngine.generateHub(vaultPath, process.cwd());
      console.log(JSON.stringify({ status: 'ok', memory: saved }, null, 2));
      break;
    }

    case 'save-skill': {
      const params = parseNamedArgs(args);
      if (!params.name || !params.instructions) {
        console.error(JSON.stringify({ error: 'Se requiere --name e --instructions' }));
        process.exit(1);
      }

      const saved = syncEngine.saveSkill(vaultPath, {
        name: params.name,
        description: params.description || '',
        instructions: params.instructions,
      });

      syncEngine.syncSkillsToVault(vaultPath, process.cwd());
      syncEngine.generateHub(vaultPath, process.cwd());
      console.log(JSON.stringify({ status: 'ok', skill: saved }, null, 2));
      break;
    }

    case 'open': {
      const note = args[0] || 'Antigravity/00 Antigravity Hub';
      const cleanNote = note.endsWith('.md') ? note.slice(0, -3) : note;
      const vaultName = encodeURIComponent(vault.name);
      const notePath = encodeURIComponent(cleanNote.replace(/\\/g, '/'));
      const uri = `obsidian://open?vault=${vaultName}&file=${notePath}`;

      if (process.platform === 'win32') {
        exec(`start "" "${uri}"`);
      } else if (process.platform === 'darwin') {
        exec(`open "${uri}"`);
      } else {
        exec(`xdg-open "${uri}"`);
      }

      console.log(JSON.stringify({ status: 'ok', uri }, null, 2));
      break;
    }

    case 'triage': {
      const query = args.join(' ');
      const result = syncEngine.triageContext(vaultPath, query);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'peek': {
      const note = args.join(' ');
      const result = syncEngine.peekMemory(vaultPath, note);
      if (result.error) {
        console.error(JSON.stringify(result));
        process.exit(1);
      }
      console.log(`# ${result.title} [${result.category.toUpperCase()}]\n> **Resumen:** ${result.summary}\n\n### Solución:\n${result.solution}`);
      break;
    }

    case 'manifest': {
      const result = syncEngine.buildContextManifest(vaultPath);
      console.log(JSON.stringify({ status: 'ok', stats: result.stats, updatedAt: result.updatedAt }, null, 2));
      break;
    }

    default:
      console.log(`
Uso de Antigravity Obsidian CLI (Bajo Consumo de Contexto):
  node cli.js triage "<query>"      (Triage ultra-compacto: Skill vs Memoria)
  node cli.js peek "<nombre-nota>"  (Solución directa sin contaminar contexto)
  node cli.js status
  node cli.js sync
  node cli.js search <query>
  node cli.js read <nombre-de-nota>
  node cli.js save-memory --title "..." --content "..." [--summary "..."] [--tags "tag1,tag2"]
  node cli.js save-skill --name "..." --instructions "..." [--description "..."]
  node cli.js open [nombre-de-nota]
      `);
      break;
  }
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
