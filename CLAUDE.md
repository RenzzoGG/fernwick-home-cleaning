# CLAUDE.md

Reglas de trabajo para este repositorio.

## Sobre el proyecto

- Fernwick Home Cleaning: negocio de limpieza **ficticio** de concepto. Este repo contiene su landing page, hecha con HTML, Tailwind CSS y JavaScript.
- Forma parte del portafolio de Renzzo (renzzogg.com). Antes vivía en `src/cleaning-landing/` del repo del portafolio (con el build en `public/projects/cleaning-landing/`); se extrajo aquí conservando su historial de git.
- Desplegado en **Railway** en **fernwick.renzzogg.com** desde la rama `main`.
- **Cada push a `main` se publica en vivo** en fernwick.renzzogg.com vía Railway.
- Railway **sí ejecuta el build**: Railpack detecta `package.json` (proveedor de Node), corre `npm ci` y `npm run build`, y sirve `dist/` como sitio estático con Caddy. Variables del servicio en Railway:
  - `RAILPACK_SPA_OUTPUT_DIR=dist` → fuerza el modo de sitio estático y le dice qué carpeta servir.
  - `RAILPACK_NODE_NPM_INSTALL=npm ci` → instala exactamente lo de `package-lock.json` (por defecto Railpack usa `npm install`).
- No agregar un script `start` a `package.json`: Railpack lo trataría como app de Node y dejaría de servir `dist/` con Caddy.

## Estructura del repo

```
index.html               # Landing (fuente)
js/main.js               # Menú móvil, animaciones al hacer scroll, validación del formulario (envío simulado)
assets/favicon.svg
styles/input.css         # Entrada de Tailwind v4 (@theme, @source)
scripts/copy-static.mjs  # Copia index.html, js/ y assets/ a dist/
package.json             # Scripts dev/build y Tailwind con versión exacta
package-lock.json
dist/                    # Resultado del build (NO se commitea, está en .gitignore)
README.md
CLAUDE.md
.gitignore
```

- **Se editan solo las fuentes** (raíz del repo). **Nunca** editar `dist/` a mano: se borra y regenera en cada build.
- `dist/` y `node_modules/` están en `.gitignore`; no se commitean.
- Las rutas a recursos propios son **relativas** (`css/styles.css`, `js/main.js`, `assets/...`).

## Build con Tailwind

- Comandos, desde la raíz del repo:
  - `npm ci` — instala exactamente lo de `package-lock.json` (primera vez o tras clonar).
  - `npm run dev` — copia HTML/JS/assets a `dist/` y regenera el CSS al guardar. Ver en otra terminal con `python3 -m http.server 8000 -d dist` → `http://localhost:8000`.
  - `npm run build` — limpia `dist/`, copia los estáticos y genera `dist/css/styles.css` minificado.
- Antes de cada commit que toque la landing, correr `npm run build` para comprobar que compila (el resultado no se commitea).
- La configuración de Tailwind v4 está en `styles/input.css` (`@theme`, `@source`); no hay `tailwind.config.js`. No construir nombres de clase concatenando strings en JS: el escáner no los detecta.

## Forma de trabajo

- Soy estudiante de Ingeniería de Software y quiero aprender: **explica las decisiones importantes antes de implementarlas** (qué opciones hay, cuál recomiendas y por qué).

## Git

- Trabajamos directo en la rama `main`, **sin crear ramas nuevas**.
- Haz commits **locales** con mensajes claros en español.
- **NUNCA** hagas `git push` ni ningún otro comando que suba cambios al remoto. El push lo hago yo.

## Stack

- HTML, Tailwind CSS y JavaScript puro, sin frameworks.
- **Única dependencia de npm aprobada:** Tailwind CSS (`tailwindcss` y `@tailwindcss/cli`), con **versión exacta** fijada en `package.json` (hoy 4.3.3). No agregar otras dependencias sin mi aprobación explícita.
- Fuentes desde Google Fonts. Si se usa alguna librería desde CDN, siempre con versión exacta.

## Reporte al terminar cada tarea

Al terminar cada tarea, entrega un **REPORTE** con:

1. Qué hiciste.
2. Archivos creados / modificados / borrados.
3. Commits hechos (hash y mensaje).
4. Problemas o dudas.
5. Siguientes pasos sugeridos.
