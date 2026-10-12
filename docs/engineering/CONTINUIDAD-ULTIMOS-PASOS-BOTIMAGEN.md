# BOTIMAGEN · Continuidad de los últimos pasos

**Actualizado:** 2026-10-12  
**Objetivo:** retomar el trabajo en otro chat sin confundir lo conocido con lo ejecutado.

## Proyecto y ubicación

- Repositorio: https://github.com/jonhararagi/botimagen
- PR de seguimiento: https://github.com/jonhararagi/botimagen/pull/11
- Rama de trabajo indicada: `feature/bimg-engine-001-cyberstreet-visual-renderer`
- Esta nota se guarda en esa rama. No implica fusionar el PR ni modificar `main`.

## Último informe conocido: BIMG-ENGINE-008-R5

**Veredicto informado: PARTIAL.**

Informe consultado: [BIMG-ENGINE-008-R5-ANATOMICAL-SVG-HARNESS.md](https://github.com/jonhararagi/botimagen/blob/feature/bimg-engine-001-cyberstreet-visual-renderer/docs/engineering/BIMG-ENGINE-008-R5-ANATOMICAL-SVG-HARNESS.md)

R5 preparó instrumentación en `web/browser_smoke.mjs` para capturas frontal/posterior y un manifiesto de cajas/medidas normalizadas; también reforzó `tests/test_visual_body_landmarks.py` y actualizó documentación de continuidad.

El hallazgo principal: el renderer reutiliza rutas de vestuario como superficies del torso, pelvis y piernas, entre ellas `.garment-torso-main`, `.character-lower-body` y `.character-leg-silhouette`. Ocultar o recolorear esas rutas no revela anatomía independiente. Las mediciones de torso, cintura, pelvis y piernas aún no son una referencia anatómica fiable.

El informe indicó que la sintaxis Python y el manifiesto pasaron en la última ejecución, pero la CI completa seguía pendiente al redactarlo. QA manual en Windows: `NOT_RUN`. No asumir que la CI terminó pasando. El HEAD mencionado en el informe R5 fue `5ef465bf0179636b98b78c5effaafc55b74c0055`; es histórico y debe verificarse antes de cualquier nueva operación.

## Decisión tomada

Todavía **no** ajustar proporciones ni avanzar a pulido artístico. Primero debe existir un cuerpo base explícito, visible sin prendas y separado de las rutas de vestuario. Después se podrán obtener capturas y medidas útiles.

## Siguiente tarea preparada, todavía no ejecutada

**BIMG-ENGINE-009-R1 · SEPARACIÓN DE GEOMETRÍA CORPORAL Y VESTUARIO**  
Estimación indicada en el prompt: **4–7 horas**; es una estimación, no tiempo real medido.

El prompt preparado para el Bot Obrero solicita:

1. Verificar el estado actual de `main`, rama, PR #11, HEAD y checks antes de tocar archivos.
2. Revisar `cerebro/README.md`, `cerebro/ESTADO_ACTUAL.md`, `VisualCharacterRenderer.tsx`, `bodyLandmarks.ts`, la composición SVG, `web/browser_smoke.mjs` y el informe R5.
3. Separar una geometría corporal real del vestuario. Ocultar prendas no debe hacer desaparecer el cuerpo.
4. Actualizar el arnés con capturas frontal y posterior sin prendas/cosméticos y otra con vestuario; inspeccionar SVG además de PNG.
5. Añadir pruebas de independencia cuerpo/ropa y comprobar que vestuario, API, catálogo y recetas sigan funcionando.
6. No cambiar deliberadamente proporciones, catálogo, recetas ni API, ni añadir dependencias pesadas.
7. Verificar CI sobre el commit final; si no terminó, informar `CI_PENDING`. Si no se ejecutó QA Windows, informar `WINDOWS_MANUAL_QA: NOT_RUN`.
8. Documentar cambios y evidencia en `cerebro/` y `docs/engineering/`, y dejar comentario en PR #11.
9. Si la separación requiere un refactor mucho mayor, detenerse y entregar diagnóstico, sin ampliar alcance.

**Criterio central:** el cuerpo define la anatomía; las prendas la visten, pero no la sustituyen.

## Qué hice y qué no hice en ChatGPT

**Hecho por mí:**
- Revisé el informe R5 y consolidé sus hallazgos y límites.
- Decidí que el próximo paso técnico es separar cuerpo y vestuario antes de medir o ajustar proporciones.
- Preparé el prompt BIMG-ENGINE-009-R1 para el Bot Obrero.
- Guardé esta nota de continuidad en la rama de trabajo.

**No hecho por mí:**
- No implementé BIMG-ENGINE-009-R1.
- No modifiqué geometría de producción ni ajusté proporciones.
- No ejecuté pruebas, CI ni QA manual de Windows.
- No generé ni revisé nuevas capturas posteriores a R5.
- No fusioné PR #11 ni hice cambios en `main`.

## Próximo paso al retomar el chat

Enviar al Bot Obrero el prompt **BIMG-ENGINE-009-R1** que ya fue preparado en la conversación anterior y esperar su informe. No asumir que la implementación existe hasta ver evidencia, archivos modificados, SHA final, pruebas y estado de CI. Si el informe no está disponible en el nuevo chat, pedirlo antes de decidir la siguiente tarea.

Al evaluar el informe, comprobar primero: (1) cuerpo independiente sin ropa, (2) vestuario todavía funcional, (3) capturas que permitan distinguir y medir anatomía, (4) pruebas/CI y (5) rama, SHA y PR reales.
