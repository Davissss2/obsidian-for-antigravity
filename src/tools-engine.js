const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, execSync } = require('child_process');

/**
 * Tools Engine for Obsidian for Antigravity
 * Clean, dynamic tool management:
 * - ZERO default / hardcoded tools.
 * - Dynamic installation from GitHub repositories (auto-detects MCP, Skill, or CLI).
 * - Custom tool creation from UI or AI.
 * - Tool execution and lifecycle management (list, run, uninstall).
 * - Bi-directional mirror in Obsidian Vault (04_Herramientas/).
 */

function getGlobalToolsDir() {
  const dir = path.join(os.homedir(), '.gemini', 'tools');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }
  return dir;
}

function getGlobalConfigDir() {
  return path.join(os.homedir(), '.gemini', 'config');
}

function getToolsRegistryPath() {
  return path.join(getGlobalConfigDir(), 'tools.json');
}

function loadToolsRegistry() {
  const regPath = getToolsRegistryPath();
  if (fs.existsSync(regPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(regPath, 'utf8'));
      if (Array.isArray(data.tools)) return data;
    } catch (e) {}
  }
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    tools: []
  };
}

function saveToolsRegistry(registry) {
  registry.lastUpdated = new Date().toISOString();
  try {
    const configDir = getGlobalConfigDir();
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(getToolsRegistryPath(), JSON.stringify(registry, null, 2), 'utf8');
  } catch (e) {}
}

/**
 * Ensure 04_Herramientas structure in Obsidian Vault
 */
function ensureToolsVaultStructure(vaultPath) {
  if (!vaultPath || !fs.existsSync(vaultPath)) return;
  const toolsDir = path.join(vaultPath, '04_Herramientas');
  if (!fs.existsSync(toolsDir)) {
    try { fs.mkdirSync(toolsDir, { recursive: true }); } catch (e) {}
  }

  const idxPath = path.join(toolsDir, '00 Indice de Herramientas.md');
  const reg = loadToolsRegistry();
  const toolsList = (reg.tools || []).map(t => {
    return `- [[${t.name}]] — **${(t.type || 'tool').toUpperCase()}** (${t.status || 'activa'}): ${t.description || 'Sin descripción'}`;
  }).join('\n');

  const content = [
    '---',
    'title: "Índice de Herramientas de IA"',
    'type: tools-index',
    `last_updated: ${new Date().toISOString().split('T')[0]}`,
    '---',
    '',
    '# Catálogo de Herramientas de IA (Tools & MCP Hub)',
    '',
    '> [!NOTE] **Gestión Dinámica de Herramientas**',
    '> La IA no tiene herramientas fijas por defecto. Las herramientas se instalan a medida que el usuario o la IA las añaden (desde GitHub o desde la interfaz).',
    '',
    '## Herramientas Instaladas',
    toolsList || '*No hay herramientas instaladas aún. Puedes instalar herramientas desde GitHub o crearlas desde el panel lateral o el chat.*',
    '',
    '## Cómo Añadir Nuevas Herramientas',
    '- **Desde un repositorio de GitHub:** Pasa el enlace del repositorio a la IA o usa `/obsidian tool install <url>`.',
    '- **Desde el Panel Lateral:** Ve a la pestaña **Herramientas** e introduce la URL del repositorio o los datos del comando.',
    '- **Autónomo por IA:** La IA puede invocar `tool_install` directamente cuando le des un repositorio.',
    '',
    '---',
    '*Sincronizado con Antigravity & Obsidian Second Brain.*'
  ].join('\n');

  try {
    fs.writeFileSync(idxPath, content, 'utf8');
  } catch (e) {}
}

/**
 * Install a Tool from a GitHub Repository
 */
