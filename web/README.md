# BotImagen Studio Web · Prototipo

Shell inicial de la futura interfaz local-first.

## Requisitos y comandos

Requiere Node.js 22 y npm. Para instalar las dependencias durante el desarrollo se necesita acceso al registro npm.

```bash
cd web
npm install
npm run dev
```

Vite se limita por defecto a 127.0.0.1. Para compilar: `npm run build`.

## Implementado en este spike

- Interfaz adaptable React + TypeScript + Vite.
- Categorías interactivas de identidad, cuerpo, cabello, rostro y pose.
- Opciones tipadas copiadas de IDs y etiquetas existentes en `character_rules.json`.
- Controles FIJO/AUTO, exploración demostrativa mediante semilla.
- Vista de prompt de muestra, copiar texto, exportar JSON y guardado temporal en localStorage.
- Indicaciones explícitas para rasgos que aún faltan, como color/distribución de escamas y tamaño del busto.

## Límites

La UI no está conectada a `character_generator.py`, no carga `character_rules.json` en tiempo de ejecución, no integra la biblioteca visual ni importa assets. El texto de prompt y la elección AUTO son solo demostraciones. El perfil guardado usa localStorage y no una carpeta local gestionada por Python. La silueta SVG es una pieza de interfaz temporal, no arte generado.

Antes de la beta hay que añadir y verificar `package-lock.json`, realizar un smoke test real en Chrome/Edge y Windows, e integrar el motor a través de una API local segura.
