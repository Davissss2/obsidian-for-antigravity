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
    '  Obsidian for Antigravity — Segundo Cerebro Inteligente y Memoria Persistente de Bajo Contexto.',
    '  Distingue cuándo usar Skills vs Memoria, realiza triage ultra-compacto (<100 tokens),',
    '  peek de soluciones directas y auto-grabación proactiva tras resolver bugs o arquitecturas.',
    '---',
    '',
    '# 🧠 Obsidian for Antigravity — Segundo Cerebro Autónomo & Eficiente',
    '',
    'Bóveda conectada actual: **' + vaultName + '** (`' + vaultPath + '`).',
    '',
    '## 🧭 MATRIZ DE DECISIÓN: ¿Cuándo mirar una SKILL vs la MEMORIA?',
    '',
    '| Tipo | Propósito Principal | Cuándo Mirarla | Dónde Mirarla |',
    '|---|---|---|---|',
    '| ⚡ **SKILL** | **¿CÓMO hacerlo?** (Procedimientos, APIs y Workflows) | Al ejecutar tareas de herramientas especializadas (ej: ERP, PrestaShop, cuentas) | En `<skills>` de tu prompt o `view_file` a su `SKILL.md` |',
    '| 🧠 **MEMORIA** | **¿QUÉ se hizo antes?** (Antecedentes, Bugs y Arquitectura) | Ante errores, bugs desconocidos, dudas de diseño previo o configs | Vía `triage` y `peek` en este script |',
    '| 🚫 **NINGUNA** | Tareas triviales o código auto-explicativo | Saludos, preguntas teóricas generales o código ya evidente | **No consultar nada** (Ahorro del 100% de tokens) |',
    '',
    '---',
    '',
    '## 🎯 PROTOCOLO DE CONSULTA DE ULTRA-BAJO CONTEXTO',
    '',
    '### Paso 1: Triage Inteligente (Solo ~60 tokens)',
    'Cuando necesites saber si existe un antecedente o si aplica una skill:',
    '```powershell',
    'node "' + normalizedScriptPath + '" triage "términos clave del problema o proyecto"',
    '```',
    '- **Si `triage` devuelve un resumen con la solución:** ¡ÚSALO DIRECTAMENTE! No necesitas leer más archivos ni consumir más contexto.',
    '- **Si `triage` recomienda una Skill:** Activa la skill indicada para seguir el procedimiento.',
    '- **Si `hasAntecedents: false`:** Procede directamente a programar sin hacer más búsquedas.',
    '',
    '### Paso 2: Extracción Focalizada (Solo si el resumen no basta)',
    'Si requieres ver los pasos de código exactos sin volcar toda la nota:',
    '```powershell',
    'node "' + normalizedScriptPath + '" peek "NombreDeLaNota"',
    '```',
    '*(Extrae únicamente la sección técnica de solución, ahorrando el 90% de contexto vs "read").*',
    '',
    '---',
    '',
    '## 💾 GRABACIÓN AUTÓNOMA Y PROACTIVA (Aprender sin que te lo pidan)',
    '**REGLA DE ORO:** No esperes a que el usuario te diga "guarda esto en obsidian".',
    'Debes guardar una memoria automáticamente siempre que:',
    '1. Resuelvas un bug complejo (concurrencia, PDO, base de datos, tipos, build, proxy).',
    '2. Definas o modifiques arquitectura clave (rutas, endpoints, tablas, microservicios).',
    '3. Descubras particularidades de entorno o servidores (puertos, Plesk, Docker, variables).',
    '',
    '**Comando de ejecución:**',
    '```powershell',
    'node "' + normalizedScriptPath + '" save-memory --title "Título Descriptivo" --category "bugfix|arquitectura|configuracion|general" --summary "Resumen conciso en 1 frase de la solución" --content "Detalles técnicos, causa del error y pasos/código aplicados"',
    '```',
    '*(Actualiza automáticamente la nota, el índice de memoria, el Hub del grafo, el manifiesto y Knowledge Items).*',
    '',
    'Tras ejecutar el guardado, incluye al final de tu respuesta:',
    '> *🧠 He registrado esta lección en tu Segundo Cerebro de Obsidian: `[[Título]]`.*',
    '',
    '---',
    '',
    '## 🛠️ Comandos CLI Disponibles',
    '',
    '| Comando | Descripción |',
    '|---|---|',
    '| `node "' + normalizedScriptPath + '" triage "query"` | Triage inteligente de ultra-bajo contexto (<100 tokens) |',
    '| `node "' + normalizedScriptPath + '" peek "Nota"` | Extrae resumen y solución técnica directa |',
    '| `node "' + normalizedScriptPath + '" save-memory ...` | Guarda memoria y actualiza índices automáticamente |',
    '| `node "' + normalizedScriptPath + '" status` | Estado de conexión y notas sincronizadas |',
    '| `node "' + normalizedScriptPath + '" list-skills` | Lista de skills activas en el sistema |',
    '| `node "' + normalizedScriptPath + '" search "query"` | Búsqueda compacta |',
    '| `node "' + normalizedScriptPath + '" read "Nota"` | Lectura completa (usar solo si es estrictamente necesario) |',
    '| `node "' + normalizedScriptPath + '" open [Nota]` | Abre la nota en Obsidian Desktop |',
    ''
  ].join('\n');
  fs.writeFileSync(skillMdPath, skillMdContent, 'utf8');

  // 4. Write Global Rule (so ALL chats know about Obsidian with Low-Context!)
  const rulePath = path.join(rulesDir, 'obsidian-brain.md');
  const proactiveSection = proactiveLookup
    ? [
        '### 1. 🔍 CONSULTA INTELIGENTE DE BAJO CONTEXTO (Zero Token Waste):',
        '**Aplica este filtro antes de cualquier consulta:**',
        '- 🚫 **NO consultes** en saludos, preguntas teóricas generales o tareas donde el código actual ya lo explica todo.',
        '- ⚡ **Consulta una SKILL** si la tarea es operativa/procedural y coincide con las capacidades en `<skills>`.',
        '- 🧠 **Consulta la MEMORIA** únicamente ante errores/bugs desconocidos, configuración de servidores o dudas de arquitectura previa:',
        '  `node "' + normalizedScriptPath + '" triage "<términos o error>"`',
        '- **Si triage devuelve un resumen:** ¡Úsalo directamente! No quemes tokens leyendo archivos enteros.',
        '- **Si requieres el código paso a paso exacto:** Ejecuta `node "' + normalizedScriptPath + '" peek "<NombreDeLaNota>"`. (Evita `read` completo a menos que sea imprescindible).'
      ].join('\n')
    : '### 1. 🔍 Consulta del Vault:\nConsulta la bóveda de Obsidian cuando el usuario lo solicite o cuando necesites recuperar antecedentes técnicos específicos.';

  const autoSaveSection = autoSave
    ? [
        '### 2. 💾 GRABACIÓN AUTÓNOMA Y PROACTIVA (Aprender de las conversaciones):',
        '**REGLA DE ORO: NO ESPERES A QUE EL USUARIO TE PIDA GUARDAR.**',
        'El asistente DEBE registrar de forma proactiva una memoria en Obsidian siempre que:',
        '1. Resuelva un bug o error técnico no trivial.',
        '2. Defina o modifique arquitectura (endpoints, rutas, BBDD, Docker, proxy).',
        '3. Descubra particularidades de entorno, servidores o dependencias.',
        '',
        '**Comando de ejecución:**',
        '  `node "' + normalizedScriptPath + '" save-memory --title "<Título Descriptivo>" --category "bugfix|arquitectura|configuracion|general" --summary "<Resumen de 1 frase>" --content "<Detalles técnicos y solución aplicada>"`',
        '',
        'Tras ejecutar el comando, incluye siempre al final de tu respuesta:',
        '> *🧠 He registrado esta lección en tu Segundo Cerebro de Obsidian: `[[Título]]`.*'
      ].join('\n')
    : '### 2. 💾 Guardado de Conocimiento:\nGuarda notas en Obsidian cuando el usuario lo solicite explícitamente.';

  const ruleContent = [
    '---',
    'description: Segundo Cerebro Autónomo y Memoria Persistente de Bajo Contexto — Obsidian for Antigravity',
    '---',
    '',
    '# 🧠 Protocolo de Segundo Cerebro Autónomo — Obsidian for Antigravity',
    '',
    'El usuario tiene conectada su bóveda de Obsidian como **Segundo Cerebro y Memoria Persistente**:',
    '- Bóveda activa: **' + vaultName + '** (`' + vaultPath + '`).',
    '- Skill activa en todos los chats: **`antigravity-obsidian`**.',
    '- Modo de consulta: **Triage Inteligente de Ultra-Bajo Contexto (Zero Token Waste)**.',
    '- Guardado autónomo: **' + (autoSave ? 'ACTIVADO (AUTOMÁTICO)' : 'Bajo petición') + '**.',
    '',
    '## 🎯 REGLAS MANDATORIAS PARA EL ASISTENTE:',
    '',
    proactiveSection,
    '',
    autoSaveSection,
    '',
    '### 3. 🌐 Interconexión en Grafo:',
    '- Todas las notas se vinculan a `[[00 Antigravity Hub]]` e `[[00 Indice de Memoria]]` manteniendo activo el Graph View.',
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