async function installFromGithub(repoUrl, options = {}, vaultPath = null) {
  if (!repoUrl || !repoUrl.trim()) {
    throw new Error('Debes proporcionar la URL del repositorio de GitHub.');
  }

  let cleanUrl = repoUrl.trim();
  // Support shorthand "owner/repo"
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(cleanUrl)) {
    cleanUrl = `https://github.com/${cleanUrl}.git`;
  }
  if (!cleanUrl.endsWith('.git') && cleanUrl.startsWith('https://github.com')) {
    cleanUrl = cleanUrl + '.git';
  }

  // Derive tool name
  const repoNameMatch = cleanUrl.match(/\/([^/]+?)(?:\.git)?$/);
  let toolName = (options.name || (repoNameMatch ? repoNameMatch[1] : 'custom-tool')).toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  const toolsBaseDir = getGlobalToolsDir();
  const targetDir = path.join(toolsBaseDir, toolName);

  // If already exists, pull
  if (fs.existsSync(targetDir)) {
    try {
      execSync('git pull', { cwd: targetDir, timeout: 20000, stdio: 'ignore' });
    } catch (e) {}
  } else {
    // Clone repo
    try {
      execSync(`git clone --depth 1 "${cleanUrl}" "${targetDir}"`, {
        timeout: 60000,
        stdio: 'ignore'
      });
    } catch (cloneErr) {
      throw new Error(`Error clonando repositorio (${cleanUrl}): ${cloneErr.message || cloneErr}`);
    }
  }

  // Detect tool architecture
  let toolType = 'cli';
  let entrypoint = '';
  let command = '';
  let mcpRegistered = false;
  let skillInstalled = false;
  let description = options.description || `Herramienta instalada desde ${cleanUrl}`;

  const pkgJsonPath = path.join(targetDir, 'package.json');
  const skillMdPath = path.join(targetDir, 'SKILL.md');
  const pyProject = path.join(targetDir, 'pyproject.toml');
  const reqTxt = path.join(targetDir, 'requirements.txt');
  const serverPy = path.join(targetDir, 'server.py');

  // Case 1: Antigravity Skill in repo
  if (fs.existsSync(skillMdPath)) {
    toolType = 'skill';
    skillInstalled = true;
    const destSkillDir = path.join(getGlobalConfigDir(), 'skills', toolName);
    try {
      if (!fs.existsSync(destSkillDir)) fs.mkdirSync(destSkillDir, { recursive: true });
      fs.copyFileSync(skillMdPath, path.join(destSkillDir, 'SKILL.md'));
      const scriptsSrc = path.join(targetDir, 'scripts');
      if (fs.existsSync(scriptsSrc)) {
        const destScripts = path.join(destSkillDir, 'scripts');
        if (!fs.existsSync(destScripts)) fs.mkdirSync(destScripts, { recursive: true });
        for (const sf of fs.readdirSync(scriptsSrc)) {
          fs.copyFileSync(path.join(scriptsSrc, sf), path.join(destScripts, sf));
        }
      }
    } catch (e) {}
  }

  // Case 2: Node.js project (MCP or CLI)
  if (fs.existsSync(pkgJsonPath)) {
    let pkg = {};
    try {
      pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (pkg.description) description = pkg.description;
    } catch (e) {}

    // Run npm install if node_modules is missing
    const nodeModulesDir = path.join(targetDir, 'node_modules');
    if (!fs.existsSync(nodeModulesDir)) {
      try {
        execSync('npm install --omit=dev --no-audit --no-fund', {
          cwd: targetDir,
          timeout: 90000,
          stdio: 'ignore'
        });
      } catch (npmErr) {}
    }

    let binEntry = '';
    if (pkg.bin) {
      binEntry = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0];
    }
    entrypoint = binEntry || pkg.main || 'index.js';
    const absEntry = path.join(targetDir, entrypoint);

    const isMcp = (pkg.dependencies && pkg.dependencies['@modelcontextprotocol/sdk']) ||
                  (pkg.keywords && pkg.keywords.includes('mcp')) ||
                  toolName.includes('mcp') ||
                  (pkg.name && pkg.name.includes('mcp'));

    if (isMcp) {
      toolType = 'mcp';
      mcpRegistered = registerMcpServer(toolName, {
        command: 'node',
        args: [absEntry.replace(/\\/g, '/')],
        env: options.env || {}
      });
    } else {
      command = `node "${absEntry}"`;
    }
  } else if (fs.existsSync(serverPy) || fs.existsSync(pyProject) || fs.existsSync(reqTxt)) {
    // Case 3: Python project
    if (fs.existsSync(reqTxt)) {
      try {
        execSync('pip install -r requirements.txt', { cwd: targetDir, timeout: 90000, stdio: 'ignore' });
      } catch (e) {}
    }

    const absPyEntry = path.join(targetDir, fs.existsSync(serverPy) ? 'server.py' : 'main.py');
    const isMcp = toolName.includes('mcp') || (fs.existsSync(serverPy));

    if (isMcp) {
      toolType = 'mcp';
      mcpRegistered = registerMcpServer(toolName, {
        command: 'python',
        args: [absPyEntry.replace(/\\/g, '/')],
        env: options.env || {}
      });
    } else {
      toolType = 'python-cli';
      command = `python "${absPyEntry}"`;
    }
  }

  // Update tools.json registry
  const reg = loadToolsRegistry();
  const existingIdx = reg.tools.findIndex(t => t.id === toolName);
  const toolRecord = {
    id: toolName,
    name: toolName,
    type: toolType,
    repoUrl: cleanUrl,
    dir: targetDir,
    entrypoint,
    command,
    description,
    status: 'active',
    mcpRegistered,
    skillInstalled,
    installedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    reg.tools[existingIdx] = toolRecord;
  } else {
    reg.tools.push(toolRecord);
  }
  saveToolsRegistry(reg);

  // Write Obsidian Note in 04_Herramientas/<toolName>.md
  if (vaultPath && fs.existsSync(vaultPath)) {
    ensureToolsVaultStructure(vaultPath);
    const notePath = path.join(vaultPath, '04_Herramientas', `${toolName}.md`);
    const noteContent = [
      '---',
      `title: "Tool: ${toolName}"`,
      `type: ai-tool`,
      `category: ${toolType}`,
      `repo: "${cleanUrl}"`,
      `installed_at: ${new Date().toISOString().split('T')[0]}`,
      `mcp_active: ${mcpRegistered}`,
      '---',
      '',
      `# Tool: ${toolName}`,
      '',
      `> [!NOTE] **Descripción**`,
      `> ${description}`,
      '',
      '## Especificaciones Técnicas',
      `- **Repositorio Origen**: [${cleanUrl}](${cleanUrl})`,
      `- **Tipo de Herramienta**: \`${toolType.toUpperCase()}\``,
      `- **Ruta Local**: \`${targetDir}\``,
      mcpRegistered ? `- **Servidor MCP**: Integrado en \`mcp_config.json\` de Antigravity.` : '',
      command ? `- **Comando de Ejecución**: \`${command}\`` : '',
      skillInstalled ? `- **Skill de Antigravity**: Sincronizada en \`~/.gemini/config/skills/${toolName}/\`` : '',
      '',
      '## Modo de Uso para la IA',
      mcpRegistered
        ? 'El servidor MCP ha sido registrado para Antigravity. Sus funciones están disponibles en `<mcp_servers>`.'
        : `Ejecutable vía \`tool_run(toolName="${toolName}", args=...)\` o CLI: \`node obsidian.js tool run ${toolName}\`.`,
      '',
      '---',
      `*Vinculado a [[00 Indice de Herramientas]] y [[00 Antigravity Hub]].*`
    ].filter(Boolean).join('\n');

    try {
      fs.writeFileSync(notePath, noteContent, 'utf8');
      ensureToolsVaultStructure(vaultPath);
    } catch (e) {}
  }

  return {
    status: 'ok',
    name: toolName,
    type: toolType,
    dir: targetDir,
    mcpRegistered,
    skillInstalled,
    description,
    message: `Herramienta "${toolName}" instalada correctamente desde GitHub (${toolType.toUpperCase()}).`
  };
}

