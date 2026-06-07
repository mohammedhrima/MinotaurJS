import { join } from "node:path";
import { ensureConfig, config } from "../core/config.ts";
import { ensureDirs, source, createFile } from "../core/paths.ts";
import { updateRoutes } from "../core/routes.ts";
import { generatePage } from "../core/scaffold.ts";
import { ura } from "../core/logger.ts";

const RESERVED = new Set(["components", "assets", "main", "tailwind", "ura"]);

function createRoute(name: string) {
  if (!/^[a-zA-Z0-9_\-/[\]]+$/.test(name)) {
    ura.error(`invalid route name: ${name}`);
    return;
  }
  const segs = name.split("/").filter(Boolean);
  if (segs.some((s) => RESERVED.has(s.replace(/^\[(.+)\]$/, "$1")))) {
    ura.error(`reserved segment in route: ${name}`);
    return;
  }
  const ext = config.typescript === "enable" ? "tsx" : "jsx";
  createFile(join(source, "pages", ...segs, `page.${ext}`), generatePage(name));
  updateRoutes();
}

(async () => {
  const names = process.argv.slice(2);
  if (!names.length) {
    ura.error(
      "usage: npm run route <path> [more...]   e.g. npm run route blog/[slug]",
    );
    process.exit(1);
  }
  ensureDirs();
  await ensureConfig();
  for (const name of names) createRoute(name);
})();
