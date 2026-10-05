const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Antigravity <-> Obsidian Sync Engine
 * Handles bi-directional synchronization of skills, memories, knowledge items,
 * and project context into standard Obsidian markdown files with frontmatter and wikilinks.
 */

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '-').trim();
}

function getAntigravityPaths() {
  const home = os.homedir();
  const globalSkillsDir = path.join(home, '.gemini', 'config', 'skills');
  return {
    globalSkillsDir,
    skillsDir: globalSkillsDir,
    knowledgeDir: path.join(home, '.gemini', 'antigravity-ide', 'knowledge'),
    brainDir: path.join(home, '.gemini', 'antigravity-ide', 'brain'),
    configDir: path.join(home, '.gemini', 'config'),
  };
}

function ensureVaultStructure(vaultPath) {
  if (!vaultPath || !fs.existsSync(vaultPath)) {
    throw new Error(`El Vault de Obsidian no existe: ${vaultPath}`);
  }

  const baseDir = path.join(vaultPath, 'Antigravity');
  const dirs = [
    baseDir,
    path.join(baseDir, 'Alma'),
    path.join(baseDir, 'Memoria'),
    path.join(baseDir, 'Skills'),
    path.join(baseDir, 'Proyectos'),
    path.join(baseDir, 'Sesiones'),
  ];

  for (const d of dirs) {
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  return baseDir;
}

// -------------------------------------------------------------
// Hermes Soul & User Profile Architecture (Multi-language & Dynamic User)
// -------------------------------------------------------------

function resolveUserName(vaultPath, explicitUserName) {
  if (explicitUserName && typeof explicitUserName === 'string' && explicitUserName.trim()) {
    return explicitUserName.trim();
  }
  // Check bridge config
  const home = os.homedir();
  const bridgeConfigPath = path.join(home, '.gemini', 'config', 'antigravity-obsidian.json');
  if (fs.existsSync(bridgeConfigPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(bridgeConfigPath, 'utf8'));
      if (cfg.userName && typeof cfg.userName === 'string' && cfg.userName.trim()) {
        return cfg.userName.trim();
      }
    } catch (e) {}
  }
  // Check existing user profile in vault
  if (vaultPath) {
    const userPath = path.join(vaultPath, 'Antigravity', 'Alma', '00 Perfil de Usuario.md');
    if (fs.existsSync(userPath)) {
      try {
        const content = fs.readFileSync(userPath, 'utf8');
        const m = content.match(/^user:\s*["']?([^"'\r\n]+)["']?/m) 
          || content.match(/^#+\s*Perfil de Trabajo\s*[—–-]\s*([^\r\n]+)/m) 
          || content.match(/^#+\s*Work Profile\s*[—–-]\s*([^\r\n]+)/m);
        if (m && m[1].trim() && m[1].trim() !== 'Usuario' && m[1].trim() !== 'User') {
          return m[1].trim();
        }
      } catch (e) {}
    }
  }
  // Try git user name
  try {
    const { execSync } = require('child_process');
    const gitUser = execSync('git config --global user.name', { encoding: 'utf8', timeout: 1000 }).trim();
    if (gitUser) return gitUser;
  } catch (e) {}
  // Fallback to system environment user
  const sysUser = process.env.USERNAME || process.env.USER || (os.userInfo && os.userInfo().username);
  if (sysUser && sysUser.trim()) return sysUser.trim();
  return 'User';
}

function resolveLanguage(options = {}) {
  if (options && options.language && options.language !== 'auto') {
    return options.language.toLowerCase().slice(0, 2);
  }
  // Check bridge config
  const home = os.homedir();
  const bridgeConfigPath = path.join(home, '.gemini', 'config', 'antigravity-obsidian.json');
  if (fs.existsSync(bridgeConfigPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(bridgeConfigPath, 'utf8'));
      if (cfg.language && cfg.language !== 'auto') {
        return cfg.language.toLowerCase().slice(0, 2);
      }
    } catch (e) {}
  }
  // Check VS Code NLS configuration
  if (process.env.VSCODE_NLS_CONFIG) {
    try {
      const nls = JSON.parse(process.env.VSCODE_NLS_CONFIG);
      if (nls.locale) {
        return nls.locale.toLowerCase().slice(0, 2);
      }
    } catch (e) {}
  }
  // Check system environment locale
  const sysLocale = process.env.LANG || process.env.LC_ALL || (Intl && Intl.DateTimeFormat().resolvedOptions().locale) || '';
  if (sysLocale.toLowerCase().startsWith('es')) return 'es';
  if (sysLocale.toLowerCase().startsWith('en')) return 'en';
  return 'es';
}

function resolvePersonality(vaultPath, explicitOptions = {}) {
  let aiName = '';
  let userCallsign = '';
  let personality = '';
  let configured = false;

  if (explicitOptions.aiName && typeof explicitOptions.aiName === 'string' && explicitOptions.aiName.trim()) {
    aiName = explicitOptions.aiName.trim();
  }
  if (explicitOptions.userCallsign && typeof explicitOptions.userCallsign === 'string' && explicitOptions.userCallsign.trim()) {
    userCallsign = explicitOptions.userCallsign.trim();
  }
  if (explicitOptions.personality && typeof explicitOptions.personality === 'string' && explicitOptions.personality.trim()) {
    personality = explicitOptions.personality.trim();
  }
  if (explicitOptions.personalityConfigured !== undefined) {
    configured = !!explicitOptions.personalityConfigured;
  }

  const home = os.homedir();
  const bridgeConfigPath = path.join(home, '.gemini', 'config', 'antigravity-obsidian.json');
  if (fs.existsSync(bridgeConfigPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(bridgeConfigPath, 'utf8'));
      if (!aiName && cfg.aiName) aiName = cfg.aiName.trim();
      if (!userCallsign && cfg.userCallsign) userCallsign = cfg.userCallsign.trim();
      if (!personality && cfg.personality) personality = cfg.personality.trim();
      if (explicitOptions.personalityConfigured === undefined && cfg.personalityConfigured !== undefined) {
        if (cfg.personalityConfigured) configured = true;
      }
    } catch (e) {}
  }

  // Check vault note if still missing fields or if configured status is recorded there
  if (vaultPath) {
    const almaDir = path.join(vaultPath, 'Antigravity', 'Alma');
    const pFile = path.join(almaDir, '00 Personalidad de la IA.md');
    const pFileEn = path.join(almaDir, '00 AI Personality.md');
    let targetFile = null;
    if (fs.existsSync(pFile) && !fs.existsSync(pFileEn)) {
      targetFile = pFile;
    } else if (fs.existsSync(pFileEn) && !fs.existsSync(pFile)) {
      targetFile = pFileEn;
    } else if (fs.existsSync(pFile) && fs.existsSync(pFileEn)) {
      try {
        const cEs = fs.readFileSync(pFile, 'utf8');
        const cEn = fs.readFileSync(pFileEn, 'utf8');
        const esConf = /configured:\s*true/i.test(cEs);
        const enConf = /configured:\s*true/i.test(cEn);
        if (esConf && !enConf) targetFile = pFile;
        else if (enConf && !esConf) targetFile = pFileEn;
        else targetFile = (resolveLanguage(explicitOptions) === 'en') ? pFileEn : pFile;
      } catch (e) {
        targetFile = pFile;
      }
    }
    if (targetFile) {
      try {
        const content = fs.readFileSync(targetFile, 'utf8');
        if (!aiName) {
          const m = content.match(/^ai_name:\s*["']?([^"'\r\n]+)["']?/m);
          if (m) aiName = m[1].trim();
        }
        if (!userCallsign) {
          const m = content.match(/^user_callsign:\s*["']?([^"'\r\n]+)["']?/m);
          if (m) userCallsign = m[1].trim();
        }
        if (!personality) {
          const m = content.match(/##\s*1\.\s*(?:Arquetipo y Rasgos de Personalidad|Archetype & Personality Traits)[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
          if (m && m[1].trim()) personality = m[1].trim();
        }
        if (!configured && explicitOptions.personalityConfigured !== false) {
          const mStatus = content.match(/^status:\s*["']?([^"'\r\n]+)["']?/m);
          const mConfigured = content.match(/^configured:\s*(true|false)/m);
          if (mConfigured && mConfigured[1] === 'true') configured = true;
          else if (mStatus && mStatus[1].trim() === 'configured') configured = true;
        }
      } catch (e) {}
    }
  }

  const lang = resolveLanguage(explicitOptions);
  const isEn = (lang === 'en');
  const defaultUserName = resolveUserName(vaultPath, explicitOptions.userName);

  if (!aiName) aiName = 'Hermes';
  if (!userCallsign) userCallsign = defaultUserName;
  if (!personality) {
    personality = isEn
      ? 'Senior autonomous software engineer: surgical, pragmatic, direct, zero corporate fluff, and strictly ZERO emojis.'
      : 'Ingeniero senior de élite, autónomo, pragmático y de precisión quirúrgica. Respuestas técnicas, directas, sin paja corporativa y estrictamente CERO emojis.';
  }

  return {
    aiName,
    userCallsign,
    personality,
    configured,
  };
}

function ensurePersonality(vaultPath, options = {}) {
  if (!vaultPath || !fs.existsSync(vaultPath)) return null;
  ensureVaultStructure(vaultPath);

  const almaDir = path.join(vaultPath, 'Antigravity', 'Alma');
  if (!fs.existsSync(almaDir)) {
    fs.mkdirSync(almaDir, { recursive: true });
  }

  const now = new Date().toISOString().split('T')[0];
  const lang = resolveLanguage(options);
  const isEn = (lang === 'en');
  const pFileName = isEn ? '00 AI Personality.md' : '00 Personalidad de la IA.md';
  const personalityPath = path.join(almaDir, pFileName);
  const otherFileName = isEn ? '00 Personalidad de la IA.md' : '00 AI Personality.md';
  const otherPath = path.join(almaDir, otherFileName);
  if (fs.existsSync(otherPath)) {
    try { fs.unlinkSync(otherPath); } catch (e) {}
  }

  const { aiName, userCallsign, personality, configured } = resolvePersonality(vaultPath, options);

  const content = isEn
    ? `---
title: "AI Personality & Agent Identity"
type: antigravity-personality
tags:
  - antigravity/personality
  - antigravity/agent
ai_name: "${aiName}"
user_callsign: "${userCallsign}"
configured: ${configured}
status: "${configured ? 'configured' : 'pending_onboarding'}"
language: en
updated: ${now}
---

# Agent Personality & Identity — ${aiName}

> [!NOTE] **Agent Identity & Communication Dynamics**
> - **Agent Name**: \`${aiName}\`
> - **User Callsign / Title**: \`${userCallsign}\`
> - **Status**: \`${configured ? 'Configured (Active)' : 'Pending Calibration (Will ask during first chat interaction)'}\`

## 1. Archetype & Personality Traits
${personality}

## 2. Communication Protocol
- The agent embodies the identity of **${aiName}** in all interactions.
- The agent always addresses the user as **${userCallsign}**.
- Zero corporate fluff, no condescension, and strictly ZERO emojis.
${configured ? '- **Persistence**: Personality is configured and locked. The AI will NEVER ask again how to behave in any chat unless explicitly requested by the user or via `/obsidian personality`.' : '- **Onboarding Active**: On first chat interaction, the AI will briefly ask the user for their desired AI name, callsign, and personality traits. Once answered, it saves permanently here and never asks again.'}

---
*Graph Connections:* [[00 Antigravity Hub]] | [[00 Soul de Antigravity]] | [[00 Perfil de Usuario]]
`
    : `---
title: "Personalidad de la IA y Trato de Agente"
type: antigravity-personality
tags:
  - antigravity/personalidad
  - antigravity/agente
ai_name: "${aiName}"
user_callsign: "${userCallsign}"
configured: ${configured}
status: "${configured ? 'configured' : 'pending_onboarding'}"
language: es
updated: ${now}
---

# Personalidad e Identidad del Agente — ${aiName}

> [!NOTE] **Identidad y Dinámica de Trato**
> - **Nombre del Agente**: \`${aiName}\`
> - **Trato hacia el usuario**: \`${userCallsign}\`
> - **Estado de Calibración**: \`${configured ? 'Configurado (Activo)' : 'Pendiente de calibración (Se preguntará en el primer chat)'}\`

## 1. Arquetipo y Rasgos de Personalidad
${personality}

## 2. Protocolo de Comunicación
- El agente responderá asumiendo plenamente el nombre e identidad de **${aiName}**.
- El agente se dirigirá siempre al usuario como **${userCallsign}**.
- Comunicación técnica de alta densidad, cero rodeos corporativos y estrictamente CERO emojis.
${configured ? '- **Permanencia**: La personalidad está fijada de forma permanente. La IA NUNCA volverá a preguntar cómo comportarse en ningún chat, a menos que el usuario lo solicite expresamente o use `/obsidian personality`.' : '- **Onboarding Activo**: En la primera interacción de un chat, la IA preguntará al usuario qué nombre asignarle, cómo dirigirse a él y qué comportamiento tener. Tras responder, quedará guardado permanentemente aquí y no volverá a preguntar jamás.'}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Soul de Antigravity]] | [[00 Perfil de Usuario]]
`;

  if (!fs.existsSync(personalityPath) || options.forceUpdate) {
    fs.writeFileSync(personalityPath, content, 'utf8');
  }

  // Also maintain bridge config
  const home = os.homedir();
  const bridgeConfigPath = path.join(home, '.gemini', 'config', 'antigravity-obsidian.json');
  if (fs.existsSync(bridgeConfigPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(bridgeConfigPath, 'utf8'));
      cfg.aiName = aiName;
      cfg.userCallsign = userCallsign;
      cfg.personality = personality;
      if (options.personalityConfigured === false) {
        cfg.personalityConfigured = false;
      } else if (configured || cfg.personalityConfigured) {
        cfg.personalityConfigured = true;
      }
      cfg.lastUpdated = new Date().toISOString();
      fs.writeFileSync(bridgeConfigPath, JSON.stringify(cfg, null, 2), 'utf8');
    } catch (e) {}
  }

  return { personalityPath, aiName, userCallsign, personality, configured };
}

