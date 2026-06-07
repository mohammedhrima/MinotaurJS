import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { loadConfig, isConfigComplete, config } from "../core/config.ts";
import { ensureDirs, source, output, outKeyForSource } from "../core/paths.ts";
import { handleCopy, handleDelete } from "../core/pipeline.ts";
import { handleTailwind } from "../core/styles.ts";
import { updateRoutes } from "../core/routes.ts";
import {
  served,
  seedIndex,
  syncEntry,
  broadcast,
  createServer,
  closeServer,
} from "../core/server.ts";
import { createWatcher, type Watcher } from "../core/watcher.ts";
import { startTypecheck } from "../core/typecheck.ts";
import { ura } from "../core/logger.ts";
import type { ChildProcess } from "node:child_process";

const isPage = (abs: string) => /(^|[/\\])page\.(jsx|tsx|js|ts)$/.test(abs);

let watcher: Watcher | null = null;
let tsc: ChildProcess | null = null;

async function flush(batch: string[]) {
  let structural = false;
  let reload = false;
  const cssUpdates: string[] = [];

  for (const abs of batch) {
    try {
      if (!existsSync(abs)) {
        await handleDelete(abs);
        served.delete(outKeyForSource(abs));
        if (isPage(abs) || !extname(abs)) structural = true;
        else reload = true;
        continue;
      }
      if (statSync(abs).isDirectory()) {
        await handleCopy(abs);
        seedIndex();
        structural = true;
        continue;
      }
      await handleCopy(abs);
      served.add(outKeyForSource(abs));
      const ext = extname(abs);
      if (ext === ".css" || ext === ".scss")
        cssUpdates.push(outKeyForSource(abs));
      else if (isPage(abs)) structural = true;
      else reload = true;
    } catch (error) {
      ura.error("watch:", (error as Error).message);
    }
  }

  if (structural) {
    updateRoutes();
    syncEntry();
    broadcast({ action: "reload" });
  } else if (reload) {
    broadcast({ action: "reload" });
  } else {
    for (const css of cssUpdates)
      broadcast({ action: "update", ext: ".css", pathname: css });
  }
}

function shutdown() {
  tsc?.kill();
  watcher?.close();
  closeServer();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

(async () => {
  ensureDirs();
  loadConfig();
  if (!isConfigComplete())
    ura.warn("config incomplete — open the app; the dev tools will set it up");

  if (existsSync(output)) {
    for (const sub of readdirSync(output))
      rmSync(join(output, sub), { recursive: true, force: true });
  }
  if (config.dirRouting === "enable") {
    updateRoutes();
  }
  await handleCopy(source);
  if (config.dirRouting === "enable") syncEntry();
  await handleTailwind();
  seedIndex();
  tsc = startTypecheck();
  createServer(config.port ?? 17000);
  watcher = createWatcher(source, (batch) => void flush(batch));
})();
