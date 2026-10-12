# Visión del producto · BotImagen Character Studio

**Estado:** VISIÓN DE PRODUCTO APROBADA COMO DIRECCIÓN; implementación futura, no comprometida todavía.  
**Fecha de registro:** 2026-10-10  
**Alcance:** producto creativo general, más allá de BaseWarriors: Meta-Strike.

## 1. Qué queremos construir

BotImagen aspira a convertirse en un **estudio personal de creación y exploración de personajes**, con una experiencia de personalización inspirada en la libertad y la profundidad de un creador como Koikatsu, pero orientada a desarrollar personajes originales para videojuegos, historias, novelas, cómics y proyectos hechos por diversión.

La persona usuaria debe poder crear un personaje desde una idea, ajustar sus rasgos visuales, combinar prendas y accesorios, probar estilos, guardar el diseño y volver a editarlo después. El mismo laboratorio también debe ayudar a imaginar protagonistas y secundarios cuando surge una historia nueva y todavía no se tiene claro cómo se ven.

BaseWarriors: Meta-Strike es un proyecto beneficiario, **no el límite de BotImagen**.

Koikatsu es una referencia de experiencia de personalización, no una instrucción de copiar su software, sus modelos, sus recursos ni sus diseños.

## 2. La experiencia deseada

El objetivo a largo plazo es un creador visual modular, preferentemente con un modo de personaje 3D que se pueda girar y observar desde distintas perspectivas, y con opciones para obtener retratos o ilustraciones del diseño. La viabilidad y el alcance exactos de ese modo 3D deben investigarse antes de comprometer una implementación.

Las herramientas que queremos explorar son:

- **Identidad del personaje:** nombre, edad adulta cuando corresponda, personalidad, rol, historia, mundo y notas para la narrativa.
- **Rasgos y proporciones:** rostro, ojos, cejas, nariz, boca, cabello, altura, constitución y otros rasgos compatibles con cada estilo.
- **Ropa y accesorios por capas:** prendas, calzado, sombreros, armadura, joyería, armas y objetos.
- **Variaciones controladas:** elegir opciones manualmente, bloquear rasgos preferidos, aleatorizar solo el resto, duplicar un diseño y crear versiones alternativas.
- **Presentación:** poses, expresiones, fondos, iluminación y encuadres compatibles con el motor visual.
- **Biblioteca personal:** guardar personajes, perfiles, variantes, referencias y notas para retomarlos en el futuro.
- **Salida creativa:** fichas visuales, retratos e imágenes de referencia. La exportación de recursos listos para un juego es una capacidad posterior que necesitará criterios técnicos propios.

No es necesario preparar todas las combinaciones de personajes de antemano. Queremos catálogos modulares con piezas compatibles, reglas de exclusión y variaciones de color y forma para conseguir una cantidad de combinaciones muy amplia. “Casi infinito” describe esa ambición combinatoria, no una promesa matemática de que cualquier combinación se verá bien.

## 3. Tres direcciones artísticas iniciales

Los tres estilos deben aparecer como **opciones diferenciadas** del creador, no mezclarse al azar en una única ilustración. Cada uno puede necesitar piezas, reglas de renderizado y recursos propios.

### A. Sci-fi anime de alto acabado, inspirado en NIKKE

Dirección objetivo: personajes anime de ciencia ficción con acabado de ilustración gacha premium, vestuarios técnicos detallados, siluetas fuertes, materiales definidos, iluminación dramática, contornos limpios y acabado pulido.

“NIKKE” es aquí una referencia de dirección visual. BotImagen debe favorecer personajes, vestuarios y diseños originales; no copiar personajes oficiales, ilustraciones, logotipos ni recursos del juego.

### B. Pixel art

Dirección objetivo: personajes pixelados diseñados intencionalmente a una resolución y una escala de píxel determinadas, con paletas controladas, siluetas legibles y agrupación coherente de píxeles.

No debe ser simplemente una ilustración de alta resolución con un filtro de pixelado automático. La investigación debe determinar cómo construir un catálogo propio de piezas pixel art, animaciones o plantillas coherentes. Este estilo puede requerir un flujo 2D separado del creador 3D.

### C. Toon Style

Dirección objetivo: arte cartoon con influencia anime, contornos marcados, cel shading, gradientes pictóricos selectivos, reflejos brillantes y formas expresivas.

Como referencias de investigación se puede estudiar la página **a-teddy-a Toon Style LoRA**: https://pixai.art/es/model/2064199521616992635 y otros candidatos cartoon-anime ya registrados en el catálogo de investigación.

Esta referencia no está aprobada como dependencia del producto ni como recurso redistribuible. Deben verificarse su licencia, sus términos y su utilidad real antes de incorporarla. No confundirla con modelos que se anuncian expresamente como hentai o contenido adulto; estos deben evaluarse separadamente y no formar parte del estilo predeterminado.

## 4. Un catálogo amplio sin dibujar todo desde cero

