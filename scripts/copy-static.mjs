// Copia los archivos estáticos (HTML, JS y assets) de src/cleaning-landing/
// a public/projects/cleaning-landing/. El CSS lo genera la CLI de Tailwind.
//   node scripts/copy-static.mjs           → copia una vez
//   node scripts/copy-static.mjs --clean   → borra la carpeta de salida y copia
//   node scripts/copy-static.mjs --watch   → copia y vuelve a copiar al guardar cambios
import { cpSync, rmSync, mkdirSync, watch } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "../../public/projects/cleaning-landing");
const entries = ["index.html", "js", "assets"];

function copyAll() {
  mkdirSync(outDir, { recursive: true });
  for (const entry of entries) {
    cpSync(resolve(root, entry), resolve(outDir, entry), { recursive: true });
  }
  console.log(`[copy-static] ${entries.join(", ")} → ${outDir}`);
}

if (process.argv.includes("--clean")) {
  rmSync(outDir, { recursive: true, force: true });
}

copyAll();

if (process.argv.includes("--watch")) {
  let timer;
  for (const entry of entries) {
    watch(resolve(root, entry), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(copyAll, 100); // agrupa varios eventos de un mismo guardado
    });
  }
  console.log("[copy-static] watching for changes…");
}