function savePersonality(vaultPath, data = {}, options = {}) {
  if (!vaultPath || !fs.existsSync(vaultPath)) return null;
  const merged = {
    ...options,
    ...data,
    personalityConfigured: data.configured !== undefined ? !!data.configured : true,
    forceUpdate: true,
  };
  return ensurePersonality(vaultPath, merged);
}

function getPersonality(vaultPath, options = {}) {
  if (!vaultPath || !fs.existsSync(vaultPath)) return null;
  const { aiName, userCallsign, personality, configured } = resolvePersonality(vaultPath, options);
  const almaDir = path.join(vaultPath, 'Antigravity', 'Alma');
  const lang = resolveLanguage(options);
  const pFileName = (lang === 'en') ? '00 AI Personality.md' : '00 Personalidad de la IA.md';
  const personalityPath = path.join(almaDir, pFileName);
  return {
    aiName,
    userCallsign,
    personality,
    configured,
    personalityPath,
    exists: fs.existsSync(personalityPath),
  };
}

function ensureSoulAndProfile(vaultPath, options = {}) {
  if (!vaultPath || !fs.existsSync(vaultPath)) return null;
  ensureVaultStructure(vaultPath);

  const almaDir = path.join(vaultPath, 'Antigravity', 'Alma');
  if (!fs.existsSync(almaDir)) {
    fs.mkdirSync(almaDir, { recursive: true });
  }

  ensurePersonality(vaultPath, options);

  const now = new Date().toISOString().split('T')[0];
  const soulPath = path.join(almaDir, '00 Soul de Antigravity.md');
  const userPath = path.join(almaDir, '00 Perfil de Usuario.md');

  const userName = resolveUserName(vaultPath, options.userName);
  const lang = resolveLanguage(options);
  const isEn = (lang === 'en');

  const soulContent = isEn
    ? `---
title: "Antigravity Soul (Hermes Core)"
type: antigravity-soul
tags:
  - antigravity/soul
  - antigravity/hermes
language: en
updated: ${now}
---

# Antigravity Soul — Agent Archetype & Operational Identity

> [!NOTE] **Operational Identity**
> You are Antigravity, an elite senior software engineer: autonomous, pragmatic, and surgically precise. You act as a high-caliber technical pair-programmer, never a passive chatbot.

## Non-Negotiable Agent Principles

1. **Autonomous Proactive Problem-Solving:**
   - Never stop at mere suggestions or ask permission for obvious steps. Diagnose root causes, implement the solution, verify behavior, and deliver complete, working results.
   - If something fails, investigate and resolve it autonomously before bothering the user.

2. **Zero Fluff & Zero Friction:**
   - Direct, synthetic, dense responses. No generic pleasantries ("Sure!", "I'd be happy to help"), no condescension, and no empty apologies.
   - Strictly ZERO EMOJIS in code, commits, explanations, and notes.

3. **Production Quality & Cross-Platform Rigor:**
   - All code must be clean, modular, typed, and verified to run seamlessly on Windows, Ubuntu (Linux), and macOS.
   - Strictly forbidden to use fake placeholders or TODO comments where working code should be.

4. **Dynamic Language Adaptation & Habit Evolution:**
   - Dynamic language adaptation: if the user or Antigravity IDE is in English, communicate in English; if in Spanish or another language, dynamically adapt to the user's active language.
   - Every correction, directive, or preference expressed by the user is assimilated immediately into the User Profile to enhance all future sessions.

---
*Graph Connections:* [[00 Antigravity Hub]] | [[00 Perfil de Usuario]] | [[00 AI Personality]]
`
    : `---
title: "Soul de Antigravity (Hermes Core)"
type: antigravity-soul
tags:
  - antigravity/soul
  - antigravity/hermes
language: es
updated: ${now}
---

# Soul de Antigravity — Arquetipo e Identidad del Agente

> [!NOTE] **Identidad Operativa**
> Eres Antigravity, un ingeniero de software senior, autónomo, pragmático y de precisión quirúrgica. Actúas como un socio técnico y pair-programmer de élite, nunca como un chatbot pasivo.

## Principios Inquebrantables del Agente

1. **Resolución Autónoma Proactiva:**
   - No te quedes en sugerencias ni pidas permiso para pasos evidentes. Diagnostica la causa raíz, implementa la solución, verifica el funcionamiento y entrega el resultado terminado.
   - Si algo no funciona, investiga y soluciona antes de consultar al usuario.

2. **Cero Paja y Cero Fricción:**
   - Respuestas directas, sintéticas y densas. Cero preámbulos genéricos, cero condescendencia y cero disculpas huecas.
   - Prohibido el uso de emojis en explicaciones, código, commits y notas.

3. **Calidad de Producción y Rigor Multiplataforma:**
   - Todo código debe ser limpio, modular, tipado y verificado para funcionar sin fisuras en Windows, Ubuntu (Linux) y macOS.
   - Prohibidos los placeholders ficticios o comentarios de relleno donde falta código.

4. **Adaptación Dinámica de Idioma y Memoria de Hábitos:**
   - Adaptación dinámica de idioma: si el usuario o el entorno de Antigravity están en inglés, comunícate en inglés; si están en español, en español.
   - Cada corrección, directriz o preferencia expresada por el usuario se asimila de inmediato en el Perfil de Usuario para mejorar el comportamiento en todos los chats siguientes.

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Perfil de Usuario]] | [[00 Personalidad de la IA]]
`;

  const userContent = isEn
    ? `---
title: "User Work Profile & Style"
type: antigravity-user-profile
tags:
  - antigravity/profile
  - antigravity/user
user: "${userName}"
language: en
updated: ${now}
---

# Work Profile — ${userName}

> [!ABSTRACT] **How the user thinks and works**
> Defines the preferences, technical habits, and workflow style of ${userName} so the assistant operates with tailor-made precision across every session.

## 1. Communication & Style
- **Language & Tone:** Direct, technical, concise. If Antigravity IDE or the user communicates in English, respond in English; dynamically match the user's active language. Zero corporate filler, zero condescension.
- **Formatting:** Strictly ZERO EMOJIS in everything (code, notes, commits, chats).
- **Conciseness:** High-density bullet points. Prefers applied working results over theoretical dissertations.

## 2. Memory Policy (High-Value Anti-Noise Filter)
- **STRICTLY FORBIDDEN TO SAVE:** Obvious syntax errors, typos, routine tasks (simple CSS, translations, cosmetic refactors) or already-known standard solutions.
- **MUST SAVE (Pure gold):**
  1. Blockers overcome after difficulty/investigation where the breakthrough was hard-won.
  2. Undocumented quirks, bugs, or nuances of tools, APIs, or operating systems.
  3. New reusable technical procedures that expand agent Skills.

## 3. Git, Distribution & Environment
- **Commits:** Conventional Commits in English (\`feat: ...\`, \`fix: ...\`, \`docs: ...\`, \`release: ...\`).
- **VSIX Packages:** Keep only the latest \`.vsix\` in the repository; remove previous versions with \`git rm\`.
- **Cross-Platform:** Tested and compatible solutions across Windows, Ubuntu (native, Flatpak, Snap), and macOS.

## 4. Dynamic Learnings & Evolved Preferences
- \`[2026-10-02]\` Strict anti-noise filter active: only difficult, non-obvious learnings; zero routine trash.
- \`[2026-10-02]\` Universal Linux support enabled: multi-path Obsidian config detection (Snap, Flatpak, XDG) and \`~/Documentos\` support.
- \`[2026-10-02]\` URI dispatch prioritized via \`vscode.env.openExternal\` before invoking shell fallbacks.

---
*Graph Connections:* [[00 Antigravity Hub]] | [[00 Soul de Antigravity]] | [[00 AI Personality]]
`
    : `---
title: "Perfil y Estilo de Trabajo del Usuario"
type: antigravity-user-profile
tags:
  - antigravity/perfil
  - antigravity/usuario
user: "${userName}"
language: es
updated: ${now}
---

# Perfil de Trabajo — ${userName}

> [!ABSTRACT] **Cómo piensa y trabaja el usuario**
> Define las preferencias, hábitos técnicos y estilo de trabajo de ${userName} para que el asistente opere exactamente a su medida en todas las sesiones.

## 1. Comunicación y Trato
- **Idioma y Tono:** Comunicación técnica y directa. Adaptación fluida: si el usuario escribe en inglés o el entorno de Antigravity está en inglés, responder en inglés; si escribe en español, responder en español. Sin formalismos corporativos ni relleno.
- **Formato:** Cero emojis en absolutamente todo (código, notas, commits, chats).
- **Extensión:** Respuestas breves con viñetas de alta densidad. El usuario prefiere ver el resultado aplicado antes que una disertación teórica.

## 2. Política de Memoria (Filtro Anti-Ruido de Alto Valor)
- **PROHIBIDO GUARDAR:** Errores sintácticos obvios, typos, tareas rutinarias (CSS simple, traducciones, refactorizaciones cosméticas) o soluciones estándar ya conocidas.
- **SÍ GUARDAR (Oro molido):**
  1. Bloqueos superados tras dificultad/investigación donde costó dar con la tecla.
  2. Quirks, bugs no documentados y particularidades de herramientas, APIs o sistemas operativos.
  3. Nuevos procedimientos técnicos reutilizables para ampliar Skills.

## 3. Git, Distribución y Entorno
- **Commits:** Conventional Commits en inglés (\`feat: ...\`, \`fix: ...\`, \`docs: ...\`, \`release: ...\`).
- **Paquetes VSIX:** Mantener únicamente el \`.vsix\` de la versión más reciente en el repositorio git; eliminar versiones anteriores con \`git rm\`.
- **Multiplataforma:** Soluciones probadas y compatibles con Windows, Ubuntu (nativo, Flatpak y Snap) y macOS.

## 4. Aprendizajes y Preferencias Dinámicas Acumuladas
- \`[2026-10-02]\` Filtrado estricto anti-ruido activado: solo aprendizajes difíciles y no obvios; cero basura rutinaria.
- \`[2026-10-02]\` Soporte universal Linux implementado: detección multi-vía de config de Obsidian (Snap, Flatpak, XDG) y soporte de directorio \`~/Documentos\`.
- \`[2026-10-02]\` Despacho de URIs con prioridad \`vscode.env.openExternal\` antes de invocar ejecutables de shell.

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Soul de Antigravity]] | [[00 Personalidad de la IA]]
`;

  if (!fs.existsSync(soulPath) || options.forceUpdate) {
    fs.writeFileSync(soulPath, soulContent, 'utf8');
  }

  if (!fs.existsSync(userPath)) {
    fs.writeFileSync(userPath, userContent, 'utf8');
  } else if (options.forceUpdate) {
    // Preserve Section 4 (Dynamic Learnings) while updating user, title, communication
    try {
      const existing = fs.readFileSync(userPath, 'utf8');
      const sec4Match = existing.match(/##\s*4\.\s*Aprendizajes[\s\S]*?(?:---|---\r?\n\*Conexiones|$)/i) 
        || existing.match(/##\s*4\.\s*Dynamic Learnings[\s\S]*?(?:---|---\r?\n\*Graph|$)/i);
      if (sec4Match) {
        const updatedContent = userContent.replace(
          /(##\s*4\.\s*(?:Aprendizajes|Dynamic Learnings)[\s\S]*?)(?:---|---\r?\n\*(?:Conexiones|Graph)|$)/i,
          sec4Match[0].trim() + '\n\n'
        );
        fs.writeFileSync(userPath, updatedContent, 'utf8');
      } else {
        fs.writeFileSync(userPath, userContent, 'utf8');
      }
    } catch (e) {
      fs.writeFileSync(userPath, userContent, 'utf8');
    }
  }

  return { soulPath, userPath, userName, language: lang };
}

function getSoulAndProfile(vaultPath, options = {}) {
  if (!vaultPath || !fs.existsSync(vaultPath)) return null;
  ensureSoulAndProfile(vaultPath, options);

  const almaDir = path.join(vaultPath, 'Antigravity', 'Alma');
  const soulPath = path.join(almaDir, '00 Soul de Antigravity.md');
  const userPath = path.join(almaDir, '00 Perfil de Usuario.md');

  const soulText = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, 'utf8') : '';
  const userText = fs.existsSync(userPath) ? fs.readFileSync(userPath, 'utf8') : '';

  return {
    soulPath,
    userPath,
    soulText,
    userText,
  };
}

function recordUserLearning(vaultPath, learningText, options = {}) {
  if (!vaultPath || !fs.existsSync(vaultPath)) return null;
  ensureSoulAndProfile(vaultPath, options);

  const userPath = path.join(vaultPath, 'Antigravity', 'Alma', '00 Perfil de Usuario.md');
  if (!fs.existsSync(userPath)) return null;

  const now = new Date().toISOString().split('T')[0];
  const cleanLearning = (learningText || '').replace(/\r?\n/g, ' ').trim();
  const entry = `- \`[${now}]\` ${cleanLearning}`;

  let content = fs.readFileSync(userPath, 'utf8');
  if (content.includes('## 4. Aprendizajes y Preferencias Dinámicas Acumuladas')) {
    content = content.replace(
      '## 4. Aprendizajes y Preferencias Dinámicas Acumuladas',
      `## 4. Aprendizajes y Preferencias Dinámicas Acumuladas\n${entry}`
    );
  } else if (content.includes('## 4. Dynamic Learnings & Evolved Preferences')) {
    content = content.replace(
      '## 4. Dynamic Learnings & Evolved Preferences',
      `## 4. Dynamic Learnings & Evolved Preferences\n${entry}`
    );
  } else {
    content += `\n## 4. Aprendizajes y Preferencias Dinámicas Acumuladas\n${entry}\n`;
  }

  fs.writeFileSync(userPath, content, 'utf8');
  return { updated: true, entry, userPath };
}

// -------------------------------------------------------------
// Skills Parser & Sync
// -------------------------------------------------------------

function parseSkillMd(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  
  let name = path.basename(path.dirname(filePath));
  let description = '';
  let body = content;

  if (fmMatch) {
    const yaml = fmMatch[1];
    body = content.slice(fmMatch[0].length).trim();

    const lines = yaml.split('\n');
    let i = 0;
    while (i < lines.length) {
      const m = lines[i].match(/^(\w+):\s*(.*)/);
      if (!m) { i++; continue; }
      const key = m[1].trim();
      const val = m[2].trim();

      if (key === 'name') {
        name = val;
        i++;
      } else if (key === 'description') {
        if (val === '>' || val === '|') {
          i++;
          const descParts = [];
          while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
            if (lines[i].trim()) descParts.push(lines[i].trim());
            i++;
          }
          description = descParts.join(' ');
        } else {
          description = val;
          i++;
        }
      } else {
        i++;
      }
    }
  }

  return { name, description, body, raw: content };
}

function syncSkillsToVault(vaultPath, workspaceRoot) {
  ensureVaultStructure(vaultPath);
  const { globalSkillsDir } = getAntigravityPaths();
  const skillsFolder = path.join(vaultPath, 'Antigravity', 'Skills');
  const syncedSkills = [];
  const activeFilenames = new Set(['00 Indice de Skills.md']);
  const seenSkillNames = new Set();
  const nowStr = new Date().toISOString().split('T')[0];

  // 1. Scan Global Skills
  if (fs.existsSync(globalSkillsDir)) {
    const entries = fs.readdirSync(globalSkillsDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const skillMd = path.join(globalSkillsDir, ent.name, 'SKILL.md');
        const parsed = parseSkillMd(skillMd);
        if (parsed && parsed.name) {
          const cleanName = parsed.name.trim();
          const fileName = `${sanitizeFilename(cleanName)}.md`;
          const obsFile = path.join(skillsFolder, fileName);
          activeFilenames.add(fileName);
          seenSkillNames.add(cleanName.toLowerCase());

          // Clean body: strip duplicate leading title if present
          let bodyText = (parsed.body || '').trim();
          const titlePattern = new RegExp('^#\\s+' + cleanName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') + '\\r?\\n*');
          if (titlePattern.test(bodyText)) {
            bodyText = bodyText.replace(titlePattern, '').trim();
          }

          const obsContent = `---
title: "Skill: ${cleanName}"
type: antigravity-skill
scope: global
tags:
  - antigravity/skill
  - antigravity/skill/global
updated: ${nowStr}
---

# Skill: ${cleanName}

> [!INFO] **Metadatos de la Skill**
> - **Nombre**: \`${cleanName}\`
> - **Ámbito**: Global (\`~/.gemini/config/skills/\`)
> - **Descripción**: ${parsed.description || 'Sin descripción'}

## Instrucciones del Agente

${bodyText}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Skills]]
`;
          fs.writeFileSync(obsFile, obsContent, 'utf8');
          syncedSkills.push({ name: cleanName, scope: 'global', path: obsFile, description: parsed.description || '' });
        }
      }
    }
  }

  // 2. Scan Project Skills (if inside workspace)
  if (workspaceRoot) {
    const projSkillsDir = path.join(workspaceRoot, '.agents', 'skills');
    if (fs.existsSync(projSkillsDir)) {
      const entries = fs.readdirSync(projSkillsDir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isDirectory()) {
          const skillMd = path.join(projSkillsDir, ent.name, 'SKILL.md');
          const parsed = parseSkillMd(skillMd);
          if (parsed && parsed.name) {
            const cleanName = parsed.name.trim();
            // Avoid duplicate note if already defined globally
            if (seenSkillNames.has(cleanName.toLowerCase())) {
              continue;
            }

            const fileName = `[Proyecto] ${sanitizeFilename(cleanName)}.md`;
            const obsFile = path.join(skillsFolder, fileName);
            activeFilenames.add(fileName);
            seenSkillNames.add(cleanName.toLowerCase());

            let bodyText = (parsed.body || '').trim();
            const titlePattern = new RegExp('^#\\s+' + cleanName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') + '\\r?\\n*');
            if (titlePattern.test(bodyText)) {
              bodyText = bodyText.replace(titlePattern, '').trim();
            }

            const obsContent = `---
title: "Skill: ${cleanName}"
type: antigravity-skill
scope: project
project: "${path.basename(workspaceRoot)}"
tags:
  - antigravity/skill
  - antigravity/skill/project
updated: ${nowStr}
---

# Skill: ${cleanName} (Proyecto)

> [!INFO] **Metadatos de la Skill**
> - **Nombre**: \`${cleanName}\`
> - **Ámbito**: Proyecto actual (\`${path.basename(workspaceRoot)}\`)
> - **Descripción**: ${parsed.description || 'Sin descripción'}

## Instrucciones del Agente

${bodyText}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Skills]] | [[${path.basename(workspaceRoot)}]]
`;
            fs.writeFileSync(obsFile, obsContent, 'utf8');
            syncedSkills.push({ name: cleanName, scope: 'project', path: obsFile, description: parsed.description || '' });
          }
        }
      }
    }
  }

  // Clean orphan or stale skill notes that are no longer active
  if (fs.existsSync(skillsFolder)) {
    const existingFiles = fs.readdirSync(skillsFolder);
    for (const f of existingFiles) {
      if (f.endsWith('.md') && !activeFilenames.has(f)) {
        try {
          fs.unlinkSync(path.join(skillsFolder, f));
        } catch (e) {}
      }
    }
  }

  // 3. Generate Skills Index Note
  const indexFile = path.join(skillsFolder, '00 Indice de Skills.md');
  let indexMd = `---
title: "Indice de Skills de Antigravity"
type: antigravity-index
tags:
  - antigravity/indice
  - antigravity/skills
updated: ${nowStr}
---

# Catalogo de Skills de Antigravity

Total de skills activas sincronizadas: **${syncedSkills.length}**

## Skills Globales
| Skill | Descripcion | Nota |
|---|---|---|
`;

  const globalList = syncedSkills.filter(s => s.scope === 'global');
  for (const s of globalList) {
    indexMd += `| **${s.name}** | ${(s.description || 'Sin descripción').replace(/\\r?\\n/g, ' ').slice(0, 150)} | [[${sanitizeFilename(s.name)}]] |\\n`;
  }

  const projList = syncedSkills.filter(s => s.scope === 'project');
  if (projList.length > 0) {
    indexMd += `\\n## Skills de Proyecto\\n| Skill | Descripcion | Nota |\\n|---|---|---|\\n`;
    for (const s of projList) {
      indexMd += `| **${s.name}** | ${(s.description || 'Sin descripción').replace(/\\r?\\n/g, ' ').slice(0, 150)} | [[${sanitizeFilename(`[Proyecto] ${s.name}`)}]] |\\n`;
    }
  }

  indexMd += `\\n---\\n*Volver al:* [[00 Antigravity Hub]]\\n`;
  fs.writeFileSync(indexFile, indexMd, 'utf8');

  return syncedSkills;
}

// -------------------------------------------------------------
// Knowledge Items & Memories Sync
// -------------------------------------------------------------

function syncKnowledgeToVault(vaultPath) {
  ensureVaultStructure(vaultPath);
  const { knowledgeDir } = getAntigravityPaths();
  const memoriaFolder = path.join(vaultPath, 'Antigravity', 'Memoria');
  const syncedMemories = [];

  if (fs.existsSync(knowledgeDir)) {
    const items = fs.readdirSync(knowledgeDir, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory()) continue;
      const itemDir = path.join(knowledgeDir, item.name);
      const metaFile = path.join(itemDir, 'metadata.json');

      if (fs.existsSync(metaFile)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

          // CRITICAL: Skip items that originated from the Obsidian Vault to prevent infinite nesting/duplication!
          if (meta.source === 'obsidian-vault') {
            continue;
          }

          const title = meta.title || item.name;
          const summary = meta.summary || 'Sin resumen';
          const safeTitle = sanitizeFilename(title);
          const obsFile = path.join(memoriaFolder, `${safeTitle}.md`);

          // If the file already exists in vault, do not re-create/corrupt it
          if (fs.existsSync(obsFile)) {
            syncedMemories.push({ title, path: obsFile, summary });
            continue;
          }

          // Read artifacts if any, ensuring clean text without recursive frontmatter
          let artifactsMd = '';
          const artifactsDir = path.join(itemDir, 'artifacts');
          if (fs.existsSync(artifactsDir)) {
            const artFiles = fs.readdirSync(artifactsDir);
            for (const af of artFiles) {
              const afPath = path.join(artifactsDir, af);
              if (fs.statSync(afPath).isFile() && (af.endsWith('.md') || af.endsWith('.txt'))) {
                let artContent = fs.readFileSync(afPath, 'utf8');
                // Strip nested frontmatter if already present
                artContent = artContent.replace(/^---[\\s\\S]*?---\\r?\\n/, '').trim();
                // Strip duplicate graph connections
                artContent = artContent.replace(/---[\\s\\S]*\\*Conexiones del Grafo:\\*[\\s\\S]*$/, '').trim();
                artifactsMd += `\\n### Documento: ${af}\\n\\n${artContent}\\n`;
              }
            }
          }

          const obsContent = `---
title: "${title}"
type: antigravity-memory
category: knowledge-item
origin_id: "${item.name}"
tags:
  - antigravity/memoria
  - antigravity/knowledge-base
created: ${meta.created_at || new Date().toISOString().split('T')[0]}
updated: ${meta.updated_at || new Date().toISOString().split('T')[0]}
---

# ${title}

> [!ABSTRACT] **Resumen de Conocimiento**
> ${summary}

## Artefactos y Referencias Técnicas

${artifactsMd || '*No se registraron artefactos adicionales.*'}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Memoria]]
`;

          fs.writeFileSync(obsFile, obsContent, 'utf8');
          syncedMemories.push({ title, path: obsFile, summary });
        } catch (e) {
          // ignore corrupted metadata
        }
      }
    }
  }

  // Also include existing memories in vault
  if (fs.existsSync(memoriaFolder)) {
    const memFiles = fs.readdirSync(memoriaFolder).filter(f => f.endsWith('.md') && !f.startsWith('00'));
    for (const f of memFiles) {
      const fullPath = path.join(memoriaFolder, f);
      const title = f.replace(/\\.md$/, '');
      if (!syncedMemories.some(m => m.title === title)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const sumMatch = content.match(/>\\s*\\[!(?:NOTE|ABSTRACT|INFO)\\][^\\r\\n]*\\r?\\n>\\s*([^\\r\\n]+)/i);
          const summary = sumMatch ? sumMatch[1].trim() : 'Sin resumen';
          syncedMemories.push({ title, path: fullPath, summary });
        } catch (e) {}
      }
    }
  }

  // Generate Memory Index Note
  const indexFile = path.join(memoriaFolder, '00 Indice de Memoria.md');
  let indexMd = `---
title: "Indice de Memoria de Antigravity"
type: antigravity-index
tags:
  - antigravity/indice
  - antigravity/memoria
updated: ${new Date().toISOString().split('T')[0]}
---

# Banco de Memoria & Knowledge Items

Total de memorias y bases de conocimiento registradas: **${syncedMemories.length}**

| Memoria / Proyecto | Resumen | Enlace Obsidian |
|---|---|---|
`;

  for (const m of syncedMemories) {
    indexMd += `| **${m.title}** | ${m.summary.slice(0, 120)}... | [[${sanitizeFilename(m.title)}]] |\\n`;
  }

  indexMd += `\\n---\\n*Volver al:* [[00 Antigravity Hub]]\\n`;
  fs.writeFileSync(indexFile, indexMd, 'utf8');

  return syncedMemories;
}

