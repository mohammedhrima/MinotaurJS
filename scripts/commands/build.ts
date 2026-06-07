import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { ensureConfig, config } from "../core/config.ts";
import {
  ensureDirs,
  root,
  output,
  source,
  createFile,
  entryFile,
  outEntry,
} from "../core/paths.ts";
import { updateRoutes } from "../core/routes.ts";
import { handleCopy } from "../core/pipeline.ts";
import { handleTailwind } from "../core/styles.ts";
import { render } from "../core/template.ts";
import { ura } from "../core/logger.ts";

function finalizeIndex(transform: (html: string) => string) {
  const indexPath = join(output, "index.html");
  writeFileSync(indexPath, transform(readFileSync(indexPath, "utf8")));
}

function pruneBundledJs() {
  const keep = join(output, "app.js");
  let removed = 0;
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        if (readdirSync(full).length === 0)
          rmSync(full, { recursive: true, force: true });
      } else if (entry.name.endsWith(".js") && full !== keep) {
        rmSync(full);
        removed++;
      }
    }
  };
  walk(output);
  ura.log(
    `pruned ${removed} bundled .js file${removed === 1 ? "" : "s"} (inlined into app.js)`,
  );
}

async function optimize() {
  try {
    const esbuild = await import("esbuild");
    await esbuild.build({
      entryPoints: [outEntry],
      bundle: true,
      minify: true,
      format: "esm",
      outfile: join(output, "app.js"),
      alias: { ura: join(output, "ura", "code.js") },
      logLevel: "silent",
    });
    finalizeIndex((html) =>
      html
        .replace("/.ura/main.js", "/app.js")
        .replace(/[ \t]*<script type="importmap">[\s\S]*?<\/script>\s*/, ""),
    );
    pruneBundledJs();
    ura.log("optimized: bundled + minified → out/app.js");
  } catch (error) {
    ura.error(
      "optimize failed (run `npm i esbuild`):",
      (error as Error).message,
    );
  }
}

(async () => {
  ensureDirs();
  await ensureConfig();
  const port = config.port ?? 17000;
  const wantOptimize = process.argv.includes("--optimize");

  if (existsSync(output)) {
    for (const sub of readdirSync(output))
      rmSync(join(output, sub), { recursive: true, force: true });
  }
  updateRoutes();
  await handleCopy(source);
  mkdirSync(dirname(outEntry), { recursive: true });
  copyFileSync(entryFile, outEntry);
  rmSync(join(output, "ura", "devtools"), { recursive: true, force: true });
  await handleTailwind();
  finalizeIndex((html) =>
    html.replace(/window\.mode\s*=\s*["'][^"']*["']/, 'window.mode = "prod"'),
  );
  if (wantOptimize) await optimize();

  const docker = join(root, "docker");
  mkdirSync(join(docker, "nginx"), { recursive: true });
  createFile(
    join(docker, "nginx", "nginx.conf"),
    render("docker/nginx.conf.tpl", { port }),
    true,
  );
  createFile(
    join(docker, "Dockerfile"),
    render("docker/Dockerfile.tpl", { port }),
    true,
  );
  createFile(
    join(docker, "docker-compose.yml"),
    render("docker/docker-compose.yml.tpl", { port }),
    true,
  );
  createFile(join(docker, "Makefile"), render("docker/Makefile.tpl"), true);

  rmSync(join(docker, "app"), { recursive: true, force: true });
  cpSync(output, join(docker, "app"), { recursive: true });
  ura.log(
    `build complete → docker/ (port ${port}${wantOptimize ? ", optimized" : ""})`,
  );
})();
