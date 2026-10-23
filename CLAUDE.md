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
js/main.js               # Menú móvil, animaciones al hacer scroll, validación y envío del formulario a la API
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
  - `npm run dev` — copia HTML/JS/assets a `dist/` y regenera el CSS al guardar. Ver en otra terminal con `python3 -m http.server 8080 -d dist` → `http://localhost:8080` (el puerto 8000 es de la API).
  - `npm run build` — limpia `dist/`, copia los estáticos y genera `dist/css/styles.css` minificado.
- Antes de cada commit que toque la landing, correr `npm run build` para comprobar que compila (el resultado no se commitea).
- La configuración de Tailwind v4 está en `styles/input.css` (`@theme`, `@source`); no hay `tailwind.config.js`. No construir nombres de clase concatenando strings en JS: el escáner no los detecta.

## Conexión con la API

- El formulario envía `POST /v1/public/quotes` a la API de `fernwick-platform` (ver su `docs/DESIGN.md`).
- `API_URL` se decide en `js/main.js` según `location.hostname`: en `localhost`/`127.0.0.1` → `http://localhost:8000`; en cualquier otro → `https://fernwick-api.renzzogg.com`. No leer la URL de la query string.
- El origen de la landing debe estar en `CORS_ORIGINS` de la API (en desarrollo, `http://localhost:8080`).
- La API usa `home_size` y `preferred_date`; el HTML conserva `size` y `date` y `buildPayload()` los traduce. `website` es el honeypot.

## Cache busting (`?v=`)

- En `index.html`, el CSS y el JS se enlazan con un número de versión: `css/styles.css?v=N` y `js/main.js?v=N`. Al cambiar el número, el navegador lo trata como un archivo nuevo y no usa la copia vieja de su caché.
- **Regla:** sube el `?v=` de un archivo **una vez por publicación** (push a `main`) **solo si ese archivo cambió**. Si en la misma publicación hay varios commits que lo tocan, se sube una sola vez.
- El CSS cambia también cuando se usan clases de Tailwind nuevas o distintas en `index.html` o `js/`, aunque no se toque `styles/input.css`; en ese caso también se sube su `?v=`.
- Cada archivo lleva su propio contador: si solo cambia el JS, solo se sube `js/main.js?v=`.

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
