import { join } from "node:path";
import { ensureConfig, config } from "../core/config.ts";
import { ensureDirs, source, createFile } from "../core/paths.ts";
import { updateRoutes } from "../core/routes.ts";
import { generateComponent } from "../core/scaffold.ts";
import { ura } from "../core/logger.ts";

function createComponent(name: string) {
  if (!/^[a-zA-Z0-9_\-/]+$/.test(name)) {
    ura.error(`invalid component name: ${name}`);
    return;
  }
  const ext = config.typescript === "enable" ? "tsx" : "jsx";

  if (name.includes("/")) {
    const parts = name.split("/").filter(Boolean);
    const comp = parts.pop() as string;
    const routePath = parts.join("/");
    createFile(
      join(source, "pages", routePath, "components", `${comp}.${ext}`),
      generateComponent(comp),
    );
  } else {
    createFile(
      join(source, "components", `${name}.${ext}`),
      generateComponent(name),
    );
  }
  updateRoutes();
}

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
