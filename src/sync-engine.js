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

  // 1. Scan Global Skills
  if (fs.existsSync(globalSkillsDir)) {
    const entries = fs.readdirSync(globalSkillsDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const skillMd = path.join(globalSkillsDir, ent.name, 'SKILL.md');
        const parsed = parseSkillMd(skillMd);
        if (parsed) {
          const obsFile = path.join(skillsFolder, `${sanitizeFilename(parsed.name)}.md`);
          const nowStr = new Date().toISOString().split('T')[0];

          const obsContent = `---
title: "Skill: ${parsed.name}"
type: antigravity-skill
scope: global
tags:
  - antigravity/skill
  - antigravity/skill/global
updated: ${nowStr}
---

# ⚡ Skill: [[${parsed.name}]]

> [!INFO] **Metadatos de la Skill**
> - **Nombre**: \`${parsed.name}\`
> - **Ámbito**: Global (\`~/.gemini/config/skills/\`)
> - **Descripción**: ${parsed.description || 'Sin descripción'}

## 📖 Instrucciones del Agente

${parsed.body}

---
*Conexiones del Grafo:* [[00 🧠 Antigravity Hub]] | [[00 ⚡ Índice de Skills]]
`;
          fs.writeFileSync(obsFile, obsContent, 'utf8');
          syncedSkills.push({ name: parsed.name, scope: 'global', path: obsFile, description: parsed.description });
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
          if (parsed) {
            const obsFile = path.join(skillsFolder, `[Proyecto] ${sanitizeFilename(parsed.name)}.md`);
            const nowStr = new Date().toISOString().split('T')[0];

            const obsContent = `---
title: "Skill: ${parsed.name}"
type: antigravity-skill
scope: project
project: "${path.basename(workspaceRoot)}"
tags:
  - antigravity/skill
  - antigravity/skill/project
updated: ${nowStr}
---

# ⚡ Skill de Proyecto: [[${parsed.name}]]

> [!INFO] **Metadatos de la Skill**
> - **Nombre**: \`${parsed.name}\`
> - **Ámbito**: Proyecto actual (\`${path.basename(workspaceRoot)}\`)
> - **Descripción**: ${parsed.description || 'Sin descripción'}

## 📖 Instrucciones del Agente

${parsed.body}

---
*Conexiones del Grafo:* [[00 🧠 Antigravity Hub]] | [[00 ⚡ Índice de Skills]] | [[${path.basename(workspaceRoot)}]]
`;
            fs.writeFileSync(obsFile, obsContent, 'utf8');
            syncedSkills.push({ name: parsed.name, scope: 'project', path: obsFile, description: parsed.description });
          }
        }
      }
    }
  }

  // 3. Generate Skills Index Note
  const indexFile = path.join(skillsFolder, '00 Indice de Skills.md');
  let indexMd = `---
title: "Índice de Skills de Antigravity"
type: antigravity-index
tags:
  - antigravity/indice
  - antigravity/skills
updated: ${new Date().toISOString().split('T')[0]}
---

# ⚡ Catálogo de Skills de Antigravity

Total de skills activas sincronizadas: **${syncedSkills.length}**

## 🌐 Skills Globales
| Skill | Descripción | Nota |
|---|---|---|
`;

  const globalList = syncedSkills.filter(s => s.scope === 'global');
  for (const s of globalList) {
    indexMd += `| **${s.name}** | ${s.description.replace(/\r?\n/g, ' ')} | [[${s.name}]] |\n`;
  }

  const projList = syncedSkills.filter(s => s.scope === 'project');
  if (projList.length > 0) {
    indexMd += `\n## 📁 Skills de Proyecto\n| Skill | Descripción | Nota |\n|---|---|---|\n`;
    for (const s of projList) {
      indexMd += `| **${s.name}** | ${s.description.replace(/\r?\n/g, ' ')} | [[${sanitizeFilename(`[Proyecto] ${s.name}`)}]] |\n`;
    }
  }

  indexMd += `\n---\n*Volver al:* [[00 Antigravity Hub]]\n`;
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
          const title = meta.title || item.name;
          const summary = meta.summary || 'Sin resumen';
          const safeTitle = sanitizeFilename(title);
          const obsFile = path.join(memoriaFolder, `${safeTitle}.md`);

          // Read artifacts if any
          let artifactsMd = '';
          const artifactsDir = path.join(itemDir, 'artifacts');
          if (fs.existsSync(artifactsDir)) {
            const artFiles = fs.readdirSync(artifactsDir);
            for (const af of artFiles) {
              const afPath = path.join(artifactsDir, af);
              if (fs.statSync(afPath).isFile() && (af.endsWith('.md') || af.endsWith('.txt'))) {
                const artContent = fs.readFileSync(afPath, 'utf8');
                artifactsMd += `\n### 📄 Documento: ${af}\n\n${artContent}\n`;
              }
            }
          }

          const obsContent = `---
title: "${title}"
type: antigravity-memory
category: knowledge-item
tags:
  - antigravity/memoria
  - antigravity/knowledge-base
created: ${meta.created_at || new Date().toISOString().split('T')[0]}
updated: ${meta.updated_at || new Date().toISOString().split('T')[0]}
---

# 🧠 ${title}

> [!ABSTRACT] **Resumen de Conocimiento**
> ${summary}

## 📚 Artefactos y Referencias Técnicas

${artifactsMd || '*No se registraron artefactos adicionales.*'}

---
*Conexiones del Grafo:* [[00 🧠 Antigravity Hub]] | [[00 🧠 Índice de Memoria]]
`;

          fs.writeFileSync(obsFile, obsContent, 'utf8');
          syncedMemories.push({ title, path: obsFile, summary });
        } catch (e) {
          // ignore corrupted metadata
        }
      }
    }
  }

  // Generate Memory Index Note
  const indexFile = path.join(memoriaFolder, '00 Indice de Memoria.md');
  let indexMd = `---
title: "Índice de Memoria de Antigravity"
type: antigravity-index
tags:
  - antigravity/indice
  - antigravity/memoria
updated: ${new Date().toISOString().split('T')[0]}
---

# 🧠 Banco de Memoria & Knowledge Items

Total de memorias y bases de conocimiento registradas: **${syncedMemories.length}**

| Memoria / Proyecto | Resumen | Enlace Obsidian |
|---|---|---|
`;

  for (const m of syncedMemories) {
    indexMd += `| **${m.title}** | ${m.summary.slice(0, 120)}... | [[${sanitizeFilename(m.title)}]] |\n`;
  }

  indexMd += `\n---\n*Volver al:* [[00 Antigravity Hub]]\n`;
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
    relatedLinks += '\n### ⚡ Skills Relacionadas\n';
    for (const sk of memoryData.relatedSkills) {
      relatedLinks += `- [[${sk}]]\n`;
    }
  }

  if (memoryData.project) {
    relatedLinks += `\n### 📁 Proyecto: [[${memoryData.project}]]\n`;
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

# 🧠 ${title}

> [!NOTE] **Contexto Registrado por Antigravity**
> ${memoryData.summary || memoryData.title}

## 📝 Detalles y Solución

${memoryData.content || '*Sin contenido adicional.*'}

${relatedLinks}

---
*Conexiones del Grafo:* [[00 Antigravity Hub]] | [[00 Indice de Memoria]]
`;

  fs.writeFileSync(obsFile, content, 'utf8');

  // Also write to Knowledge Items if requested
  try {
    const { knowledgeDir } = getAntigravityPaths();
    const kiId = cleanTitle.toLowerCase().replace(/\s+/g, '-');
    const kiDir = path.join(knowledgeDir, kiId);
    if (!fs.existsSync(kiDir)) {
      fs.mkdirSync(path.join(kiDir, 'artifacts'), { recursive: true });
      fs.writeFileSync(path.join(kiDir, 'metadata.json'), JSON.stringify({
        title,
        summary: memoryData.summary || memoryData.content?.slice(0, 200) || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, null, 2));
      fs.writeFileSync(path.join(kiDir, 'artifacts', `${cleanTitle}.md`), memoryData.content || '');
    }
  } catch (e) {
    // Non-fatal
  }

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

# ⚡ Skill: [[${name}]]

> [!INFO] **Metadatos de la Skill**
> - **Nombre**: \`${name}\`
> - **Ámbito**: Global (\`~/.gemini/config/skills/\`)
> - **Descripción**: ${description}

## 📖 Instrucciones del Agente

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
      packageInfo = `\n### 📦 Stack Tecnológico (package.json)\n- **Versión**: \`${pkg.version || '1.0.0'}\`\n- **Dependencias**: ${Object.keys(pkg.dependencies || {}).map(d => `\`${d}\``).join(', ') || 'Ninguna'}\n- **DevDependencies**: ${Object.keys(pkg.devDependencies || {}).map(d => `\`${d}\``).join(', ') || 'Ninguna'}\n`;
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

# 📁 Proyecto: [[${projectName}]]

> [!INFO] **Ficha del Proyecto**
> - **Nombre**: \`${projectName}\`
> - **Ruta local**: \`${workspaceRoot}\`
> - **Última sincronización**: ${now}

${packageInfo}

## 🧠 Memorias y Decisiones Vinculadas
<!-- Agrega enlaces [[Nombre de la Memoria]] para conectar este proyecto con el grafo de Antigravity -->

## ⚡ Skills de Proyecto
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

function generateHub(vaultPath, workspaceRoot) {
  ensureVaultStructure(vaultPath);
  const hubFile = path.join(vaultPath, 'Antigravity', '00 Antigravity Hub.md');
  const now = new Date().toISOString().split('T')[0];
  const projectName = workspaceRoot ? path.basename(workspaceRoot) : null;

  const content = `---
title: "Antigravity Hub — Segundo Cerebro IA"
type: antigravity-hub
tags:
  - antigravity/hub
  - antigravity/segundo-cerebro
updated: ${now}
---

# 🧠 Antigravity Hub — Segundo Cerebro de IA

Bienvenido al núcleo de memoria, skills y conocimiento interconectado entre **Antigravity** y **Obsidian**.
Todos los nodos de esta bóveda están enlazados bidireccionalmente para iluminar tu **Vista Gráfica (Graph View)**.

\`\`\`
       ┌──────────────────────────────┐
       │     00 Antigravity Hub       │
       └──────────────┬───────────────┘
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ⚡ Skills    🧠 Memoria   📁 Proyectos
\`\`\`

---

## ⚡ Skills Disponibles
Accede al catálogo completo de capacidades y flujos que domina el asistente:
- 📑 [[00 Indice de Skills]]

---

## 🧠 Memoria y Base de Conocimiento (Knowledge Items)
Lecciones aprendidas, arquitecturas, trucos, modelos y documentación permanente:
- 📚 [[00 Indice de Memoria]]

---

## 📁 Proyectos Vinculados
${projectName ? `- 📂 Proyecto Actual: [[${projectName}]]` : '- *Abre un proyecto en Antigravity para registrarlo automáticamente.*'}

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
    return { memories: 0, skills: 0, projects: 0, sessions: 0, hubExists: false };
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
  };
}

// -------------------------------------------------------------
// Sync All
// -------------------------------------------------------------

function syncAll(vaultPath, workspaceRoot) {
  ensureVaultStructure(vaultPath);
  const skills = syncSkillsToVault(vaultPath, workspaceRoot);
  const memories = syncKnowledgeToVault(vaultPath);
  const project = workspaceRoot ? syncProject(vaultPath, workspaceRoot) : null;
  const hub = generateHub(vaultPath, workspaceRoot);
  const stats = getVaultStats(vaultPath);

  return {
    skillsCount: skills.length,
    memoriesCount: memories.length,
    project,
    hub,
    stats,
  };
}

module.exports = {
  getAntigravityPaths,
  ensureVaultStructure,
  syncSkillsToVault,
  syncKnowledgeToVault,
  saveNewMemory,
  saveSkill,
  syncProject,
  generateHub,
  getVaultStats,
  syncAll,
};
