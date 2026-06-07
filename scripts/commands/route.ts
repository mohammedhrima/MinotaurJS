import { join, resolve, sep } from "node:path";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ensureConfig, config } from "../core/config.ts";
import { ensureDirs, pagesDir, createFile } from "../core/paths.ts";
import { updateRoutes } from "../core/routes.ts";
import { generatePage, generateStyle } from "../core/scaffold.ts";
import { ura } from "../core/logger.ts";

const RESERVED = new Set(["components", "assets", "main", "tailwind", "ura"]);

function toSegments(name: string): string[] {
  return name
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createRoute(name: string): { ok: boolean; error?: string } {
  const segs = toSegments(name);
  const folder = segs.join("/");
  if (!folder || !/^[a-zA-Z0-9_\-/:[\]]+$/.test(folder)) {
    ura.error(`invalid route name: ${name}`);
    return { ok: false, error: "invalid route name" };
  }
  if (segs.some((s) => RESERVED.has(s.replace(/^[:[](.+?)\]?$/, "$1")))) {
    ura.error(`reserved segment in route: ${name}`);
    return { ok: false, error: "reserved segment" };
  }
  const ext = config.typescript === "enable" ? "tsx" : "jsx";
  createFile(join(pagesDir, ...segs, `page.${ext}`), generatePage(folder));
  if (config.styling !== "Tailwind CSS") {
    const styleExt = config.styling === "SCSS" ? "scss" : "css";
    createFile(
      join(pagesDir, ...segs, `page.${styleExt}`),
      generateStyle(folder, "page"),
    );
  }
  updateRoutes();
  return { ok: true };
}

export function deleteRoute(name: string): { ok: boolean; error?: string } {
  const segs = toSegments(name);
  if (!segs.length) return { ok: false, error: "empty route" };
  const base = resolve(pagesDir);
  const target = resolve(pagesDir, ...segs);
  if (target === base || !target.startsWith(base + sep))
    return { ok: false, error: "route outside src/pages" };
  if (!existsSync(target)) return { ok: false, error: "route not found" };
  rmSync(target, { recursive: true, force: true });
  updateRoutes();
  return { ok: true };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  (async () => {
    const names = process.argv.slice(2);
    if (!names.length) {
      ura.error(
        "usage: npm run route <path> [more...]   e.g. npm run route reads/[slug]",
      );
      process.exit(1);
    }
    ensureDirs();
    await ensureConfig();
    for (const name of names) createRoute(name);
  })();
}
