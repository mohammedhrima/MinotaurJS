import { join, resolve } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ensureConfig, config } from "../core/config.ts";
import { ensureDirs, source, pagesDir, createFile } from "../core/paths.ts";
import { updateRoutes } from "../core/routes.ts";
import { generateComponent, generateStyle } from "../core/scaffold.ts";
import { ura } from "../core/logger.ts";

export function createComponent(name: string): { ok: boolean; error?: string } {
  if (!/^[a-zA-Z0-9_\-/]+$/.test(name)) {
    ura.error(`invalid component name: ${name}`);
    return { ok: false, error: "invalid component name" };
  }
  const ext = config.typescript === "enable" ? "tsx" : "jsx";
  const styleExt = config.styling === "SCSS" ? "scss" : "css";
  const withCss = config.styling !== "Tailwind CSS";

  if (name.includes("/")) {
    const parts = name.split("/").filter(Boolean);
    const comp = parts.pop() as string;
    const routePath = parts.join("/");
    createFile(
      join(pagesDir, routePath, "components", `${comp}.${ext}`),
      generateComponent(comp),
    );
    if (withCss)
      createFile(
        join(pagesDir, routePath, "components", `${comp}.${styleExt}`),
        generateStyle(comp, "component"),
      );
  } else {
    createFile(
      join(source, "components", `${name}.${ext}`),
      generateComponent(name),
    );
    if (withCss)
      createFile(
        join(source, "components", `${name}.${styleExt}`),
        generateStyle(name, "component"),
      );
  }
  updateRoutes();
  return { ok: true };
}

// Global components (scope "") plus route-scoped ones under src/pages/<route>/components.
export function listComponents(): { name: string; scope: string }[] {
  const out: { name: string; scope: string }[] = [];
  const isComp = (f: string) => /\.(tsx|ts|jsx|js)$/.test(f);
  const strip = (f: string) => f.replace(/\.[^.]+$/, "");

  const gdir = join(source, "components");
  if (existsSync(gdir))
    for (const f of readdirSync(gdir))
      if (isComp(f)) out.push({ name: strip(f), scope: "" });

  const walk = (dir: string, rel: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "components") {
        for (const f of readdirSync(join(dir, "components")))
          if (isComp(f)) out.push({ name: strip(f), scope: rel });
      } else {
        walk(join(dir, entry.name), rel ? rel + "/" + entry.name : entry.name);
      }
    }
  };
  walk(pagesDir, "");
  return out;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  (async () => {
    const names = process.argv.slice(2);
    if (!names.length) {
      ura.error("usage: npm run comp <Name | route/Name> [more...]");
      process.exit(1);
    }
    ensureDirs();
    await ensureConfig();
    for (const name of names) createComponent(name);
  })();
}
