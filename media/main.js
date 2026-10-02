(function () {
  const vscode = acquireVsCodeApi();

  // Multi-language dictionary (i18n)
  const I18N = {
    es: {
      brand_title: "Obsidian for Antigravity",
      brand_subtitle: "Segundo Cerebro de Antigravity",
      online: "Online",
      offline: "Offline",
      memories: "Memorias",
      skills: "Skills",
      graph: "Grafo",
      tab_panel: "Panel",
      tab_memories: "Memorias",
      tab_skills: "Skills",
      tab_create: "Crear",
      tab_settings: "Ajustes",
      graph_title: "Explorar Grafo de Conocimiento",
      graph_desc: "Abre Obsidian Graph View con todas tus notas interconectadas.",
      btn_sync: "Sincronizar Bóveda",
      btn_syncing: "Sincronizando...",
      btn_open_hub: "Abrir 00 Antigravity Hub",
      info_title: "Sincronización Autónoma Activa",
      info_desc: "Antigravity aprende de tus conversaciones y guarda lecciones en tu Vault automáticamente sin pedir confirmación.",
      search_memories: "Buscar en memorias...",
      search_skills: "Filtrar skills...",
      filter_all: "Todos",
      filter_arch: "Arquitectura",
      filter_bugfix: "Bugfix",
      filter_knowledge: "Knowledge",
      filter_general: "General",
      no_memories: "Sin memorias registradas aún",
      no_skills: "Sin skills sincronizadas aún",
      btn_copy: "Copiar",
      btn_open: "Abrir",
      btn_change: "Cambiar Bóveda",
      form_title: "Título de la Memoria / Solución",
      form_title_ph: "Ej: Optimización SQLite WAL y concurrencia",
      form_cat: "Categoría",
      form_details: "Detalles / Solución Técnica",
      form_details_ph: "Escribe aquí los pasos, comandos o explicación técnica...",
      form_tags: "Etiquetas (separadas por coma)",
      form_tags_ph: "ej: sqlite, backend, rendimiento",
      btn_save: "Guardar en Obsidian Vault",
      settings_mode_title: "Modo Nativo Directo Activo",
      settings_mode_desc: "La extensión sincroniza directamente tus archivos Markdown locales. Cero configuración, cero API keys.",
      settings_vaults_detected: "Bóvedas detectadas en este equipo:",
      btn_select_another: "Seleccionar otra carpeta de Bóveda...",
      settings_reinstall_title: "Inyección en Chats de IA:",
      btn_reinstall: "Refrescar Skill y Reglas Globales",
      settings_reinstall_desc: "Vuelve a comprobar que ~/.gemini/config/skills/ tenga la skill lista para todos los chats.",
      language_label: "Idioma / Language:",
      toast_copied: "Ruta copiada al portapapeles",
      toast_link_copied: "Enlace copiado",
      toast_synced: "Sincronización con Obsidian completada",
      toast_saved: "Memoria guardada en Obsidian",
      toast_fill_required: "Por favor completa el título y los detalles",
      settings_ai_title: "Comportamiento en Conversaciones de IA:",
      settings_proactive_title: "Consultar Vault al Iniciar Tareas",
      settings_proactive_desc: "La IA revisará si hay notas previas que le sirvan antes de investigar o asumir soluciones.",
      settings_autosave_title: "Aprender y Guardar Automáticamente",
      settings_autosave_desc: "Guarda lecciones de bugs resueltos y decisiones arquitectónicas sin pedir confirmación.",
      btn_save_ai_settings: "Guardar y Aplicar a Todos los Chats",
      toast_ai_settings_saved: "Preferencias de IA actualizadas para todos los chats"
    },
    en: {
      brand_title: "Obsidian for Antigravity",
      brand_subtitle: "Antigravity Second Brain",
      online: "Online",
      offline: "Offline",
      memories: "Memories",
      skills: "Skills",
      graph: "Graph",
      tab_panel: "Dashboard",
      tab_memories: "Memories",
      tab_skills: "Skills",
      tab_create: "Create",
      tab_settings: "Settings",
      graph_title: "Explore Knowledge Graph",
      graph_desc: "Opens your Obsidian Graph View with all interconnected notes.",
      btn_sync: "Sync Vault Now",
      btn_syncing: "Syncing...",
      btn_open_hub: "Open 00 Antigravity Hub",
      info_title: "Autonomous Sync Active",
      info_desc: "Antigravity learns from your conversations and saves lessons to your Vault automatically without asking.",
      search_memories: "Search memories...",
      search_skills: "Filter skills...",
      filter_all: "All",
      filter_arch: "Architecture",
      filter_bugfix: "Bugfix",
      filter_knowledge: "Knowledge",
      filter_general: "General",
      no_memories: "No memories recorded yet",
      no_skills: "No skills synced yet",
      btn_copy: "Copy",
      btn_open: "Open",
      btn_change: "Change Vault",
      form_title: "Memory / Solution Title",
      form_title_ph: "E.g.: SQLite WAL optimization and concurrency",
      form_cat: "Category",
      form_details: "Details / Technical Solution",
      form_details_ph: "Write steps, commands, or technical explanation...",
      form_tags: "Tags (comma-separated)",
      form_tags_ph: "e.g.: sqlite, backend, performance",
      btn_save: "Save to Obsidian Vault",
      settings_mode_title: "Direct Native Mode Active",
      settings_mode_desc: "The extension syncs local Markdown files directly. Zero configuration, zero API keys.",
      settings_vaults_detected: "Vaults detected on this machine:",
      btn_select_another: "Select another Vault folder...",
      settings_reinstall_title: "AI Chat Injection:",
      btn_reinstall: "Refresh Global Skill & Rules",
      settings_reinstall_desc: "Verifies that ~/.gemini/config/skills/ has the skill ready for all chats.",
      language_label: "Language:",
      toast_copied: "Vault path copied to clipboard",
      toast_link_copied: "Link copied",
      toast_synced: "Sync with Obsidian completed",
      toast_saved: "Memory saved to Obsidian",
      toast_fill_required: "Please fill in title and details",
      settings_ai_title: "AI Conversation Behavior:",
      settings_proactive_title: "Consult Vault When Starting Tasks",
      settings_proactive_desc: "AI inspects prior notes for relevant insights before researching or guessing.",
      settings_autosave_title: "Autonomously Learn & Save",
      settings_autosave_desc: "Automatically records solutions and architectural decisions without prompting.",
      btn_save_ai_settings: "Save & Apply to All Chats",
      toast_ai_settings_saved: "AI settings applied to all chats"
    },
    fr: {
      brand_title: "Obsidian for Antigravity",
      brand_subtitle: "Second Cerveau d'Antigravity",
      online: "En ligne",
      offline: "Hors ligne",
      memories: "Mémoires",
      skills: "Compétences",
      graph: "Graphe",
      tab_panel: "Panneau",
      tab_memories: "Mémoires",
      tab_skills: "Compétences",
      tab_create: "Créer",
      tab_settings: "Options",
      graph_title: "Explorer le Graphe",
      graph_desc: "Ouvre Obsidian Graph View avec toutes vos notes interconnectées.",
      btn_sync: "Synchroniser le Vault",
      btn_syncing: "Synchronisation...",
      btn_open_hub: "Ouvrir 00 Antigravity Hub",
      info_title: "Synchronisation Autonome Active",
      info_desc: "Antigravity apprend de vos conversations et enregistre les leçons dans votre Vault sans confirmation.",
      search_memories: "Rechercher des mémoires...",
      search_skills: "Filtrer compétences...",
      filter_all: "Tous",
      filter_arch: "Architecture",
      filter_bugfix: "Correction",
      filter_knowledge: "Connaissance",
      filter_general: "Général",
      no_memories: "Aucune mémoire enregistrée",
      no_skills: "Aucune compétence synchronisée",
      btn_copy: "Copier",
      btn_open: "Ouvrir",
      btn_change: "Changer Vault",
      form_title: "Titre de la Mémoire / Solution",
      form_title_ph: "Ex: Optimisation SQLite WAL",
      form_cat: "Catégorie",
      form_details: "Détails / Solution Technique",
      form_details_ph: "Écrivez les étapes ou explications techniques...",
      form_tags: "Tags (séparés par virgule)",
      form_tags_ph: "ex: sqlite, backend, performance",
      btn_save: "Enregistrer dans Obsidian",
      settings_mode_title: "Mode Natif Direct Actif",
      settings_mode_desc: "Synchronisation directe des fichiers Markdown locaux. Zéro configuration.",
      settings_vaults_detected: "Vaults détectés sur cette machine :",
      btn_select_another: "Choisir un autre dossier...",
      settings_reinstall_title: "Injection dans les Chats d'IA :",
      btn_reinstall: "Actualiser Skill et Règles",
      settings_reinstall_desc: "Vérifie que la skill est prête pour tous les chats.",
      language_label: "Langue :",
      toast_copied: "Chemin copié",
      toast_link_copied: "Lien copié",
      toast_synced: "Synchronisation terminée",
      toast_saved: "Mémoire enregistrée",
      toast_fill_required: "Veuillez remplir le titre et le contenu",
      settings_ai_title: "Comportement de l'IA dans les Chats :",
      settings_proactive_title: "Consulter le Vault au début des tâches",
      settings_proactive_desc: "L'IA vérifie les notes précédentes avant de chercher ou d'assumer des solutions.",
      settings_autosave_title: "Apprendre et Enregistrer Autonome",
      settings_autosave_desc: "Enregistre automatiquement les bugs résolus et décisions d'architecture.",
      btn_save_ai_settings: "Enregistrer et Appliquer à tous les Chats",
      toast_ai_settings_saved: "Paramètres d'IA appliqués à tous les chats"
    },
    de: {
      brand_title: "Obsidian for Antigravity",
      brand_subtitle: "Zweites Gehirn von Antigravity",
      online: "Online",
      offline: "Offline",
      memories: "Erinnerungen",
      skills: "Fähigkeiten",
      graph: "Graph",
      tab_panel: "Übersicht",
      tab_memories: "Erinnerungen",
      tab_skills: "Fähigkeiten",
      tab_create: "Erstellen",
      tab_settings: "Optionen",
      graph_title: "Wissensgraphen erkunden",
      graph_desc: "Öffnet Obsidian Graph View mit allen verknüpften Notizen.",
      btn_sync: "Tresor jetzt synchronisieren",
      btn_syncing: "Synchronisiere...",
      btn_open_hub: "00 Antigravity Hub öffnen",
      info_title: "Autonome Synchronisierung aktiv",
      info_desc: "Antigravity lernt aus Ihren Gesprächen und speichert Lösungen automatisch im Tresor.",
      search_memories: "Erinnerungen durchsuchen...",
      search_skills: "Fähigkeiten filtern...",
      filter_all: "Alle",
      filter_arch: "Architektur",
      filter_bugfix: "Fehlerbehebung",
      filter_knowledge: "Wissen",
      filter_general: "Allgemein",
      no_memories: "Noch keine Erinnerungen",
      no_skills: "Noch keine Fähigkeiten synchronisiert",
      btn_copy: "Kopieren",
      btn_open: "Öffnen",
      btn_change: "Tresor ändern",
      form_title: "Titel der Erinnerung / Lösung",
      form_title_ph: "Z.B.: SQLite WAL Optimierung",
      form_cat: "Kategorie",
      form_details: "Details / Technische Lösung",
      form_details_ph: "Schritte oder technische Erklärung eingeben...",
      form_tags: "Tags (Kommagetrennt)",
      form_tags_ph: "z.B.: sqlite, backend, leistung",
      btn_save: "In Obsidian speichern",
      settings_mode_title: "Direkter nativer Modus aktiv",
      settings_mode_desc: "Synchronisiert lokale Markdown-Dateien direkt. Keine API-Keys erforderlich.",
      settings_vaults_detected: "Erkannte Tresore:",
      btn_select_another: "Anderen Ordner auswählen...",
      settings_reinstall_title: "KI-Chat-Injektion:",
      btn_reinstall: "Skills und Regeln aktualisieren",
      settings_reinstall_desc: "Stellt sicher, dass die Skills für alle Chats bereit sind.",
      language_label: "Sprache:",
      toast_copied: "Pfad kopiert",
      toast_link_copied: "Link kopiert",
      toast_synced: "Synchronisierung abgeschlossen",
      toast_saved: "Erinnerung gespeichert",
      toast_fill_required: "Bitte Titel und Inhalt ausfüllen",
      settings_ai_title: "KI-Verhalten in Unterhaltungen:",
      settings_proactive_title: "Tresor bei Aufgabenbeginn abfragen",
      settings_proactive_desc: "Die KI prüft vorhandene Notizen, bevor sie recherchiert oder Annahmen trifft.",
      settings_autosave_title: "Automatisch lernen & speichern",
      settings_autosave_desc: "Speichert gelöste Fehler und Architektur-Entscheidungen ohne Nachfrage.",
      btn_save_ai_settings: "Speichern & auf alle Chats anwenden",
      toast_ai_settings_saved: "KI-Einstellungen für alle Chats übernommen"
    },
    zh: {
      brand_title: "Obsidian for Antigravity",
      brand_subtitle: "Antigravity 第二大脑",
      online: "在线",
      offline: "离线",
      memories: "记忆库",
      skills: "技能库",
      graph: "图谱",
      tab_panel: "仪表盘",
      tab_memories: "记忆库",
      tab_skills: "技能库",
      tab_create: "新建",
      tab_settings: "设置",
      graph_title: "探索知识图谱",
      graph_desc: "在 Obsidian 中打开互联的关系图谱视图。",
      btn_sync: "立即同步知识库",
      btn_syncing: "正在同步...",
      btn_open_hub: "打开 00 Antigravity Hub",
      info_title: "自主记忆同步已激活",
      info_desc: "Antigravity 会自主学习对话经验，自动将关键架构与解决方案沉淀至库中。",
      search_memories: "搜索记忆...",
      search_skills: "筛选技能...",
      filter_all: "全部",
      filter_arch: "架构",
      filter_bugfix: "修复",
      filter_knowledge: "知识",
      filter_general: "通用",
      no_memories: "暂无记录",
      no_skills: "暂无同步技能",
      btn_copy: "复制",
      btn_open: "打开",
      btn_change: "更改知识库",
      form_title: "记忆 / 方案标题",
      form_title_ph: "例如：SQLite WAL 优化及并发处理",
      form_cat: "分类",
      form_details: "详情 / 技术方案",
      form_details_ph: "输入具体实施步骤、配置或说明...",
      form_tags: "标签（逗号分隔）",
      form_tags_ph: "例如：sqlite, backend, performance",
      btn_save: "保存至 Obsidian 库",
      settings_mode_title: "原生直接同步模式",
      settings_mode_desc: "直接读写本地 Markdown 文件。零配置，无需任何 API 密钥。",
      settings_vaults_detected: "检测到的知识库：",
      btn_select_another: "选择其他文件夹...",
      settings_reinstall_title: "全局对话记忆注入：",
      btn_reinstall: "刷新全局技能与规则",
      settings_reinstall_desc: "确保所有对话均已接入该技能。",
      language_label: "语言 / Language:",
      toast_copied: "路径已复制至剪贴板",
      toast_link_copied: "双向链接已复制",
      toast_synced: "Obsidian 同步完成",
      toast_saved: "记忆已成功保存",
      toast_fill_required: "请填写标题和详细内容",
      settings_ai_title: "AI 对话行为偏好设置：",
      settings_proactive_title: "开始任务前主动查阅知识库",
      settings_proactive_desc: "在开始排查或猜测前，AI 会主动检查库中是否有先验记录与可用方案。",
      settings_autosave_title: "自主沉淀与自动记录",
      settings_autosave_desc: "自动保存复杂 Bug 解决方案与架构决策，无需逐次人工确认。",
      btn_save_ai_settings: "保存并应用于所有对话",
      toast_ai_settings_saved: "已将设置应用于全局所有 AI 对话"
    },
    ja: {
      brand_title: "Obsidian for Antigravity",
      brand_subtitle: "Antigravity 第2の脳",
      online: "オンライン",
      offline: "オフライン",
      memories: "記憶",
      skills: "スキル",
      graph: "グラフ",
      tab_panel: "パネル",
      tab_memories: "記憶",
      tab_skills: "スキル",
      tab_create: "新規作成",
      tab_settings: "設定",
      graph_title: "ナレッジグラフを探索",
      graph_desc: "Obsidianのグラフビューで相互リンクを開きます。",
      btn_sync: "保管庫を今すぐ同期",
      btn_syncing: "同期中...",
      btn_open_hub: "00 Antigravity Hub を開く",
      info_title: "自律的学習同期が有効",
      info_desc: "Antigravityは会話から自動的に学習し、保管庫に記録を保存します。",
      search_memories: "記憶を検索...",
      search_skills: "スキルを絞り込み...",
      filter_all: "すべて",
      filter_arch: "設計",
      filter_bugfix: "修正",
      filter_knowledge: "ナレッジ",
      filter_general: "一般",
      no_memories: "記録はまだありません",
      no_skills: "同期されたスキルはありません",
      btn_copy: "コピー",
      btn_open: "開く",
      btn_change: "保管庫を変更",
      form_title: "記憶 / 解決策のタイトル",
      form_title_ph: "例: SQLite WAL の最適化と並行性",
      form_cat: "カテゴリー",
      form_details: "詳細 / 技術的解決策",
      form_details_ph: "手順、コマンド、解説を入力...",
      form_tags: "タグ（カンマ区切り）",
      form_tags_ph: "例: sqlite, backend, performance",
      btn_save: "Obsidian に保存",
      settings_mode_title: "ネイティブ直接同期モード",
      settings_mode_desc: "ローカルのMarkdownファイルを直接同期します。設定不要。",
      settings_vaults_detected: "検出された保管庫:",
      btn_select_another: "別のフォルダを選択...",
      settings_reinstall_title: "AIチャットへの自動注入:",
      btn_reinstall: "グローバルスキルとルールを更新",
      settings_reinstall_desc: "すべてのチャットで利用可能か確認します。",
      language_label: "言語 / Language:",
      toast_copied: "パスをコピーしました",
      toast_link_copied: "リンクをコピーしました",
      toast_synced: "同期が完了しました",
      toast_saved: "記憶を保存しました",
      toast_fill_required: "タイトルと詳細を入力してください",
      settings_ai_title: "AI会話での自律動作設定:",
      settings_proactive_title: "タスク開始時に保管庫を事前確認",
      settings_proactive_desc: "調査や推測を始める前に、過去のノートや教訓を自動的に確認します。",
      settings_autosave_title: "自動学習と自動保存",
      settings_autosave_desc: "解決したバグや設計判断を、確認なしで自動的に保管庫へ保存します。",
      btn_save_ai_settings: "保存してすべてのチャットに適用",
      toast_ai_settings_saved: "AI設定を全チャットに適用しました"
    }
  };

  // State
  let currentLang = localStorage.getItem('obsidian_bridge_lang') || 'es';
  if (!I18N[currentLang]) currentLang = 'es';

  function applyLanguage(lang) {
    if (!I18N[lang]) return;
    currentLang = lang;
    localStorage.setItem('obsidian_bridge_lang', lang);
    const dict = I18N[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    document.querySelectorAll('.lang-select').forEach(sel => {
      sel.value = lang;
    });
  }

  // Navigation Tabs
  const tabPills = document.querySelectorAll('.tab-pill');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const statBoxes = document.querySelectorAll('.stat-box');
  const toast = document.getElementById('toast');

  function switchTab(targetTab) {
    tabPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-tab') === targetTab));
    tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === `pane-${targetTab}`));
    statBoxes.forEach(sb => sb.classList.toggle('active', sb.getAttribute('data-tab') === targetTab));
  }

  tabPills.forEach(pill => {
    pill.addEventListener('click', () => {
      switchTab(pill.getAttribute('data-tab'));
    });
  });

  statBoxes.forEach(sb => {
    sb.addEventListener('click', () => {
      const target = sb.getAttribute('data-tab');
      if (target) switchTab(target);
    });
  });

  // Language selectors
  document.querySelectorAll('.lang-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      applyLanguage(e.target.value);
    });
  });

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 3500);
  }

  // Action Buttons
  const btnSync = document.getElementById('btn-sync');
  if (btnSync) {
    btnSync.addEventListener('click', () => {
      btnSync.disabled = true;
      const dict = I18N[currentLang] || I18N.es;
      btnSync.querySelector('.btn-label').textContent = dict.btn_syncing;
      vscode.postMessage({ type: 'syncNow' });
    });
  }

  const btnOpenHub = document.getElementById('btn-open-hub');
  if (btnOpenHub) {
    btnOpenHub.addEventListener('click', () => {
      vscode.postMessage({ type: 'openHub' });
    });
  }

  const btnOpenGraph = document.getElementById('card-open-graph');
  if (btnOpenGraph) {
    btnOpenGraph.addEventListener('click', () => {
      vscode.postMessage({ type: 'openHub' });
    });
  }

  const btnSelectVault = document.getElementById('btn-change-vault');
  if (btnSelectVault) {
    btnSelectVault.addEventListener('click', () => {
      vscode.postMessage({ type: 'selectVault' });
    });
  }

  const btnSelectAnother = document.getElementById('btn-select-another');
  if (btnSelectAnother) {
    btnSelectAnother.addEventListener('click', () => {
      vscode.postMessage({ type: 'selectVault' });
    });
  }

  const btnReinstall = document.getElementById('btn-reinstall');
  if (btnReinstall) {
    btnReinstall.addEventListener('click', () => {
      vscode.postMessage({ type: 'reinstallSkill' });
    });
  }

  const btnSaveAi = document.getElementById('btn-save-ai-settings');
  if (btnSaveAi) {
    btnSaveAi.addEventListener('click', () => {
      const toggleProactive = document.getElementById('toggle-proactive');
      const toggleAutosave = document.getElementById('toggle-autosave');
      const proactiveLookup = toggleProactive ? toggleProactive.checked : true;
      const autoSave = toggleAutosave ? toggleAutosave.checked : true;

      vscode.postMessage({
        type: 'updateAiConfig',
        proactiveLookup,
        autoSave,
      });

      const dict = I18N[currentLang] || I18N.es;
      showToast(dict.toast_ai_settings_saved || 'Configuración guardada para todas las conversaciones');
    });
  }

  const btnCopyPath = document.getElementById('btn-copy-path');
  if (btnCopyPath) {
    btnCopyPath.addEventListener('click', () => {
      const pathText = btnCopyPath.getAttribute('data-path');
      if (pathText) {
        navigator.clipboard.writeText(pathText);
        const dict = I18N[currentLang] || I18N.es;
        showToast(dict.toast_copied);
      }
    });
  }

  // Filter chips in Memorias
  let activeFilter = 'all';
  const filterChips = document.querySelectorAll('.chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-category') || 'all';
      filterMemories();
    });
  });

  const searchMemories = document.getElementById('search-memories');
  if (searchMemories) {
    searchMemories.addEventListener('input', () => {
      filterMemories();
    });
  }

  function filterMemories() {
    const q = (searchMemories ? searchMemories.value : '').toLowerCase();
    document.querySelectorAll('#memories-list .note-item').forEach(card => {
      const title = (card.getAttribute('data-title') || '').toLowerCase();
      const cat = (card.getAttribute('data-cat') || '').toLowerCase();
      const matchesSearch = title.includes(q);
      const matchesCat = activeFilter === 'all' || cat === activeFilter.toLowerCase();
      card.style.display = (matchesSearch && matchesCat) ? 'block' : 'none';
    });
  }

  // Search Skills
  const searchSkills = document.getElementById('search-skills');
  if (searchSkills) {
    searchSkills.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#skills-list .note-item').forEach(card => {
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        card.style.display = title.includes(q) ? 'block' : 'none';
      });
    });
  }

  // Delegate for Open in Obsidian & Copy Wikilink
  document.addEventListener('click', (e) => {
    const openBtn = e.target.closest('.btn-open-note');
    if (openBtn) {
      const notePath = openBtn.getAttribute('data-note');
      if (notePath) {
        vscode.postMessage({ type: 'openNote', path: notePath });
      }
      return;
    }

    const copyBtn = e.target.closest('.btn-copy-wikilink');
    if (copyBtn) {
      const noteTitle = copyBtn.getAttribute('data-title');
      if (noteTitle) {
        navigator.clipboard.writeText(`[[${noteTitle}]]`);
        const dict = I18N[currentLang] || I18N.es;
        showToast(`${dict.toast_link_copied}: [[${noteTitle}]]`);
      }
      return;
    }
  });

  // Save Memory Form
  const memoryForm = document.getElementById('memory-form');
  if (memoryForm) {
    memoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('mem-title').value.trim();
      const content = document.getElementById('mem-content').value.trim();
      const tags = document.getElementById('mem-tags').value.split(',').map(t => t.trim()).filter(Boolean);
      const category = document.getElementById('mem-category').value;
      const dict = I18N[currentLang] || I18N.es;

      if (!title || !content) {
        showToast(dict.toast_fill_required);
        return;
      }

      vscode.postMessage({
        type: 'saveMemory',
        data: { title, content, tags, category }
      });

      document.getElementById('mem-title').value = '';
      document.getElementById('mem-content').value = '';
      document.getElementById('mem-tags').value = '';
      switchTab('memoria');
    });
  }

  // Listen for messages from extension
  window.addEventListener('message', (event) => {
    const msg = event.data;
    const dict = I18N[currentLang] || I18N.es;
    switch (msg.type) {
      case 'switchTab': {
        if (msg.tab) switchTab(msg.tab);
        break;
      }
      case 'syncComplete': {
        if (btnSync) {
          btnSync.disabled = false;
          btnSync.querySelector('.btn-label').textContent = dict.btn_sync;
        }
        showToast(dict.toast_synced);
        break;
      }
      case 'memorySaved': {
        showToast(`${dict.toast_saved}: "${msg.title}"`);
        break;
      }
      case 'toast': {
        showToast(msg.text);
        break;
      }
    }
  });

  // Apply initial language
  applyLanguage(currentLang);
})();