// -------------------------------------------------------------
// Save New Custom Memory
// -------------------------------------------------------------

function saveNewMemory(vaultPath, memoryData) {
  ensureVaultStructure(vaultPath);
  const memoriaFolder = path.join(vaultPath, 'Antigravity', 'Memoria');
  const title = memoryData.title || `Memoria ${new Date().toISOString().slice(0, 10)}`;
  const cleanTitle = sanitizeFilename(title);
  const obsFile = path.join(memoriaFolder, `${cleanTitle}.md`);
  const now = new Date().toISOString().split('T')[0];

  const tags = Array.isArray(memoryData.tags) ? memoryData.tags : ['antigravity/memoria'];
  if (!tags.includes('antigravity/memoria')) tags.push('antigravity/memoria');

  let relatedLinks = '';
  if (memoryData.relatedSkills && memoryData.relatedSkills.length > 0) {
    relatedLinks += '\n### Skills Relacionadas\n';
    for (const sk of memoryData.relatedSkills) {
      relatedLinks += `- [[${sk}]]\n`;
    }
  }

  if (memoryData.project) {
    relatedLinks += `\n### Proyecto: [[${memoryData.project}]]\n`;
  }

  const content = `---
title: "${title}"
type: antigravity-memory
category: "${memoryData.category || 'general'}"
tags:
${tags.map(t => `  - ${t}`).join('\n')}
created: ${now}
updated: ${now}
---

# ${title}

> [!NOTE] **Contexto Registrado por Antigravity**
> ${memoryData.summary || memoryData.title}

## Detalles y Solución

${memoryData.content || '*Sin contenido adicional.*'}

${relatedLinks}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Memoria]]
`;

  fs.writeFileSync(obsFile, content, 'utf8');

  // 1. Update 00 Indice de Memoria.md
  try {
    const indexFile = path.join(memoriaFolder, '00 Indice de Memoria.md');
    const allFiles = fs.readdirSync(memoriaFolder).filter(f => f.endsWith('.md') && !f.startsWith('00'));
    let indexMd = `---
title: "Indice de Memoria de Antigravity"
type: antigravity-index
tags:
  - antigravity/indice
  - antigravity/memoria
updated: ${now}
---

# Banco de Memoria & Knowledge Items

Total de memorias registradas: **${allFiles.length}**

| Memoria / Proyecto | Categoría | Resumen | Enlace Obsidian |
|---|---|---|---|
`;
    for (const f of allFiles) {
      const fp = path.join(memoriaFolder, f);
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

  // 2. Also write to Knowledge Items if requested
  try {
    const { knowledgeDir } = getAntigravityPaths();
    const kiId = cleanTitle.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const kiDir = path.join(knowledgeDir, kiId);
    if (!fs.existsSync(kiDir)) {
      fs.mkdirSync(path.join(kiDir, 'artifacts'), { recursive: true });
      fs.writeFileSync(path.join(kiDir, 'metadata.json'), JSON.stringify({
        title,
        summary: memoryData.summary || memoryData.content?.slice(0, 200) || '',
        source: 'obsidian-vault',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, null, 2));
      fs.writeFileSync(path.join(kiDir, 'artifacts', `${cleanTitle}.md`), content || '');
    }
  } catch (e) {}

  // 3. Update Manifest Cache
  try {
    buildContextManifest(vaultPath);
  } catch (e) {}

  return { title, path: obsFile, cleanTitle };
}

// -------------------------------------------------------------
// AI Skill & Rules Management Subsystem (Zero Token Waste)
// -------------------------------------------------------------

function listAllSkills(vaultPath, workspaceRoot, options = {}) {
  const { globalSkillsDir } = getAntigravityPaths();
  const scopeFilter = (options.scope || 'all').toLowerCase();
  const query = (options.query || '').toLowerCase().trim();
  const skillsMap = new Map();

  function scanDir(dir, scope) {
    if (!fs.existsSync(dir)) return;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (!ent.isDirectory()) continue;
        const sDir = path.join(dir, ent.name);
        const skillMd = path.join(sDir, 'SKILL.md');
        let parsed = parseSkillMd(skillMd);
        const name = (parsed && parsed.name) ? parsed.name.trim() : ent.name;
        const desc = (parsed && parsed.description) ? parsed.description.trim() : '';

        let scripts = [];
        const scriptsDir = path.join(sDir, 'scripts');
        if (fs.existsSync(scriptsDir)) {
          try {
            scripts = fs.readdirSync(scriptsDir).filter(f => !f.startsWith('.'));
          } catch (e) {}
        }

        let references = [];
        const refDir = path.join(sDir, 'references');
        if (fs.existsSync(refDir)) {
          try {
            references = fs.readdirSync(refDir).filter(f => !f.startsWith('.'));
          } catch (e) {}
        }

        const safeKey = name.toLowerCase();
        if (!skillsMap.has(safeKey) || scope === 'project') {
          skillsMap.set(safeKey, {
            name,
            scope,
            description: desc,
            path: sDir,
            skillMdPath: skillMd,
            hasSkillMd: fs.existsSync(skillMd),
            scripts,
            references,
            vaultNote: vaultPath ? path.join(vaultPath, 'Antigravity', 'Skills', (scope === 'project' ? `[Proyecto] ${sanitizeFilename(name)}.md` : `${sanitizeFilename(name)}.md`)) : null,
          });
        }
      }
    } catch (e) {}
  }

  // 1. Scan global skills
  if (scopeFilter === 'all' || scopeFilter === 'global') {
    scanDir(globalSkillsDir, 'global');
  }

  // 2. Scan workspace skills
  const effectiveWs = workspaceRoot || process.cwd();
  if (scopeFilter === 'all' || scopeFilter === 'project') {
    if (effectiveWs) {
      scanDir(path.join(effectiveWs, '.agents', 'skills'), 'project');
    }
  }

  // 3. Include vault notes if not found in disk
  if (vaultPath) {
    const vSkills = path.join(vaultPath, 'Antigravity', 'Skills');
    if (fs.existsSync(vSkills)) {
      try {
        for (const vf of fs.readdirSync(vSkills)) {
          if (!vf.endsWith('.md') || vf.startsWith('00')) continue;
          const isProj = vf.startsWith('[Proyecto]');
          const clean = vf.replace(/\.md$/, '').replace(/^\[Proyecto\]\s*/, '');
          const key = clean.toLowerCase();
          if (!skillsMap.has(key)) {
            skillsMap.set(key, {
              name: clean,
              scope: isProj ? 'project' : 'global',
              description: 'Skill en Bóveda de Obsidian',
              path: path.join(vSkills, vf),
              skillMdPath: null,
              hasSkillMd: false,
              scripts: [],
              references: [],
              vaultNote: path.join(vSkills, vf),
            });
          }
        }
      } catch (e) {}
    }
  }

  let list = Array.from(skillsMap.values());

  if (scopeFilter !== 'all') {
    list = list.filter(s => s.scope === scopeFilter);
  }

  if (query) {
    list = list.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query)
    );
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

function getSkillDetails(vaultPath, workspaceRoot, skillName, options = {}) {
  if (!skillName) return { error: 'Especifica el nombre de la skill a consultar.' };
  const all = listAllSkills(vaultPath, workspaceRoot);
  const cleanQuery = skillName.toLowerCase().replace(/[^a-z0-9_-]/g, '');

  let found = all.find(s => s.name.toLowerCase() === skillName.toLowerCase());
  if (!found) {
    found = all.find(s => s.name.toLowerCase().replace(/[^a-z0-9_-]/g, '') === cleanQuery);
  }
  if (!found) {
    found = all.find(s => s.name.toLowerCase().includes(skillName.toLowerCase()));
  }

  if (!found) {
    return { error: `Skill no encontrada: '${skillName}'` };
  }

  let raw = '';
  let body = '';
  let description = found.description;
  if (found.skillMdPath && fs.existsSync(found.skillMdPath)) {
    raw = fs.readFileSync(found.skillMdPath, 'utf8');
    const parsed = parseSkillMd(found.skillMdPath);
    if (parsed) {
      body = parsed.body || '';
      if (parsed.description) description = parsed.description;
    }
  } else if (found.vaultNote && fs.existsSync(found.vaultNote)) {
    raw = fs.readFileSync(found.vaultNote, 'utf8');
    body = raw.replace(/^---[\s\S]*?---\r?\n/, '').trim();
  }

  let scriptDetails = [];
  if (options.scripts || options.full) {
    const scriptsDir = path.join(found.path, 'scripts');
    if (fs.existsSync(scriptsDir)) {
      for (const sf of fs.readdirSync(scriptsDir)) {
        const sfp = path.join(scriptsDir, sf);
        if (fs.statSync(sfp).isFile()) {
          try {
            const sContent = fs.readFileSync(sfp, 'utf8');
            scriptDetails.push({
              filename: sf,
              path: sfp,
              sizeBytes: fs.statSync(sfp).size,
              preview: sContent.slice(0, 500),
            });
          } catch (e) {}
        }
      }
    }
  }

  let peekInstructions = body;
  if (options.peek || !options.full) {
    if (peekInstructions.length > 1200) {
      peekInstructions = peekInstructions.slice(0, 1200) + '\n\n*(Instrucciones recortadas para optimizar contexto. Usa --full para ver el archivo completo).*';
    }
  }

  return {
    status: 'ok',
    name: found.name,
    scope: found.scope,
    description,
    path: found.path,
    skillMdPath: found.skillMdPath,
    vaultNote: found.vaultNote,
    scripts: found.scripts,
    references: found.references,
    scriptDetails: scriptDetails.length > 0 ? scriptDetails : undefined,
    instructions: options.full ? body : peekInstructions,
    raw: options.full ? raw : undefined,
  };
}

function createSkill(vaultPath, workspaceRoot, options = {}) {
  const { globalSkillsDir } = getAntigravityPaths();
  let name = (options.name || '').trim();
  if (!name) throw new Error('Especifica el nombre de la skill.');

  const safeName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!safeName) throw new Error(`Nombre de skill no válido: "${name}"`);

  const scope = (options.scope || 'global').toLowerCase() === 'project' ? 'project' : 'global';
  const description = (options.description || options.desc || `Skill técnica ${safeName}`).trim();
  const content = (options.content || options.instructions || `# ${safeName}\n\nInstrucciones operativas para el agente.`).trim();

  const effectiveWs = options.workspacePath || workspaceRoot || process.cwd();
  let skillDir = '';
  if (scope === 'project') {
    if (!effectiveWs) throw new Error('No se detectó la carpeta del workspace para la skill de proyecto.');
    skillDir = path.join(effectiveWs, '.agents', 'skills', safeName);
  } else {
    skillDir = path.join(globalSkillsDir, safeName);
  }

  if (fs.existsSync(skillDir) && !options.overwrite) {
    return {
      status: 'exists',
      error: `La skill '${safeName}' ya existe en ${skillDir}. Usa 'skill edit' para modificarla o añade --overwrite para sobrescribir.`,
      path: skillDir,
    };
  }

  // 1. Create skill directory and structure
  fs.mkdirSync(path.join(skillDir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(skillDir, 'references'), { recursive: true });

  // 2. Write standard SKILL.md with YAML frontmatter
  const skillMdContent = [
    '---',
    `name: ${safeName}`,
    'description: >',
    `  ${description.replace(/\r?\n/g, ' ')}`,
    '---',
    '',
    content.startsWith('#') ? content : `# ${safeName}\n\n${content}`,
    ''
  ].join('\n');
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMdContent, 'utf8');

  // 3. Mirror into Obsidian Vault
  let obsFile = null;
  if (vaultPath && fs.existsSync(vaultPath)) {
    ensureVaultStructure(vaultPath);
    const skillsFolder = path.join(vaultPath, 'Antigravity', 'Skills');
    const fileName = scope === 'project' ? `[Proyecto] ${sanitizeFilename(safeName)}.md` : `${sanitizeFilename(safeName)}.md`;
    obsFile = path.join(skillsFolder, fileName);
    const nowStr = new Date().toISOString().split('T')[0];

    const obsContent = [
      '---',
      `title: "Skill: ${safeName}"`,
      'type: antigravity-skill',
      `scope: ${scope}`,
      ...(scope === 'project' ? [`project: "${path.basename(effectiveWs)}"`] : []),
      'tags:',
      '  - antigravity/skill',
      `  - antigravity/skill/${scope}`,
      `updated: ${nowStr}`,
      '---',
      '',
      `# Skill: ${safeName}${scope === 'project' ? ' (Proyecto)' : ''}`,
      '',
      '> [!INFO] **Metadatos de la Skill**',
      `> - **Nombre**: \`${safeName}\``,
      `> - **Ámbito**: ${scope === 'project' ? `Proyecto (\`${path.basename(effectiveWs)}\`)` : 'Global (`~/.gemini/config/skills/`)'}`,
      `> - **Descripción**: ${description}`,
      `> - **Ruta local**: \`${skillDir}\``,
      '',
      '## Instrucciones del Agente',
      '',
      content,
      '',
      '---',
      `*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Skills]]${scope === 'project' ? ` | [[${path.basename(effectiveWs)}]]` : ''}`,
      ''
    ].join('\n');
    fs.writeFileSync(obsFile, obsContent, 'utf8');

    // 4. If project scope, update project note in Antigravity/Proyectos
    if (scope === 'project') {
      try {
        const projDir = path.join(vaultPath, 'Antigravity', 'Proyectos');
        const projNote = path.join(projDir, `${path.basename(effectiveWs)}.md`);
        if (fs.existsSync(projNote)) {
          let pTxt = fs.readFileSync(projNote, 'utf8');
          const skillLink = `[[${safeName}]]`;
          if (!pTxt.includes(skillLink)) {
            if (pTxt.includes('## Skills de Proyecto')) {
              pTxt = pTxt.replace('## Skills de Proyecto', `## Skills de Proyecto\n- Skill vinculada: ${skillLink}`);
            } else {
              pTxt = pTxt.replace('---', `## Skills de Proyecto\n- Skill vinculada: ${skillLink}\n\n---`);
            }
            fs.writeFileSync(projNote, pTxt, 'utf8');
          }
        }
      } catch (e) {}
    }

    // 5. Update Skills index and Hub
    syncSkillsToVault(vaultPath, effectiveWs);
    generateHub(vaultPath, effectiveWs);
    buildContextManifest(vaultPath);
  }

  return {
    status: 'ok',
    action: 'created',
    name: safeName,
    scope,
    description,
    path: skillDir,
    skillMd: path.join(skillDir, 'SKILL.md'),
    vaultNote: obsFile,
    message: `Skill '${safeName}' creada con éxito (${scope}) y vinculada con Obsidian.`
  };
}