La base del concepto es combinar elementos compatibles: peinados, rostros, ojos, prendas, materiales, accesorios, paletas, proporciones y rasgos distintivos. Con suficientes componentes bien diseñados, las combinaciones crecen rápidamente.

El catálogo debe priorizar **calidad, compatibilidad y coherencia artística**, no acumular miles de archivos sin curación. Se pueden incorporar nuevas piezas y paquetes de estilo cuando haya evidencia de procedencia y permisos.

Un recurso puede servir para uno de varios propósitos, que deben distinguirse:

- inspiración visual y estudio;
- referencia para diseñar una pieza original;
- uso local autorizado;
- modificación autorizada;
- redistribución autorizada.

Encontrar una imagen en Internet, verla públicamente o usar BotImagen de forma personal no concede por sí mismo permiso para descargarla, entrenar modelos, modificarla o publicarla dentro de un repositorio. Registrar autoría, fuente y licencia; cuando la licencia no esté clara, mantener el recurso como pendiente y no incorporarlo.

## 5. Arquitectura conceptual

Separar los datos del personaje de la manera en que cada estilo lo representa:

1. **Perfil del personaje:** opciones escogidas, rasgos bloqueados, campos automáticos, semilla o identificador de variantes, notas narrativas y metadatos.
2. **Biblioteca de componentes:** recursos locales indexados, categorías, compatibilidades, fuentes, licencia, hashes y etiquetas.
3. **Paquetes de estilo:** reglas visuales y recursos específicos para sci-fi anime inspirado en NIKKE, pixel art y Toon Style.
4. **Presentación y salida:** visor, composición de piezas, renderizado o exportación según las capacidades de cada paquete.

No asumir que un mismo conjunto de modelos 3D puede producir automáticamente los tres estilos con calidad equivalente. El estilo 3D/sci-fi anime y el pixel art pueden requerir pipelines distintos bajo una experiencia de usuario común.

### IA como módulo opcional

El producto **no debe depender de generar imágenes mediante IA cada vez que se cambia una pieza**. La personalización de elementos ya catalogados debe poder funcionar sin hacer inferencia neuronal para cada cambio.

Una integración futura de IA local o externa puede ayudar a explorar conceptos, crear variaciones o producir ilustraciones, pero será un módulo independiente, evaluado después de medir rendimiento, coste, derechos, privacidad y calidad. No es requisito para completar la beta local actual.

## 6. Relación con el producto existente

BotImagen ya tiene un motor local de rasgos, catálogos, generación de perfiles/prompts y una interfaz web local-first en evolución. Debemos preservar lo que funciona y ampliar el sistema de forma incremental.

Esta visión describe el **destino creativo a largo plazo**, no el estado implementado. No declara que exista ya un creador 3D, un catálogo infinito, un renderizador de los tres estilos ni una IA local.

El progreso porcentual de la beta de Windows se calcula exclusivamente según el alcance de beta documentado en PROGRESO.md. La visión futura no debe inflar ese porcentaje ni bloquear la finalización de la beta actual.

El camino preferido es:

1. cerrar y estabilizar la beta local existente;
2. completar la investigación de referencias visuales, licencias y bibliotecas;
3. preparar una prueba de concepto visual acotada para elegir el primer paquete de estilo;
4. probar la viabilidad de personalización y presentación 3D;
5. decidir cómo construir el catálogo y qué partes requieren un flujo 2D independiente;
6. ampliar de forma modular, con evidencia y pruebas por etapa.

## 7. Criterios para tomar decisiones futuras

Una propuesta nueva encaja con la visión si:

- ayuda a crear, personalizar, guardar o explorar personajes originales;
- puede reutilizarse en distintas historias y juegos, no solo en BaseWarriors;
- preserva la posibilidad de mantener una dirección artística coherente;
- distingue referencias de inspiración de recursos autorizados para producción;
- no incorpora recursos de terceros sin verificar derechos;
- no exige ejecutar un modelo de IA grande para cada operación sencilla;
- conserva la separación entre datos del personaje, componentes y presentación;
- se justifica con una prueba de concepto antes de asumir una gran carga de trabajo.

## 8. TIMER y estimación

Esta actualización es documentación de visión, no implementación del creador completo. La duración de un producto de esta ambición no se debe estimar con seriedad hasta definir el alcance del primer prototipo y probar una biblioteca representativa.

Como previsión inicial, un **prototipo de viabilidad acotado** (un estilo, un personaje base, personalización de un conjunto pequeño de rasgos y guardado/carga) podría requerir aproximadamente **2–5 días de trabajo técnico**, dependiendo de la reutilización de las herramientas existentes. No incluye fabricar un catálogo de calidad comercial ni completar los tres estilos.

**Decisión de continuidad:** conservar este documento como la visión oficial de producto de BotImagen. Las tareas técnicas deben indicar si pertenecen a la beta local actual o a una fase futura de Character Studio.
