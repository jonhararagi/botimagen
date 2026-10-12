# BIMG-ENGINE-010 · Integración del motor anime paramétrico

**Estado al publicar:** implementación integrada en la rama visual; aceptación pendiente de CI del SHA final y revisión de capturas reales.  
**Rama:** \`feature/bimg-engine-001-cyberstreet-visual-renderer\` · **PR:** https://github.com/jonhararagi/botimagen/pull/11  
**HEAD de partida:** \`542d8c21e5e5d264ae9ca1a104b2526672dd389c\`  
**TIMER:** 6–10 horas estimadas para integración, QA de capturas y correcciones. Tiempo real no medido de forma fiable.

## Qué cambia

La vista previa principal deja de depender solamente del SVG procedural original de CyberStreet. Se integra el motor paramétrico SVG de [rhedak/anime-character-creator](https://github.com/rhedak/anime-character-creator), upstream SHA \`1bcb2f875050fbab16968318112fea1615968a3e\`. La licencia MIT y la atribución están preservadas en \`vendor/anime_character_creator/\`.

El motor dibuja geometría SVG calculada a partir de un esqueleto proporcional, con cabeza, rostro, ojos y boca paramétricos, cabello por capas, anatomía, brazos, manos, piernas, calzado y vestuario. BotImagen no copia los presets, personajes, PNG ni SVG de ejemplo del repositorio de origen. Sus identificadores de catálogo, paleta, receta visual y detalles CyberStreet se aplican mediante \`character_render_engine.py\`.

## Flujo conectado

- React envía las selecciones reales y la receta a \`POST /api/render/character\`.
- El servicio Python valida los IDs frente al catálogo canónico y la receta frente al contrato existente.
- El adaptador transforma las opciones en \`CharacterParams\`, \`FaceStyle\`, \`Outfit\` y un esqueleto SVG de proporción adulta.
- La vista previa visible utiliza la salida SVG local. El renderer antiguo queda como fallback explícito y fixture para las pruebas existentes de Style Lab.
- No se añade dependencia Python, npm, servicio remoto ni clave de IA.

## Verificación exigida

La CI debe demostrar que el servidor emite SVG, que los cambios de opciones alteran la salida real, que el contrato rechaza valores no existentes y que la app carga la imagen desde el nuevo endpoint. Después hay que revisar las capturas producidas por la CI. Compilar y pasar tests no basta para aceptar calidad artística.

## Límites reconocidos

La geometría adicional de orejas, cuernos, colas, marcas y detalles CyberStreet se compone en capas SVG. No todas las 47 categorías tienen aún una geometría individual especializada. La vista posterior es una composición de presentación sobre el mismo esqueleto, no un segundo rig anatómico completo. Esos límites no deben describirse como funciones terminadas.

**Pendiente:** CI del SHA final, inspección de la salida visual en artefactos y QA manual en Windows/Chrome/Edge (\`NOT_RUN\` hasta ejecutarse físicamente). El progreso global no sube hasta revisar evidencias y volver a calcular la beta con su ponderación real.


## BIMG-ENGINE-010-R1 · corrección guiada por la captura real

La primera captura real de Chromium reveló que la integración seguía demasiado chibi. Esta corrección aborda defectos observados, no solo la compilación: sube la proporción corporal objetivo a 6,0–7,15 cabezas, eleva la madurez facial de base a 1,0, reduce ojos/iris, conecta flequillo/textura/boca/cejas a las opciones seleccionadas, coloca colas/coletas en el fondo de SVG y limita el patrón CyberStreet a un panel central tenue.

La aceptación artística continúa en PARTIAL hasta inspeccionar las nuevas capturas. CI verde no significa diseño aprobado.


## BIMG-PRODUCT-001-R1 · biblioteca local y renderer visible único

La vista previa de producto tiene una única fuente visible: el SVG validado que devuelve `POST /api/render/character`. El antiguo `VisualCharacterRenderer` permanece como fixture QA oculto para los tests geométricos, sin dibujar un segundo personaje. El lienzo permite elegir entre tres fondos SVG locales empaquetados por Vite; la preferencia se conserva localmente. Dos presets JSON se cargan desde recursos locales, aplican selecciones verificadas contra el catálogo y la receta CyberStreet, y se representan mediante el motor Python.

La biblioteca inicial añade tres fondos originales, dos emblemas UI y dos presets JSON, todos con ID estable, ruta local, autor/procedencia, URL de origen, licencia, atribución y finalidad. Un validador comprueba que cada ruta exista dentro del repositorio. Los recursos son originales del proyecto; no se incorporan imágenes de terceros sin licencia individual verificada. La licencia MIT del código de `vendor/anime_character_creator/` sigue siendo independiente.

**Aceptación pendiente:** CI del SHA final, inspección de los artefactos Chromium de ese mismo SHA y revisión artística humana. `WINDOWS_MANUAL_QA: NOT_RUN` hasta ejecutar Chrome/Edge físicamente en Windows. No se eleva el progreso beta por el mero recuento de archivos.