function editSkill(vaultPath, workspaceRoot, options = {}) {
  let name = (options.name || '').trim();
  if (!name) throw new Error('Especifica el nombre de la skill a editar.');

  const all = listAllSkills(vaultPath, workspaceRoot);
  const cleanQuery = name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  let found = all.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    found = all.find(s => s.name.toLowerCase().replace(/[^a-z0-9_-]/g, '') === cleanQuery);
  }
  if (!found) {
    found = all.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
  }

  if (!found) {
    throw new Error(`No se encontró ninguna skill con el nombre '${name}'.`);
  }

  const skillMdPath = found.skillMdPath;
  if (!skillMdPath || !fs.existsSync(skillMdPath)) {
    throw new Error(`Archivo SKILL.md no encontrado en ${found.path}`);
  }

  const parsed = parseSkillMd(skillMdPath) || { name: found.name, description: found.description, body: '' };
  let newDesc = parsed.description;
  let newBody = parsed.body;
  const updatedFields = [];

  if (options.description !== undefined || options.desc !== undefined) {
    newDesc = (options.description || options.desc || '').trim();
    updatedFields.push('description');
  }

  if (options.content !== undefined || options.instructions !== undefined) {
    newBody = (options.content || options.instructions || '').trim();
    updatedFields.push('content');
  }

  if (options.append) {
    const toAppend = options.append.trim();
    newBody = newBody ? `${newBody}\n\n${toAppend}` : toAppend;
    updatedFields.push('append');
  }

  if (updatedFields.length === 0) {
    return {
      status: 'noop',
      message: 'No se especificaron cambios para la skill. Usa --desc, --content o --append.',
      skill: found,
    };
  }

  const updatedMd = [
    '---',
    `name: ${parsed.name || found.name}`,
    'description: >',
    `  ${newDesc.replace(/\r?\n/g, ' ')}`,
    '---',
    '',
    newBody.startsWith('#') ? newBody : `# ${parsed.name || found.name}\n\n${newBody}`,
    ''
  ].join('\n');
  fs.writeFileSync(skillMdPath, updatedMd, 'utf8');

  const effectiveWs = workspaceRoot || process.cwd();
  if (vaultPath && fs.existsSync(vaultPath)) {
    syncSkillsToVault(vaultPath, effectiveWs);
    generateHub(vaultPath, effectiveWs);
    buildContextManifest(vaultPath);
  }

  return {
    status: 'ok',
    action: 'updated',
    name: found.name,
    scope: found.scope,
    path: found.path,
    updatedFields,
    message: `Skill '${found.name}' actualizada correctamente (${updatedFields.join(', ')}).`,
  };
}

