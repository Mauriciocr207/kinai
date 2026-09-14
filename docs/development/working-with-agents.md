# Trabajo con agentes

Los agentes de KINAI son herramientas externas de colaboración: Orca, Codex, Claude Code u otras. No representan agentes internos del asistente de voz.

## Flujo

```text
Agente trabajador → rama → PR → CI → agente maestro → merge a main
```

Los agentes trabajadores pueden editar ramas y abrir PRs. El agente maestro revisa alcance, pruebas, documentación, secretos, datos sensibles y conflictos. `main` debe permanecer protegido.

## Agente maestro

Debe usar una identidad separada y permisos limitados de Pull Requests y contenidos. No debe tener bypass de reglas ni decidir por sí solo sobre consentimiento, licencias, publicación de datos, modelos de producción o resultados científicos.

El maestro puede mergear cambios de bajo riesgo cuando los checks pasen. Los cambios sensibles se escalan a revisión humana.

## Estados sugeridos

`queued`, `in-progress`, `needs-review`, `changes-requested`, `blocked`, `human-review-required`, `ready-to-merge`, `merged`.

