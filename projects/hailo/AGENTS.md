# Instrucciones de trabajo

- Leer `README.md` antes de proponer arquitectura o modificar el entorno. Es la fuente
  de contexto, referencias, decisiones y pendientes de este proyecto.
- Comunicarse en español. Este trabajo continúa la tesis de Mauricio sobre voz en
  maya yucateco; el objetivo es audio → ASR → texto → LLM → texto → TTS → audio.
- Partir de los modelos propios `mau-cr/mayan_best_model` y
  `mau-cr/mms-tts-yua-6voces`. Evaluar cualquier sustitución con respecto a ellos.
- Distinguir el decodificador KenLM del ASR del LLM que genera las respuestas.
  Conservar vocabulario, processor y decodificación al evaluar cambios de runtime.
- No asumir que la HAT+2 soporta un modelo porque esté publicado en ONNX o PyTorch.
  Distinguir detección PCIe, controlador operativo e inferencia comprobada.
- No dar por decidido el funcionamiento sin internet, el LLM, los idiomas de respuesta
  ni el reparto CPU/Hailo/remoto: consultar los acuerdos actualizados del README.
- El diagnóstico del hardware es histórico. Volver a comprobar lo necesario antes
  de basar un cambio en él; no presentar métricas publicadas como pruebas locales.
- La petición del 2026-09-13 limita esta fase a investigar y documentar antes de
  modificar la Pi. Cuando el usuario solicite implementación o configuración,
  avanzar dentro de ese nuevo alcance sin volver a pedir autorización ya concedida.
- Actualizar el README con decisiones y resultados confirmados, su fecha y fuentes.
  Mantener aquí instrucciones breves; evitar duplicar el contexto completo.
- No guardar tokens ni credenciales en documentación o código. El corpus se documenta
  como privado; no suponer acceso o autorización para publicarlo.
