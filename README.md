<p align="center">
  <img src="https://raw.githubusercontent.com/Davissss2/obsidian-for-antigravity/main/logo.png" width="160" alt="Obsidian for Antigravity Logo" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);" />
</p>

<h1 align="center">Obsidian for Antigravity</h1>

<p align="center">
  <strong>Segundo Cerebro Tecnico Autonomo y Memoria Persistente de Bajo Contexto para Antigravity AI</strong><br>
  <em>Conecta tu boveda local de Obsidian con todos los chats de Antigravity mediante bucle cerrado Hermes, triage de bajo contexto (<80 tokens), calibracion de identidad personalizada y grafo interactivo continuo.</em>
</p>

<p align="center">
  <a href="https://github.com/Davissss2/obsidian-for-antigravity"><img src="https://img.shields.io/badge/version-1.8.3-8b5cf6.svg?style=flat-square" alt="Version 1.8.3"></a>
  <a href="https://open-vsx.org"><img src="https://img.shields.io/badge/Open%20VSX-available-blue.svg?style=flat-square" alt="Open VSX"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-purple.svg?style=flat-square" alt="License"></a>
  <a href="https://github.com/Davissss2"><img src="https://img.shields.io/badge/author-Davissss2-emerald.svg?style=flat-square" alt="Author Davissss2"></a>
  <img src="https://img.shields.io/badge/platform-Windows%20|%20macOS%20|%20Linux-gray.svg?style=flat-square" alt="Platforms">
</p>

---

## Indice de Contenidos