function deleteSkill(vaultPath, workspaceRoot, options = {}) {
  let name = (options.name || '').trim();
  if (!name) throw new Error('Especifica el nombre de la skill a eliminar.');

  const all = listAllSkills(vaultPath, workspaceRoot);
  const cleanQuery = name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  let found = all.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (!found) {
    found = all.find(s => s.name.toLowerCase().replace(/[^a-z0-9_-]/g, '') === cleanQuery);
  }

  if (!found) {
    throw new Error(`No se encontró ninguna skill llamada '${name}'.`);
  }

  try {
    fs.rmSync(found.path, { recursive: true, force: true });
  } catch (e) {
    throw new Error(`Error al eliminar directorio ${found.path}: ${e.message}`);
  }

  if (found.vaultNote && fs.existsSync(found.vaultNote)) {
    try {
      fs.unlinkSync(found.vaultNote);
    } catch (e) {}
  }

  const effectiveWs = workspaceRoot || process.cwd();
  if (vaultPath && fs.existsSync(vaultPath)) {
    syncSkillsToVault(vaultPath, effectiveWs);
    generateHub(vaultPath, effectiveWs);
    buildContextManifest(vaultPath);
  }

  return {
    status: 'ok',
    action: 'deleted',
    name: found.name,
    scope: found.scope,
    path: found.path,
    message: `Skill '${found.name}' eliminada correctamente.`,
  };
}

function addSkillScript(vaultPath, workspaceRoot, options = {}) {
  let skillName = (options.skillName || options.name || '').trim();
  let scriptName = (options.scriptName || options.filename || '').trim();
  let code = options.code || options.content || '';

  if (!skillName || !scriptName) {
    throw new Error('Especifica el nombre de la skill y el archivo del script (ej: skill script <skill> add <file> --code "...")');
  }

  const all = listAllSkills(vaultPath, workspaceRoot);
  let found = all.find(s => s.name.toLowerCase() === skillName.toLowerCase());
  if (!found) {
    throw new Error(`No se encontró la skill '${skillName}'.`);
  }

  const scriptsDir = path.join(found.path, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  const scriptPath = path.join(scriptsDir, scriptName);
  fs.writeFileSync(scriptPath, code, 'utf8');
  if (process.platform !== 'win32') {
    try { fs.chmodSync(scriptPath, 0o755); } catch (e) {}
  }

  return {
    status: 'ok',
    action: 'script-added',
    skillName: found.name,
    scriptName,
    path: scriptPath,
    message: `Script '${scriptName}' agregado exitosamente a la skill '${found.name}'.`,
  };
}

function listRules(vaultPath, workspaceRoot) {
  const home = os.homedir();
  const rules = [];

  const gRuleDir = path.join(home, '.gemini', 'config', 'rules');
  if (fs.existsSync(gRuleDir)) {
    for (const f of fs.readdirSync(gRuleDir)) {
      if (f.endsWith('.md')) {
        rules.push({ name: f.replace(/\.md$/, ''), scope: 'global', path: path.join(gRuleDir, f) });
      }
    }
  }

  const effectiveWs = workspaceRoot || process.cwd();
  if (effectiveWs) {
    const wsRulesDir = path.join(effectiveWs, '.agents', 'rules');
    if (fs.existsSync(wsRulesDir)) {
      for (const f of fs.readdirSync(wsRulesDir)) {
        if (f.endsWith('.md')) {
          rules.push({ name: f.replace(/\.md$/, ''), scope: 'workspace', path: path.join(wsRulesDir, f) });
        }
      }
    }
  }

  let dynamicLearningsCount = 0;
  if (vaultPath) {
    const uProfile = path.join(vaultPath, 'Antigravity', 'Alma', '00 Perfil de Usuario.md');
    if (fs.existsSync(uProfile)) {
      try {
        const uTxt = fs.readFileSync(uProfile, 'utf8');
        const m = uTxt.match(/##\s*4\.\s*Aprendizajes y Preferencias Dinámicas Acumuladas[^\r\n]*\r?\n([\s\S]*?)(?:---|$)/i);
        if (m) {
          const lines = m[1].split('\n').filter(l => l.trim().startsWith('-'));
          dynamicLearningsCount = lines.length;
        }
      } catch (e) {}
    }
  }

  return {
    status: 'ok',
    total: rules.length,
    dynamicLearningsCount,
    rules,
  };
}

function viewRule(vaultPath, workspaceRoot, ruleName) {
  if (!ruleName) throw new Error('Especifica el nombre de la regla a consultar.');
  const { rules } = listRules(vaultPath, workspaceRoot);
  const cleanQ = ruleName.toLowerCase().replace(/\.md$/, '');
  const found = rules.find(r => r.name.toLowerCase() === cleanQ || r.name.toLowerCase().includes(cleanQ));

  if (!found) {
    throw new Error(`Regla no encontrada: '${ruleName}'`);
  }

  const content = fs.readFileSync(found.path, 'utf8');
  return {
    status: 'ok',
    name: found.name,
    scope: found.scope,
    path: found.path,
    content,
    peek: content.slice(0, 1000) + (content.length > 1000 ? '\n\n*(Extracto recortado para optimizar tokens).*' : ''),
  };
}

// Backward compatible saveSkill
function saveSkill(vaultPath, skillData) {
  return createSkill(vaultPath, process.cwd(), {
    name: skillData.name,
    description: skillData.description,
    content: skillData.instructions,
    scope: 'global',
    overwrite: true,
  });
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// Unified Project Registry & Autonomous Workspace Detection
// -------------------------------------------------------------

function detectWorkspaceStack(workspaceRoot) {
  const info = {
    name: path.basename(workspaceRoot),
    version: '1.0.0',
    stack: 'General / No detectado',
    description: '',
    framework: '',
    dependencies: [],
  };

  if (!workspaceRoot || !fs.existsSync(workspaceRoot)) return info;

  // 1. Check package.json (Node.js / JS / TS)
  const pkgPath = path.join(workspaceRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) info.name = pkg.name;
      if (pkg.version) info.version = pkg.version;
      if (pkg.description) info.description = pkg.description;

      const deps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});
      info.dependencies = [...deps, ...devDeps];

      if (pkg.engines && pkg.engines.vscode) {
        info.framework = 'VS Code Extension';
      } else if (deps.includes('next') || devDeps.includes('next')) {
        info.framework = 'Next.js';
      } else if (deps.includes('react') || devDeps.includes('react')) {
        info.framework = 'React';
      } else if (deps.includes('vue') || devDeps.includes('vue')) {
        info.framework = 'Vue';
      } else if (deps.includes('express') || devDeps.includes('express')) {
        info.framework = 'Express';
      } else if (deps.includes('fastify') || devDeps.includes('fastify')) {
        info.framework = 'Fastify';
      } else if (deps.includes('nest') || devDeps.includes('@nestjs/core')) {
        info.framework = 'NestJS';
      } else if (deps.includes('electron') || devDeps.includes('electron')) {
        info.framework = 'Electron';
      }

      const tsConfig = path.join(workspaceRoot, 'tsconfig.json');
      const lang = fs.existsSync(tsConfig) ? 'TypeScript' : 'JavaScript (Node.js)';
      info.stack = info.framework ? `${info.framework} (${lang})` : lang;
    } catch (e) {}
  }

  // 2. Check Python (pyproject.toml, requirements.txt, Pipfile)
  const pyProject = path.join(workspaceRoot, 'pyproject.toml');
  const reqTxt = path.join(workspaceRoot, 'requirements.txt');
  if (fs.existsSync(pyProject) || fs.existsSync(reqTxt)) {
    let pyFramework = '';
    let content = '';
    if (fs.existsSync(reqTxt)) {
      try { content += fs.readFileSync(reqTxt, 'utf8').toLowerCase(); } catch (e) {}
    }
    if (fs.existsSync(pyProject)) {
      try { content += fs.readFileSync(pyProject, 'utf8').toLowerCase(); } catch (e) {}
    }
    if (content.includes('fastapi')) pyFramework = 'FastAPI';
    else if (content.includes('django')) pyFramework = 'Django';
    else if (content.includes('flask')) pyFramework = 'Flask';

    info.stack = pyFramework ? `Python (${pyFramework})` : 'Python';
  }

  // 3. Check Rust (Cargo.toml)
  const cargoToml = path.join(workspaceRoot, 'Cargo.toml');
  if (fs.existsSync(cargoToml)) {
    info.stack = 'Rust (Cargo)';
  }

  // 4. Check PHP (composer.json)
  const composerJson = path.join(workspaceRoot, 'composer.json');
  if (fs.existsSync(composerJson)) {
    try {
      const comp = JSON.parse(fs.readFileSync(composerJson, 'utf8'));
      if (comp.description && !info.description) info.description = comp.description;
      const reqs = Object.keys(comp.require || {});
      if (reqs.includes('laravel/framework')) info.stack = 'PHP (Laravel)';
      else if (reqs.includes('symfony/framework-bundle')) info.stack = 'PHP (Symfony)';
      else info.stack = 'PHP (Composer)';
    } catch (e) {
      info.stack = 'PHP';
    }
  }

  // 5. Check Go (go.mod)
  if (fs.existsSync(path.join(workspaceRoot, 'go.mod'))) {
    info.stack = 'Go';
  }

  // 6. Check README.md for description fallback
  if (!info.description) {
    const readmePath = path.join(workspaceRoot, 'README.md');
    if (fs.existsSync(readmePath)) {
      try {
        const readme = fs.readFileSync(readmePath, 'utf8');
        const clean = readme.replace(/^#[^\r\n]*/gm, '').replace(/\[!.*?\][^\r\n]*/g, '').trim();
        const firstPara = clean.split(/\r?\n\r?\n/)[0];
        if (firstPara) {
          info.description = firstPara.replace(/\r?\n/g, ' ').slice(0, 160).trim();
        }
      } catch (e) {}
    }
  }

  if (!info.description) {
    info.description = `Proyecto en desarrollo (${info.stack})`;
  }

  return info;
}

