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

  const configuredLang = options.language !== undefined ? options.language : (existingConfig.language || 'auto');
  const configuredUser = options.userName !== undefined ? options.userName : (existingConfig.userName || '');

  const userName = syncEngine.resolveUserName(vaultPath, configuredUser);
  const lang = syncEngine.resolveLanguage({ language: configuredLang });
  const isEn = (lang === 'en');

  const personalityInfo = syncEngine.resolvePersonality(vaultPath, {
    aiName: options.aiName !== undefined ? options.aiName : existingConfig.aiName,
    userCallsign: options.userCallsign !== undefined ? options.userCallsign : existingConfig.userCallsign,
    personality: options.personality !== undefined ? options.personality : existingConfig.personality,
    personalityConfigured: options.personalityConfigured !== undefined ? options.personalityConfigured : existingConfig.personalityConfigured,
    userName: configuredUser || userName,
    language: configuredLang,
  });

  const aiName = personalityInfo.aiName;
  const userCallsign = personalityInfo.userCallsign;
  const personality = personalityInfo.personality;
  const personalityConfigured = personalityInfo.configured;

  const bridgeConfig = {
    vaultPath,
    vaultName,
    active: !!vaultPath,
    proactiveLookup,
    autoSave,
    language: configuredLang,
    userName: configuredUser || userName,
    aiName,
    userCallsign,
    personality,
    personalityConfigured,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(bridgeConfigPath, JSON.stringify(bridgeConfig, null, 2), 'utf8');

  // 2. Deploy Runner Script into scripts/obsidian.js
  const scriptPath = path.join(scriptsDir, 'obsidian.js');
  const runnerSource = path.join(__dirname, 'obsidian-runner.js');
  if (fs.existsSync(runnerSource)) {
    fs.copyFileSync(runnerSource, scriptPath);
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(scriptPath, 0o755);
      } catch (e) {}
    }
  }

  // Normalized script execution path for Markdown
  const normalizedScriptPath = scriptPath.replace(/\\/g, '/');

  // 3. Write SKILL.md (Zero Emojis, Low Context)
  const skillMdPath = path.join(skillsDir, 'SKILL.md');
  const skillMdContent = isEn
    ? [
        '---',
        'name: antigravity-obsidian',
        'description: >',
        '  Obsidian for Antigravity — Technical Second Brain & Low-Context Memory.',
        '  Trigger with /obsidian, /obsidian save, /obsidian status, /obsidian soul, /obsidian learn,',
        '  /obsidian triage, /obsidian peek, /obsidian catalog, /obsidian open, or when accessing Obsidian notes.',
        '  Separates Skills (procedures) vs Memory (past records), ultra-compact triage (<80 tokens),',
        '  selective peek extraction, and atomic auto-saving with zero emojis and zero fluff.',
        '---',
        '',
        '# Obsidian for Antigravity — Technical Second Brain',
        '',
        'Connected Vault: **' + vaultName + '** (`' + vaultPath + '`).',
        '',
        '## Decision Matrix: Skill vs Memory vs Nothing',
        '',
        '| Type | Purpose | When to Query | Where to Look |',
        '|---|---|---|---|',
        '| **SKILL** | HOW to do it? (Procedures, APIs & Workflows) | When operating specialized tools (e.g. ERP, PrestaShop, PA tokens) | `<skills>` in prompt or `view_file` on its `SKILL.md` |',
        '| **MEMORY** | WHAT was done before? (Past records, Bugs & Architecture) | On unknown errors, environment quirks, or previous decisions | `triage` and `peek` via this script |',
        '| **NOTHING** | Trivial tasks or self-evident code | Greetings, general theory, or self-explanatory code | **Do not query anything (0 tokens)** |',
        '',
        '---',
        '',
        '## Low-Context Query Protocol',
        '',
        '### Step 1: Smart Triage (<80 tokens)',
        '```bash',
        'node "' + normalizedScriptPath + '" triage "key terms of problem or project"',
        '```',
        '- **If triage returns a summary:** Use it directly. Solve the problem without reading more files.',
        '- **If triage recommends a Skill:** Activate the specified skill to follow the procedure.',
        '- **If hasAntecedents is false:** Proceed directly without further searches.',
        '',
        '### Step 2: Selective Extraction with Peek (Only if summary is insufficient)',
        '```bash',
        'node "' + normalizedScriptPath + '" peek "NoteName"',
        '```',
        '*(Extracts strictly the technical solution, saving 90% context vs full read).*',
        '',
        '---',
        '',
        '## Selective Autonomous Recording (Only Real Learnings and Overcome Blockers)',
        '**Strict filter: DO NOT document obvious or routine tasks.**',
        'Do not save standard bugs, typos, fixes where the solution was obvious, or routine tasks.',
        '',
        '**Record memory ONLY after:**',
        '1. Overcoming a difficult blocker or failure after deep debugging or research.',
        '2. Discovering hidden quirks, library traps, or undocumented environment nuances.',
        '3. Creating a new reusable technical procedure that expands a Skill.',
        '',
        '**Mandatory Style Rules:**',
        '- **Zero emojis**: No emojis in titles, summaries, or content.',
        '- **1-Sentence summary**: Format `Non-trivial problem -> Applied solution`.',
        '- **Technical data only**: Root cause, exact code/command, verification. No filler or pleasantries.',
        '',
        '**Atomic save command (high-value knowledge only):**',
        '```bash',
        'node "' + normalizedScriptPath + '" save --title "Descriptive Title" --category "bugfix|arquitectura|configuracion|general" --summary "Problem -> Applied solution" --content "Root cause, technical steps, and applied code"',
        '```',
        '',
        'After saving, append this notice at the end:',
        '> *Recorded in Obsidian Second Brain: `[[Title]]`.*',
        '',
        '---',
        '',
        '## Chat Slash Commands (/obsidian)',
        '',
        'Users can run quick actions in chat by typing slash commands:',
        '',
        '| Slash Command | Equivalent CLI Execution | Description |',
        '|---|---|---|',
        '| `/obsidian` or `/obsidian status` | `node "' + normalizedScriptPath + '" status` | Check connection and stats |',
        '| `/obsidian personality [args]` | `node "' + normalizedScriptPath + '" personality [args]` | View or configure AI agent personality, name & user callsign |',
        '| `/obsidian project [register|list|status]` | `node "' + normalizedScriptPath + '" project [args]` | Manage unified projects registry & auto-detection |',
        '| `/obsidian save <title> [content]` | `node "' + normalizedScriptPath + '" save --title "<title>" --content "<content>"` | Save technical solution |',
        '| `/obsidian soul` | `node "' + normalizedScriptPath + '" soul` | View active Soul & User Profile |',
        '| `/obsidian learn <preference>` | `node "' + normalizedScriptPath + '" learn "<preference>"` | Learn new user workflow habit |',
        '| `/obsidian triage <query>` | `node "' + normalizedScriptPath + '" triage "<query>"` | Low-context triage |',
        '| `/obsidian peek <note>` | `node "' + normalizedScriptPath + '" peek "<note>"` | Extract exact technical fix |',
        '| `/obsidian catalog` | `node "' + normalizedScriptPath + '" catalog` | 1-line overview of skills & memories |',
        '| `/obsidian skills` | `node "' + normalizedScriptPath + '" skills` | List available vault skills |',
        '| `/obsidian memories` | `node "' + normalizedScriptPath + '" memories` | List technical memories |',
        '| `/obsidian open [note]` | `node "' + normalizedScriptPath + '" open [note]` | Open note in Obsidian Desktop |',
        '| `/obsidian help` | `node "' + normalizedScriptPath + '" help` | Show quick command list |',
        '',
        '---',
        '',
        '## Available CLI Commands',
        '',
        '| Command | Description |',
        '|---|---|',
        '| `node "' + normalizedScriptPath + '" personality [--ai-name <n>] [--user-callsign <c>] [--personality <p>]` | View or configure AI personality & callsign |',
        '| `node "' + normalizedScriptPath + '" project [register|list|status] [path]` | Unified project registry & autonomous stack detection |',
        '| `node "' + normalizedScriptPath + '" triage "query"` | Ultra-compact smart triage (<80 tokens) |',
        '| `node "' + normalizedScriptPath + '" peek "Note"` | Direct technical solution without metadata overhead |',
        '| `node "' + normalizedScriptPath + '" save --title "..." ...` | Atomic save to vault and Knowledge Items |',
        '| `node "' + normalizedScriptPath + '" catalog` | 1-line summary of all skills and memories |',
        '| `node "' + normalizedScriptPath + '" skills` | Quick list of skills with short descriptions |',
        '| `node "' + normalizedScriptPath + '" memories` | Quick list of memories with short summaries |',
        '| `node "' + normalizedScriptPath + '" soul` | Shows active Soul and User Profile |',
        '| `node "' + normalizedScriptPath + '" learn "text"` | Records a newly learned habit or preference |',
        '| `node "' + normalizedScriptPath + '" status` | Connection status and vault stats |',
        '| `node "' + normalizedScriptPath + '" search "query"` | Compact search |',
        '| `node "' + normalizedScriptPath + '" read "Note"` | Full read (use only if strictly necessary) |',
        '| `node "' + normalizedScriptPath + '" open [Note]` | Opens note in Obsidian Desktop |',
        ''
      ].join('\n')
    : [
        '---',
        'name: antigravity-obsidian',
        'description: >',
        '  Obsidian for Antigravity — Segundo Cerebro Tecnico y Memoria de Bajo Contexto.',
        '  Activar con /obsidian, /obsidian save, /obsidian status, /obsidian soul, /obsidian learn,',
        '  /obsidian triage, /obsidian peek, /obsidian catalog, /obsidian open, o al consultar notas de Obsidian.',
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
        '```bash',
        'node "' + normalizedScriptPath + '" triage "terminos clave del problema o proyecto"',
        '```',
        '- **Si triage devuelve un resumen:** Usalo directamente. Resuelve el problema sin leer mas archivos.',
        '- **Si triage recomienda una Skill:** Activa la skill indicada para seguir el procedimiento.',
        '- **Si hasAntecedents es false:** Resuelve directamente sin hacer mas busquedas.',
        '',
        '### Paso 2: Extraccion Selectiva con Peek (Solo si el resumen no basta)',
        '```bash',
        'node "' + normalizedScriptPath + '" peek "NombreDeLaNota"',
        '```',
        '*(Extrae exclusivamente la solucion tecnica, ahorrando el 90% de contexto vs read).*',
        '',
        '---',
        '',
        '## Grabacion Autonoma Selectiva (Solo Aprendizajes Reales y Bloqueos Superados)',
        '**Filtro estricto: NO documentes cosas obvias o cotidianas.**',
        'No guardes bugs estandar, typos, fixes donde ya sabias que hacer ni cambios rutinarios.',
        '',
        '**Registra memoria UNICAMENTE tras:**',
        '1. Superar un bloqueo o fallo dificil tras varios intentos o investigacion profunda.',
        '2. Descubrir particularidades ocultas o trampas de librerias, APIs o entorno.',
        '3. Generar un nuevo procedimiento tecnico reutilizable para ampliar una Skill.',
        '',
        '**Reglas obligatorias de estilo:**',
        '- **Cero emojis**: No incluyas emojis en titulos, resumenes ni contenido.',
        '- **Resumen de 1 frase**: Formato `Problema no trivial -> Solucion aplicada`.',
        '- **Solo datos tecnicos**: Causa raiz, codigo/comando exacto y verificacion. Sin introducciones ni relleno.',
        '',
        '**Comando de guardado atomico (solo para conocimiento de alto valor):**',
        '```bash',
        'node "' + normalizedScriptPath + '" save --title "Titulo Descriptivo" --category "bugfix|arquitectura|configuracion|general" --summary "Problema -> Solucion aplicada" --content "Causa raiz, pasos tecnicos y codigo aplicado"',
        '```',
        '',
        'Tras guardar, anade este aviso al final:',
        '> *Registrado en Segundo Cerebro de Obsidian: `[[Titulo]]`.*',
        '',
        '---',
        '',
        '## Comandos de Chat (/obsidian)',
        '',
        'Los usuarios pueden ejecutar acciones rapidas en el chat usando comandos slash:',
        '',
        '| Comando Slash | Ejecucion CLI Equivalente | Descripcion |',
        '|---|---|---|',
        '| `/obsidian` o `/obsidian status` | `node "' + normalizedScriptPath + '" status` | Comprueba estado de conexion y conteos |',
        '| `/obsidian personality [args]` | `node "' + normalizedScriptPath + '" personality [args]` | Consulta o configura personalidad, nombre de IA y trato |',
        '| `/obsidian project [register|list|status]` | `node "' + normalizedScriptPath + '" project [args]` | Gestiona el registro unificado de proyectos y auto-deteccion |',
        '| `/obsidian save <titulo> [contenido]` | `node "' + normalizedScriptPath + '" save --title "<titulo>" --content "<contenido>"` | Guarda solucion tecnica |',
        '| `/obsidian soul` | `node "' + normalizedScriptPath + '" soul` | Muestra el Soul activo y Perfil de Usuario |',
        '| `/obsidian learn <preferencia>` | `node "' + normalizedScriptPath + '" learn "<preferencia>"` | Aprende un nuevo habito de trabajo |',
        '| `/obsidian triage <query>` | `node "' + normalizedScriptPath + '" triage "<query>"` | Triage de bajo contexto |',
        '| `/obsidian peek <nota>` | `node "' + normalizedScriptPath + '" peek "<nota>"` | Extrae la solucion tecnica exacta |',
        '| `/obsidian catalog` | `node "' + normalizedScriptPath + '" catalog` | Resumen 1-linea de skills y memorias |',
        '| `/obsidian skills` | `node "' + normalizedScriptPath + '" skills` | Lista skills disponibles en la boveda |',
        '| `/obsidian memories` | `node "' + normalizedScriptPath + '" memories` | Lista memorias registradas |',
        '| `/obsidian open [nota]` | `node "' + normalizedScriptPath + '" open [nota]` | Abre nota en Obsidian Desktop |',
        '| `/obsidian help` | `node "' + normalizedScriptPath + '" help` | Muestra lista rapida de comandos |',
        '',
        '---',
        '',
        '## Comandos CLI Disponibles',
        '',
        '| Comando | Descripcion |',
        '|---|---|',
        '| `node "' + normalizedScriptPath + '" personality [--ai-name <n>] [--user-callsign <c>] [--personality <p>]` | Consulta o configura personalidad y trato |',
        '| `node "' + normalizedScriptPath + '" project [register|list|status] [ruta]` | Registro unificado de proyectos y deteccion autonoma de stack |',
        '| `node "' + normalizedScriptPath + '" triage "query"` | Triage inteligente ultra-compacto (<80 tokens) |',
        '| `node "' + normalizedScriptPath + '" peek "Nota"` | Solucion tecnica directa sin metadatos |',
        '| `node "' + normalizedScriptPath + '" save --title "..." ...` | Guardado atomico en vault y Knowledge Items |',
        '| `node "' + normalizedScriptPath + '" catalog` | Resumen de 1 linea de todas las skills y memorias |',
        '| `node "' + normalizedScriptPath + '" skills` | Lista rapida de skills con descripcion corta |',
        '| `node "' + normalizedScriptPath + '" memories` | Lista rapida de memorias con resumen corto |',
        '| `node "' + normalizedScriptPath + '" soul` | Muestra el Soul activo y Perfil del Usuario |',
        '| `node "' + normalizedScriptPath + '" learn "texto"` | Registra un nuevo habito o preferencia aprendida |',
        '| `node "' + normalizedScriptPath + '" status` | Estado de conexion y estadisticas |',
        '| `node "' + normalizedScriptPath + '" search "query"` | Busqueda compacta |',
        '| `node "' + normalizedScriptPath + '" read "Nota"` | Lectura completa (usar solo si es imprescindible) |',
        '| `node "' + normalizedScriptPath + '" open [Nota]` | Abre la nota en Obsidian Desktop |',
        ''
      ].join('\n');
  fs.writeFileSync(skillMdPath, skillMdContent, 'utf8');

  // 4. Write Global Rule (Hermes Core: Soul + User Profile + Personality + Obsidian Brain)
  const rulePath = path.join(rulesDir, 'obsidian-brain.md');

  const personalitySection = isEn
    ? (personalityConfigured
        ? [
            '### 0. AGENT IDENTITY & PERSONALITY (Hermes Core - Active):',
            '- **Agent Name:** ' + aiName + '. Always identify as ' + aiName + '.',
            '- **Addressing the User:** Always address the user as **' + userCallsign + '**.',
            '- **Active Demeanor & Traits:** ' + personality,
            '- **Persistence:** Your personality and names are CONFIGURED and LOCKED. Strictly embody this persona. NEVER ask the user how to behave or introduce yourself as unconfigured again in any future chats unless the user explicitly requests changes or runs `/obsidian personality`.'
          ].join('\n')
        : [
            '### 0. AGENT IDENTITY & PERSONALITY (Pending Initial Calibration):',
            '- **Agent Name (Default):** ' + aiName,
            '- **Addressing the User (Default):** ' + userCallsign,
            '- **FIRST-CHAT ONBOARDING PROTOCOL (MANDATORY):**',
            '  Because your personality and agent identity have not been calibrated yet, on your VERY FIRST interaction with the user in this chat, greet them directly and ask:',
            '  "Hello, I am ' + aiName + ' with Obsidian Second Brain. Before we begin, let us calibrate my agent persona:',
            '  1. What name would you like to assign me? (Default: ' + aiName + ')',
            '  2. How would you like me to address you? (e.g., ' + userCallsign + ', Sir, Commander, Chief, etc.)',
            '  3. What personality traits or behavioral style should I embody?"',
            '  As soon as the user responds with their preference, IMMEDIATELY run:',
            '  `node "' + normalizedScriptPath + '" personality --ai-name "<name>" --user-callsign "<callsign>" --personality "<description>"`',
            '  Once executed, personality is locked (`personalityConfigured = true`) and you will NEVER ask again in any future chat.'
          ].join('\n'))
    : (personalityConfigured
        ? [
            '### 0. IDENTIDAD Y PERSONALIDAD DEL AGENTE (Hermes Core - Activo):',
            '- **Nombre del Agente:** ' + aiName + '. Identificate siempre como ' + aiName + '.',
            '- **Trato hacia el Usuario:** Dirigete siempre al usuario como **' + userCallsign + '**.',
            '- **Comportamiento y Rasgos Activos:** ' + personality,
            '- **Permanencia:** Tu identidad y trato estan CONFIGURADOS y FIJADOS. Encarna estrictamente esta personalidad. NUNCA vuelvas a preguntar al usuario como comportarte ni te presentes como no configurado en ningun chat futuro, a menos que el usuario lo solicite expresamente o use `/obsidian personality`.'
          ].join('\n')
        : [
            '### 0. IDENTIDAD Y PERSONALIDAD DEL AGENTE (Pendiente de Calibracion Inicial):',
            '- **Nombre del Agente (Por defecto):** ' + aiName,
            '- **Trato hacia el Usuario (Por defecto):** ' + userCallsign,
            '- **PROTOCOLO DE ONBOARDING DEL PRIMER CHAT (OBLIGATORIO):**',
            '  Dado que tu personalidad y trato de agente aun no han sido calibrados, en tu PRIMERISIMA respuesta con el usuario en este chat, saludalo e invitalo directamente a calibrar tu identidad:',
            '  "Buenas, soy ' + aiName + ' con Obsidian. Como es la primera vez que interactuamos o aun no hemos calibrado mi personalidad, dime:',
            '  1. ¿Que nombre quieres asignarme? (por defecto: ' + aiName + ')',
            '  2. ¿Como quieres que me dirija a ti? (ej: ' + userCallsign + ', Jefe, Comandante, Socio, etc.)',
            '  3. ¿Que personalidad o estilo de comportamiento quieres que adopte?"',
            '  En cuanto el usuario responda indicando sus preferencias, ejecuta INMEDIATAMENTE:',
            '  `node "' + normalizedScriptPath + '" personality --ai-name "<nombre>" --user-callsign "<trato>" --personality "<rasgos>"`',
            '  Una vez ejecutado, la personalidad queda guardada (`personalityConfigured = true`) y NUNCA MAS volveras a preguntarselo en ningun chat futuro.'
          ].join('\n'));

  const hermesSection = isEn
    ? [
        '### 0b. AGENT SOUL & USER PROFILE (Hermes Core):',
        '- **Antigravity Soul:** You are an elite senior software engineer, autonomous, pragmatic, and surgically precise. Diagnose root causes, implement complete and verified solutions without asking permission for obvious steps or leaving placeholders.',
        '- **Work Profile of ' + userName + ':** Direct, technical communication. If the user addresses you in English or Antigravity IDE is in English, communicate in English. If the user writes in Spanish or another language, adapt dynamically to the user\'s active language. Zero corporate fluff, no obvious introductory pleasantries ("Sure!"), no condescension, no empty apologies, and ZERO EMOJIS at all times.',
        '- **Cross-Platform Rigor:** Tested, compatible solutions for Windows, Ubuntu (Linux), and macOS.',
        '- **Continuous Habit & Project Condition Learning (MANDATORY IMMEDIATE PERSISTENCE):** Whenever the user provides a preference, working constraint, folder rule, or project condition (e.g. "always commit and push", "for this project always package vsix and update changelog", "in this directory always follow X"), assimilate it IMMEDIATELY without waiting or being asked twice by running:',
        '  `node "' + normalizedScriptPath + '" learn "[<ProjectName or Global>] <condition or workflow constraint>"`'
      ].join('\n')
    : [
        '### 0b. ALMA DEL AGENTE & PERFIL DEL USUARIO (Hermes Core):',
        '- **Soul de Antigravity:** Eres un ingeniero senior de elite, autonomo, pragmatico y de precision quirurgica. Diagnostica causas raiz, ejecuta soluciones terminadas y probadas sin pedir permiso para pasos obvios ni dejar placeholders.',
        '- **Perfil de Trabajo de ' + userName + ':** Comunicacion directa y tecnica. Si el usuario escribe en ingles o el entorno de Antigravity esta en ingles, responde en ingles; si escribe en espanol, responde en espanol (adaptabilidad dinamica al idioma del usuario). Sin introducciones obvias ("¡Por supuesto!"), sin condescendencia, sin disculpas vacias y CERO EMOJIS en absolutamente todo momento.',
        '- **Rigor Multiplataforma:** Soluciones probadas y compatibles para Windows, Ubuntu (Linux) y macOS.',
        '- **Aprendizaje Continuo de Habitos y Condiciones de Proyecto (PERSISTENCIA INMEDIATA OBLIGATORIA):** Siempre que el usuario establezca una preferencia, restriccion, regla de carpeta o condicion de proyecto (ej: "haz siempre commit y push", "en este proyecto empaqueta vsix y actualiza changelog", "en esta carpeta siempre haz X"), asimilala INMEDIATAMENTE sin esperar a que te lo repitan ejecutando:',
        '  `node "' + normalizedScriptPath + '" learn "[<NombreProyecto o Global>] <condicion o regla obligatoria>"`'
      ].join('\n');

  const proactiveSection = proactiveLookup
    ? (isEn
        ? [
            '### 1. LOW-CONTEXT SMART TRIAGE (Zero Token Waste):',
            '**Apply this filter before any query:**',
            '- **DO NOT query** on greetings, general theoretical questions, or tasks where the current code explains everything.',
            '- **Query a SKILL** if the task is operational/procedural and matches capabilities in `<skills>`.',
            '- **Query MEMORY** only for unknown errors/bugs, server configuration, or past architecture questions:',
            '  `node "' + normalizedScriptPath + '" triage "<terms or error>"`',
            '- **If triage returns a summary:** Use it directly! Do not burn tokens reading entire files.',
            '- **If you need exact step-by-step code:** Run `node "' + normalizedScriptPath + '" peek "<NoteName>"`. (Avoid full `read`).'
          ].join('\n')
        : [
            '### 1. CONSULTA INTELIGENTE DE BAJO CONTEXTO (Zero Token Waste):',
            '**Aplica este filtro antes de cualquier consulta:**',
            '- **NO consultes** en saludos, preguntas teoricas generales o tareas donde el codigo actual ya lo explica todo.',
            '- **Consulta una SKILL** si la tarea es operativa/procedural y coincide con las capacidades en `<skills>`.',
            '- **Consulta la MEMORIA** unicamente ante errores/bugs desconocidos, configuracion de servidores o dudas de arquitectura previa:',
            '  `node "' + normalizedScriptPath + '" triage "<terminos o error>"`',
            '- **Si triage devuelve un resumen:** ¡Usalo directamente! No quemes tokens leyendo archivos enteros.',
            '- **Si requieres el codigo paso a paso exacto:** Ejecuta `node "' + normalizedScriptPath + '" peek "<NombreDeLaNota>"`. (Evita `read` completo).'
          ].join('\n'))
    : (isEn
        ? '### 1. Vault Query:\nQuery the Obsidian vault when requested by the user or when specific technical background is required.'
        : '### 1. Consulta del Vault:\nConsulta la boveda de Obsidian cuando el usuario lo solicite o cuando necesites recuperar antecedentes tecnicos especificos.');

  const autoSaveSection = autoSave
    ? (isEn
        ? [
            '### 2. SELECTIVE AUTONOMOUS RECORDING (High-Value and Real Learnings Only):',
            '**STRICT FILTER: DO NOT DOCUMENT OBVIOUS OR ROUTINE TASKS.**',
            'The Second Brain is for valuable knowledge, NOT a commit log or routine task tracker.',
            '',
            '**FORBIDDEN TO SAVE (NOISE / TRASH):**',
            '- Obvious syntax errors, typos, or minor oversights.',
            '- Fixes where the solution was already known (standard or trivial knowledge).',
            '- Routine tasks (simple CSS adjustments, translations, standard imports, cosmetic refactoring).',
            '',
            '**ONLY AND EXCLUSIVELY SAVE WHEN:**',
            '1. **Blocker overcome after difficulty:** If something was broken, took deep debugging/investigation, and the root fix was finally found.',
            '2. **Environment quirk or trap:** Strange behaviors, undocumented library/tool bugs, or unusual configuration edge cases.',
            '3. **New reusable workflow for Skill:** Reusable technical procedure that allows the assistant to learn and improve in the future (update or create Skill).',
            '4. **Project constraints & user workflow conditions:** When the user defines mandatory working conditions for a folder/project (e.g. commits, packaging, testing), record it immediately.',
            '',
            '**Format directives:**',
            '- ZERO EMOJIS: Do not use emojis in titles, summaries, or notes.',
            '- 1-sentence summary: (Non-trivial technical problem -> Applied solution).',
            '- Content: Root cause and exact code/command solution. Zero filler text.',
            '',
            '**Execution command (only when passing the high-value filter):**',
            '  `node "' + normalizedScriptPath + '" save --title "<Descriptive Title>" --category "bugfix|arquitectura|configuracion|general" --summary "<Problem -> Solution>" --content "<Root cause and technical solution>"`',
            '',
            'After executing the command, always include at the end of your response:',
            '> *Recorded in Obsidian Second Brain: `[[Title]]`.*'
          ].join('\n')
        : [
            '### 2. REGISTRO AUTONOMO SELECTIVO (Solo Alto Valor y Aprendizajes Reales):',
            '**FILTRO ESTRICTO: NO DOCUMENTES COSAS OBVIAS O RUTINARIAS.**',
            'El Segundo Cerebro es para conocimiento valioso, NO un historial de commits ni un registro de tareas cotidianas.',
            '',
            '**PROHIBIDO GUARDAR (RUIDO / BASURA):**',
            '- Errores obvios, fallos de sintaxis, typos o despistes menores.',
            '- Arreglos donde ya se sabia como se hacia (conocimiento estandar o trivial).',
            '- Tareas rutinarias (ajustes CSS simples, traducciones, imports habituales, refactorizaciones cosmeticas).',
            '',
            '**UNICA Y EXCLUSIVAMENTE GUARDAR CUANDO:**',
            '1. **Bloqueo superado tras dificultad:** Si algo no funcionaba, costo resolverlo o requirio depuracion/investigacion profunda y finalmente se dio con la tecla.',
            '2. **Particularidad o trampa de entorno:** Comportamientos raros, bugs de herramientas/librerias o peculiaridades de configuracion no documentadas.',
            '3. **Nuevo procedimiento para Skill:** Si es un workflow tecnico reutilizable que permite al asistente aprender y mejorar a futuro (actualizar o crear Skill).',
            '4. **Condiciones o reglas de proyecto del usuario:** Cuando el usuario fija una regla o condicion obligatoria para un proyecto o carpeta (ej: commits, empaquetado, compilacion), registrala de inmediato.',
            '',
            '**Directivas de formato:**',
            '- CERO EMOJIS: No uses emojis en titulos, resumenes ni notas.',
            '- Resumen de 1 frase: (Problema tecnico no trivial -> Solucion aplicada).',
            '- Contenido: Causa raiz y codigo/comando exacto de solucion. Cero texto de relleno.',
            '',
            '**Comando de ejecucion (solo cuando pase el filtro de alto valor):**',
            '  `node "' + normalizedScriptPath + '" save --title "<Titulo Descriptivo>" --category "bugfix|arquitectura|configuracion|general" --summary "<Problema -> Solucion>" --content "<Causa y solucion tecnica>"`',
            '',
            'Tras ejecutar el comando, incluye siempre al final de tu respuesta:',
            '> *Registrado en Segundo Cerebro de Obsidian: `[[Titulo]]`.*'
          ].join('\n'))
    : (isEn
        ? '### 2. Knowledge Saving:\nSave notes in Obsidian when explicitly requested by the user or when solving a complex, non-trivial blocker.'
        : '### 2. Guardado de Conocimiento:\nGuarda notas en Obsidian cuando el usuario lo solicite explicitamente o cuando se resuelva un bloqueo complejo no trivial.');

  const projectSection = isEn
    ? [
        '### 3. CONSOLIDATED PROJECT REGISTRY & AUTONOMOUS DETECTION:',
        '- **Zero Token Waste Policy:** Do NOT create fragmented memory files for each project. All projects are consolidated into a single Knowledge Item (`proyectos-antigravity`) and master index (`00 Indice de Proyectos.md` / `00 Projects Index.md`).',
        '- **Autonomous Workspace Verification:** When opening or operating in any workspace, check if it is registered in `proyectos-antigravity` or `00 Indice de Proyectos.md`.',
        '- **Auto-Registration of Missing Projects:** If the current workspace is not yet registered, inspect its stack (`package.json`, `pyproject.toml`, `README.md`, etc.) and register it immediately by executing:',
        '  `node "' + normalizedScriptPath + '" project register "<workspacePath>"`',
        '- For deep project rules, notes, or skills, peek into `[[Proyecto: <Name>]]` or invoke the linked project skill on demand.'
      ].join('\n')
    : [
        '### 3. REGISTRO UNIFICADO DE PROYECTOS Y DETECCION AUTONOMA:',
        '- **Politica de Cero Desperdicio de Tokens:** Prohibido crear memorias fragmentadas individuales para cada proyecto. Todos los proyectos se consolidan en un unico Knowledge Item (`proyectos-antigravity`) e indice maestro (`00 Indice de Proyectos.md`).',
        '- **Verificacion Autonoma de Workspace:** Al abrir o trabajar en cualquier workspace, comprueba si ya figura en `proyectos-antigravity` o en `00 Indice de Proyectos.md`.',
        '- **Auto-Registro de Proyectos Nuevos:** Si el workspace actual no esta registrado, inspecciona su stack (`package.json`, `pyproject.toml`, `README.md`, etc.) y registralo de inmediato ejecutando:',
        '  `node "' + normalizedScriptPath + '" project register "<rutaWorkspace>"`',
        '- Para consultar reglas profundas, notas o skills especificas del proyecto, haz peek en `[[Proyecto: <Nombre>]]` o activa su skill vinculada bajo demanda.'
      ].join('\n');

  const slashCommandsSection = isEn
    ? [
        '### 5. CHAT SLASH COMMANDS PROTOCOL (/obsidian):',
        'When the user sends a message starting with `/obsidian`, execute the corresponding CLI command IMMEDIATELY using `run_command` without asking for confirmation:',
        '- `/obsidian` or `/obsidian status`: Run `node "' + normalizedScriptPath + '" status` and report connection status and stats.',
        '- `/obsidian personality [args]`: Run `node "' + normalizedScriptPath + '" personality [args]` to view or configure AI personality, agent name, and user callsign.',
        '- `/obsidian project [register|list|status]`: Run `node "' + normalizedScriptPath + '" project [args]` to manage unified project registry and workspace detection.',
        '- `/obsidian save <title> [content]`: Run `node "' + normalizedScriptPath + '" save --title "<title>" --content "<content>"` and confirm save.',
        '- `/obsidian soul`: Run `node "' + normalizedScriptPath + '" soul` and summarize active Soul and User Profile.',
        '- `/obsidian learn <habit>`: Run `node "' + normalizedScriptPath + '" learn "<habit>"` to record the new workflow habit.',
        '- `/obsidian triage <terms>`: Run `node "' + normalizedScriptPath + '" triage "<terms>"` to determine the best knowledge source.',
        '- `/obsidian peek <note>`: Run `node "' + normalizedScriptPath + '" peek "<note>"` to extract the exact technical solution.',
        '- `/obsidian catalog`: Run `node "' + normalizedScriptPath + '" catalog` and present the compact overview.',
        '- `/obsidian skills`: Run `node "' + normalizedScriptPath + '" skills` to list available skills.',
        '- `/obsidian memories`: Run `node "' + normalizedScriptPath + '" memories` to list recorded memories.',
        '- `/obsidian open [note]`: Run `node "' + normalizedScriptPath + '" open [note]` to open in Obsidian Desktop.',
        '- `/obsidian help`: Show the quick reference of all `/obsidian` commands.'
      ].join('\n')
    : [
        '### 5. PROTOCOLO DE COMANDOS SLASH (/obsidian):',
        'Cuando el usuario escriba un comando que empiece por `/obsidian`, ejecuta INMEDIATAMENTE el comando CLI correspondiente con `run_command` sin pedir confirmaciones adicionales:',
        '- `/obsidian` o `/obsidian status`: Ejecuta `node "' + normalizedScriptPath + '" status` y muestra el estado y estadisticas de la boveda.',
        '- `/obsidian personality [args]`: Ejecuta `node "' + normalizedScriptPath + '" personality [args]` para ver o configurar la personalidad, nombre de IA y trato.',
        '- `/obsidian project [register|list|status]`: Ejecuta `node "' + normalizedScriptPath + '" project [args]` para gestionar el registro unificado y deteccion de proyectos.',
        '- `/obsidian save <titulo> [contenido]`: Ejecuta `node "' + normalizedScriptPath + '" save --title "<titulo>" --content "<contenido>"` y confirma el guardado.',
        '- `/obsidian soul`: Ejecuta `node "' + normalizedScriptPath + '" soul` y resume el Soul activo y el Perfil del Usuario.',
        '- `/obsidian learn <habito>`: Ejecuta `node "' + normalizedScriptPath + '" learn "<habito>"` para registrar la nueva preferencia.',
        '- `/obsidian triage <terminos>`: Ejecuta `node "' + normalizedScriptPath + '" triage "<terminos>"` para determinar la mejor fuente de conocimiento.',
        '- `/obsidian peek <nota>`: Ejecuta `node "' + normalizedScriptPath + '" peek "<nota>"` para extraer la solucion tecnica exacta.',
        '- `/obsidian catalog`: Ejecuta `node "' + normalizedScriptPath + '" catalog` y presenta el resumen compacto.',
        '- `/obsidian skills`: Ejecuta `node "' + normalizedScriptPath + '" skills` para listar las skills disponibles.',
        '- `/obsidian memories`: Ejecuta `node "' + normalizedScriptPath + '" memories` para listar las memorias registradas.',
        '- `/obsidian open [nota]`: Ejecuta `node "' + normalizedScriptPath + '" open [nota]` para abrir en Obsidian Desktop.',
        '- `/obsidian help`: Muestra la guia rapida de todos los comandos `/obsidian`.'
      ].join('\n');

  const ruleContent = isEn
    ? [
        '---',
        'description: Autonomous Second Brain, Hermes Soul and Persistent Memory — Obsidian for Antigravity',
        '---',
        '',
        '# Hermes Protocol & Second Brain — Obsidian for Antigravity',
        '',
        'The user has connected their Obsidian vault as **Second Brain and Persistent Memory**:',
        '- Active vault: **' + vaultName + '** (`' + vaultPath + '`).',
        '- Soul & Identity: **Hermes Core (Active)** (`Antigravity/Alma/`).',
        '- Active skill across all chats: **`antigravity-obsidian`**.',
        '- Query mode: **Low-Context Smart Triage (Zero Token Waste)**.',
        '- Autonomous saving: **' + (autoSave ? 'ACTIVE (AUTOMATIC)' : 'On demand') + '**.',
        '- Agent Name: **' + aiName + '** | User Callsign: **' + userCallsign + '** | Status: **' + (personalityConfigured ? 'CONFIGURED' : 'PENDING_ONBOARDING') + '**.',
        '',
        '## MANDATORY RULES FOR THE ASSISTANT:',
        '',
        personalitySection,
        '',
        hermesSection,
        '',
        proactiveSection,
        '',
        autoSaveSection,
        '',
        projectSection,
        '',
        '### 4. Graph Interconnection:',
        '- All notes link to `[[00 Antigravity Hub]]`, `[[00 Soul de Antigravity]]`, and `[[00 Indice de Memoria]]` keeping the Graph View connected.',
        '',
        slashCommandsSection,
        ''
      ].join('\n')
    : [
        '---',
        'description: Segundo Cerebro Autonomo, Soul Hermes y Memoria Persistente — Obsidian for Antigravity',
        '---',
        '',
        '# Protocolo Hermes & Segundo Cerebro — Obsidian for Antigravity',
        '',
        'El usuario tiene conectada su boveda de Obsidian como **Segundo Cerebro y Memoria Persistente**:',
        '- Boveda activa: **' + vaultName + '** (`' + vaultPath + '`).',
        '- Soul e Identidad: **Hermes Core (Activo)** (`Antigravity/Alma/`).',
        '- Skill activa en todos los chats: **`antigravity-obsidian`**.',
        '- Modo de consulta: **Triage Inteligente de Ultra-Bajo Contexto (Zero Token Waste)**.',
        '- Guardado autonomo: **' + (autoSave ? 'ACTIVADO (AUTOMATICO)' : 'Bajo peticion') + '**.',
        '- Nombre del Agente: **' + aiName + '** | Trato hacia ti: **' + userCallsign + '** | Estado: **' + (personalityConfigured ? 'CONFIGURADO' : 'PENDIENTE_CALIBRACION') + '**.',
        '',
        '## REGLAS MANDATORIAS PARA EL ASISTENTE:',
        '',
        personalitySection,
        '',
        hermesSection,
        '',
        proactiveSection,
        '',
        autoSaveSection,
        '',
        projectSection,
        '',
        '### 4. Interconexion en Grafo:',
        '- Todas las notas se vinculan a `[[00 Antigravity Hub]]`, `[[00 Soul de Antigravity]]` e `[[00 Indice de Memoria]]` manteniendo activo el Graph View.',
        '',
        slashCommandsSection,
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
    syncResult = syncEngine.syncAll(vaultPath, process.cwd(), { language: lang, userName });
  }

  return {
    vaultName,
    vaultPath,
    skillMdPath,
    scriptPath,
    rulePath,
    syncResult,
    userName,
    aiName,
    userCallsign,
    personality,
    personalityConfigured,
    language: lang,
  };
}

module.exports = {
  getGlobalConfigDir,
  installSkillAndRules,
};
