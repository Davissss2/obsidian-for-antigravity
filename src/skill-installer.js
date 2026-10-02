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

  // 3. Write SKILL.md (Zero Emojis, Low Context)
  const skillMdPath = path.join(skillsDir, 'SKILL.md');
  const skillMdContent = [
    '---',
    'name: antigravity-obsidian',
    'description: >',
    '  Obsidian for Antigravity — Segundo Cerebro Tecnico y Memoria de Bajo Contexto.',
    '  Distingue Skills (procedimientos) vs Memoria (antecedentes), triage ultra-compacto (<80 tokens),',
    '  extraccion selectiva con peek y auto-guardado atomico sin emojis ni texto de relleno.',
    '---',
    '',
    '# Obsidian for Antigravity — Segundo Cerebro Tecnico',
    '',
    'Boveda conectada: **' + vaultName + '** (`' + vaultPath + '`).',
    '',
    '## Matriz de Decision: Skill vs Memoria vs Nada',
    '',
    '| Tipo | Proposito | Cuando Consultar | Donde Mirar |',
    '|---|---|---|---|',
    '| **SKILL** | ¿COMO hacerlo? (Procedimientos, APIs y Workflows) | Al operar herramientas especializadas (ej: ERP, PrestaShop, tokens PA) | `<skills>` en prompt o `view_file` a su `SKILL.md` |',
    '| **MEMORIA** | ¿QUE se hizo antes? (Antecedentes, Bugs y Arquitectura) | Ante errores desconocidos, problemas de entorno o decisiones previas | `triage` y `peek` en este script |',
    '| **NINGUNA** | Tareas triviales o codigo evidente | Saludos, preguntas teoricas generales o codigo auto-explicativo | **No consultar nada (0 tokens)** |',
    '',
    '---',
    '',
    '## Protocolo de Consulta de Bajo Contexto',
    '',
    '### Paso 1: Triage Inteligente (<80 tokens)',
    '```powershell',
    'node "' + normalizedScriptPath + '" triage "terminos clave del problema o proyecto"',
    '```',
    '- **Si triage devuelve un resumen:** Usalo directamente. Resuelve el problema sin leer mas archivos.',
    '- **Si triage recomienda una Skill:** Activa la skill indicada para seguir el procedimiento.',
    '- **Si hasAntecedents es false:** Resuelve directamente sin hacer mas busquedas.',
    '',
    '### Paso 2: Extraccion Selectiva con Peek (Solo si el resumen no basta)',
    '```powershell',
    'node "' + normalizedScriptPath + '" peek "NombreDeLaNota"',
    '```',
    '*(Extrae exclusivamente la solucion tecnica, ahorrando el 90% de contexto vs read).*',
    '',
    '---',
    '',
    '## Grabacion Autonoma Proactiva (Sin Emojis, Maxima Concisión)',
    'Registra una memoria inmediatamente tras:',
    '1. Resolver un bug tecnico o error de configuracion.',
    '2. Definir o modificar arquitectura (rutas, endpoints, tablas, proxy, docker).',
    '3. Descubrir particularidades de entorno o dependencias.',
    '',
    '**Reglas obligatorias de estilo:**',
    '- **Cero emojis**: No incluyas emojis en titulos, resumenes ni contenido.',
    '- **Resumen de 1 frase**: Formato `Problema tecnico -> Solucion aplicada`.',
    '- **Solo datos tecnicos**: Causa raiz, codigo/comando exacto y verificacion. Sin introducciones ni relleno.',
    '',
    '**Comando de guardado atomico:**',
    '```powershell',
    'node "' + normalizedScriptPath + '" save --title "Titulo Descriptivo" --category "bugfix|arquitectura|configuracion|general" --summary "Problema -> Solucion aplicada" --content "Causa raiz, pasos tecnicos y codigo aplicado"',
    '```',
    '',
    'Tras guardar, anade este aviso al final:',
    '> *Registrado en Segundo Cerebro de Obsidian: `[[Titulo]]`.*',
    '',
    '---',
    '',
    '## Comandos CLI Disponibles',
    '',
    '| Comando | Descripcion |',
    '|---|---|',
    '| `node "' + normalizedScriptPath + '" triage "query"` | Triage inteligente ultra-compacto (<80 tokens) |',
    '| `node "' + normalizedScriptPath + '" peek "Nota"` | Solucion tecnica directa sin metadatos |',
    '| `node "' + normalizedScriptPath + '" save --title "..." ...` | Guardado atomico en vault y Knowledge Items |',
    '| `node "' + normalizedScriptPath + '" catalog` | Resumen de 1 linea de todas las skills y memorias |',
    '| `node "' + normalizedScriptPath + '" skills` | Lista rapida de skills con descripcion corta |',
    '| `node "' + normalizedScriptPath + '" memories` | Lista rapida de memorias con resumen corto |',
    '| `node "' + normalizedScriptPath + '" status` | Estado de conexion y estadisticas |',
    '| `node "' + normalizedScriptPath + '" search "query"` | Busqueda compacta |',
    '| `node "' + normalizedScriptPath + '" read "Nota"` | Lectura completa (usar solo si es imprescindible) |',
    '| `node "' + normalizedScriptPath + '" open [Nota]` | Abre la nota en Obsidian Desktop |',
    ''
  ].join('\n');
  fs.writeFileSync(skillMdPath, skillMdContent, 'utf8');

  // 4. Write Global Rule (Zero Emojis, High Density)
  const rulePath = path.join(rulesDir, 'obsidian-brain.md');
  const proactiveSection = proactiveLookup
    ? [
        '### 1. CONSULTA INTELIGENTE DE BAJO CONTEXTO (Zero Token Waste):',
        '**Aplica este filtro antes de cualquier consulta:**',
        '- **NO consultes** en saludos, preguntas teoricas generales o tareas donde el codigo actual ya lo explica todo.',
        '- **Consulta una SKILL** si la tarea es operativa/procedural y coincide con las capacidades en `<skills>`.',
        '- **Consulta la MEMORIA** unicamente ante errores/bugs desconocidos, configuracion de servidores o dudas de arquitectura previa:',
        '  `node "' + normalizedScriptPath + '" triage "<terminos o error>"`',
        '- **Si triage devuelve un resumen:** ¡Usalo directamente! No quemes tokens leyendo archivos enteros.',
        '- **Si requieres el codigo paso a paso exacto:** Ejecuta `node "' + normalizedScriptPath + '" peek "<NombreDeLaNota>"`. (Evita `read` completo).'
      ].join('\n')
    : '### 1. Consulta del Vault:\nConsulta la boveda de Obsidian cuando el usuario lo solicite o cuando necesites recuperar antecedentes tecnicos especificos.';

  const autoSaveSection = autoSave
    ? [
        '### 2. GRABACION AUTONOMA Y PROACTIVA (Sin Emojis, Maxima Densidad):',
        '**REGLA DE ORO: NO ESPERES A QUE EL USUARIO TE PIDA GUARDAR.**',
        'El asistente DEBE registrar de forma proactiva una memoria en Obsidian siempre que:',
        '1. Resuelva un bug o error tecnico no trivial.',
        '2. Defina o modifique arquitectura (endpoints, rutas, BBDD, Docker, proxy).',
        '3. Descubra particularidades de entorno, servidores o dependencias.',
        '',
        '**Directivas de formato obligatorio:**',
        '- CERO EMOJIS: No uses emojis en titulos, resumenes ni notas.',
        '- Resumen de 1 frase: (Problema tecnico -> Solucion aplicada).',
        '- Contenido: Causa raiz y codigo/comando exacto de solucion. Cero texto de relleno.',
        '',
        '**Comando de ejecucion:**',
        '  `node "' + normalizedScriptPath + '" save --title "<Titulo Descriptivo>" --category "bugfix|arquitectura|configuracion|general" --summary "<Problema -> Solucion>" --content "<Causa y solucion tecnica>"`',
        '',
        'Tras ejecutar el comando, incluye siempre al final de tu respuesta:',
        '> *Registrado en Segundo Cerebro de Obsidian: `[[Titulo]]`.*'
      ].join('\n')
    : '### 2. Guardado de Conocimiento:\nGuarda notas en Obsidian cuando el usuario lo solicite explicitamente.';

  const ruleContent = [
    '---',
    'description: Segundo Cerebro Autonomo y Memoria Persistente de Bajo Contexto — Obsidian for Antigravity',
    '---',
    '',
    '# Protocolo de Segundo Cerebro Autonomo — Obsidian for Antigravity',
    '',
    'El usuario tiene conectada su boveda de Obsidian como **Segundo Cerebro y Memoria Persistente**:',
    '- Boveda activa: **' + vaultName + '** (`' + vaultPath + '`).',
    '- Skill activa en todos los chats: **`antigravity-obsidian`**.',
    '- Modo de consulta: **Triage Inteligente de Ultra-Bajo Contexto (Zero Token Waste)**.',
    '- Guardado autonomo: **' + (autoSave ? 'ACTIVADO (AUTOMATICO)' : 'Bajo peticion') + '**.',
    '',
    '## REGLAS MANDATORIAS PARA EL ASISTENTE:',
    '',
    proactiveSection,
    '',
    autoSaveSection,
    '',
    '### 3. Interconexion en Grafo:',
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
