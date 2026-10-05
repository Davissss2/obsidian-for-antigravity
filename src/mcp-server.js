#!/usr/bin/env node
/**
 * Antigravity <-> Obsidian MCP Server
 * Exposes Obsidian vault tools to Antigravity AI agents via Model Context Protocol (stdio).
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const { detectVaults, getActiveOrConfiguredVault } = require('./vault-detector');
const syncEngine = require('./sync-engine');

// Resolve active vault
function getVaultPath() {
  const customPath = process.env.OBSIDIAN_VAULT_PATH;
  const vault = getActiveOrConfiguredVault(customPath);
  return vault ? vault.path : null;
}

// Tool definitions for MCP
const TOOLS = [
  {
    name: 'obsidian_triage',
    description: 'Triage de ultra-bajo contexto (<100 tokens). Determina si existe una Skill o Memoria previa para una tarea o error sin gastar tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Problema, término técnico, nombre de proyecto o error a consultar' },
      },
      required: ['query'],
    },
  },
  {
    name: 'obsidian_peek',
    description: 'Extrae exclusivamente el resumen y la solución técnica de una nota de memoria, ahorrando el 90% del contexto vs lectura completa.',
    inputSchema: {
      type: 'object',
      properties: {
        noteName: { type: 'string', description: 'Título o nombre de la nota a inspeccionar' },
      },
      required: ['noteName'],
    },
  },
  {
    name: 'obsidian_status',
    description: 'Obtiene el estado de conexión con Obsidian, ruta de la bóveda (vault) activa y estadísticas de memorias y skills sincronizadas.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'obsidian_search',
    description: 'Busca notas, memorias o skills en la bóveda de Obsidian por palabra clave o etiqueta.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Término de búsqueda o palabra clave' },
        folder: { type: 'string', enum: ['Memoria', 'Skills', 'Proyectos', 'Todas'], description: 'Carpeta en la que buscar (por defecto Todas)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'obsidian_read_note',
    description: 'Lee el contenido completo de una nota de Obsidian (por ruta relativa o nombre de nota).',
    inputSchema: {
      type: 'object',
      properties: {
        noteNameOrPath: { type: 'string', description: 'Nombre de la nota (ej: "Latalaya" o "Memoria/Latalaya.md")' },
      },
      required: ['noteNameOrPath'],
    },
  },
  {
    name: 'obsidian_save_memory',
    description: 'Guarda una nueva memoria, lección aprendida, solución técnica o contexto en Obsidian (y en la base de conocimiento de Antigravity).',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título claro de la memoria o solución técnica' },
        content: { type: 'string', description: 'Contenido detallado en formato Markdown' },
        summary: { type: 'string', description: 'Resumen conciso de 1-2 frases' },
        category: { type: 'string', description: 'Categoría (ej: arquitectura, bugfix, backend, frontend)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Lista de etiquetas (ej: ["nodejs", "prestashop"])' },
        relatedSkills: { type: 'array', items: { type: 'string' }, description: 'Nombres de skills relacionadas' },
        project: { type: 'string', description: 'Nombre del proyecto vinculado' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'obsidian_save_skill',
    description: 'Crea o actualiza una skill tanto en Obsidian como en Antigravity (~/.gemini/config/skills).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Identificador único de la skill (ej: mi-herramienta)' },
        description: { type: 'string', description: 'Descripción corta de lo que hace la skill' },
        instructions: { type: 'string', description: 'Instrucciones completas en markdown para el agente' },
      },
      required: ['name', 'description', 'instructions'],
    },
  },
  {
    name: 'obsidian_sync_all',
    description: 'Ejecuta una sincronización completa de todas las skills, memorias y proyectos entre Antigravity y Obsidian.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'obsidian_session_save',
    description: 'Guarda un checkpoint de sesión o hito de trabajo en el Daily Log del proyecto en Obsidian (Antigravity/Sesiones/YYYY-MM-DD - Proyecto.md).',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Nombre del proyecto de trabajo' },
        summary: { type: 'string', description: 'Resumen conciso del hito o tarea completada' },
        content: { type: 'string', description: 'Detalles técnicos, archivos modificados y decisiones tomadas' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Etiquetas opcionales' },
      },
      required: ['summary'],
    },
  },
  {
    name: 'obsidian_session_last',
    description: 'Recupera el último hito o sesión de trabajo registrada para un proyecto para recordar contexto previo sin quemar tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Nombre del proyecto a consultar (opcional)' },
      },
    },
  },
  {
    name: 'obsidian_session_list',
    description: 'Lista los checkpoints y sesiones de trabajo recientes del vault.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Número máximo de sesiones a retornar (por defecto 10)' },
      },
    },
  },
  {
    name: 'obsidian_learn',
    description: 'Registra un hábito, preferencia o regla de trabajo del usuario. Si incluye [Proyecto] o project, se almacena exclusivamente en el dossier del proyecto.',
    inputSchema: {
      type: 'object',
      properties: {
        habit: { type: 'string', description: 'Preferencia, hábito técnico o condición obligatoria aprendida' },
        project: { type: 'string', description: 'Proyecto específico al que aplica (opcional)' },
      },
      required: ['habit'],
    },
  },
  {
    name: 'obsidian_open_note',
    description: 'Abre una nota directamente en la ventana de la aplicación de escritorio Obsidian del usuario.',
    inputSchema: {
      type: 'object',
      properties: {
        notePath: { type: 'string', description: 'Ruta relativa o nombre de la nota a abrir en Obsidian' },
      },
      required: ['notePath'],
    },
  },
];

// Tool Executors
async function executeTool(name, args) {
  const vaultPath = getVaultPath();
  if (!vaultPath) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: No se encontró ningún Vault de Obsidian activo en el sistema. Asegúrate de tener Obsidian instalado y una bóveda creada.' }],
    };
  }

  try {
    switch (name) {
      case 'obsidian_triage': {
        const result = syncEngine.triageContext(vaultPath, args.query);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      case 'obsidian_peek': {
        const result = syncEngine.peekMemory(vaultPath, args.noteName);
        if (result.error) {
          return { isError: true, content: [{ type: 'text', text: result.error }] };
        }
        return {
          content: [{
            type: 'text',
            text: `# ${result.title} [${result.category.toUpperCase()}]\n> **Resumen:** ${result.summary}\n\n### Solución:\n${result.solution}`,
          }],
        };
      }

      case 'obsidian_status': {
        const stats = syncEngine.getVaultStats(vaultPath);
        const vaultName = path.basename(vaultPath);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              connected: true,
              vaultName,
              vaultPath,
              stats,
            }, null, 2),
          }],
        };
      }

      case 'obsidian_search': {
        const query = (args.query || '').toLowerCase();
        const folder = args.folder && args.folder !== 'Todas' ? args.folder : null;
        const baseSearchDir = folder 
          ? path.join(vaultPath, 'Antigravity', folder)
          : path.join(vaultPath, 'Antigravity');

        if (!fs.existsSync(baseSearchDir)) {
          return { content: [{ type: 'text', text: 'No se encontraron notas en la ubicación especificada.' }] };
        }

        const matches = [];
        function scan(dir) {
          for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
              scan(fullPath);
            } else if (item.isFile() && item.name.endsWith('.md')) {
              const content = fs.readFileSync(fullPath, 'utf8');
              if (item.name.toLowerCase().includes(query) || content.toLowerCase().includes(query)) {
                const relPath = path.relative(vaultPath, fullPath);
                matches.push({
                  title: item.name.replace(/\.md$/, ''),
                  path: relPath,
                  preview: content.slice(0, 200).replace(/\r?\n/g, ' '),
                });
              }
            }
          }
        }
        scan(baseSearchDir);

        return {
          content: [{
            type: 'text',
            text: matches.length > 0
              ? JSON.stringify(matches.slice(0, 10), null, 2)
              : `No se encontraron notas que coincidan con "${args.query}".`,
          }],
        };
      }

      case 'obsidian_read_note': {
        let noteName = args.noteNameOrPath.trim();
        if (!noteName.endsWith('.md')) noteName += '.md';

        // Try direct relative path
        let targetFile = path.join(vaultPath, noteName);
        if (!fs.existsSync(targetFile)) {
          // Try under Antigravity
          targetFile = path.join(vaultPath, 'Antigravity', noteName);
        }
        if (!fs.existsSync(targetFile)) {
          // Search recursively
          let found = null;
          function find(dir) {
            for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
              const fp = path.join(dir, f.name);
              if (f.isDirectory()) find(fp);
              else if (f.name.toLowerCase() === path.basename(noteName).toLowerCase()) {
                found = fp;
                break;
              }
            }
          }
          find(path.join(vaultPath, 'Antigravity'));
          targetFile = found;
        }

        if (!targetFile || !fs.existsSync(targetFile)) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Nota no encontrada: ${args.noteNameOrPath}` }],
          };
        }

        const noteContent = fs.readFileSync(targetFile, 'utf8');
        return {
          content: [{ type: 'text', text: noteContent }],
        };
      }

      case 'obsidian_save_memory': {
        const result = syncEngine.saveNewMemory(vaultPath, args);
        syncEngine.generateHub(vaultPath, process.cwd());
        return {
          content: [{
            type: 'text',
            text: `✅ Memoria "${result.title}" guardada exitosamente en Obsidian:\n${result.path}`,
          }],
        };
      }

      case 'obsidian_save_skill': {
        const result = syncEngine.saveSkill(vaultPath, args);
        syncEngine.syncSkillsToVault(vaultPath, process.cwd());
        syncEngine.generateHub(vaultPath, process.cwd());
        return {
          content: [{
            type: 'text',
            text: `✅ Skill "${result.name}" guardada y sincronizada tanto en Obsidian como en Antigravity (~/.gemini/config/skills/${result.name}/SKILL.md).`,
          }],
        };
      }

      case 'obsidian_sync_all': {
        const result = syncEngine.syncAll(vaultPath, process.cwd());
        return {
          content: [{
            type: 'text',
            text: `✅ Sincronización completa con Obsidian finalizada:\n- Skills sincronizadas: ${result.skillsCount}\n- Memorias sincronizadas: ${result.memoriesCount}\n- Hub actualizado: ${result.hub}`,
          }],
        };
      }

      case 'obsidian_session_save': {
        const pName = args.project || path.basename(process.cwd());
        const result = syncEngine.saveSessionCheckpoint(vaultPath, {
          project: pName,
          summary: args.summary,
          content: args.content,
          tags: args.tags,
        });
        const dateStr = new Date().toISOString().split('T')[0];
        const safeP = (pName || 'General').replace(/[\/:*?"<>|\\]/g, '-').trim();
        return {
          content: [{
            type: 'text',
            text: `Checkpoint guardado exitosamente en Daily Log de ${pName}:\nAntigravity/Sesiones/${dateStr} - ${safeP}.md\nResumen: ${args.summary}`,
          }],
        };
      }

      case 'obsidian_session_last': {
        const pName = args.project || '';
        const sesFolder = path.join(vaultPath, 'Antigravity', 'Sesiones');
        if (!fs.existsSync(sesFolder)) {
          return { content: [{ type: 'text', text: 'No hay sesiones registradas.' }] };
        }
        const files = fs.readdirSync(sesFolder).filter(f => f.endsWith('.md') && !f.startsWith('00'));
        const list = [];
        for (const f of files) {
          try {
            const fp = path.join(sesFolder, f);
            const c = fs.readFileSync(fp, 'utf8');
            let proj = '';
            const mP = c.match(/^project:\s*["']?([^"'\r\n]+)["']?/m);
            if (mP) proj = mP[1].trim();
            if (pName && proj.toLowerCase() !== pName.toLowerCase() && !f.toLowerCase().includes(pName.toLowerCase())) continue;
            const stat = fs.statSync(fp);
            list.push({ file: f, path: fp, content: c, mtime: stat.mtimeMs, project: proj });
          } catch (e) {}
        }
        list.sort((a, b) => b.mtime - a.mtime);
        if (list.length === 0) {
          return { content: [{ type: 'text', text: `Sin sesiones previas para ${pName || 'este workspace'}.` }] };
        }
        const latest = list[0];
        const milestones = [];
        const mRegex = /##\s*(\d{2}:\d{2})\s*[—–-]\s*([^\r\n]+)\r?\n([\s\S]*?)(?=(?:\r?\n##\s*\d{2}:\d{2}\s*[—–-])|(?:\r?\n---)|$)/g;
        let mMatch;
        while ((mMatch = mRegex.exec(latest.content)) !== null) {
          milestones.push({ time: mMatch[1], summary: mMatch[2].trim(), details: mMatch[3].trim() });
        }
        let summary = '';
        let details = '';
        if (milestones.length > 0) {
          const lastM = milestones[milestones.length - 1];
          summary = lastM.summary;
          details = lastM.details;
        } else {
          const mSum = latest.content.match(/>\s*\[!NOTE\]\s*\*\*(?:Último Hito|Resumen)[^\r\n]*\*\*\r?\n>\s*([^\r\n]+)/i)
            || latest.content.match(/^summary:\s*["']?([^"'\r\n]+)["']?/m);
          summary = mSum ? mSum[1].trim() : 'Sin resumen';
          const mWork = latest.content.match(/##\s*Trabajo Realizado y Decisiones Técnicas[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
          details = mWork ? mWork[1].trim() : '';
        }
        return {
          content: [{
            type: 'text',
            text: `[SESION PREVIA: ${latest.project || 'General'}]\nResumen: ${summary}\n\nDetalles:\n${details}`,
          }],
        };
      }

      case 'obsidian_session_list': {
        const { sessions } = syncEngine.syncSessionsIndex(vaultPath);
        const limit = args.limit || 10;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ total: sessions.length, sessions: sessions.slice(0, limit) }, null, 2),
          }],
        };
      }

      case 'obsidian_learn': {
        const habit = args.habit || '';
        let project = args.project || null;
        if (!project) {
          const projTagMatch = habit.match(/^\[([a-zA-Z0-9_\-.]+)\]/);
          if (projTagMatch) project = projTagMatch[1];
        }
        const isGlobal = !project || project.toLowerCase() === 'global';
        const now = new Date().toISOString().split('T')[0];
        const entry = `- \`[${now}]\` ${habit}`;
        let target = '';

        if (isGlobal) {
          const userFile = path.join(vaultPath, 'Antigravity', 'Alma', '00 Perfil de Usuario.md');
          if (fs.existsSync(userFile)) {
            let uContent = fs.readFileSync(userFile, 'utf8');
            if (uContent.includes('## 4. Aprendizajes y Preferencias Dinámicas Acumuladas')) {
              uContent = uContent.replace('## 4. Aprendizajes y Preferencias Dinámicas Acumuladas', `## 4. Aprendizajes y Preferencias Dinámicas Acumuladas\n${entry}`);
            } else {
              uContent += `\n## 4. Aprendizajes y Preferencias Dinámicas Acumuladas\n${entry}\n`;
            }
            fs.writeFileSync(userFile, uContent, 'utf8');
          }
          target = '00 Perfil de Usuario.md';
        } else {
          const projDir = path.join(vaultPath, 'Antigravity', 'Proyectos');
          if (!fs.existsSync(projDir)) fs.mkdirSync(projDir, { recursive: true });
          const projFile = path.join(projDir, `${project}.md`);
          if (fs.existsSync(projFile)) {
            let pContent = fs.readFileSync(projFile, 'utf8');
            const h = '## Reglas y Condiciones Obligatorias del Proyecto';
            if (pContent.includes(h)) {
              pContent = pContent.replace(h, `${h}\n${entry}`);
            } else {
              const splitIdx = pContent.lastIndexOf('---');
              if (splitIdx !== -1) pContent = pContent.slice(0, splitIdx) + `${h}\n${entry}\n\n` + pContent.slice(splitIdx);
              else pContent += `\n${h}\n${entry}\n`;
            }
            fs.writeFileSync(projFile, pContent, 'utf8');
          }
          target = `Antigravity/Proyectos/${project}.md`;
        }
        return {
          content: [{
            type: 'text',
            text: `Aprendizaje asimilado y persistido en ${target}:\n${entry}`,
          }],
        };
      }

      case 'obsidian_open_note': {
        const vaultName = path.basename(vaultPath);
        const encodedVault = encodeURIComponent(vaultName);
        let note = args.notePath.replace(/\\/g, '/');
        if (note.endsWith('.md')) note = note.slice(0, -3);
        const encodedFile = encodeURIComponent(note);
        const uri = `obsidian://open?vault=${encodedVault}&file=${encodedFile}`;

        if (process.platform === 'win32') {
          exec(`start "" "${uri}"`);
        } else if (process.platform === 'darwin') {
          exec(`open "${uri}"`);
        } else {
          exec(`xdg-open "${uri}"`);
        }

        return {
          content: [{ type: 'text', text: `Nota abierta en la app Obsidian: ${uri}` }],
        };
      }

      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `Herramienta desconocida: ${name}` }],
        };
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error ejecutando ${name}: ${err.message}` }],
    };
  }
}

// Stdio JSON-RPC Loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  if (!line || !line.trim()) return;

  let request;
  try {
    request = JSON.parse(line.trim());
  } catch (err) {
    return;
  }

  const { id, method, params } = request;

  if (method === 'initialize') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'antigravity-obsidian-mcp',
          version: '1.0.0',
        },
      },
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    const response = {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS,
      },
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: toolArgs } = params || {};
    const result = await executeTool(name, toolArgs || {});
    const response = {
      jsonrpc: '2.0',
      id,
      result,
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    return;
  }

  if (id !== undefined) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Método no soportado: ${method}`,
      },
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  }
});