/**
 * Create a Custom Tool (CLI or command)
 */
function createTool(toolData, vaultPath = null) {
  if (!toolData || !toolData.name) {
    throw new Error('Debes indicar un nombre para la herramienta.');
  }

  const toolName = toolData.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const command = toolData.command || '';
  const description = toolData.description || 'Herramienta personalizada configurada por el usuario.';
  const toolType = toolData.type || 'cli';

  const reg = loadToolsRegistry();
  const existingIdx = reg.tools.findIndex(t => t.id === toolName);
  const toolRecord = {
    id: toolName,
    name: toolData.name,
    type: toolType,
    command,
    description,
    status: 'active',
    installedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    reg.tools[existingIdx] = toolRecord;
  } else {
    reg.tools.push(toolRecord);
  }
  saveToolsRegistry(reg);

  if (vaultPath && fs.existsSync(vaultPath)) {
    ensureToolsVaultStructure(vaultPath);
    const notePath = path.join(vaultPath, '04_Herramientas', `${toolName}.md`);
    const noteContent = [
      '---',
      `title: "Tool: ${toolName}"`,
      `type: ai-tool`,
      `category: ${toolType}`,
      `installed_at: ${new Date().toISOString().split('T')[0]}`,
      '---',
      '',
      `# Tool: ${toolData.name}`,
      '',
      `> [!NOTE] **Descripción**`,
      `> ${description}`,
      '',
      '## Especificaciones',
      `- **Tipo**: \`${toolType.toUpperCase()}\``,
      command ? `- **Comando**: \`${command}\`` : '',
      '',
      '## Modo de Uso',
      `Ejecutable vía \`tool_run(toolName="${toolName}", args=...)\` o CLI: \`node obsidian.js tool run ${toolName}\`.`,
      '',
      '---',
      `*Vinculado a [[00 Indice de Herramientas]] y [[00 Antigravity Hub]].*`
    ].filter(Boolean).join('\n');

    try {
      fs.writeFileSync(notePath, noteContent, 'utf8');
      ensureToolsVaultStructure(vaultPath);
    } catch (e) {}
  }

  return {
    status: 'ok',
    name: toolName,
    tool: toolRecord,
    message: `Herramienta "${toolName}" creada correctamente.`
  };
}

