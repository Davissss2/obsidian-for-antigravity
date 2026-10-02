# Changelog

Todos los cambios notables de la extensión **Obsidian for Antigravity** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] - 2026-10-02

### ✨ Novedades Principales

#### 🧠 Memoria Autónoma y Aprendizaje Continuo para Antigravity
- **Inyección Automática en Todos los Chats**: La extensión registra la regla global en `~/.gemini/config/rules/obsidian-brain.md` y la skill `antigravity-obsidian`. Todos los modelos en cualquier chat de Antigravity reconocen Obsidian como su Segundo Cerebro.
- **Recuperación Proactiva de Información**: La IA comprueba notas y lecciones anteriores en Obsidian antes de investigar o responder desde cero en proyectos conocidos.
- **Grabación Autónoma**: La IA sintetiza y almacena de forma autónoma soluciones a bugs complejos, decisiones de arquitectura y trucos técnicos sin requerir que el usuario se lo pida explícitamente.

#### 🔍 Detección Automática de Bóvedas (Zero-Configuration)
- Detección automática en Windows (`%APPDATA%\obsidian\obsidian.json`), macOS y Linux.
- Localiza la bóveda actualmente abierta y conecta el sistema de archivos en menos de 5 ms.
- No requiere claves de API, cuentas externas ni tokens de terceros.

#### ⚡ Sincronización Bidireccional de Skills
- Refleja todas las skills globales (`~/.gemini/config/skills/`) y de proyecto (`.agents/skills/`) en `Antigravity/Skills/` con YAML frontmatter y formato Obsidian.
- Las notas de skills creadas o editadas en Obsidian se sincronizan automáticamente de vuelta hacia Antigravity.

#### 🗺️ 00 Antigravity Hub & Vista Gráfica (Graph View)
- Generación dinámica del mapa de contenido central `00 Antigravity Hub.md`.
- Conexión mediante wikilinks `[[...]]` de todas las memorias, skills y proyectos.
- Enlaces listos para iluminar la Vista Gráfica interactiva de Obsidian.

#### 🖥️ Panel Visual Rediseñado en Antigravity IDE
- Pestañas fluidas: **Panel**, **Memorias**, **Skills**, **➕ Crear** y **Ajustes**.
- Filtros por categoría (`Todos`, `Arquitectura`, `Bugfix`, `Knowledge`, `General`).
- Botón rápido `🔗 Copiar` para copiar el wikilink `[[...]]` al portapapeles.
- Deep-links instantáneos a la app de escritorio de Obsidian con el protocolo nativo `obsidian://open`.
- Barra de estado con indicador de conexión y acceso directo.
- Tarjeta de bóveda limpia con botón para copiar la ruta local sin saltos de línea feos.

#### 📦 Empaquetado y Distribución
- Empaquetado oficial en formato VSIX: `obsidian-for-antigravity-1.0.0.vsix`.
- Icono y branding oficial con estética cibernética glassmorphism.
