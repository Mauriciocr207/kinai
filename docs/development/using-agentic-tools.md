# Usar herramientas agenticas con KINAI

KINAI permite trabajar con Orca, Codex, Claude Code u otra herramienta agentica. La herramienta puede explorar, modificar y validar el repositorio, pero la integración se realiza mediante ramas y Pull Requests.

## Preparación

Clona el repositorio con `git clone https://github.com/Mauriciocr207/kinai.git` y entra en la carpeta `kinai`. Antes de trabajar, lee `README.md`, `AGENTS.md`, `docs/status.md` y el `AGENTS.md` más cercano al área que modificarás.

Para Codex, consulta la [documentación oficial sobre `AGENTS.md`](https://learn.chatgpt.com/docs/agent-configuration/agents-md), la [guía oficial de revisión de código](https://learn.chatgpt.com/docs/code-review) y la [integración con GitHub](https://learn.chatgpt.com/docs/third-party/github).

Si la herramienta no detecta automáticamente las instrucciones del proyecto, añade `README.md` y `AGENTS.md` como contexto principal.

## Elegir una tarea

Empieza con una tarea concreta y revisable: corregir documentación, añadir un ejemplo ASR/TTS, documentar un experimento, corregir una ruta de notebook, añadir una prueba pequeña o integrar una mejora aislada en `apps/chatbot/`. No pidas “reorganiza todo” en una sola sesión; divide el trabajo en PRs independientes.

## Prompt recomendado

```text
Trabaja en este repositorio siguiendo README.md y AGENTS.md.
Tarea: [una sola tarea]
Área: [docs / projects/corpus / projects/mms_asr / apps/chatbot / ...]
Antes de editar, inspecciona los archivos relevantes y explica riesgos.
Después, implementa solo esta tarea, ejecuta validaciones y resume cambios,
pruebas y pendientes. No guardes credenciales ni modifiques datos privados.
```

Para una tarea de investigación, indica que no debe editar archivos hasta entregar el análisis.

## Rama y validación

Cada agente necesita una rama propia, por ejemplo `git switch -c agent/orca/docs-asr-example`. Usa nombres como `agent/orca/<tarea>`, `agent/codex/<tarea>`, `agent/claude/<tarea>` o `human/<tarea>`.

Antes del PR ejecuta `git status`, `git diff --check` y `git diff --stat`. Según el área, ejecuta `python -m compileall -q projects`, `uv sync`, o desde `apps/chatbot/` los comandos `npm ci`, `npm run typecheck` y `npm run build`.

No descargues modelos grandes ni el corpus privado para una validación que no lo necesita. No ejecutes notebooks que puedan modificar Drive o publicar artefactos sin revisar antes sus celdas.

## Herramientas y proveedores

Todas estas opciones pueden trabajar con KINAI, pero cumplen funciones distintas. Elige una herramienta de trabajo, abre la raíz del repositorio y aplica el mismo flujo de rama, validación y PR.

### Orca: orquestación multi-proveedor

[Orca](https://github.com/stablyai/orca) permite trabajar con una flota de agentes de código y distintos proveedores desde un mismo entorno. Es útil para repartir tareas entre agentes o coordinar sesiones paralelas. Consulta su [repositorio e instrucciones de instalación](https://github.com/stablyai/orca).

No compartas con Orca acceso al corpus privado salvo que entiendas dónde se ejecutan los agentes y qué permisos tienen.

### Claude Code: agente de Anthropic

[Claude Code](https://www.anthropic.com/claude-code) es el agente de programación de Anthropic. Consulta la [guía oficial de instalación](https://code.claude.com/docs/en/quickstart) y la documentación de [configuración con GitHub](https://code.claude.com/docs/en/github-actions).

Ábrelo desde la raíz de KINAI y pídele que lea `README.md` y `AGENTS.md` antes de trabajar.

### Codex CLI: agente de OpenAI

[Codex CLI](https://github.com/openai/codex) es el agente de programación local de OpenAI. Consulta la [guía oficial de inicio](https://help.openai.com/en/articles/11096431) para instalarlo y utilizarlo desde la terminal.

Úsalo desde la raíz del repositorio, con una rama propia y las instrucciones de KINAI como contexto.

### Anthropic: proveedor de modelos

[Anthropic](https://www.anthropic.com/) es un proveedor de modelos, no una herramienta de control de versiones ni una instalación local equivalente a Orca, Claude Code o Codex. Para utilizar sus modelos necesitas una cuenta y una API key en la [consola de Anthropic](https://console.anthropic.com/); consulta también la documentación oficial de la [API](https://docs.anthropic.com/).

Las claves deben vivir en el gestor de secretos de la herramienta o del servidor. Nunca las guardes en KINAI, `localStorage`, un prompt compartido o un PR.

### Otras herramientas

También puedes utilizar Cursor, GitHub Copilot, OpenCode, Aider u otra herramienta compatible. Busca su documentación oficial de instalación y configura el repositorio para que lea `AGENTS.md`.

## Abrir el Pull Request

Guarda cambios con un commit descriptivo, súbelos con `git push -u origin <rama>` y abre el PR desde GitHub o con `gh pr create --base main --head <rama>`. Completa la [plantilla de PR](../../.github/PULL_REQUEST_TEMPLATE.md) con objetivo, cambios, pruebas, riesgos, impacto en datos y procedencia.

## Agente maestro

Los agentes trabajadores no hacen merge de sus propios PRs. El agente maestro revisa alcance, CI, rutas, documentación, secretos, datos sensibles, modelos, licencias y despliegues. Puede fusionar cambios técnicos de bajo riesgo.

El cambio debe escalarse a revisión humana si añade audio, transcripciones o metadatos; toca consentimiento, privacidad, licencias, publicación de modelos o datasets, secretos, workflows, despliegues, resultados científicos o eliminación de archivos.

El flujo esperado es: `agente trabajador → rama → PR → CI → agente maestro → main`.

Consulta [Trabajo con agentes](working-with-agents.md) y [Contribuir](../../CONTRIBUTING.md) para el contrato completo.

## Google Drive y datos privados

Que un archivo exista en Google Drive no implica permiso para copiarlo a Git o publicarlo. Respeta [`docs/storage.md`](../storage.md), no guardes tokens y no alteres el audio original.

## Checklist

- [ ] Leí `README.md`, `AGENTS.md` y el estado del proyecto.
- [ ] Trabajé en una rama propia.
- [ ] El PR tiene un solo objetivo.
- [ ] No incluí secretos, audio ni datos privados.
- [ ] Ejecuté las validaciones aplicables.
- [ ] Documenté fuentes, limitaciones y accesos externos.
- [ ] Abrí un PR dirigido a `main`.
- [ ] Esperé la revisión del agente maestro.