function findAssociatedSkill(projectName, workspaceRoot, vaultPath) {
  const normName = (projectName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const pTokens = (projectName || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 3 && !['for', 'the', 'app', 'ide', 'with', 'and'].includes(t));

  function matchesSkill(skillName) {
    if (!skillName) return false;
    const clean = skillName.replace(/\.md$/, '').replace(/^\[Proyecto\]\s*/, '');
    const normSkill = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normSkill.includes(normName) || normName.includes(normSkill)) return true;

    const sTokens = clean.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 3);
    const common = pTokens.filter(t => sTokens.includes(t));
    if (common.length >= 2 || (pTokens.length === 1 && common.length === 1)) {
      return true;
    }
    return false;
  }

  // 1. Workspace skills
  if (workspaceRoot) {
    const wsSkills = path.join(workspaceRoot, '.agents', 'skills');
    if (fs.existsSync(wsSkills)) {
      try {
        const list = fs.readdirSync(wsSkills, { withFileTypes: true });
        for (const s of list) {
          if (s.isDirectory() && matchesSkill(s.name)) {
            return s.name;
          }
        }
      } catch (e) {}
    }
  }

  // 2. Global skills
  const { skillsDir } = getAntigravityPaths();
  if (fs.existsSync(skillsDir)) {
    try {
      const list = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const s of list) {
        if (!s.isDirectory()) continue;
        if (matchesSkill(s.name)) {
          return s.name;
        }
      }
    } catch (e) {}
  }

  // 3. Vault skills
  if (vaultPath) {
    const vaultSkillsDir = path.join(vaultPath, 'Antigravity', 'Skills');
    if (fs.existsSync(vaultSkillsDir)) {
      try {
        const list = fs.readdirSync(vaultSkillsDir);
        for (const sf of list) {
          if (!sf.endsWith('.md') || sf.startsWith('00')) continue;
          const clean = sf.replace(/\.md$/, '').replace(/^\[Proyecto\]\s*/, '');
          if (matchesSkill(clean)) {
            return clean;
          }
        }
      } catch (e) {}
    }
  }

  return '—';
}

