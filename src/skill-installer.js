const fs = require('fs');
const path = require('path');
const os = require('os');
const { getActiveOrConfiguredVault } = require('./vault-detector');
const syncEngine = require('./sync-engine');

/**
 * Skill & Rules Auto-Injector
 * Ensures the Antigravity AI agent has the Obsidian skill and rule active in ALL chats globally.
 */

function getGlobalConfigDir() {
  return path.join(os.homedir(), '.gemini', 'config');
}

function installSkillAndRules(targetVaultPath, options = {}) {
  const configDir = getGlobalConfigDir();
  const skillsDir = path.join(configDir, 'skills', 'antigravity-obsidian');
  const scriptsDir = path.join(skillsDir, 'scripts');
  const rulesDir = path.join(configDir, 'rules');

  // Ensure directories
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  if (!fs.existsSync(rulesDir)) {
    fs.mkdirSync(rulesDir, { recursive: true });
  }

  // Resolve vault
  const vault = getActiveOrConfiguredVault(targetVaultPath);
  const vaultPath = vault ? vault.path : (targetVaultPath || '');
  const vaultName = vault ? vault.name : path.basename(vaultPath || 'Obsidian Vault');

  // 1. Write Bridge State Config (Preserve existing preferences if not overridden)
  const bridgeConfigPath = path.join(configDir, 'antigravity-obsidian.json');
  let existingConfig = {};
  if (fs.existsSync(bridgeConfigPath)) {
    try {
      existingConfig = JSON.parse(fs.readFileSync(bridgeConfigPath, 'utf8'));
    } catch (e) {}
  }

  const proactiveLookup = options.proactiveLookup !== undefined 
    ? !!options.proactiveLookup 
    : (existingConfig.proactiveLookup !== undefined ? existingConfig.proactiveLookup : true);

  const autoSave = options.autoSave !== undefined 
    ? !!options.autoSave 
    : (existingConfig.autoSave !== undefined ? existingConfig.autoSave : true);

  const bridgeConfig = {
    vaultPath,
    vaultName,
    active: !!vaultPath,
    proactiveLookup,
    autoSave,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(bridgeConfigPath, JSON.stringify(bridgeConfig, null, 2), 'utf8');

  // 2. Deploy Runner Script into scripts/obsidian.js
  const scriptPath = path.join(scriptsDir, 'obsidian.js');
  const runnerSource = path.join(__dirname, 'obsidian-runner.js');
  if (fs.existsSync(runnerSource)) {
    fs.copyFileSync(runnerSource, scriptPath);
  }

  // Normalized script execution path for Markdown
  const normalizedScriptPath = scriptPath.replace(/\\/g, '/');

  // 3. Write SKILL.md
  const skillMdPath = path.join(skillsDir, 'SKILL.md');
  const skillMdContent = [
    '---',
    'name: antigravity-obsidian',
    'description: >',
    '  Obsidian for Antigravity — Segundo Cerebro y Memoria Persistente OBLIGATORIA.',
    '  Activar e invocar SIEMPRE para buscar antecedentes tecnicos de proyectos o errores con search/read,',
    '  y registrar automaticamente lecciones aprendidas, soluciones de bugs y arquitecturas con save-memory.',
    '---',
    '',
    '# 🧠 Obsidian for Antigravity — Segundo Cerebro Autónomo',
    '',
    'Esta skill te conecta de forma directa con la bóveda de **Obsidian** del usuario.',
    'Bóveda conectada actual: **' + vaultName + '** (`' + vaultPath + '`).',
    '',
    '---',
    '',
    '## 🤖 COMPORTAMIENTO AUTÓNOMO E INTELIGENTE (Obligatorio para el Agente)',
    '',
    '### 1. 🔍 Búsqueda Proactiva (Recuperar memoria antes de inventar)',
    '**ANTES de investigar desde cero, preguntar al usuario o asumir una arquitectura:**',
    '- Comprueba si el proyecto o problema ya tiene notas registradas en Obsidian:',
    '```powershell',
    'node "' + normalizedScriptPath + '" search "termino_o_proyecto"',
    '```',
    '- Si encuentras una nota relevante, lee sus lecciones aprendidas:',
    '```powershell',
    'node "' + normalizedScriptPath + '" read "NombreDeLaNota"',
    '```',
    '- Aplica las soluciones previas de inmediato para ahorrar tiempo y evitar repetir errores.',
    '',
    '### 2. 💾 Grabación Autónoma (Aprender de las conversaciones SIN que el usuario lo pida)',
    '**NO ESPERES a que el usuario te diga "guarda esto en obsidian". Sé proactivo e inteligente:**',
    'Debes guardar una memoria automáticamente siempre que:',
    '- **Resuelvas un bug complejo** (concurrencia, errores de base de datos, configuraciones de servidor, errores de hooks/tipos).',
    '- **Definas una arquitectura nueva** (rutas de backend, esquemas, APIs, endpoints, contenedores Docker).',
    '- **Descubras particularidades del proyecto** (puertos, credenciales de dev, directorios de Plesk, versiones).',
    '- **El usuario mencione preferencias o reglas clave**.',
    '',
    '**Comando para guardar:**',
    '```powershell',
    'node "' + normalizedScriptPath + '" save-memory --title "Título Claro y Descriptivo" --category "bugfix|arquitectura|configuracion|general" --summary "Resumen conciso de 1-2 frases" --content "Pasos detallados, código aplicado y conclusiones"',
    '```',
    '',
    'Tras guardar, añade un breve aviso al final de tu respuesta:',
    '> *🧠 He registrado esta lección en tu Segundo Cerebro de Obsidian: `[[Título]]`.*',
    '',
    '---',
    '',
    '## 🛠️ Herramientas CLI Disponibles',
    '',
    '| Comando | Acción |',
    '|---|---|',
    '| `node "' + normalizedScriptPath + '" status` | Estado del Vault, notas y estadísticas |',
    '| `node "' + normalizedScriptPath + '" search "query"` | Buscar notas por término clave |',
    '| `node "' + normalizedScriptPath + '" read "Nota"` | Leer contenido completo de una nota |',
    '| `node "' + normalizedScriptPath + '" save-memory --title "..." --content "..."` | Guardar nueva memoria en el grafo |',
    '| `node "' + normalizedScriptPath + '" open "Nota"` | Abrir nota en la app Obsidian |',
    '',
    '---',
    '',
    '## 📌 Estructura en el Vault',
    '- `Antigravity/00 Antigravity Hub.md`: Mapa central que ilumina la Vista Gráfica (Graph View).',
    '- `Antigravity/Memoria/`: Todas las lecciones y soluciones interconectadas con `[[...]]`.',
    '- `Antigravity/Skills/`: Fichas de todas las skills disponibles.',
    '- `Antigravity/Proyectos/`: Fichas técnicas de cada proyecto.',
    ''
  ].join('\n');
  fs.writeFileSync(skillMdPath, skillMdContent, 'utf8');

  // 4. Write Global Rule (so ALL chats know about Obsidian!)
  const rulePath = path.join(rulesDir, 'obsidian-brain.md');
  const proactiveSection = proactiveLookup
    ? [
        '### 1. 🔍 CONSULTA PROACTIVA DEL VAULT (Paso 1 Obligatorio al recibir cualquier tarea):',
        'Al inicio de cualquier conversación o tarea técnica (investigar código, resolver bugs, añadir features, configurar servidores, etc.):',
        '- **Comprueba si ya existen antecedentes en Obsidian ANTES de investigar desde cero:**',
        '  `node "' + normalizedScriptPath + '" search "<nombre del proyecto o tecnologia o error>"`',
        '- **Si encuentras notas relevantes, léelas de inmediato:**',
        '  `node "' + normalizedScriptPath + '" read "<NombreDeLaNota>"`',
        '- **Aplica el contexto recuperado:** No reinventes la rueda, mantén coherencia con arquitecturas previas y evita errores ya solucionados.'
      ].join('\n')
    : '### 1. 🔍 Consulta del Vault:\nConsulta la bóveda de Obsidian cuando el usuario lo solicite o cuando necesites recuperar información de sesiones pasadas.';

  const autoSaveSection = autoSave
    ? [
        '### 2. 💾 GRABACIÓN AUTÓNOMA OBLIGATORIA (Aprender de las conversaciones):',
        '**REGLA DE ORO: NO ESPERES A QUE EL USUARIO TE PIDA GUARDAR.**',
        'El asistente DEBE registrar de forma proactiva una memoria en Obsidian siempre que:',
        '1. Resuelva un bug, error de compilación, tipo o configuración.',
        '2. Defina o modifique arquitectura (endpoints, rutas, bases de datos, docker, proxy).',
        '3. Integre librerías, modifique scripts o descubra comportamientos no triviales.',
        '4. El usuario establezca una regla de negocio o preferencia técnica importante.',
        '',
        '**Comando de ejecución:**',
        '  `node "' + normalizedScriptPath + '" save-memory --title "<Título Descriptivo>" --category "bugfix|arquitectura|configuracion|general" --summary "<Resumen de 1 frase>" --content "<Detalles técnicos, causa del problema y solución aplicada>"`',
        '',
        'Tras ejecutar el comando, incluye siempre al final de tu respuesta:',
        '> *🧠 He registrado esta lección en tu Segundo Cerebro de Obsidian: `[[Título]]`.*'
      ].join('\n')
    : '### 2. 💾 Guardado de Conocimiento:\nGuarda notas en Obsidian cuando el usuario lo solicite explícitamente.';

  const ruleContent = [
    '---',
    'description: Segundo Cerebro Autónomo y Memoria Persistente — Obsidian for Antigravity',
    '---',
    '',
    '# 🧠 Protocolo de Segundo Cerebro Autónomo — Obsidian for Antigravity',
    '',
    'El usuario tiene conectada su bóveda de Obsidian como **Segundo Cerebro y Memoria Persistente a Largo Plazo**:',
    '- Bóveda activa: **' + vaultName + '** (`' + vaultPath + '`).',
    '- Skill activa disponible en todos los chats: **`antigravity-obsidian`**.',
    '- Consulta proactiva: **' + (proactiveLookup ? 'ACTIVADA (OBLIGATORIA)' : 'Opcional') + '**.',
    '- Guardado autónomo: **' + (autoSave ? 'ACTIVADO (AUTOMÁTICO)' : 'Bajo petición') + '**.',
    '',
    '## 🎯 REGLAS MANDATORIAS PARA EL ASISTENTE EN TODAS LAS CONVERSACIONES:',
    '',
    proactiveSection,
    '',
    autoSaveSection,
    '',
    '### 3. 🌐 Interconexión en Grafo:',
    '- Todas las notas están vinculadas al mapa central `[[00 Antigravity Hub]]` para que el Graph View de Obsidian se mantenga vivo e interactivo.',
    ''
  ].join('\n');
  fs.writeFileSync(rulePath, ruleContent, 'utf8');

  // 4b. Write Global GEMINI.md & AGENTS.md in ~/.gemini/config/ (universally loaded in ALL chats)
  const geminiMdPath = path.join(configDir, 'GEMINI.md');
  const agentsMdPath = path.join(configDir, 'AGENTS.md');
  fs.writeFileSync(geminiMdPath, ruleContent, 'utf8');
  fs.writeFileSync(agentsMdPath, ruleContent, 'utf8');


  // 5. Run Initial Sync if vault path exists
  let syncResult = null;
  if (vaultPath && fs.existsSync(vaultPath)) {
    syncResult = syncEngine.syncAll(vaultPath, process.cwd());
  }

  return {
    vaultName,
    vaultPath,
    skillMdPath,
    scriptPath,
    rulePath,
    syncResult,
  };
}

module.exports = {
  getGlobalConfigDir,
  installSkillAndRules,
};