1. [Que es Obsidian for Antigravity](#que-es-obsidian-for-antigravity)
2. [Arquitectura Hermes: Bucle Cerrado y Memoria Acotada](#arquitectura-hermes-bucle-cerrado-y-memoria-acotada)
3. [Identidad del Agente y Trato Personalizado (Tu Nombre)](#identidad-del-agente-y-trato-personalizado-tu-nombre)
4. [Workflow Completo Paso a Paso](#workflow-completo-paso-a-paso)
   - [Paso 1: Instalacion y Deteccion de Boveda](#paso-1-instalacion-y-deteccion-de-boveda)
   - [Paso 2: Calibracion de Identidad y Trato](#paso-2-calibracion-de-identidad-y-trato)
   - [Paso 3: Inicio de Tarea y Triage Inteligente (<80 tokens)](#paso-3-inicio-de-tarea-y-triage-inteligente-80-tokens)
   - [Paso 4: Extraccion Quirurgica con Peek](#paso-4-extraccion-quirurgica-con-peek)
   - [Paso 5: Blueprint Arquitectonico de Proyectos](#paso-5-blueprint-arquitectonico-de-proyectos)
   - [Paso 6: Registro de Trampas y Anti-patrones Prohibidos](#paso-6-registro-de-trampas-y-anti-patrones-prohibidos)
   - [Paso 7: Checkpoints y Continuidad de Sesion (<50 tokens)](#paso-7-checkpoints-y-continuidad-de-sesion-50-tokens)
   - [Paso 8: Asimilacion Autonoma de Reglas y Habitos](#paso-8-asimilacion-autonoma-de-reglas-y-habitos)
5. [Grafo Interactivo de Conocimiento (HTML5 Canvas)](#grafo-interactivo-de-conocimiento-html5-canvas)
6. [Estructura Oficial del Vault en Obsidian](#estructura-oficial-del-vault-en-obsidian)
7. [Referencia de Herramientas MCP y Comandos CLI](#referencia-de-herramientas-mcp-y-comandos-cli)
8. [Comandos de Chat (/obsidian)](#comandos-de-chat-obsidian)
9. [Copia de Seguridad Cifrada (.agvault) y Auto-Commit Git](#copia-de-seguridad-cifrada-agvault-y-auto-commit-git)
10. [Instalacion y Actualizacion](#instalacion-y-actualizacion)

---

## Que es Obsidian for Antigravity

**Obsidian for Antigravity** transforma cualquier boveda local de [Obsidian](https://obsidian.md) en el segundo cerebro persistente de Antigravity AI. 

A diferencia de extensiones convencionales o chatbots pasivos, este sistema implementa:
- **Zero Cloud / Zero API Keys**: Sincronizacion 100% local directa en tus archivos Markdown en disco.
- **Bucle Cerrado Hermes**: Arquitectura de aprendizaje autonomo inspirada en Nous Research con cuotas estrictas de contexto.
- **Triage Inteligente de Bajo Contexto**: La IA comprueba antecedentes en menos de 80 tokens, evitando leer archivos completos innecesariamente.
- **Personalidad Activa y Trato Personal**: El agente asume una identidad definida (ej. Pedro) y se dirige siempre a ti por tu nombre (ej. David), comportandose como un companero de desarrollo senior y resolutivo.
- **Grafo de Fuerza Integrado**: Visualizador interactivo de nodos en la barra lateral con simulacion fisica fluida y captura de puntero continua.

---

## Arquitectura Hermes: Bucle Cerrado y Memoria Acotada

Para evitar que los modelos de lenguaje consuman su ventana de contexto con historiales infinitos o notas gigantes, Obsidian for Antigravity utiliza un sistema de **Memoria Acotada (Bounded Memory)**:

```text
                               ┌─────────────────────────────┐
                               │       Antigravity Chat      │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [¿COMO hacer algo nuevo?]                       [¿QUE paso antes?]
         Playbooks en 01_Skills/                         Triage (<80 tokens)
                      │                                               │
                      ▼                                               ▼
      ┌───────────────────────────────┐               ┌───────────────────────────────┐
      │          01_Skills/           │               │       00_Agente/Memorias/     │
      │   Playbooks Vivos Autonomos   │               │   Peek: Causa raiz + Fix      │
      └───────────────────────────────┘               └───────────────────────────────┘
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                               ┌─────────────────────────────┐
                               │   Registro y Actualizacion  │
                               │   • 00_Agente/USER.md       │ (<1,500 caracteres)
                               │   • 00_Agente/MEMORY.md     │ (<2,500 caracteres)
                               │   • .agents/rules/          │ (Reglas de proyecto)
                               └─────────────────────────────┘
```

### Cuotas de Caracteres Estrictas
- **`00_Agente/USER.md`** (Max 1,500 caracteres): Preferencias del desarrollador, estilo de programacion y restricciones directas.
- **`00_Agente/MEMORY.md`** (Max 2,500 caracteres): Hechos clave del entorno, puertos, rutas absolutas y configuraciones criticas.
- **`00_Agente/Memorias/`**: Informes tecnicos atomicos de fallos resueltos y decisiones de arquitectura.
- **`01_Skills/`**: Playbooks procedurales vivos con control de versiones (`v1.0.0`) y resolucion paso a paso.

---

## Identidad del Agente y Trato Personalizado (Tu Nombre)

Una queja frecuente con los asistentes genericos es que actuan como un chat sin personalidad y nunca recuerdan como llamarte. En Obsidian for Antigravity, la identidad y el trato son ciudadanos de primera clase:

### 1. Parametros de Identidad
- **Tu Nombre / Callsign**: El nombre con el que el agente se dirige a ti en cada intervencion (ej. `David`, `Jefe`, `Comandante`).
- **Nombre del Agente**: La identidad asignada al modelo (ej. `Pedro`, `Hermes`, `Jarvis`).
- **Rasgos y Comportamiento**: Estilo de ejecucion (por defecto: `Completamente autonomo y resolutivo: soluciona todos los problemas de raiz; directo, pragmatico y CERO emojis`).

### 2. Formas de Configurarlo
1. **Desde la Barra Lateral (Webview)**:
   - Abre la pestana **Ajustes** en el panel de Obsidian.
   - En la seccion **Identidad del Agente y Trato Personalizado**, escribe tu nombre y el del agente.
   - Pulsa **Guardar Identidad y Trato**.
2. **Desde la Paleta de Comandos de VS Code**:
   - Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P`).
   - Ejecuta: `Obsidian: Configure AI Identity & User Callsign`.
   - Introduce tu nombre y el nombre del agente en las ventanas emergentes.
3. **Desde la Terminal (CLI)**:
   ```bash
   node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js user "David"
   node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js name "Pedro"
   ```
4. **Mediante Comandos de Chat**:
   - `/obsidian user David`
   - `/obsidian name Pedro`

Una vez configurado, queda fijado permanentemente en `00_Agente/00 Personalidad de la IA.md`, en la configuracion de la extension y en las reglas globales de Antigravity (`rules/obsidian-brain.md`).

---

## Workflow Completo Paso a Paso

### Paso 1: Instalacion y Deteccion de Boveda
Al instalar la extension, esta escanea automaticamente tu sistema en busca de una boveda de Obsidian activa:
- En Windows: Busca en `%APPDATA%\obsidian\obsidian.json` y carpetas en `Documents/Obsidian Vault`.
- En macOS y Linux: Busca en las rutas equivalentes de configuracion de Obsidian.
- Si no existe ninguna boveda, crea de forma automatica una boveda estructurada en `Documents/Obsidian Vault`.

### Paso 2: Calibracion de Identidad y Trato
Configura tu nombre en los ajustes de la barra lateral o responde cuando el agente te pregunte en su primer arranque. El agente fijara su trato hacia ti y no volvera a preguntar en chats posteriores.

### Paso 3: Inicio de Tarea y Triage Inteligente (<80 tokens)
Cuando inicias una conversacion sobre un problema o arquitectura, la IA ejecuta un triage rapido:
```bash
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js triage "sqlite database locked"
```
- Si hay antecedentes, devuelve un resumen de una linea (<80 tokens).
- Si no hay antecedentes, procede a resolver de raiz sin contaminar el contexto.

### Paso 4: Extraccion Quirurgica con Peek
Si el resumen de triage indica que existe una solucion previa y se requieren detalles tecnicos, la IA no lee todo el archivo; utiliza `peek` para extraer exclusivamente la causa raiz y la solucion aplicada:
```bash
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js peek "SQLite WAL Concurrency Bugfix"
```

### Paso 5: Blueprint Arquitectonico de Proyectos
Para mapear proyectos completos, stack tecnologico, dependencias y reglas de repositorio:
```bash
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js project scan "C:\Ruta\Al\Proyecto"
```
Esto genera o actualiza `02_Proyectos/[Proyecto]/ARCHITECTURE.md` con:
- Stack tecnologico y version exacta.
- Dependencias clave detectadas automaticamente.
- Reglas operativas obligatorias.
- Anti-patrones y trampas tecnicas prohibidas.

### Paso 6: Registro de Trampas y Anti-patrones Prohibidos
Cuando descubres un fallo recurrente, una limitacion de API o una trampa tecnica que la IA nunca debe volver a cometer, se registra como anti-patron:
```bash
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js project antipattern add "Nunca usar fs sync en bucles de request criticos"
```
El anti-patron se inyecta en `02_Proyectos/[Proyecto]/ARCHITECTURE.md` y se sincroniza inmediatamente con `.agents/rules/project-rules.md`. En cualquier sesion futura, la IA comprueba estas reglas obligatorias y evita cometer el error nuevamente.

### Paso 7: Checkpoints y Continuidad de Sesion (<50 tokens)
Al finalizar una tarea o antes de cerrar el editor, se guarda un checkpoint:
```bash
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js session save --summary "Solucionado bug de empaquetado VSIX y parser CLI" --content "Modificados extension.js y sync-engine.js. Tests pasando."
```
En la siguiente conversacion o al abrir un chat nuevo, la IA recupera el estado exacto en menos de 50 tokens con:
```bash
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js session last
```

### Paso 8: Asimilacion Autonoma de Reglas y Habitos
Siempre que indiques una preferencia de trabajo o restriccion de flujo (ej. "en este repo siempre compila con npm run build y sube a git"):
```bash
node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js learn "Siempre compilar vsix y hacer push a git tras modificar extension"
```
Se registra en `00_Agente/USER.md` y en las reglas del workspace para que se aplique de forma automatica en todos los chats.

---

## Grafo Interactivo de Conocimiento (HTML5 Canvas)

La extension incluye un visualizador de grafo de fuerza integrado directamente en la pestana **Grafo** de la barra lateral:

```text
┌─────────────────────────────────────────────────────────────┐
│ [Buscar nodo...]  [Ajustar]  [+]  [-]  [Reset]  [Abrir]     │
├─────────────────────────────────────────────────────────────┤
│ (Hub) (Alma) (Skills) (Memoria) (Proyectos) (Sesiones)      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│             ● [Pedro / Hermes Core]                        │
│            / \                                              │
│           /   \                                             │
│          ●     ● [00 Personalidad]                          │
│     [USER.md]   \                                           │
│                  ● [antigravity-account]                    │
│                 / \                                         │
│                ●   ● [qr-precios]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mejoras de Rendimiento y Usabilidad
1. **Simulacion Fisica por Enfriamiento Alfa**:
   - Movimiento natural con repulsion coulombiana, elasticidad por enlaces wikilink y friccion suave.
   - Al soltar un nodo, el grafo no se congela en seco; decae fluidamente hacia el equilibrio termodinamico.
2. **Captura de Puntero Continua (Pointer Capture)**:
   - Al arrastrar un nodo o el fondo, la extension activa `setPointerCapture`.
   - Aunque el cursor salga del panel, de la ventana de VS Code o de la pantalla, **el grafo nunca se congela ni pierde el nodo**. Al volver o soltar, se libera limpiamente.
3. **Auto-Ajuste a la Pantalla (`Fit to View`)**:
   - El boton **Ajustar** o hacer **doble clic** en cualquier zona vacia calcula el cuadro delimitador de todos los nodos y centra el grafo con zoom optimo para que no quede cortado.
4. **Controles Completos**:
   - Zoom con la rueda del raton centrado en la posicion del cursor.
   - Botones dedicados de acercar (`+`) y alejar (`-`).
   - Boton de reinicio de fisica (`Reset`).
   - Filtro de busqueda en vivo con iluminacion de nodos y enlaces conectados.
   - Clic en cualquier nodo para abrir la nota correspondiente en Obsidian o VS Code.
5. **Codigo de Colores por Categoria**:
   - **Hub Principal**: Purpura (`#8b5cf6`)
   - **Alma / Identidad / Usuario**: Rosa (`#ec4899`)
   - **Skills / Playbooks**: Azul (`#3b82f6`)
   - **Memorias / Bugfixes**: Esmeralda (`#10b981`)
   - **Proyectos / Blueprints**: Ambar (`#f59e0b`)
   - **Sesiones / Checkpoints**: Cian (`#06b6d4`)

---

## Estructura Oficial del Vault en Obsidian

La estructura interna de la boveda esta unificada bajo el estandar Hermes:

```text
📁 Obsidian Vault/
├── 📁 00_Agente/
│   ├── 📄 SOUL.md                          <-- Principios operativos y directivas quirurgicas
│   ├── 📄 USER.md                          <-- Perfil y preferencias de trabajo (<1,500 chars)
│   ├── 📄 MEMORY.md                        <-- Hechos del entorno y sistema (<2,500 chars)
│   ├── 📄 00 Personalidad de la IA.md      <-- Nombre de agente, trato y rasgos de identidad
│   └── 📁 Memorias/                        <-- Soluciones atomicas y bugfixes
│       ├── 📄 00 Indice de Memoria.md
│       └── ...
├── 📁 01_Skills/                           <-- Playbooks vivos versionados (v1.0.0)
│   ├── 📄 00 Indice de Skills.md
│   └── ...
├── 📁 02_Proyectos/                        <-- Blueprints de arquitectura viva
│   ├── 📄 00 Indice de Proyectos.md
│   └── 📁 [Nombre-Proyecto]/
│       ├── 📄 ARCHITECTURE.md              <-- Stack, dependencias, reglas y anti-patrones
│       └── 📄 WORKFLOW.md                  <-- Comandos verificados de build, test y release
└── 📁 03_Sesiones/                         <-- Bitacora diaria y checkpoints de continuidad
    ├── 📄 00 Indice de Sesiones.md
    ├── 📁 Trajectories/
    └── 📄 YYYY-MM-DD - [Proyecto].md
```

---

## Referencia de Herramientas MCP y Comandos CLI

El sistema ofrece soporte nativo dual: Servidor MCP directo (sin colisionar con otros servidores) y ejecucion por linea de comandos (CLI).

| Operacion | Herramienta MCP | Comando CLI Equivalente |
|---|---|---|
| Triage de bajo contexto | `obsidian_triage` | `node obsidian.js triage "<query>"` |
| Extraccion quirurgica | `obsidian_peek` | `node obsidian.js peek "<nota>"` |
| Lectura de nota | `obsidian_read_note` | `node obsidian.js read "<nota>"` |
| Guardar memoria | `obsidian_save_memory` | `node obsidian.js save --title "..." --content "..."` |
| Agregar anti-patron | `obsidian_add_antipattern` | `node obsidian.js project antipattern add "<regla>"` |
| Listar anti-patrones | `obsidian_list_antipatterns`| `node obsidian.js project antipattern list` |
| Guardar checkpoint sesion | `obsidian_session_save` | `node obsidian.js session save --summary "..." --content "..."` |
| Recuperar ultima sesion | `obsidian_session_last` | `node obsidian.js session last` |
| Listar sesiones | `obsidian_session_list` | `node obsidian.js session list` |
| Aprender preferencia | `obsidian_learn` | `node obsidian.js learn "<regla>"` |
| Estado del sistema | `obsidian_status` | `node obsidian.js status` |
| Sincronizar todo | `obsidian_sync_all` | `node obsidian.js sync` |
| Consultar personalidad | `obsidian_status` | `node obsidian.js personality` |
| Configurar personalidad | — | `node obsidian.js personality --ai-name "..." --user-callsign "..."` |
| Cambiar trato de usuario | — | `node obsidian.js user "<nombre>"` |
| Cambiar nombre de agente | — | `node obsidian.js name "<nombre>"` |
| Escanear proyecto | — | `node obsidian.js project scan [ruta]` |

*Ruta predeterminada del ejecutable CLI:*
`node ~/.gemini/config/skills/antigravity-obsidian/scripts/obsidian.js <comando>`

---

## Comandos de Chat (/obsidian)

En cualquier chat de Antigravity puedes invocar las capacidades de la boveda usando comandos slash:

- `/obsidian status`: Muestra estado de conexion, estadisticas, nombre del agente y trato activo.
- `/obsidian user <trato>`: Cambia de inmediato como debe dirigirse a ti la IA (ej. `/obsidian user David`).
- `/obsidian name <nombre>`: Cambia de inmediato el nombre del agente (ej. `/obsidian name Pedro`).
- `/obsidian personality`: Muestra la personalidad y rasgos activos.
- `/obsidian session save <resumen>`: Guarda un checkpoint de sesion de trabajo.
- `/obsidian session last`: Recupera el contexto de la sesion anterior en <50 tokens.
- `/obsidian project scan`: Escanea la arquitectura del espacio de trabajo activo.
- `/obsidian project antipattern <regla>`: Registra una trampa o error prohibido.
- `/obsidian triage <query>`: Ejecuta triage rapido de bajo contexto.
- `/obsidian peek <nota>`: Extrae la solucion tecnica de una nota existente.
- `/obsidian save <titulo>`: Guarda una nueva memoria tecnica en el vault.
- `/obsidian learn <regla>`: Asimila un habito o preferencia innegociable.
- `/obsidian open [nota]`: Abre la nota indicada directamente en la aplicacion Obsidian Desktop.

---

## Copia de Seguridad Cifrada (.agvault) y Auto-Commit Git

### 1. Respaldo Cifrado Portatil
Puedes exportar todas tus notas y configuracion en un archivo `.agvault`:
- **Algoritmo**: AES-256-GCM.
- **Derivacion de clave**: PBKDF2 con 100,000 iteraciones y SHA-512 bajo la contrasena que elijas.
- **Restauracion**: Boton **Importar Respaldo** en los Ajustes del panel para migrar tu segundo cerebro a cualquier otro ordenador de forma segura.

### 2. Auto-Commit Git Silencioso
Si inicializas un repositorio git en tu boveda (`git init` en la raiz del vault):
- Cada vez que la IA o el usuario guarda una memoria, escanea un proyecto o guarda un checkpoint de sesion, la extension genera de forma automatica un commit limpio en el historial del vault.

---

## Instalacion y Actualizacion

### Instalacion desde archivo VSIX
```bash
code --install-extension obsidian-for-antigravity-1.8.3.vsix
```

### Instalacion desde Open VSX
```bash
ovsx install Davissss2.obsidian-for-antigravity
```

---

## Autor y Licencia

- **Autor**: **[Davissss2 (David)](https://github.com/Davissss2)**
- **Repositorio**: **[https://github.com/Davissss2/obsidian-for-antigravity](https://github.com/Davissss2/obsidian-for-antigravity)**
- **Reporte de incidencias**: **[https://github.com/Davissss2/obsidian-for-antigravity/issues](https://github.com/Davissss2/obsidian-for-antigravity/issues)**
- **Licencia**: MIT License. Consultar [`LICENSE`](LICENSE) para terminos completos.