function syncProjectsIndex(vaultPath, options = {}) {
  ensureVaultStructure(vaultPath);
  const lang = resolveLanguage(options);
  const isEn = (lang === 'en');
  const projFolder = path.join(vaultPath, 'Antigravity', 'Proyectos');
  const indexFile = path.join(projFolder, isEn ? '00 Projects Index.md' : '00 Indice de Proyectos.md');
  const now = new Date().toISOString().split('T')[0];

  const projects = [];

  if (fs.existsSync(projFolder)) {
    const files = fs.readdirSync(projFolder);
    for (const f of files) {
      if (!f.endsWith('.md') || f.startsWith('00')) continue;
      const fp = path.join(projFolder, f);
      try {
        const content = fs.readFileSync(fp, 'utf8');
        const baseName = f.replace(/\.md$/, '');
        let name = baseName;
        let localPath = '—';
        let stack = '—';
        let summary = '—';
        let skill = '—';

        const nameMatch = content.match(/>\s*-\s*\*\*Nombre\*\*:\s*`([^`]+)`/i) || content.match(/^title:\s*"Proyecto:\s*([^"\r\n]+)"/m);
        if (nameMatch) name = nameMatch[1].trim();

        const pathMatch = content.match(/>\s*-\s*\*\*Ruta local\*\*:\s*`([^`]+)`/i);
        if (pathMatch) localPath = pathMatch[1].trim();

        const stackMatch = content.match(/>\s*-\s*\*\*Stack\*\*:\s*([^\r\n]+)/i) || content.match(/###\s*Stack Tecnológico[^\r\n]*\r?\n([^\r\n#]+)/i);
        if (stackMatch) stack = stackMatch[1].replace(/[`*]/g, '').trim();

        const sumMatch = content.match(/>\s*-\s*\*\*Resumen\*\*:\s*([^\r\n]+)/i) || content.match(/>\s*\[!(?:INFO|ABSTRACT)\][^\r\n]*\r?\n>\s*([^\r\n]+)/i);
        if (sumMatch) summary = sumMatch[1].trim();

        const skillMatch = content.match(/>\s*-\s*\*\*Skill Asociada\*\*:\s*\[\[?([^\]\r\n]+)\]\]?/i) || content.match(/##\s*Skills de Proyecto[^\r\n]*\r?\n\[\[([^\]]+)\]\]/i);
        if (skillMatch) skill = skillMatch[1].replace(/^\[\[|\]\]$/g, '').trim();

        projects.push({
          name,
          localPath,
          stack,
          summary: summary.slice(0, 140),
          skill: skill !== '—' ? `[[${skill}]]` : '—',
          file: baseName,
        });
      } catch (e) {}
    }
  }

  projects.sort((a, b) => a.name.localeCompare(b.name));

  let tableRows = '';
  if (projects.length === 0) {
    tableRows = isEn
      ? '| *No projects registered yet* | — | — | — | — | — |\n'
      : '| *Aún no hay proyectos registrados* | — | — | — | — | — |\n';
  } else {
    for (const p of projects) {
      tableRows += `| **${p.name}** | \`${p.localPath}\` | ${p.stack} | ${p.summary} | ${p.skill} | [[${p.file}]] |\n`;
    }
  }

  const content = isEn
    ? `---
title: "Projects Index — Antigravity"
type: antigravity-index
tags:
  - antigravity/proyectos
  - antigravity/index
created: ${now}
updated: ${now}
---

# Unified Projects Index — Antigravity

> [!INFO] **Consolidated Projects Registry**
> High-density unified registry of all workspace projects tracked by Antigravity and Obsidian.
> This single index prevents token waste across chat sessions by aggregating project metadata, paths, and skills.

| Project | Local Path | Tech Stack | Summary | Associated Skill | Note |
|---|---|---|---|---|---|
${tableRows}
---
*Graph Connections:* [[00 Antigravity Hub]] | [[00 Indice de Memoria]]
`
    : `---
title: "Índice de Proyectos — Antigravity"
type: antigravity-index
tags:
  - antigravity/proyectos
  - antigravity/index
created: ${now}
updated: ${now}
---

# Índice Unificado de Proyectos — Antigravity

> [!INFO] **Registro Consolidado de Proyectos**
> Registro unificado de alta densidad de todos los proyectos de workspace vinculados a Antigravity y Obsidian.
> Este índice único evita el consumo excesivo de tokens al consolidar rutas, stack y skills asociadas en una sola memoria.

| Proyecto | Ruta Local | Stack Tecnológico | Resumen | Skill Asociada | Ficha |
|---|---|---|---|---|---|
${tableRows}
---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Memoria]]
`;

  fs.writeFileSync(indexFile, content, 'utf8');
  return { indexPath: indexFile, count: projects.length, projects };
}

function syncProject(vaultPath, workspaceRoot, options = {}) {
  if (!workspaceRoot || !fs.existsSync(workspaceRoot)) return null;

  ensureVaultStructure(vaultPath);
  const detected = detectWorkspaceStack(workspaceRoot);
  const projectName = detected.name || path.basename(workspaceRoot);
  const projFolder = path.join(vaultPath, 'Antigravity', 'Proyectos');
  const obsFile = path.join(projFolder, `${sanitizeFilename(projectName)}.md`);
  const now = new Date().toISOString().split('T')[0];
  const associatedSkill = findAssociatedSkill(projectName, workspaceRoot, vaultPath);

  // Remove any legacy note for the same workspace path if name changed (e.g. obsi.md vs obsidian-for-antigravity.md)
  try {
    for (const f of fs.readdirSync(projFolder)) {
      if (!f.endsWith('.md') || f.startsWith('00') || f === `${sanitizeFilename(projectName)}.md`) continue;
      const oldFp = path.join(projFolder, f);
      const oldTxt = fs.readFileSync(oldFp, 'utf8');
      const mP = oldTxt.match(/>\s*-\s*\*\*Ruta local\*\*:\s*`([^`]+)`/i);
      if (mP && path.resolve(mP[1]).toLowerCase() === path.resolve(workspaceRoot).toLowerCase()) {
        try { fs.unlinkSync(oldFp); } catch (e) {}
      }
    }
  } catch (e) {}

  let existingRules = '';
  let existingMemories = '';
  let existingSkills = '';
  if (fs.existsSync(obsFile)) {
    try {
      const existing = fs.readFileSync(obsFile, 'utf8');
      const rulesMatch = existing.match(/##\s*(?:Reglas y Condiciones Obligatorias del Proyecto|Project Rules & Constraints)[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
      if (rulesMatch && rulesMatch[1].trim()) {
        existingRules = rulesMatch[1].trim();
      }
      const memMatch = existing.match(/##\s*Memorias y Decisiones Vinculadas[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
      if (memMatch && memMatch[1].trim() && !memMatch[1].includes('<!-- Agrega enlaces')) {
        existingMemories = memMatch[1].trim();
      }
      const skiMatch = existing.match(/##\s*Skills de Proyecto[^\r\n]*\r?\n([\s\S]*?)(?:---|\n##|$)/i);
      if (skiMatch && skiMatch[1].trim() && !skiMatch[1].includes('<!-- Agrega skills')) {
        existingSkills = skiMatch[1].trim();
      }
    } catch (e) {}
  }

  const skillLink = associatedSkill !== '—' ? `[[${associatedSkill}]]` : '—';
  const skillsSection = existingSkills || (associatedSkill !== '—' ? `- Skill vinculada: [[${associatedSkill}]]` : '<!-- Agrega skills específicas usando enlaces [[Skill]] -->');

  const content = `---
title: "Proyecto: ${projectName}"
type: antigravity-project
tags:
  - antigravity/proyecto
created: ${now}
updated: ${now}
---

# Proyecto: ${projectName}

> [!INFO] **Ficha del Proyecto**
> - **Nombre**: \`${projectName}\`
> - **Ruta local**: \`${workspaceRoot}\`
> - **Stack**: ${detected.stack}
> - **Resumen**: ${detected.description}
> - **Skill Asociada**: ${skillLink}
> - **Última sincronización**: ${now}

### Detalles Técnicos Detectados
- **Versión**: \`${detected.version}\`
- **Framework / Core**: \`${detected.framework || detected.stack}\`
- **Dependencias clave**: ${detected.dependencies.slice(0, 15).map(d => `\`${d}\``).join(', ') || 'Ninguna'}

## Reglas y Condiciones Obligatorias del Proyecto
${existingRules || '<!-- Reglas operativas y condiciones obligatorias para este proyecto (commits, empaquetado, workflows, etc.) -->'}

## Memorias y Decisiones Vinculadas
${existingMemories || '<!-- Agrega enlaces [[Nombre de la Memoria]] para conectar este proyecto con el grafo de Antigravity -->'}

## Skills de Proyecto
${skillsSection}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Proyectos]]
`;

  fs.writeFileSync(obsFile, content, 'utf8');

  // Automatically update the unified projects index
  syncProjectsIndex(vaultPath, options);

  return {
    projectName,
    path: obsFile,
    stack: detected.stack,
    summary: detected.description,
    skill: associatedSkill,
  };
}

function getProjectsRegistry(vaultPath) {
  const projFolder = path.join(vaultPath, 'Antigravity', 'Proyectos');
  const list = [];
  if (!fs.existsSync(projFolder)) return list;

  const files = fs.readdirSync(projFolder);
  for (const f of files) {
    if (!f.endsWith('.md') || f.startsWith('00')) continue;
    const fp = path.join(projFolder, f);
    try {
      const content = fs.readFileSync(fp, 'utf8');
      const baseName = f.replace(/\.md$/, '');
      let name = baseName;
      let localPath = '';
      let stack = '';
      let summary = '';
      let skill = '';

      const nameMatch = content.match(/>\s*-\s*\*\*Nombre\*\*:\s*`([^`]+)`/i);
      if (nameMatch) name = nameMatch[1].trim();

      const pathMatch = content.match(/>\s*-\s*\*\*Ruta local\*\*:\s*`([^`]+)`/i);
      if (pathMatch) localPath = pathMatch[1].trim();

      const stackMatch = content.match(/>\s*-\s*\*\*Stack\*\*:\s*([^\r\n]+)/i);
      if (stackMatch) stack = stackMatch[1].trim();

      const sumMatch = content.match(/>\s*-\s*\*\*Resumen\*\*:\s*([^\r\n]+)/i);
      if (sumMatch) summary = sumMatch[1].trim();

      const skillMatch = content.match(/>\s*-\s*\*\*Skill Asociada\*\*:\s*\[\[?([^\]\r\n]+)\]\]?/i);
      if (skillMatch) skill = skillMatch[1].replace(/^\[\[|\]\]$/g, '').trim();

      list.push({
        name,
        localPath,
        stack,
        summary,
        skill: skill || '—',
        note: baseName,
        relPath: `Antigravity/Proyectos/${f}`,
      });
    } catch (e) {}
  }
  return list;
}

function isProjectRegistered(vaultPath, workspaceRoot) {
  if (!workspaceRoot) return { registered: false, project: null };
  const projects = getProjectsRegistry(vaultPath);
  const normTarget = path.resolve(workspaceRoot).toLowerCase().replace(/\\/g, '/');
  const targetBase = path.basename(workspaceRoot).toLowerCase();

  for (const p of projects) {
    if (p.localPath && p.localPath !== '—') {
      const normProj = path.resolve(p.localPath).toLowerCase().replace(/\\/g, '/');
      if (normProj === normTarget) {
        return { registered: true, project: p };
      }
    }
    if (p.name.toLowerCase() === targetBase) {
      return { registered: true, project: p };
    }
  }

  return { registered: false, project: null };
}

// -------------------------------------------------------------
// Generate Main Antigravity Hub (The Central Brain MOC)
// -------------------------------------------------------------

function generateHub(vaultPath, workspaceRoot, options = {}) {
  ensureVaultStructure(vaultPath);
  const hubFile = path.join(vaultPath, 'Antigravity', '00 Antigravity Hub.md');
  const now = new Date().toISOString().split('T')[0];
  const projectName = workspaceRoot ? path.basename(workspaceRoot) : null;
  const userName = resolveUserName(vaultPath, options.userName);
  const { aiName, userCallsign } = resolvePersonality(vaultPath, options);
  const lang = resolveLanguage(options);
  const isEn = (lang === 'en');

  const content = isEn
    ? `---
title: "Antigravity Hub — AI Second Brain"
type: antigravity-hub
tags:
  - antigravity/hub
  - antigravity/second-brain
updated: ${now}
---

# Antigravity Hub — AI Second Brain

Welcome to the interconnected memory, skills, and knowledge core between **Antigravity** and **Obsidian**.
All nodes in this vault are bidirectionally linked to light up your **Graph View**.

\`\`\`
       ┌──────────────────────────────────────────────┐
       │              00 Antigravity Hub              │
       └──────────────────────┬───────────────────────┘
          ┌───────────┬───────┴───────┬───────────┐
          ▼           ▼               ▼           ▼
        Soul       Skills          Memory     Sessions & Projects
\`\`\`

---

## Soul, Personality & Profile (Hermes Core)
Agent identity and working style of ${userName}:
- [[00 Soul de Antigravity]] — Decisive archetype, non-negotiable principles, and autonomy
- [[00 AI Personality]] — Agent name (${aiName}), callsign for you (${userCallsign}), and behavioral tone
- [[00 Perfil de Usuario]] — Preferences, technical habits, and accumulated learnings

---

## Available Skills
Access the complete catalog of capabilities and workflows mastered by the assistant:
- [[00 Indice de Skills]]

---

## Memory & Knowledge Base (Knowledge Items)
Lessons learned, architectures, debugging fixes, models, and permanent documentation:
- [[00 Indice de Memoria]]

---

## Work Continuity & Sessions
Chronological history of checkpoints, architecture decisions, and milestones across sessions:
- [[00 Indice de Sesiones]]

---

## Linked Projects & Blueprints
Consolidated index of project architectures, antipatterns, and backlogs:
- [[00 Indice de Proyectos]]
${projectName ? `- Current Active Project: [[${projectName}]]` : '- *Open a project in Antigravity to automatically register its blueprint.*'}

---

> [!TIP] **How does autonomous sync work?**
> - Every time Antigravity solves a problem or generates knowledge, it is automatically stored in \`Antigravity/Memoria/\`.
> - Work sessions and milestones are recorded in \`Antigravity/Sesiones/\`.
> - Global skills from \`~/.gemini/config/skills/\` are synchronized in real-time into \`Antigravity/Skills/\`.
> - You can create or edit skills right here in Markdown and Antigravity will assimilate them.
`
    : `---
title: "Antigravity Hub — Segundo Cerebro IA"
type: antigravity-hub
tags:
  - antigravity/hub
  - antigravity/segundo-cerebro
updated: ${now}
---

# Antigravity Hub — Segundo Cerebro de IA

Bienvenido al núcleo de memoria, skills y conocimiento interconectado entre **Antigravity** y **Obsidian**.
Todos los nodos de esta bóveda están enlazados bidireccionalmente para iluminar tu **Vista Gráfica (Graph View)**.

\`\`\`
       ┌──────────────────────────────────────────────┐
       │              00 Antigravity Hub              │
       └──────────────────────┬───────────────────────┘
          ┌───────────┬───────┴───────┬───────────┐
          ▼           ▼               ▼           ▼
        Alma       Skills          Memoria    Sesiones & Proyectos
\`\`\`

---

## Alma, Personalidad & Perfil (Hermes Core)
Identidad del agente y estilo de trabajo de ${userName}:
- [[00 Soul de Antigravity]] — Arquetipo resolutivo, principios inquebrantables y autonomía
- [[00 Personalidad de la IA]] — Nombre del agente (${aiName}), trato hacia ti (${userCallsign}) y rasgos de comportamiento
- [[00 Perfil de Usuario]] — Preferencias, hábitos técnicos y aprendizajes acumulados

---

## Skills Disponibles
Accede al catálogo completo de capacidades y flujos que domina el asistente:
- [[00 Indice de Skills]]

---

## Memoria y Base de Conocimiento (Knowledge Items)
Lecciones aprendidas, arquitecturas, trucos, modelos y documentación permanente:
- [[00 Indice de Memoria]]

---

## Continuidad de Trabajo & Sesiones
Historial cronológico de checkpoints, decisiones arquitectónicas e hitos de sesión:
- [[00 Indice de Sesiones]]

---

## Proyectos Vinculados & Blueprints
Índice consolidado de arquitectura de proyectos, anti-patrones y backlog:
- [[00 Indice de Proyectos]]
${projectName ? `- Proyecto Activo Actual: [[${projectName}]]` : '- *Abre un proyecto en Antigravity para registrar su blueprint automáticamente.*'}

---

> [!TIP] **¿Cómo funciona la sincronización automática?**
> - Cada vez que Antigravity resuelve un problema o genera conocimiento, se guarda automáticamente en \`Antigravity/Memoria/\`.
> - Las sesiones e hitos de trabajo se registran en \`Antigravity/Sesiones/\`.
> - Las skills globales de \`~/.gemini/config/skills/\` se mantienen sincronizadas en tiempo real en \`Antigravity/Skills/\`.
> - Puedes crear o editar skills aquí mismo con formato markdown y Antigravity las asimilará.
`;

  fs.writeFileSync(hubFile, content, 'utf8');
  return hubFile;
}

// -------------------------------------------------------------
// Vault Statistics
// -------------------------------------------------------------

function getVaultStats(vaultPath) {
  if (!vaultPath || !fs.existsSync(vaultPath)) {
    return { memories: 0, skills: 0, projects: 0, sessions: 0, hubExists: false, soulActive: false, personalityActive: false, personalityConfigured: false, aiName: 'Hermes', userCallsign: '' };
  }

  const baseDir = path.join(vaultPath, 'Antigravity');
  const countMd = (dir) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('00 ')).length;
  };

  const personalityInfo = resolvePersonality(vaultPath);
  const personalityActive = fs.existsSync(path.join(baseDir, 'Alma', '00 Personalidad de la IA.md')) || fs.existsSync(path.join(baseDir, 'Alma', '00 AI Personality.md'));

  return {
    memories: countMd(path.join(baseDir, 'Memoria')),
    skills: countMd(path.join(baseDir, 'Skills')),
    projects: countMd(path.join(baseDir, 'Proyectos')),
    sessions: countMd(path.join(baseDir, 'Sesiones')),
    hubExists: fs.existsSync(path.join(baseDir, '00 Antigravity Hub.md')),
    soulActive: fs.existsSync(path.join(baseDir, 'Alma', '00 Soul de Antigravity.md')),
    personalityActive,
    personalityConfigured: personalityInfo.configured,
    aiName: personalityInfo.aiName,
    userCallsign: personalityInfo.userCallsign,
    personality: personalityInfo.personality,
  };
}

// -------------------------------------------------------------
// Sync All
// -------------------------------------------------------------


// -------------------------------------------------------------
// Vault to Antigravity Knowledge Items Sync (Bidirectional)
// -------------------------------------------------------------