/**
 * Register MCP Server in ~/.gemini/config/mcp_config.json
 */
function registerMcpServer(name, serverConfig) {
  const mcpConfigFile = path.join(getGlobalConfigDir(), 'mcp_config.json');
  let config = { mcpServers: {} };
  if (fs.existsSync(mcpConfigFile)) {
    try {
      config = JSON.parse(fs.readFileSync(mcpConfigFile, 'utf8'));
    } catch (e) {}
  }
  if (!config.mcpServers) config.mcpServers = {};

  config.mcpServers[name] = {
    command: serverConfig.command || 'node',
    args: serverConfig.args || [],
    env: serverConfig.env || {}
  };

  try {
    fs.writeFileSync(mcpConfigFile, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Deregister MCP Server from mcp_config.json
 */
function deregisterMcpServer(name) {
  const mcpConfigFile = path.join(getGlobalConfigDir(), 'mcp_config.json');
  if (fs.existsSync(mcpConfigFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(mcpConfigFile, 'utf8'));
      if (config.mcpServers && config.mcpServers[name]) {
        delete config.mcpServers[name];
        fs.writeFileSync(mcpConfigFile, JSON.stringify(config, null, 2), 'utf8');
        return true;
      }
    } catch (e) {}
  }
  return false;
}

/**
 * List all tools
 */
function listTools(vaultPath = null) {
  const reg = loadToolsRegistry();
  return {
    total: (reg.tools || []).length,
    tools: reg.tools || []
  };
}

/**
 * Run an installed tool
 */
async function runTool(toolName, args = [], options = {}) {
  const reg = loadToolsRegistry();
  const tool = (reg.tools || []).find(t => t.id === toolName || t.name.toLowerCase() === toolName.toLowerCase());

  if (!tool) {
    throw new Error(`Herramienta "${toolName}" no encontrada en el registro de tools.`);
  }

  if (tool.command) {
    const fullCmd = `${tool.command} ${Array.isArray(args) ? args.join(' ') : args}`;
    return new Promise((resolve, reject) => {
      exec(fullCmd, { cwd: tool.dir || process.cwd(), timeout: 30000 }, (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || stdout || err.message));
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      });
    });
  }

  throw new Error(`La herramienta "${toolName}" no tiene un comando ejecutable configurado.`);
}

/**
 * Uninstall a Tool
 */
function uninstallTool(toolName, vaultPath = null) {
  const reg = loadToolsRegistry();
  const idx = (reg.tools || []).findIndex(t => t.id === toolName || t.name.toLowerCase() === toolName.toLowerCase());
  if (idx < 0) {
    throw new Error(`Herramienta "${toolName}" no encontrada.`);
  }

  const tool = reg.tools[idx];

  // Remove directory
  if (tool.dir && fs.existsSync(tool.dir)) {
    try {
      fs.rmSync(tool.dir, { recursive: true, force: true });
    } catch (e) {}
  }

  // Deregister MCP
  if (tool.mcpRegistered) {
    deregisterMcpServer(tool.id);
  }

  // Remove Skill
  if (tool.skillInstalled) {
    const sDir = path.join(getGlobalConfigDir(), 'skills', tool.id);
    if (fs.existsSync(sDir)) {
      try { fs.rmSync(sDir, { recursive: true, force: true }); } catch (e) {}
    }
  }

  // Remove Obsidian Note
  if (vaultPath && fs.existsSync(vaultPath)) {
    const nPath = path.join(vaultPath, '04_Herramientas', `${tool.id}.md`);
    if (fs.existsSync(nPath)) {
      try { fs.unlinkSync(nPath); } catch (e) {}
    }
    ensureToolsVaultStructure(vaultPath);
  }

  reg.tools.splice(idx, 1);
  saveToolsRegistry(reg);

  return { status: 'ok', message: `Herramienta "${toolName}" desinstalada correctamente.` };
}

module.exports = {
  installFromGithub,
  createTool,
  listTools,
  runTool,
  uninstallTool,
  ensureToolsVaultStructure,
  loadToolsRegistry
};
