# BIMG-DATASET-001 · Auditoría técnica y visual del dataset corporal

**Fecha:** 2026-10-11  
**Repositorio:** [`jonhararagi/botimagen`](https://github.com/jonhararagi/botimagen)  
**HEAD auditado:** [`b508cfe7d3216eda801438d46dff8873842cea86`](https://github.com/jonhararagi/botimagen/commit/b508cfe7d3216eda801438d46dff8873842cea86)  
**Carpeta:** [`references/dataset-cuerpos/`](../../references/dataset-cuerpos/)  
**Estado de auditoría:** **COMPLETE_WITH_LIMITATIONS**  
**TIMER inicial:** 30–60 minutos para el cierre documental de esta revisión.  
**Tiempo real de reloj:** `NOT_MEASURED`; el entorno no registró una duración automática de sesión.  
**Trabajo pendiente:** la inspección visual de las 16 imágenes está completada. La procedencia/licencia sigue sin verificarse y requiere evidencia externa de fuente/autor.

## 1. Resumen ejecutivo

El listado actual de GitHub confirma **16 PNG (`0.png`–`15.png`) más `README.md`**: 17 entradas en la carpeta. Las 16 imágenes suman **13.882.547 bytes (13,239 MiB)**. Las 16 pudieron abrirse y pasar `Pillow Image.verify()`; las dimensiones comprobadas son idénticas, **768×1280 píxeles**, relación de aspecto 0,6 (vertical 3:5), PNG RGBA de 8 bits por canal. Aunque el modo declara canal alfa, **todos los píxeles son opacos**: alpha mínimo y máximo 255; no existe transparencia real.

**No se encontraron duplicados exactos** por SHA-256. Se calculó un dHash de 64 bits para ordenar similitudes visuales posibles, pero es una señal exploratoria y no confirma duplicados. Los SHA-256 se recalcularon en una segunda pasada y permanecieron estables. Los 16 archivos pasaron la decodificación; no se detectaron archivos corruptos.

Se inspeccionaron visualmente **16 de 16 imágenes**. El subconjunto observado está formado por ilustraciones corporales humanas estilizadas con lenguaje anime, la mayoría de pie y en ángulos oblicuos, con varios gestos de brazos y recortes de torso. No son láminas anatómicas ortográficas ni maniquíes limpios listos para separar en piezas. Los fondos claros son opacos e incluyen símbolos decorativos y sombras; no pueden utilizarse directamente como capas transparentes sin un trabajo posterior de limpieza/segmentación.

Las cuatro imágenes que antes estaban pendientes (`4.png`, `6.png`, `7.png` y `8.png`) se abrieron directamente desde sus URLs originales `raw.githubusercontent.com` y se inspeccionaron visualmente. Las descripciones registran vista aparente, pose, extremidades, encuadre, fondo, utilidad, confianza y limitaciones; no son mediciones anatómicas. No se generó ninguna miniatura, copia, recorte ni recurso derivado, y los originales no se modificaron.

**Recomendación:** avanzar con un enfoque **2D primero, híbrido a largo plazo**. `12.png` es el candidato primario para estudiar una silueta de cuerpo completo casi frontal; `15.png` es un candidato secundario. `0.png`, `1.png`, `2.png`, `3.png` y `5.png` complementan posturas de cuerpo entero, y las imágenes `9.png`–`11.png`, `13.png` y `14.png` aportan detalles de torso o posturas parciales. Ninguna es todavía una plantilla modular de producción. La evidencia no justifica iniciar rigging ni declarar construible un personaje 3D.

## 2. Alcance y estado del repositorio

- `main` auditado: `b508cfe7d3216eda801438d46dff8873842cea86`.
- Repositorio: público; la permanencia pública de los archivos es una decisión expresa del usuario.
- Carpeta comprobada en GitHub: 16 archivos `.png` numerados de 0 a 15 y un `README.md`.
- Se corrigió en esta entrega el README de la carpeta, que aún decía que solo había documentación. Se conserva el aviso de que la exposición pública no garantiza derechos de redistribución.
- No se ha modificado ni fusionado el PR #11 de anatomía/ropa. En su rama, el documento [BIMG-ENGINE-007](https://github.com/jonhararagi/botimagen/blob/feature/bimg-engine-001-cyberstreet-visual-renderer/docs/engineering/BIMG-ENGINE-007-PROPORTION-BODY-CONSTRUCTION-GATE.md) permanece `PARTIAL` y recomienda detener arreglos geométricos aislados y refactorizar el modelo visual antes de reconstruir anatomía. Esa recomendación sigue siendo la dependencia adecuada.
- PR #11 sigue abierto y sin fusionar, en `69e4e212aae6498a71a1296cebfd36bd4a9b50fd`; su base registrada es `46bc7e702ae5d608927345991b5c4f0a661318a9`, distinta del HEAD actual auditado. No se sincronizó ni alteró ese PR.

## 3. Inventario técnico

Todos los archivos tienen formato PNG real, modo RGBA, 8 bits por canal, color type PNG 6 (truecolor con alfa) y resolución 768×1280. En los 16, `alpha_extrema=[255,255]`, 0 píxeles transparentes, 0 píxeles semitransparentes y 983.040 píxeles opacos. El canal alfa existe técnicamente, pero no recorta el fondo.

| Archivo | Bytes | Dimensiones | Modo/profundidad | Alfa / transparencia | SHA-256 |
|---|---:|---:|---|---|---|
| `0.png` | 704,068 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `d9fc2f0dd2f747faf8a824feb7d200db98b8cc814252220f91b6f9493b340c8b` |
| `1.png` | 523,829 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `657dc29534fea940f4e7293ab702519cb301007b0a496795cff801a108a1e7ae` |
| `2.png` | 810,771 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `4aaa531e358e036c351eb67ccd77261bd544bd2391e148fed4995844cd588b8f` |
| `3.png` | 857,222 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `4c6828c3c26fada7de66f50e4aa326359a0baadb1dec778e3d35de8733766eef` |
| `4.png` | 1,069,595 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `d3ea1d425aa81adfa123f276fa735afc072208279d9b88276f606d3133929945` |
| `5.png` | 891,558 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `70b4980258a12808764364b5ca3b9f5b6cf427aa8197480de48400322894b6b4` |
| `6.png` | 1,116,151 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `8497d5756dc3d365e3dbca5c1e8f0ed74347b8d58a6b2f0b0b7d649bee3e2144` |
| `7.png` | 1,214,391 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `91d65a0317398d15edf6abee8a98214cac3767ba4d9083a1be276c6865c8e2b2` |
| `8.png` | 1,074,877 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `d6b28031c62c65a2a7150cd34c0641dd40ca9a7f2d7e9699b41006d24cdeae81` |
| `9.png` | 912,005 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `ffca802f619fda63de62bb35c6450f65f77f884274657a40ecc51b6b6f5ce649` |
| `10.png` | 851,759 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `2bf55523239d4b7019eaa085980ef87cae79b78c6b73548bbae6ff64ea287855` |
| `11.png` | 692,989 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `0d9a158690927814132ffe904911b83817e0d49fee07aa2b2d7aa7a172693360` |
| `12.png` | 611,302 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `85143742e095ee9f3c5115ba53e3b487eb50efc62080e272fdf6754003204d05` |
| `13.png` | 944,493 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `05572321bffb759c69e25fcb702c766a5b60ebddfae7914ea4987aa3ff4a977c` |
| `14.png` | 752,315 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `05a91ee22a2101c77bfdffb587dde2ae3c557dec41a156d07cdabc750d182622` |
| `15.png` | 855,222 | 768×1280 | RGBA, 8-bit, color type 6 | 255–255; transparencia real: **no** | `e4fa1f02592cdb721800678d34552fedc3e215d29f687db2f0c43f37726f728e` |

**Rango de tamaño:** `1.png` es el menor (523.829 bytes); `7.png` es el mayor (1.214.391 bytes).  
**Volumen total de originales PNG:** 13.882.547 bytes / 13,239 MiB.  
**Integridad de decodificación:** 16/16 `PASS_REAL`.  
**Repetición de hash:** 16/16 SHA-256 idénticos en las dos pasadas, `PASS_REAL`.  
**Estado del clon de inspección:** `git status --short` limpio; los PNG no se escribieron ni alteraron. El SHA-1 Git de cada archivo coincide con el identificador de blob publicado por GitHub.

Los valores completos, incluidos dHash, extremos del alfa, SHA-1 Git y clasificación visual, están disponibles en el [manifiesto JSON](BIMG-DATASET-001.manifest.json).

## 4. Clasificación visual individual

**Convenciones:** `VISUAL_REVIEWED` significa que la imagen se transfirió y observó directamente. `NOT_RUN` significa que no existe evidencia visual suficiente. “Tres cuartos/oblicua” no equivale a una vista ortográfica lateral. La visibilidad de codos o rodillas por el dibujo no significa que existan puntos de articulación, huesos o información de rigging.

| Archivo | Qué representa | Vista / pose | Brazos y piernas | Articulaciones / silueta | Fondo | Confianza | Utilidad y limitaciones |
|---|---|---|---|---|---|---|---|
| `0.png` | stylized human-body anime illustration | three-quarter frontal/oblique; not orthographic / standing contrapposto, torso/hips tilted | one arm lowered beside torso; other bent with hand near hip/back; piernas: both legs and feet visible, separated stance | elbow/knee contours and shading visible, no joint landmarks; silueta: mostly complete and readable; one arm overlaps/partly hides waist | opaque pale grey-white with orange symbol/star and ground shadow | HIGH for complete figure and broad pose; MEDIUM for exact view | full-body pose reference; secondary body-base trace candidate; límites: asymmetry; bent arm and decorative marks; non-orthographic perspective |
| `1.png` | stylized human-body anime illustration | three-quarter frontal/oblique / standing; one arm raised behind/above head, other hand near hip | raised arm bends behind head; opposite elbow flexed with hand at waist; piernas: full legs/feet visible, separated and slightly staggered | elbows and knees indicated by contour/shading, not annotated; silueta: full body visible; upper arm bends over/behind head | opaque white/off-white with orange marks and ground shadow | HIGH for pose; MEDIUM for exact view | raised-arm pose and full-body proportion reference; límites: arm/hand hidden behind head/hip; pose unsuitable as a clean neutral base |
| `2.png` | stylized human-body anime illustration | oblique side/three-quarter; not a true side orthographic view / standing with pronounced torso and hip turn | arms largely held behind or along the torso; hands partly occluded; piernas: full legs/feet visible; staggered, one foot turned sideward | knees/ankles legible by shading, no skeleton/joint guides; silueta: complete; arm and torso overlaps hide some landmarks | opaque pale grey-white with decorative orange marks and ground shadow | HIGH for complete figure; MEDIUM for pose/view | three-quarter body, pelvis and leg reference; límites: rotated perspective; arms occluded; not an anatomical side view |
| `3.png` | stylized human-body anime illustration | three-quarter side/oblique, not orthographic / standing, curved torso and hips rotated, one leg extended outward | arms mostly behind torso; hands only partly visible; piernas: full legs/feet visible, wide and staggered stance | elbows/knees discernible from drawing but not explicit landmarks; silueta: complete, hair extends far behind head; some arm contours occluded | opaque pale grey-white, orange marks and ellipse-like ground shadow | HIGH for full-body pose; MEDIUM for exact view | oblique pose and leg silhouette reference; límites: perspective and torso twist make dimensions unsuitable as direct parameter values |
| `4.png` | stylized human-body anime illustration | frontal/near-frontal, slight obliqueness possible / upright standing, ankles crossed | both arms/hands visible, held behind or close to body; both legs and bare feet visible, lower legs cross at ankles | no explicit landmarks; full-body silhouette head-to-feet, overlap at ankles and arms | opaque pale off-white, oval ground shadow and orange sparkles | HIGH for framing/leg visibility; MEDIUM for exact view/arm placement | full-body standing reference incl. feet; limits: arm overlap, crossed ankles, opaque decorative background |
| `5.png` | stylized human-body anime illustration | three-quarter frontal/oblique / standing with both hands at hips and legs apart | both elbows bent; hands rest on/near waist; piernas: full legs and feet visible, wide stance | elbows/knees marked by line and shading, not annotated; silueta: complete and readable; hands/forearms cover parts of waist | opaque white with orange sparkles and ground shadow | HIGH for pose and full-body classification; MEDIUM for view | full-body pose; waist/hip and stance reference; límites: arms cover waist landmarks; decorative elements; asymmetric perspective |
| `6.png` | stylized human-body anime illustration | near-frontal with slight turn / standing, arms low and outward, elbows slightly bent, hips tilted | both arms/hands visible; legs to lower shins; feet outside frame | no explicit landmarks; head through lower shins, feet cropped | opaque pale off-white with orange star/spark shapes | HIGH for crop/pose; MEDIUM for exact view/hip angle | torso, arms, hands and upper-leg reference; not full-body |
| `7.png` | stylized human-body anime illustration | three-quarter/oblique, face turned toward viewer / side-leaning; both arms raised and bent behind/over head | arms substantially visible, hands near frame edges; hips and upper thighs visible, lower legs/feet cropped | no explicit landmarks; elbows partly obscured; head-to-upper-thigh crop | opaque pale off-white with orange sparkles | HIGH for broad pose/crop; MEDIUM for exact hand placement | raised-arm, shoulder, torso and hip reference; poor lower-limb reference |
| `8.png` | stylized human-body anime illustration | near-frontal three-quarter/oblique / torso and hips curved, arms lifted outward/upward | upper arms only; forearms/hands clipped at side edges; hips/upper thighs visible, lower legs/feet cropped | no explicit landmarks; silhouette cut at both sides and mid-thigh | opaque pale off-white with orange motif near upper right | HIGH for crop/gesture; MEDIUM for exact view/curve | upper-body, shoulder, arm silhouette and hip reference; not complete-limb reference |
| `9.png` | stylized human-body anime illustration (partial crop) | three-quarter frontal/oblique / upper-body pose with both arms lifted overhead/behind head | both upper arms lifted; hands largely hidden behind head and cropped near top; piernas: hips and upper thighs visible; lower legs/feet absent because image is cropped | shoulder/arm contours visible, elbow articulation partly obscured by head/arms; silueta: torso clear; full-body outline absent by crop | opaque off-white, orange symbol and no alpha transparency | HIGH for crop and raised-arm pose; MEDIUM for exact view | shoulder/underarm/upper torso reference; límites: not a base body; hands, lower legs and feet unavailable |
| `10.png` | stylized human-body anime illustration (partial crop) | three-quarter/oblique, leaning pose / dynamic leaning torso, arms extended laterally | both arms reach outward and are clipped by left/right frame edges; piernas: upper thighs only partly shown; lower legs and feet absent due crop | shoulder and elbow paths visible but distal limbs clipped; silueta: incomplete; arms exit frame and one side of body reaches canvas edge | opaque near-white, decorative orange symbol; no transparency | HIGH for crop and extended arms; MEDIUM for view | torso, shoulder and arm-extension reference; límites: cannot supply complete pose or body silhouette; limbs truncated at borders |
| `11.png` | stylized human-body anime illustration (partial crop) | oblique/three-quarter / dynamic torso twist; one arm stretched horizontally across/out of frame | one arm extends to right edge and is clipped; opposite arm partly obscured; piernas: image ends around thighs; calves/feet absent | elbow contour visible on extended arm; no explicit articulation landmarks; silueta: partial and partly occluded by horizontal arm | opaque near-white with orange decorative symbols | HIGH for crop and arm gesture; MEDIUM for exact view | shoulder/elbow and horizontal reach reference; límites: cropped extremity and lower body; arm crosses torso silhouette |
| `12.png` | stylized human-body anime illustration | near-frontal with mild obliqueness; not a measured orthographic view / full-body standing, arms angled outward and down; legs close/slightly staggered | both arms separated from torso, hands extended out to sides; piernas: both full legs and feet visible; knees/ankles close with slight overlap | elbows and knees discernible; no joint landmarks, rig guide or skeleton; silueta: one of clearest complete silhouettes in reviewed subset; some leg overlap | opaque near-white with orange sparkles and ground ellipse | HIGH for complete near-frontal figure; MEDIUM for neutrality | PRIMARY candidate for manual 2D base-body tracing/reference; límites: not A/T pose; arms angled down; legs overlap slightly; background must be removed manually |
| `13.png` | stylized human-body anime illustration (partial crop) | three-quarter/oblique with hip and torso turned / standing/leaning upper-body pose with hip shifted | one arm runs close to/behind torso and is not fully separable; piernas: pelvis and upper thighs are visible; lower legs/feet absent | shoulder/elbow detail partial; no explicit joint markers; silueta: torso/hip contour readable; whole body cropped at thighs | opaque pale grey-white with orange marks | HIGH for crop and torso/hip pose; MEDIUM for view | secondary torso, bust, waist and hip contour reference; límites: cropped lower body; hair/decorations; arm merges visually with torso |
| `14.png` | stylized human-body anime illustration (partial crop) | oblique, looking back across a turned torso / dynamic twist; one arm extended across and out of frame | horizontal arm crosses/overlaps upper torso and exits right edge; piernas: upper legs visible; lower legs/feet absent because of crop | shoulder/elbow linework visible but arm/torso overlap obscures landmarks; silueta: incomplete and occluded by the extended arm | opaque white/off-white; orange symbols | HIGH for dynamic twist and crop; MEDIUM for exact view | torso rotation and arm reach reference; límites: arm and body overlap; extremity and lower body clipped |
| `15.png` | stylized human-body anime illustration | near-frontal three-quarter/oblique / full-body standing contrapposto; arms extended diagonally outward | both arms reach away from torso with hands visible; piernas: full legs/feet visible, legs close and slightly staggered/overlapped | knee/elbow contours visible but no landmarks or joint axes; silueta: complete and clear; some leg/foot overlap | opaque pale grey-white with orange sparkles and ground shadow | HIGH for complete silhouette; MEDIUM for view | SECONDARY full-body candidate and pose/silhouette reference; límites: asymmetry and leg overlap; not orthographic or A/T pose |

### Observaciones compartidas del subconjunto visualmente revisado

- El lenguaje de dibujo es muy cercano entre las imágenes vistas: figura anime estilizada, sombreado de piel, cabello castaño y elementos decorativos naranja. Esto sugiere coherencia de estilo, **pero no demuestra que se generaran desde un mismo modelo corporal o proceso**.
- Se identifican como mínimo siete cuerpos enteros directamente observados: `0.png`, `1.png`, `2.png`, `3.png`, `5.png`, `12.png` y `15.png`. Los cuatro archivos aún no vistos podrían ampliar o cambiar ese recuento.
- No hay una secuencia de frente, perfil y espalda en condiciones controladas dentro de las imágenes revisadas. Las vistas oblicuas son referencias de perspectiva, no ortografías.
- No se observa una pose A/T neutra estandarizada. En muchas posturas los brazos ocultan cintura, espalda o axila; varias imágenes están recortadas antes de las rodillas, pantorrillas o pies.
- Los codos, las rodillas y los contornos son dibujados a mano mediante línea y sombreado. No hay puntos anatómicos etiquetados, esqueleto, pesos de huesos ni evidencia de que la forma se deforme correctamente en otra pose.
- Los fondos son esencialmente claros pero opacos; incluyen brillos/símbolos naranjas y sombras de suelo. El alfa no permite extraer el cuerpo automáticamente.

## 5. Duplicados y similitud visual aproximada

- **Duplicados exactos por SHA-256:** ninguno.
- **Hashes perceptuales:** dHash de 64 bits implementado sobre una reducción en escala de grises de 9×8. Este cálculo es solo un filtro exploratorio; el fondo repetido y el estilo común afectan los resultados. No se fijó un umbral empírico, por lo que no se etiqueta ninguna pareja como duplicada o casi duplicada.
- Las parejas con distancia más baja en este dHash fueron `12.png`–`15.png` (12 bits distintos), `0.png`–`1.png` (13), `1.png`–`3.png` (16), `8.png`–`13.png` (16), `3.png`–`5.png` (17) y `9.png`–`14.png` (17). Son únicamente **candidatas para comparación manual**, no duplicados confirmados. `8.png` además no tuvo inspección visual, de modo que cualquier interpretación de esa pareja queda especialmente limitada.

## 6. Candidatos para cuerpo base y poses

1. **Candidato primario: `12.png`.** Cuerpo entero, vista casi frontal y ambos brazos separados del torso hacia abajo. Su silueta se lee mejor que las poses con manos sobre la cintura o extremidades levantadas. No es frontal ortográfico ni A/T neutra; las piernas se acercan y se solapan ligeramente, y habría que trazar una silueta propia y separar el fondo.
2. **Candidato secundario: `15.png`.** Cuerpo entero, brazos visibles separados del torso y pies presentes. La postura es asimétrica y las piernas se acercan/solapan, por lo que resulta útil como contraste de pose, no como plantilla exacta.
3. **Referencias de cuerpo completo adicionales:** `0.png` para contrapposto; `1.png` para un brazo elevado; `2.png` y `3.png` para perspectivas oblicuas; `5.png` para manos en cintura y postura amplia.
4. **Referencias parciales:** `9.png` para hombros/axilas con brazos arriba; `10.png` para torso y alcance lateral; `11.png` y `14.png` para el brazo horizontal y torsión; `13.png` para cintura/cadera.

Los candidatos son referencias de diseño, **no assets aprobados ni bases directamente importables**. Antes de integrar o redistribuir una silueta habrá que resolver procedencia/derechos y decidir una limpieza o redibujado original.

## 7. Evaluación de los cuatro caminos

| Camino | Evidencia disponible | Viabilidad actual | Confianza | Veredicto |
|---|---|---|---|---|
| **A. Cuerpo base 2D** | Al menos siete cuerpos enteros observados, contorno pintado y estilo cercano; fondos opacos y decoraciones | **Media** para referencia y trazado manual; baja para extracción automática sin limpieza | Media | Priorizar un cuerpo SVG/2D propio usando `12.png` como referencia y un modelo de landmarks compartidos |
| **B. Variaciones paramétricas** | Hay variaciones de silueta/pose, pero no poses normalizadas ni etiquetas de medidas | **Baja** para inferir altura, anchura o complexión mediante medición automática; media para estudio manual una vez normalizadas las posturas | Baja-media | No codificar sliders según diferencias entre imágenes hasta registrar landmarks y distinguir pose de proporción corporal |
| **C. Biblioteca de poses** | Varias posturas de pie, brazo elevado, manos a la cintura, brazos extendidos y torsiones; cinco imágenes son recortes de torso | **Media** como colección de referencia; baja-media como biblioteca estructurada | Media | Crear luego metadatos/etiquetas por pose y vista. Completar antes la revisión de 4, 6, 7 y 8 |
| **D. Futuro sistema 3D** | Referencias 2D estilizadas con contorno, luz/sombreado y algunos ángulos oblicuos | **Baja** para construir un personaje 3D articulado directamente | Alta respecto a las carencias de datos | Solo usarlas como guía visual; se necesitan malla/topología, vistas controladas o modelado 3D original, UV, materiales y pesos de huesos |

### Lo que las imágenes no proporcionan por sí mismas

No aportan geometría tridimensional, malla, topología, UV, materiales, mapa de normales, esqueleto, pesos de huesos, rigging facial, físicas de ropa ni prendas que sigan articulaciones. La perspectiva pintada y las sombras no permiten recuperar profundidad única. Tampoco prueban medidas reales o consistencia anatómica de una base reutilizada en distintas poses.

## 8. Procedencia, licencia y publicación

| Campo | Estado verificado |
|---|---|
| Repositorio público | `VERIFIED_PUBLIC` |
| Presencia de los 16 PNG | `PASS_REAL` |
| Autoría/origen individual | `UNKNOWN` |
| Licencia declarada | `UNVERIFIED` |
| Derecho de redistribución | `UNVERIFIED` |
| Uso comercial | `UNVERIFIED` |
| Edad exacta de la figura estilizada | `UNKNOWN` |
| Consentimiento/licencia de la fuente original | `UNKNOWN` |

El permiso expreso del usuario para conservar la carpeta pública decide el estado deseado del repositorio, pero no demuestra autoría ni amplía licencias de terceros. Esta auditoría no encontró evidencia suficiente para conceder derechos de reutilización. Hasta aclararlo, tratar las imágenes como referencias internas y no como recursos redistribuibles empaquetados con BotImagen.

## 9. Recomendación priorizada

**Adoptar un enfoque 2D primero con dirección híbrida futura (confianza: MEDIA).**

1. Completar la inspección visual de `4.png`, `6.png`, `7.png` y `8.png`, y documentar la procedencia/licencia si existe una fuente verificable.
2. Seguir la recomendación de BIMG-ENGINE-007: refactorizar el renderer hacia landmarks corporales canónicos, una silueta frontal/trasera coherente y un contrato de capas compartido antes de otra ronda de retoques anatómicos aislados.
3. Usar `12.png` como referencia primaria de trazado/medición y `15.png` como secundaria, conservando los originales. Definir landmarks medibles y un checklist manual de silueta antes de declarar parámetros de altura, anchura o complexión funcionales.
4. Mantener ropa, rostro, cabello y anatomía separados en capas de renderizado con reglas de oclusión explícitas. No trasladar los adornos ni el fondo de las referencias como componentes del cuerpo.
5. Reconsiderar un prototipo 3D solo después de probar un flujo de modelado propio con vistas controladas y una malla/rig de prueba. No derivar topología ni rigging directamente del PNG.

Esta secuencia mantiene compatibilidad con el MVP React/TypeScript/Vite + servicio Python local, reduce el riesgo de seguir añadiendo coordenadas SVG especiales y no introduce dependencias pesadas.

## 10. Herramientas, comandos y método reproducible

El análisis técnico se ejecutó sobre un clon temporal de solo lectura, con HEAD `b508cfe7d3216eda801438d46dff8873842cea86`; `git status --short` quedó limpio.

- Enumeración de carpeta: GitHub Contents API para `references/dataset-cuerpos/`.
- Clonación: `git clone --depth 1 https://github.com/jonhararagi/botimagen.git repo`.
- Inventario: Python 3 + Pillow; abrir cada PNG, ejecutar `Image.verify()`, consultar dimensiones/modo y recorrer el canal alfa.
- SHA-256: `hashlib.sha256(path.read_bytes()).hexdigest()`, dos pasadas.
- SHA-1 Git para integridad del blob: `git hash-object <ruta>`, cotejado con el SHA del blob de GitHub.
- Similitud exploratoria: dHash 64-bit con conversión a escala de grises y redimensionado en memoria a 9×8. No se guardaron esas matrices como archivos.
- Se inspeccionaron visualmente los 16 originales (`0.png`–`15.png`) desde sus URLs raw de GitHub. Las cuatro imágenes antes pendientes se describen en la tabla visual y en el manifiesto, con evidencia enlazada a cada PNG.

## 11. Estados de pruebas

| Comprobación | Estado | Evidencia |
|---|---|---|
| Listado actual y conteo de archivos en GitHub | `PASS_REAL` | 16 PNG numerados y README |
| Lectura/decodificación de cada PNG | `PASS_REAL` | Pillow `Image.verify()`: 16/16 |
| Dimensiones, modo, profundidad y alfa | `PASS_REAL` | Metadatos de los 16 originales |
| SHA-256 de todos los originales | `PASS_REAL` | Segunda pasada idéntica |
| Duplicados exactos por hash | `PASS_REAL` | Ningún grupo duplicado |
| Parejas de similitud dHash | `PARTIAL` | Orden exploratorio; umbral sin calibrar |
| Inspección visual | `PASS_REAL` | 16/16 inspeccionados; clasificación visual, no medición anatómica |
| Procedencia/licencias individuales | `UNKNOWN` | No hay datos verificables en los metadatos/documentación consultados |
| Validación sintáctica del manifiesto | `PASS_STATIC` | JSON parseado antes de publicar |
| Enlaces internos relevantes | `PASS_STATIC` | Rutas relativas verificadas con el árbol de archivos de esta entrega |
| Suite completa de CI | `NOT_RUN` | Cambio documental/manifiesto; no se necesitó la batería de código |
| Prueba física de Windows | `NOT_RUN` | No disponible en esta sesión |

## 12. Límites y riesgos

- Cuatro imágenes carecen de clasificación visual en esta iteración.
- Los hashes de archivos prueban identidad binaria, no derechos de autor.
- La semejanza visual aproximada no prueba que los archivos compartan el mismo personaje base o sean duplicados.
- El fondo opaco impedirá una superposición limpia sin trazado o segmentación posterior.
- Las posturas oblicuas y recortadas no deben usarse para inferir medidas paramétricas sin normalización y landmarks.
- Mantener los originales públicos expone el dataset para descarga. La licencia sigue sin verificar.
- Esta tarea no crea ni implementa un editor 3D, rigging, malla, UV, deformación de ropa o personalización paramétrica corporal.

## 13. Próxima tarea recomendada

La inspección visual de BIMG-DATASET-001 queda cerrada para los 16 archivos. La procedencia, autoría, licencia y derechos de redistribución siguen `UNKNOWN` / `UNVERIFIED`; no deben deducirse a partir del estilo ni de la presencia en un repositorio público.

**Siguiente hito: BIMG-ENGINE-007.** Antes de reconstruir anatomía, definir landmarks corporales compartidos y su normalización; fijar un contrato explícito de capas/orden de renderizado; mantener siluetas frontal y posterior coherentes; comprobar compatibilidad con las tres prendas y controles existentes; añadir pruebas de continuidad y capturas comparables. Preservar APIs públicas, IDs de catálogo, perfiles, recetas y controles. No introducir rigging/3D ni rediseñar el renderer fuera del alcance aprobado.


## TIMER final

- **Estimación inicial solicitada:** 30–60 minutos.
- **Tiempo real medido:** `NOT_MEASURED`; no hay cronómetro de sesión fiable, por lo que no se inventa una duración.
- **Resultado:** 16/16 imágenes inspeccionadas; documentación y manifiesto sincronizados; originales intactos.
- **Estimación revisada de BIMG-ENGINE-007:** 1–2 días de trabajo concentrado para diseño del contrato, implementación acotada y pruebas/capturas; recalcular tras revisar el estado exacto del PR #11. Investigación de procedencia/licencia queda como tarea separada sin plazo fiable.
