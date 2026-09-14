# Contribuir a KINAI

KINAI acepta mejoras de documentación, código, ejemplos, análisis y herramientas. El repositorio es un laboratorio: los experimentos incompletos son válidos si su estado, procedencia y limitaciones están documentados.

## Flujo

1. Abrir o identificar un issue.
2. Crear una rama, por ejemplo `agent/orca/docs-status`.
3. Leer las instrucciones aplicables.
4. Implementar un cambio pequeño y verificable.
5. Ejecutar las pruebas correspondientes.
6. Abrir un Pull Request con el resumen, pruebas, riesgos e impacto en datos.

Los agentes trabajadores crean PRs y esperan revisión. El agente maestro coordina la integración; ningún agente debe escribir directamente en `main`.

## El PR debe indicar

- objetivo;
- áreas afectadas;
- archivos importantes;
- validaciones ejecutadas;
- impacto en datos, modelos o privacidad;
- dependencias externas;
- limitaciones conocidas;
- confirmación de que no incluye secretos.

Los cambios sobre corpus, consentimiento, licencias, publicación de modelos, despliegues o seguridad requieren revisión humana.

