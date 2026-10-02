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
  return {
    globalSkillsDir: path.join(home, '.gemini', 'config', 'skills'),
    knowledgeDir: path.join(home, '.gemini', 'antigravity-ide', 'knowledge'),
    brainDir: path.join(home, '.gemini', 'antigravity-ide', 'brain'),
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

function ensureSoulAndProfile(vaultPath, options = {}) {
  if (!vaultPath || !fs.existsSync(vaultPath)) return null;
  ensureVaultStructure(vaultPath);

  const almaDir = path.join(vaultPath, 'Antigravity', 'Alma');
  if (!fs.existsSync(almaDir)) {
    fs.mkdirSync(almaDir, { recursive: true });
  }

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
*Graph Connections:* [[00 Antigravity Hub]] | [[00 Perfil de Usuario]]
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
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Perfil de Usuario]]
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
*Graph Connections:* [[00 Antigravity Hub]] | [[00 Soul de Antigravity]]
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
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Soul de Antigravity]]
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
// Save New Custom Skill (Two-way: Obsidian + Antigravity)
// -------------------------------------------------------------

function saveSkill(vaultPath, skillData) {
  ensureVaultStructure(vaultPath);
  const { globalSkillsDir } = getAntigravityPaths();
  const name = skillData.name.trim();
  const description = skillData.description ? skillData.description.trim() : '';
  const instructions = skillData.instructions ? skillData.instructions.trim() : '';

  // 1. Write to Antigravity Global Skills
  const agSkillDir = path.join(globalSkillsDir, name);
  if (!fs.existsSync(agSkillDir)) {
    fs.mkdirSync(agSkillDir, { recursive: true });
  }

  const skillMdContent = `---
name: ${name}
description: >
  ${description.replace(/\n/g, '\n  ')}
---

# ${name}

${instructions}
`;
  fs.writeFileSync(path.join(agSkillDir, 'SKILL.md'), skillMdContent, 'utf8');

  // 2. Write to Obsidian Vault
  const skillsFolder = path.join(vaultPath, 'Antigravity', 'Skills');
  const obsFile = path.join(skillsFolder, `${sanitizeFilename(name)}.md`);
  const now = new Date().toISOString().split('T')[0];

  const obsContent = `---
title: "Skill: ${name}"
type: antigravity-skill
scope: global
tags:
  - antigravity/skill
  - antigravity/skill/global
updated: ${now}
---

# Skill: ${name}

> [!INFO] **Metadatos de la Skill**
> - **Nombre**: \`${name}\`
> - **Ámbito**: Global (\`~/.gemini/config/skills/\`)
> - **Descripción**: ${description}

## Instrucciones del Agente

${instructions}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Skills]]
`;

  fs.writeFileSync(obsFile, obsContent, 'utf8');

  return { name, path: obsFile, agSkillDir };
}

// -------------------------------------------------------------
// Sync Current Workspace Project
// -------------------------------------------------------------

function syncProject(vaultPath, workspaceRoot) {
  if (!workspaceRoot || !fs.existsSync(workspaceRoot)) return null;

  ensureVaultStructure(vaultPath);
  const projectName = path.basename(workspaceRoot);
  const projFolder = path.join(vaultPath, 'Antigravity', 'Proyectos');
  const obsFile = path.join(projFolder, `${sanitizeFilename(projectName)}.md`);
  const now = new Date().toISOString().split('T')[0];

  let packageInfo = '';
  const pkgPath = path.join(workspaceRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      packageInfo = `\n### Stack Tecnológico (package.json)\n- **Versión**: \`${pkg.version || '1.0.0'}\`\n- **Dependencias**: ${Object.keys(pkg.dependencies || {}).map(d => `\`${d}\``).join(', ') || 'Ninguna'}\n- **DevDependencies**: ${Object.keys(pkg.devDependencies || {}).map(d => `\`${d}\``).join(', ') || 'Ninguna'}\n`;
    } catch (e) {}
  }

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
> - **Última sincronización**: ${now}

${packageInfo}

## Memorias y Decisiones Vinculadas
<!-- Agrega enlaces [[Nombre de la Memoria]] para conectar este proyecto con el grafo de Antigravity -->

## Skills de Proyecto
<!-- Agrega skills específicas usando enlaces [[Skill]] -->

---
*Conexiones del Grafo:* [[00 Antigravity Hub]]
`;

  fs.writeFileSync(obsFile, content, 'utf8');
  return { projectName, path: obsFile };
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
       ┌──────────────────────────────┐
       │     00 Antigravity Hub       │
       └──────────────┬───────────────┘
          ┌───────────┼───────────┬───────────┐
          ▼           ▼           ▼           ▼
        Soul       Skills      Memory      Projects
\`\`\`

---

## Soul & Profile (Hermes Core)
Agent identity and working style of ${userName}:
- [[00 Soul de Antigravity]] — Decisive archetype, non-negotiable principles, and autonomy
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

## Linked Projects
${projectName ? `- Current Project: [[${projectName}]]` : '- *Open a project in Antigravity to automatically register it.*'}

---

> [!TIP] **How does autonomous sync work?**
> - Every time Antigravity solves a problem or generates knowledge, it is automatically stored in \`Antigravity/Memoria/\`.
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
       ┌──────────────────────────────┐
       │     00 Antigravity Hub       │
       └──────────────┬───────────────┘
          ┌───────────┼───────────┬───────────┐
          ▼           ▼           ▼           ▼
        Alma       Skills      Memoria    Proyectos
\`\`\`

---

## Alma & Perfil (Hermes Core)
Identidad del agente y estilo de trabajo de ${userName}:
- [[00 Soul de Antigravity]] — Arquetipo resolutivo, principios inquebrantables y autonomía
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

## Proyectos Vinculados
${projectName ? `- Proyecto Actual: [[${projectName}]]` : '- *Abre un proyecto en Antigravity para registrarlo automáticamente.*'}

---

> [!TIP] **¿Cómo funciona la sincronización automática?**
> - Cada vez que Antigravity resuelve un problema o genera conocimiento, se guarda automáticamente en \`Antigravity/Memoria/\`.
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
    return { memories: 0, skills: 0, projects: 0, sessions: 0, hubExists: false, soulActive: false };
  }

  const baseDir = path.join(vaultPath, 'Antigravity');
  const countMd = (dir) => {
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('00 ')).length;
  };

  return {
    memories: countMd(path.join(baseDir, 'Memoria')),
    skills: countMd(path.join(baseDir, 'Skills')),
    projects: countMd(path.join(baseDir, 'Proyectos')),
    sessions: countMd(path.join(baseDir, 'Sesiones')),
    hubExists: fs.existsSync(path.join(baseDir, '00 Antigravity Hub.md')),
    soulActive: fs.existsSync(path.join(baseDir, 'Alma', '00 Soul de Antigravity.md')),
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

  if (fs.existsSync(proyectosDir)) {
    for (const f of fs.readdirSync(proyectosDir)) {
      if (f.endsWith('.md')) processFile(path.join(proyectosDir, f));
    }
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
  recordUserLearning,
  resolveUserName,
  resolveLanguage,
  syncSkillsToVault,
  syncKnowledgeToVault,
  saveNewMemory,
  saveSkill,
  syncProject,
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