function syncVaultToKnowledge(vaultPath) {
  const { knowledgeDir } = getAntigravityPaths();
  if (!fs.existsSync(knowledgeDir)) {
    fs.mkdirSync(knowledgeDir, { recursive: true });
  }

  const memoriaDir = path.join(vaultPath, 'Antigravity', 'Memoria');
  const proyectosDir = path.join(vaultPath, 'Antigravity', 'Proyectos');

  function sanitizeId(name) {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const base = path.basename(filePath, '.md');
    if (base.startsWith('00')) return;

    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    let title = base;
    let summary = '';
    let originId = null;
    let body = content;

    if (fmMatch) {
      body = content.slice(fmMatch[0].length).trim();
      const lines = fmMatch[1].split('\n');
      for (const l of lines) {
        const tm = l.match(/^title:\s*"?([^"\r\n]+)"?$/);
        if (tm && tm[1]) title = tm[1].trim();
        const om = l.match(/^origin_id:\s*"?([^"\r\n]+)"?$/);
        if (om && om[1]) originId = om[1].trim();
      }
    }

    const bqMatch = body.match(/>\s*\[!.*?\]\s*\*\*.*?\*\*\r?\n>\s*([^\r\n]+)/);
    if (bqMatch && bqMatch[1]) {
      summary = bqMatch[1].trim();
    } else {
      summary = body.replace(/#.*|\r?\n/g, ' ').slice(0, 220).trim() + '...';
    }

    const id = originId || sanitizeId(title) || sanitizeId(base);
    const targetDir = path.join(knowledgeDir, id);
    const artifactsDir = path.join(targetDir, 'artifacts');

    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

    const meta = {
      title,
      summary,
      source: 'obsidian-vault',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      references: []
    };

    fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf8');
    fs.writeFileSync(path.join(artifactsDir, base + '.md'), content, 'utf8');
  }

  if (fs.existsSync(memoriaDir)) {
    for (const f of fs.readdirSync(memoriaDir)) {
      if (f.endsWith('.md')) processFile(path.join(memoriaDir, f));
    }
  }

  // Clean legacy individual project knowledge items to avoid prompt token waste
  try {
    const items = fs.readdirSync(knowledgeDir, { withFileTypes: true });
    for (const item of items) {
      if (!item.isDirectory()) continue;
      if (item.name.startsWith('proyecto-') && item.name !== 'proyectos-antigravity') {
        const metaPath = path.join(knowledgeDir, item.name, 'metadata.json');
        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (meta.source === 'obsidian-vault' || (meta.title && meta.title.startsWith('Proyecto:'))) {
              fs.rmSync(path.join(knowledgeDir, item.name), { recursive: true, force: true });
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {}

  // Export ONLY ONE single consolidated Knowledge Item for all projects: proyectos-antigravity
  if (fs.existsSync(proyectosDir)) {
    const indexResult = syncProjectsIndex(vaultPath);
    const targetDir = path.join(knowledgeDir, 'proyectos-antigravity');
    const artifactsDir = path.join(targetDir, 'artifacts');
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

    let indexContent = '';
    if (indexResult.indexPath && fs.existsSync(indexResult.indexPath)) {
      indexContent = fs.readFileSync(indexResult.indexPath, 'utf8');
    }

    const meta = {
      title: 'Proyectos Registrados — Antigravity',
      summary: 'Registro consolidado de proyectos vinculados en Antigravity con ruta, stack tecnológico y skills asociadas.',
      source: 'obsidian-vault',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      references: []
    };

    fs.writeFileSync(path.join(targetDir, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf8');
    fs.writeFileSync(path.join(artifactsDir, '00 Indice de Proyectos.md'), indexContent, 'utf8');
  }
}

// -------------------------------------------------------------
// Context Manifest Cache & Ultra-Low-Context Triage / Peek
// -------------------------------------------------------------

function buildContextManifest(vaultPath) {
  ensureVaultStructure(vaultPath);
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
        const nameMatch = txt.match(/^title:\s*"Skill:\s*([^"\r\n]+)"/m) || txt.match(/^#+\s*Skill:\s*\[\[([^\]]+)\]\]/m);
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
    vaultName: path.basename(vaultPath),
    stats: { memories: memories.length, skills: skills.length, projects: projects.length },
    skills,
    memories,
    projects,
  };

  try {
    const manifestFile = path.join(vaultPath, 'Antigravity', 'context-manifest.json');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
  } catch (e) {}

  return manifest;
}

function getContextManifest(vaultPath, forceRebuild = false) {
  const manifestFile = path.join(vaultPath, 'Antigravity', 'context-manifest.json');
  if (!forceRebuild && fs.existsSync(manifestFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      const diffMs = Date.now() - new Date(data.updatedAt || 0).getTime();
      if (diffMs < 7200000) return data;
    } catch (e) {}
  }
  return buildContextManifest(vaultPath);
}

function triageContext(vaultPath, query) {
  const STOPWORDS = new Set([
    'de', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'en', 'a',
    'con', 'por', 'para', 'del', 'al', 'que', 'es', 'son', 'fue', 'era', 'como', 'se',
    'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'the', 'and', 'in', 'on', 'for', 'with', 'to', 'at'
  ]);

  if (!query || query.trim() === '') {
    return { hasAntecedents: false, recommendation: 'Consulta vacía. Procede normalmente.' };
  }

  const manifest = getContextManifest(vaultPath);
  const keywords = query
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_\-\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));

  if (keywords.length === 0) {
    return { hasAntecedents: false, recommendation: 'Sin palabras clave relevantes. Procede normalmente.' };
  }

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
        advice: `Usa la Skill [[${s.name}]] para este flujo de trabajo. Lee su SKILL.md para instrucciones operativas.`,
      };
    }
  }

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
        relPath: m.relPath,
      });
    }
  }

  scoredMemories.sort((a, b) => b.score - a.score);
  const topMemories = scoredMemories.slice(0, 2).map(({ title, category, summary, relPath }) => ({
    title,
    category,
    summary,
    relPath,
  }));

  const hasAntecedents = topMemories.length > 0 || !!skillMatch;

  let recommendation = '';
  if (topMemories.length > 0) {
    recommendation = 'Antecedente encontrado: Usa directamente el resumen arriba indicado. Usa "peek" si necesitas ver el código exacto.';
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

function peekMemory(vaultPath, noteName) {
  if (!noteName) return { error: 'Especifica la nota a inspeccionar.' };

  const cleanName = sanitizeFilename(noteName.endsWith('.md') ? noteName.slice(0, -3) : noteName);
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
  const summary = sumMatch ? sumMatch[1].trim() : '';

  let body = raw.replace(/^---[\s\S]*?---\r?\n/, '');
  body = body.replace(/---[\s\S]*?\*Conexiones del Grafo:\*[\s\S]*$/, '');
  body = body.replace(/^#+\s*[^\r\n]+/gm, '').trim();

  const detailsMatch = raw.match(/##\s*Detalles y Solución\r?\n([\s\S]*?)(?:---|###|$)/i);
  let solutionText = detailsMatch ? detailsMatch[1].trim() : body;

  if (solutionText.length > 1200) {
    solutionText = solutionText.slice(0, 1200) + '\n\n*(Extracto resumido para ahorrar contexto).*';
  }

  return {
    title: path.basename(target, '.md'),
    category,
    summary,
    solution: solutionText || 'Sin detalles adicionales registrados.',
  };
}

function catalogContext(vaultPath) {
  const manifest = getContextManifest(vaultPath);
  return {
    skills: manifest.skills.map(s => ({ name: s.name, desc: s.description })),
    memories: manifest.memories.slice(0, 10).map(m => ({ title: m.title, cat: m.category, desc: m.summary })),
  };
}

function syncAll(vaultPath, workspaceRoot, options = {}) {
  ensureVaultStructure(vaultPath);
  ensureSoulAndProfile(vaultPath, options);
  const skills = syncSkillsToVault(vaultPath, workspaceRoot);
  const memories = syncKnowledgeToVault(vaultPath);
  const project = workspaceRoot ? syncProject(vaultPath, workspaceRoot) : null;
  const hub = generateHub(vaultPath, workspaceRoot, options);
  syncVaultToKnowledge(vaultPath);
  buildContextManifest(vaultPath);
  const stats = getVaultStats(vaultPath);

  return {
    skillsCount: skills.length,
    memoriesCount: memories.length,
    project,
    hub,
    stats,
  };
}

function resetAllData(vaultPath, workspaceRoot) {
  if (!vaultPath || !fs.existsSync(vaultPath)) {
    throw new Error(`El Vault de Obsidian no existe: ${vaultPath}`);
  }

  const baseDir = path.join(vaultPath, 'Antigravity');
  const memDir = path.join(baseDir, 'Memoria');
  const skiDir = path.join(baseDir, 'Skills');
  const proDir = path.join(baseDir, 'Proyectos');
  const sesDir = path.join(baseDir, 'Sesiones');
  const manifestFile = path.join(baseDir, 'context-manifest.json');

  // 1. Wipe Memories in Vault
  if (fs.existsSync(memDir)) {
    for (const f of fs.readdirSync(memDir)) {
      try { fs.unlinkSync(path.join(memDir, f)); } catch (e) {}
    }
  }

  // 2. Wipe Skills in Vault
  if (fs.existsSync(skiDir)) {
    for (const f of fs.readdirSync(skiDir)) {
      try { fs.unlinkSync(path.join(skiDir, f)); } catch (e) {}
    }
  }

  // 3. Wipe Projects in Vault
  if (fs.existsSync(proDir)) {
    for (const f of fs.readdirSync(proDir)) {
      try { fs.unlinkSync(path.join(proDir, f)); } catch (e) {}
    }
  }

  // 4. Wipe Sessions in Vault
  if (fs.existsSync(sesDir)) {
    for (const f of fs.readdirSync(sesDir)) {
      try { fs.unlinkSync(path.join(sesDir, f)); } catch (e) {}
    }
  }

  // 5. Delete manifest file
  if (fs.existsSync(manifestFile)) {
    try { fs.unlinkSync(manifestFile); } catch (e) {}
  }

  // 6. Clean Knowledge Items created by Obsidian
  const { knowledgeDir } = getAntigravityPaths();
  if (fs.existsSync(knowledgeDir)) {
    const kiFolders = fs.readdirSync(knowledgeDir, { withFileTypes: true });
    for (const kf of kiFolders) {
      if (!kf.isDirectory()) continue;
      const folderPath = path.join(knowledgeDir, kf.name);
      const metaPath = path.join(folderPath, 'metadata.json');
      let shouldDelete = false;

      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          if (meta.source === 'obsidian-vault') {
            shouldDelete = true;
          }
        } catch (e) {}
      }

      // Known Obsidian generated IDs or duplicate sync items
      const obsKnownPrefixes = ['proyecto-', 'antigravity-', 'arquitectura-antigravity', 'protocolo-de-memoria', 'sincronizacion-bidireccional', 'solucion-a-variables', 'latalaya-arquitectura'];
      if (obsKnownPrefixes.some(p => kf.name.startsWith(p))) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        try {
          fs.rmSync(folderPath, { recursive: true, force: true });
        } catch (e) {}
      }
    }
  }

  // 7. Re-create vault structure
  ensureVaultStructure(vaultPath);

  // 8. Re-sync active skills cleanly (no duplicates, no orphans)
  const skills = syncSkillsToVault(vaultPath, workspaceRoot);

  // 9. Generate fresh empty Memory Index
  const now = new Date().toISOString().split('T')[0];
  const indexFile = path.join(memDir, '00 Indice de Memoria.md');
  const emptyIndexMd = `---
title: "Indice de Memoria de Antigravity"
type: antigravity-index
tags:
  - antigravity/indice
  - antigravity/memoria
updated: ${now}
---

# Banco de Memoria & Knowledge Items

Total de memorias registradas: **0**

*No hay memorias registradas. La IA guardará lecciones y arquitectura automáticamente o puedes añadir notas desde la pestaña "Crear".*

---
*Volver al:* [[00 Antigravity Hub]]
`;
  fs.writeFileSync(indexFile, emptyIndexMd, 'utf8');

  // 10. Generate fresh Hub
  const hub = generateHub(vaultPath, workspaceRoot);

  // 11. Re-sync current workspace project if any
  const project = workspaceRoot ? syncProject(vaultPath, workspaceRoot) : null;

  // 12. Build fresh clean manifest
  buildContextManifest(vaultPath);

  return {
    status: 'reset_complete',
    vaultPath,
    skillsCount: skills.length,
    memoriesCount: 0,
    project,
    hub,
  };
}

module.exports = {
  syncVaultToKnowledge,
  getAntigravityPaths,
  ensureVaultStructure,
  ensureSoulAndProfile,
  getSoulAndProfile,
  resolvePersonality,
  ensurePersonality,
  getPersonality,
  savePersonality,
  recordUserLearning,
  resolveUserName,
  resolveLanguage,
  syncSkillsToVault,
  syncKnowledgeToVault,
  saveNewMemory,
  saveSkill,
  createSkill,
  editSkill,
  getSkillDetails,
  listAllSkills,
  deleteSkill,
  addSkillScript,
  listRules,
  viewRule,
  syncProject,
  syncProjectsIndex,
  getProjectsRegistry,
  isProjectRegistered,
  generateHub,
  getVaultStats,
  syncAll,
  resetAllData,
  buildContextManifest,
  getContextManifest,
  triageContext,
  peekMemory,
  catalogContext,
};
