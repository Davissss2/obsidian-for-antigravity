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
      sessions: "Sesiones",
      projects: "Proyectos",
      graph: "Grafo",
      tab_panel: "Panel",
      tab_memories: "Memorias",
      tab_skills: "Skills",
      tab_sessions: "Sesiones",
      tab_projects: "Proyectos",
      tab_graph: "Grafo",
      tab_create: "Crear",
      tab_settings: "Ajustes",
      graph_title: "Explorar Grafo de Conocimiento",
      graph_desc: "Abre Obsidian Graph View con todas tus notas interconectadas.",
      btn_sync: "Sincronizar Bóveda",
      btn_syncing: "Sincronizando...",
      btn_open_hub: "Abrir 00 Antigravity Hub",
      btn_scan_project: "Escanear Proyecto",
      btn_save_session: "Guardar Sesión",
      btn_open_index: "Ver Índice",
      search_sessions: "Buscar en sesiones...",
      search_projects: "Buscar proyectos...",
      search_graph: "Buscar nodo en el grafo...",
      no_sessions: "Sin sesiones registradas aún",
      no_projects: "Sin proyectos registrados aún",
      settings_backup_title: "Copia de Seguridad y Migración Cifrada:",
      settings_backup_desc: "Exporta o importa todas tus notas cifradas con AES-256-GCM y PBKDF2 bajo tu contraseña.",
      btn_export_vault: "Exportar Cifrado",
      btn_import_vault: "Importar Respaldo",
      graph_instructions: "Arrastra nodos o el fondo | Rueda para zoom | Clic en un nodo para abrir la nota",
      btn_scan_project: "Escanear Proyecto",
      btn_save_session: "Guardar Sesión",
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
      settings_proactive_title: "Triage Inteligente de Bajo Contexto",
      settings_proactive_desc: "La IA usa triage ultra-compacto (<100 tokens) para distinguir Skills vs Memoria sin quemar contexto.",
      settings_autosave_title: "Aprender y Guardar Automáticamente",
      settings_autosave_desc: "Guarda lecciones de bugs resueltos y decisiones de arquitectura en el Vault y Knowledge Items.",
      btn_save_ai_settings: "Guardar y Aplicar a Todos los Chats",
      toast_ai_settings_saved: "Preferencias de IA actualizadas para todos los chats",
      settings_danger_title: "Zona de Peligro / Empezar de Cero",
      settings_danger_desc: "Borra todas las memorias acumuladas, limpia duplicados y resetea el contexto de la IA para empezar completamente limpio desde cero con Obsidian.",
      btn_reset_data: "Borrar Todo y Empezar de Cero",
      toast_reset_complete: "Memoria reiniciada correctamente. Empezando de cero.",
      soul_title: "Hermes Core — Alma & Perfil",
      soul_status_active: "Activo",
      soul_label: "Soul de Antigravity:",
      soul_desc: "Ingeniero de software senior autónomo, resolutivo, sin rodeos y CERO emojis.",
      profile_label_prefix: "Perfil de Usuario",
      profile_desc: "Español/Inglés directo según entorno, filtro anti-ruido estricto y rigor multiplataforma.",
      soul_view_soul: "Ver Soul",
      soul_view_profile: "Ver Perfil",
      settings_user_name_label: "Nombre de Usuario (Perfil Hermes):",
      settings_user_name_ph: "Davissss2 o tu alias",
      toast_lang_updated: "Idioma y reglas de IA actualizadas"
    },
    en: {
      brand_title: "Obsidian for Antigravity",
      brand_subtitle: "Antigravity Second Brain",
      online: "Online",
      offline: "Offline",
      memories: "Memories",
      skills: "Skills",
      sessions: "Sessions",
      projects: "Projects",
      graph: "Graph",
      tab_panel: "Dashboard",
      tab_memories: "Memories",
      tab_skills: "Skills",
      tab_sessions: "Sessions",
      tab_projects: "Projects",
      tab_graph: "Graph",
      tab_create: "Create",
      tab_settings: "Settings",
      graph_title: "Explore Knowledge Graph",
      graph_desc: "Opens your Obsidian Graph View with all interconnected notes.",
      btn_sync: "Sync Vault Now",
      btn_syncing: "Syncing...",
      btn_open_hub: "Open 00 Antigravity Hub",
      btn_scan_project: "Scan Project",
      btn_save_session: "Save Session",
      btn_open_index: "View Index",
      search_sessions: "Search sessions...",
      search_projects: "Search projects...",
      search_graph: "Search graph nodes...",
      no_sessions: "No sessions recorded yet",
      no_projects: "No projects recorded yet",
      settings_backup_title: "Encrypted Backup & Migration:",
      settings_backup_desc: "Export or import all notes encrypted with AES-256-GCM and PBKDF2 under your password.",
      btn_export_vault: "Export Encrypted",
      btn_import_vault: "Import Backup",
      graph_instructions: "Drag nodes or pan | Scroll to zoom | Click node to open note",
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
      settings_proactive_title: "Low-Context Smart Triage",
      settings_proactive_desc: "AI uses ultra-compact triage (<100 tokens) to distinguish Skills vs Memory without burning context.",
      settings_autosave_title: "Autonomously Learn & Save",
      settings_autosave_desc: "Automatically records bugfixes and architecture lessons into Vault and Knowledge Items.",
      btn_save_ai_settings: "Save & Apply to All Chats",
      toast_ai_settings_saved: "AI settings applied to all chats",
      settings_danger_title: "Danger Zone / Start From Scratch",
      settings_danger_desc: "Wipes all accumulated memories, cleans duplicates and resets AI context to start completely fresh with Obsidian.",
      btn_reset_data: "Wipe All Data & Start Fresh",
      toast_reset_complete: "Memory wiped successfully. Starting from scratch.",
      soul_title: "Hermes Core — Soul & Profile",
      soul_status_active: "Active",
      soul_label: "Antigravity Soul:",
      soul_desc: "Senior autonomous software engineer: decisive, no fluff, and ZERO emojis.",
      profile_label_prefix: "User Profile",
      profile_desc: "Direct English/Spanish based on environment, strict anti-noise filter, and cross-platform rigor.",
      soul_view_soul: "View Soul",
      soul_view_profile: "View Profile",
      settings_user_name_label: "User Name (Hermes Profile):",
      settings_user_name_ph: "Davissss2 or your alias",
      toast_lang_updated: "Language and AI rules updated"
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
      toast_ai_settings_saved: "Paramètres d'IA appliqués à tous les chats",
      soul_title: "Hermes Core — Âme & Profil",
      soul_status_active: "Actif",
      soul_label: "Âme d'Antigravity :",
      soul_desc: "Ingénieur logiciel senior autonome, résolu, direct et ZÉRO emoji.",
      profile_label_prefix: "Profil Utilisateur",
      profile_desc: "Anglais/Français/Espagnol direct selon l'environnement, filtre anti-bruit strict.",
      soul_view_soul: "Voir l'Âme",
      soul_view_profile: "Voir le Profil",
      settings_user_name_label: "Nom d'utilisateur (Profil Hermes) :",
      settings_user_name_ph: "Davissss2 ou votre pseudo",
      toast_lang_updated: "Langue et règles IA mises à jour"
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
      toast_ai_settings_saved: "KI-Einstellungen für alle Chats übernommen",
      soul_title: "Hermes Core — Seele & Profil",
      soul_status_active: "Aktiv",
      soul_label: "Antigravity Seele:",
      soul_desc: "Autonomer Senior-Software-Ingenieur: zielgerichtet, direkt und NULL Emojis.",
      profile_label_prefix: "Benutzerprofil",
      profile_desc: "Direktes Englisch/Deutsch/Spanisch je nach Umgebung, strenger Anti-Rausch-Filter.",
      soul_view_soul: "Seele anzeigen",
      soul_view_profile: "Profil anzeigen",
      settings_user_name_label: "Benutzername (Hermes-Profil):",
      settings_user_name_ph: "Davissss2 oder Ihr Alias",
      toast_lang_updated: "Sprache und KI-Regeln aktualisiert"
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
      toast_ai_settings_saved: "已将设置应用于全局所有 AI 对话",
      soul_title: "Hermes Core — 核心与画像",
      soul_status_active: "活跃",
      soul_label: "Antigravity 核心:",
      soul_desc: "自主高级软件工程师：务实高效、零废话、零表情符号。",
      profile_label_prefix: "用户画像",
      profile_desc: "根据环境自动适配语言，严格抗噪过滤，跨平台兼容。",
      soul_view_soul: "查看核心",
      soul_view_profile: "查看画像",
      settings_user_name_label: "用户名（Hermes 画像）:",
      settings_user_name_ph: "Davissss2 或您的别名",
      toast_lang_updated: "语言和 AI 规则已更新"
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
      toast_ai_settings_saved: "AI設定を全チャットに適用しました",
      soul_title: "Hermes Core — コアとプロファイル",
      soul_status_active: "アクティブ",
      soul_label: "Antigravity コア:",
      soul_desc: "自律的なシニアソフトウェアエンジニア：決断力、無駄なし、絵文字ゼロ。",
      profile_label_prefix: "ユーザープロファイル",
      profile_desc: "環境に応じた直接的な言語対応、厳格なノイズ除去フィルター、クロスプラットフォーム。",
      soul_view_soul: "コアを表示",
      soul_view_profile: "プロファイルを表示",
      settings_user_name_label: "ユーザー名（Hermes プロファイル）:",
      settings_user_name_ph: "Davissss2 またはエイリアス",
      toast_lang_updated: "言語とAIルールが更新されました"
    }
  };

  // State
  const htmlLang = document.documentElement.getAttribute('lang') || 'es';
  let currentLang = localStorage.getItem('obsidian_bridge_lang') || htmlLang;
  if (!I18N[currentLang]) currentLang = 'es';

  function applyLanguage(lang) {
    const effective = (lang === 'auto')
      ? (document.documentElement.getAttribute('lang') || 'en')
      : lang;
    const dict = I18N[effective] || I18N.es;
    currentLang = effective;
    localStorage.setItem('obsidian_bridge_lang', lang);

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
    if (targetTab === 'grafo') {
      setTimeout(() => initOrResizeGraph(), 60);
    }
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
      const selected = e.target.value;
      applyLanguage(selected);
      vscode.postMessage({ type: 'setLanguage', language: selected });
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
      switchTab('grafo');
    });
  }

  const statSessions = document.getElementById('stat-sessions');
  if (statSessions) {
    statSessions.addEventListener('click', () => {
      switchTab('sesiones');
    });
  }

  const statProjects = document.getElementById('stat-projects');
  if (statProjects) {
    statProjects.addEventListener('click', () => {
      switchTab('proyectos');
    });
  }

  const btnScanProject = document.getElementById('btn-scan-project');
  if (btnScanProject) {
    btnScanProject.addEventListener('click', () => {
      vscode.postMessage({ type: 'scanProject' });
    });
  }

  const btnScanProjectTab = document.getElementById('btn-scan-project-tab');
  if (btnScanProjectTab) {
    btnScanProjectTab.addEventListener('click', () => {
      vscode.postMessage({ type: 'scanProject' });
    });
  }

  const btnSaveSession = document.getElementById('btn-save-session');
  if (btnSaveSession) {
    btnSaveSession.addEventListener('click', () => {
      vscode.postMessage({ type: 'saveSession' });
    });
  }

  const btnNewSessionTab = document.getElementById('btn-new-session-tab');
  if (btnNewSessionTab) {
    btnNewSessionTab.addEventListener('click', () => {
      vscode.postMessage({ type: 'saveSession' });
    });
  }

  const btnExportVault = document.getElementById('btn-export-vault');
  if (btnExportVault) {
    btnExportVault.addEventListener('click', () => {
      vscode.postMessage({ type: 'exportVault' });
    });
  }

  const btnImportVault = document.getElementById('btn-import-vault');
  if (btnImportVault) {
    btnImportVault.addEventListener('click', () => {
      vscode.postMessage({ type: 'importVault' });
    });
  }

  const searchSessions = document.getElementById('search-sessions');
  if (searchSessions) {
    searchSessions.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#sessions-list .note-item').forEach(card => {
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        const project = (card.getAttribute('data-project') || '').toLowerCase();
        card.style.display = (title.includes(q) || project.includes(q)) ? 'block' : 'none';
      });
    });
  }

  const searchProjects = document.getElementById('search-projects');
  if (searchProjects) {
    searchProjects.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('#projects-list .note-item').forEach(card => {
        const title = (card.getAttribute('data-title') || '').toLowerCase();
        const stack = (card.getAttribute('data-stack') || '').toLowerCase();
        card.style.display = (title.includes(q) || stack.includes(q)) ? 'block' : 'none';
      });
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

  const btnInstallObsidian = document.getElementById('btn-install-obsidian');
  if (btnInstallObsidian) {
    btnInstallObsidian.addEventListener('click', () => {
      vscode.postMessage({ type: 'openExternal', url: 'https://obsidian.md/download' });
    });
  }

  const btnSelectCard = document.getElementById('btn-select-vault-card');
  if (btnSelectCard) {
    btnSelectCard.addEventListener('click', () => {
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
      const userNameInput = document.getElementById('setting-user-name');
      const languageSelect = document.getElementById('setting-language');
      const proactiveLookup = toggleProactive ? toggleProactive.checked : true;
      const autoSave = toggleAutosave ? toggleAutosave.checked : true;
      const userName = userNameInput ? userNameInput.value.trim() : '';
      const language = languageSelect ? languageSelect.value : currentLang;

      vscode.postMessage({
        type: 'updateAiConfig',
        data: {
          proactiveLookup,
          autoSave,
          userName,
          language,
        },
        proactiveLookup,
        autoSave,
        userName,
        language,
      });

      const dict = I18N[currentLang] || I18N.es;
      showToast(dict.toast_ai_settings_saved || 'Configuración guardada para todas las conversaciones');
    });
  }

  const btnResetData = document.getElementById('btn-reset-data');
  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      vscode.postMessage({ type: 'resetAllData' });
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
      case 'resetComplete': {
        showToast(dict.toast_reset_complete || 'Memoria reiniciada correctamente.');
        switchTab('panel');
        break;
      }
      case 'toast': {
        showToast(msg.text);
        break;
      }
    }
  });

  // Force-Directed Graph View
  let graphData = window.INITIAL_GRAPH_DATA || { nodes: [], links: [] };
  let graphCanvas = null;
  let graphCtx = null;
  let graphAnimationId = null;
  let isGraphSimulating = false;
  let graphNodes = [];
  let graphLinks = [];
  let graphTransform = { x: 0, y: 0, k: 1 };
  let isDraggingGraph = false;
  let dragNode = null;
  let mouseStartPos = { x: 0, y: 0 };
  let hoveredNode = null;
  let graphFilterQuery = '';
  let graphEventsAttached = false;

  const GROUP_COLORS = {
    hub: '#8b5cf6',
    soul: '#ec4899',
    skill: '#3b82f6',
    memory: '#10b981',
    project: '#f59e0b',
    session: '#06b6d4',
    index: '#94a3b8',
    default: '#a855f7'
  };

  function initOrResizeGraph() {
    graphCanvas = document.getElementById('graph-canvas');
    if (!graphCanvas) return;
    const container = document.getElementById('graph-container');
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;
    const dpr = window.devicePixelRatio || 1;
    graphCanvas.width = width * dpr;
    graphCanvas.height = height * dpr;
    graphCtx = graphCanvas.getContext('2d');
    graphCtx.scale(dpr, dpr);

    if (!graphEventsAttached) {
      setupGraphEvents();
      graphEventsAttached = true;
    }

    if (graphNodes.length === 0 && graphData && graphData.nodes && graphData.nodes.length > 0) {
      buildGraphSimulation(width, height);
    } else {
      drawGraph();
    }
  }

  function buildGraphSimulation(width, height) {
    const cx = width / 2;
    const cy = height / 2;
    graphTransform = { x: cx, y: cy, k: 0.95 };

    const nodeCount = graphData.nodes.length;
    graphNodes = graphData.nodes.map((n, i) => {
      const angle = (i / Math.max(1, nodeCount)) * 2 * Math.PI;
      const radius = 50 + Math.random() * 70;
      return {
        id: n.id,
        label: n.label || n.id,
        group: n.group || 'default',
        relPath: n.relPath || `Antigravity/${n.id}.md`,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        r: n.group === 'hub' ? 12 : (n.group === 'project' ? 9 : 7)
      };
    });

    const nodeMap = new Map();
    graphNodes.forEach(n => nodeMap.set(n.id.toLowerCase(), n));

    graphLinks = [];
    if (graphData.links) {
      for (const l of graphData.links) {
        const s = nodeMap.get((l.source || '').toLowerCase());
        const t = nodeMap.get((l.target || '').toLowerCase());
        if (s && t && s !== t) {
          graphLinks.push({ source: s, target: t });
        }
      }
    }

    startGraphSimulation();
  }

  function startGraphSimulation() {
    if (isGraphSimulating) return;
    isGraphSimulating = true;
    let ticks = 0;
    const maxTicks = 180;

    function step() {
      // Repulsion between nodes
      const repulsion = 480;
      for (let i = 0; i < graphNodes.length; i++) {
        const na = graphNodes[i];
        for (let j = i + 1; j < graphNodes.length; j++) {
          const nb = graphNodes[j];
          const dx = nb.x - na.x;
          const dy = nb.y - na.y;
          const distSq = dx * dx + dy * dy + 1;
          const dist = Math.sqrt(distSq);
          if (dist < 200) {
            const f = repulsion / distSq;
            const fx = (dx / dist) * f;
            const fy = (dy / dist) * f;
            if (na !== dragNode) { na.vx -= fx; na.vy -= fy; }
            if (nb !== dragNode) { nb.vx += fx; nb.vy += fy; }
          }
        }
      }

      // Spring force along links
      const restLen = 65;
      const springK = 0.045;
      for (const link of graphLinks) {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const diff = dist - restLen;
        const f = diff * springK;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        if (link.source !== dragNode) { link.source.vx += fx; link.source.vy += fy; }
        if (link.target !== dragNode) { link.target.vx -= fx; link.target.vy -= fy; }
      }

      // Center gravity & damping
      const gravity = 0.025;
      const damping = 0.82;
      for (const n of graphNodes) {
        if (n === dragNode) continue;
        n.vx -= n.x * gravity;
        n.vy -= n.y * gravity;
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      }

      drawGraph();
      ticks++;
      if (ticks < maxTicks || dragNode) {
        graphAnimationId = requestAnimationFrame(step);
      } else {
        isGraphSimulating = false;
      }
    }

    graphAnimationId = requestAnimationFrame(step);
  }

  function drawGraph() {
    if (!graphCtx || !graphCanvas) return;
    const container = document.getElementById('graph-container');
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    graphCtx.save();
    graphCtx.clearRect(0, 0, width, height);

    // Subtle grid dots background
    graphCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    const gridSize = 24 * graphTransform.k;
    const ox = ((graphTransform.x % gridSize) + gridSize) % gridSize;
    const oy = ((graphTransform.y % gridSize) + gridSize) % gridSize;
    for (let x = ox; x < width; x += gridSize) {
      for (let y = oy; y < height; y += gridSize) {
        graphCtx.fillRect(x, y, 1.5, 1.5);
      }
    }

    graphCtx.translate(graphTransform.x, graphTransform.y);
    graphCtx.scale(graphTransform.k, graphTransform.k);

    const q = graphFilterQuery.toLowerCase().trim();

    // Draw links
    for (const link of graphLinks) {
      const isHighlighted = q && (link.source.label.toLowerCase().includes(q) || link.target.label.toLowerCase().includes(q));
      graphCtx.beginPath();
      graphCtx.moveTo(link.source.x, link.source.y);
      graphCtx.lineTo(link.target.x, link.target.y);
      graphCtx.strokeStyle = isHighlighted ? 'rgba(139, 92, 246, 0.7)' : 'rgba(255, 255, 255, 0.12)';
      graphCtx.lineWidth = isHighlighted ? 1.8 : 1;
      graphCtx.stroke();
    }

    // Draw nodes
    for (const node of graphNodes) {
      const isMatch = !q || node.label.toLowerCase().includes(q);
      const isHovered = (hoveredNode === node);
      const color = GROUP_COLORS[node.group] || GROUP_COLORS.default;

      // Glow for hovered or query match
      if (isHovered || (q && isMatch)) {
        graphCtx.beginPath();
        graphCtx.arc(node.x, node.y, node.r + 5, 0, Math.PI * 2);
        graphCtx.fillStyle = 'rgba(139, 92, 246, 0.25)';
        graphCtx.fill();
      }

      // Node body
      graphCtx.beginPath();
      graphCtx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      graphCtx.fillStyle = isMatch ? color : 'rgba(100, 116, 139, 0.35)';
      graphCtx.fill();
      graphCtx.strokeStyle = isHovered ? '#ffffff' : 'rgba(0, 0, 0, 0.35)';
      graphCtx.lineWidth = isHovered ? 2 : 1;
      graphCtx.stroke();

      // Node label
      if (graphTransform.k > 0.65 || isHovered || isMatch) {
        graphCtx.font = (isHovered ? 'bold ' : '') + '9.5px -apple-system, BlinkMacSystemFont, sans-serif';
        graphCtx.fillStyle = isMatch ? (isHovered ? '#ffffff' : '#e2e8f0') : 'rgba(148, 163, 184, 0.3)';
        graphCtx.textAlign = 'center';
        graphCtx.textBaseline = 'top';
        const displayLabel = node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label;
        graphCtx.fillText(displayLabel, node.x, node.y + node.r + 3);
      }
    }

    graphCtx.restore();
  }

  function setupGraphEvents() {
    const canvas = document.getElementById('graph-canvas');
    const tooltip = document.getElementById('graph-tooltip');
    if (!canvas) return;

    let dragMoved = false;

    function getCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const x = (mx - graphTransform.x) / graphTransform.k;
      const y = (my - graphTransform.y) / graphTransform.k;
      return { mx, my, x, y };
    }

    function findNodeAt(x, y) {
      for (let i = graphNodes.length - 1; i >= 0; i--) {
        const n = graphNodes[i];
        const dx = n.x - x;
        const dy = n.y - y;
        if (dx * dx + dy * dy <= (n.r + 4) * (n.r + 4)) {
          return n;
        }
      }
      return null;
    }

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const { mx, my } = getCanvasCoords(e);
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newK = Math.max(0.2, Math.min(3.5, graphTransform.k * zoomFactor));
      graphTransform.x = mx - (mx - graphTransform.x) * (newK / graphTransform.k);
      graphTransform.y = my - (my - graphTransform.y) * (newK / graphTransform.k);
      graphTransform.k = newK;
      drawGraph();
    }, { passive: false });

    canvas.addEventListener('mousedown', (e) => {
      const { mx, my, x, y } = getCanvasCoords(e);
      dragMoved = false;
      mouseStartPos = { x: mx, y: my };
      const hit = findNodeAt(x, y);
      if (hit) {
        dragNode = hit;
      } else {
        isDraggingGraph = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!canvas) return;
      const { mx, my, x, y } = getCanvasCoords(e);

      if (dragNode) {
        dragMoved = true;
        dragNode.x = x;
        dragNode.y = y;
        dragNode.vx = 0;
        dragNode.vy = 0;
        startGraphSimulation();
        return;
      }

      if (isDraggingGraph) {
        dragMoved = true;
        graphTransform.x += (mx - mouseStartPos.x);
        graphTransform.y += (my - mouseStartPos.y);
        mouseStartPos = { x: mx, y: my };
        drawGraph();
        return;
      }

      const hovered = findNodeAt(x, y);
      if (hovered !== hoveredNode) {
        hoveredNode = hovered;
        drawGraph();
      }

      if (hovered && tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${mx + 12}px`;
        tooltip.style.top = `${my + 12}px`;
        const connCount = graphLinks.filter(l => l.source === hovered || l.target === hovered).length;
        tooltip.innerHTML = `<strong>${hovered.label}</strong><br><span style="color:#a855f7;">${hovered.group}</span> · ${connCount} enlaces<br><span style="font-size:9.5px;color:#94a3b8;">Clic para abrir nota</span>`;
      } else if (tooltip) {
        tooltip.style.display = 'none';
      }
    });

    window.addEventListener('mouseup', () => {
      if (dragNode && !dragMoved) {
        vscode.postMessage({ type: 'openNote', note: dragNode.relPath || dragNode.id, path: dragNode.relPath });
      }
      dragNode = null;
      isDraggingGraph = false;
    });

    const searchGraph = document.getElementById('search-graph-nodes');
    if (searchGraph) {
      searchGraph.addEventListener('input', (e) => {
        graphFilterQuery = e.target.value;
        drawGraph();
      });
    }

    const btnResetGraph = document.getElementById('btn-reset-graph');
    if (btnResetGraph) {
      btnResetGraph.addEventListener('click', () => {
        const container = document.getElementById('graph-container');
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 300;
        buildGraphSimulation(width, height);
      });
    }
  }

  // Apply initial language
  applyLanguage(currentLang);
})();
