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

  // 1. Update 00 Indice de Memoria.md
  try {
    const indexFile = path.join(memoriaFolder, '00 Indice de Memoria.md');
    const allFiles = fs.readdirSync(memoriaFolder).filter(f => f.endsWith('.md') && !f.startsWith('00'));
    let indexMd = `---
title: "Índice de Memoria de Antigravity"
type: antigravity-index
tags:
  - antigravity/indice
  - antigravity/memoria
updated: ${now}
---

# 🧠 Banco de Memoria & Knowledge Items

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
    let body = content;

    if (fmMatch) {
      body = content.slice(fmMatch[0].length).trim();
      const lines = fmMatch[1].split('\n');
      for (const l of lines) {
        const tm = l.match(/^title:\s*"?([^"\r\n]+)"?$/);
        if (tm && tm[1]) title = tm[1].trim();
      }
    }

    const bqMatch = body.match(/>\s*\[!.*?\]\s*\*\*.*?\*\*\r?\n>\s*([^\r\n]+)/);
    if (bqMatch && bqMatch[1]) {
      summary = bqMatch[1].trim();
    } else {
      summary = body.replace(/#.*|\r?\n/g, ' ').slice(0, 220).trim() + '...';
    }

    const id = sanitizeId(title) || sanitizeId(base);
    const targetDir = path.join(knowledgeDir, id);
    const artifactsDir = path.join(targetDir, 'artifacts');

    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

    const meta = {
      title,
      summary,
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
        const titleMatch = txt.match(/^title:\s*"([^"\r\n]+)"/m) || txt.match(/^#+\s*🧠?\s*(.+)$/m);
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
        const nameMatch = txt.match(/^title:\s*"Skill:\s*([^"\r\n]+)"/m) || txt.match(/^#+\s*⚡?\s*Skill:\s*\[\[([^\]]+)\]\]/m);
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

  const detailsMatch = raw.match(/##\s*📝\s*Detalles y Solución\r?\n([\s\S]*?)(?:---|###\s*📄|$)/i);
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

function syncAll(vaultPath, workspaceRoot) {
  ensureVaultStructure(vaultPath);
  const skills = syncSkillsToVault(vaultPath, workspaceRoot);
  const memories = syncKnowledgeToVault(vaultPath);
  const project = workspaceRoot ? syncProject(vaultPath, workspaceRoot) : null;
  const hub = generateHub(vaultPath, workspaceRoot);
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

module.exports = {
  syncVaultToKnowledge,
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
  buildContextManifest,
  getContextManifest,
  triageContext,
  peekMemory,
};
