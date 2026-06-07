import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { config } from "./config.ts";
import { source, pagesDir } from "./paths.ts";
import { routeId } from "./names.ts";
import { render } from "./template.ts";
import { ura } from "./logger.ts";

const PAGE_EXTS = [".jsx", ".tsx", ".js", ".ts"];

interface RouteEntry {
  importPath: string;
  id: string;
}

function scanRoutes(
  dir: string,
  routes: Record<string, RouteEntry>,
  used: Set<string>,
) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "components") continue;
    const full = join(dir, entry.name);
    if (PAGE_EXTS.some((e) => existsSync(join(full, "page" + e)))) {
      const rel = relative(pagesDir, full).split(/[\\/]/);
      const routePath =
        "/" + rel.map((s) => s.replace(/^\[(.+)\]$/, ":$1")).join("/");
      let id = routeId(rel.map((s) => s.replace(/^\[(.+)\]$/, ":$1")));
      while (used.has(id)) id += "_";
      used.add(id);
      routes[routePath] = { importPath: "./" + rel.join("/") + "/page.js", id };
    }
    scanRoutes(full, routes, used);
  }
}

function collectStyles(): string[] {
  const styles: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(css|scss)$/.test(entry.name)) {
        styles.push(
          "/" +
            relative(source, full)
              .split(/[\\/]/)
              .join("/")
              .replace(/\.scss$/, ".css"),
        );
      }
    }
  };
  walk(pagesDir);
  walk(join(source, "components"));
  if (existsSync(join(source, "layout.css"))) styles.push("/layout.css");
  if (config.styling === "Tailwind CSS") styles.push("/pages/tailwind.css");
  return [...new Set(styles)];
}

function printRouteTable(routes: Record<string, RouteEntry>) {
  const entries = Object.entries(routes);
  if (!entries.length)
    return ura.warn("no routes found (add src/pages/<name>/page.jsx)");
  const w = Math.max(
    20,
    ...entries.map(([r, e]) => r.length + e.importPath.length + 5),
  );
  const line = (l: string) => ura.print("\x1b[36m" + l + "\x1b[0m");
  line("\n┌" + "─".repeat(w) + "┐");
  line("│ \x1b[1mROUTES\x1b[0m\x1b[36m" + " ".repeat(w - 7) + "│");
  line("├" + "─".repeat(w) + "┤");
  for (const [route, e] of entries) {
    const text = ` \x1b[33m${route}\x1b[0m → \x1b[32m${e.importPath}\x1b[0m`;
    const pad = w - (route.length + e.importPath.length + 4);
    line("│" + text + " ".repeat(Math.max(0, pad)) + "\x1b[36m│");
  }
  line("└" + "─".repeat(w) + "┘\n");
}

export function updateRoutes() {
  try {
    if (config.dirRouting !== "enable") {
      ura.warn("directory routing disabled");
      return;
    }
    const routes: Record<string, RouteEntry> = {};
    scanRoutes(pagesDir, routes, new Set());
    printRouteTable(routes);

    const styles = collectStyles();
    const defaultId = routes["/" + (config.defaultRoute ?? "")]?.id;

    const imports = Object.values(routes)
      .map((e) => `import * as ${e.id} from "${e.importPath}";`)
      .join("\n");
    const routeMap = [
      ...(defaultId ? [`  "/": ${defaultId}.default,`] : []),
      ...Object.entries(routes).map(
        ([path, e]) => `  "${path}": ${e.id}.default,`,
      ),
    ].join("\n");
    const keepAliveMap = Object.entries(routes)
      .map(([path, e]) => `  "${path}": ${e.id}.keepAlive,`)
      .join("\n");

    writeFileSync(
      join(pagesDir, "main.js"),
      render("main.tpl", {
        imports,
        routes: routeMap,
        keepAlive: keepAliveMap,
        styles: JSON.stringify(styles, null, 2),
      }),
      "utf8",
    );
    ura.log("routes + styles updated");
  } catch (error) {
    ura.error("updateRoutes:", (error as Error).message);
  }
}
