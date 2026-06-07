import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { configPath, pagesDir } from "./paths.ts";
import { ask, select } from "./prompts.ts";
import { ura } from "./logger.ts";

export type Styling = "CSS" | "SCSS" | "Tailwind CSS";

export interface Config {
  typescript?: "enable" | "disable";
  dirRouting?: "enable" | "disable";
  defaultRoute?: string;
  styling?: Styling;
  port?: number;
}

export const config: Config = {};

export function loadConfig() {
  if (!existsSync(configPath)) return;
  try {
    Object.assign(config, JSON.parse(readFileSync(configPath, "utf8")));
  } catch {
    ura.warn(".ura/config.json is invalid — ignoring");
  }
}

export function saveConfig() {
  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
}

export function isConfigComplete(): boolean {
  return Boolean(
    config.typescript &&
      config.dirRouting &&
      config.styling &&
      config.port &&
      (config.dirRouting !== "enable" || config.defaultRoute),
  );
}

export async function ensureConfig() {
  loadConfig();
  let changed = false;

  const toggle = async (message: string, key: "typescript" | "dirRouting") => {
    config[key] =
      (await select(message, ["Yes", "No"])) === "Yes" ? "enable" : "disable";
    changed = true;
  };

  if (!config.typescript) await toggle("Enable TypeScript?", "typescript");
  if (!config.dirRouting)
    await toggle("Enable directory routing?", "dirRouting");

  if (config.dirRouting === "enable" && !config.defaultRoute) {
    const dirs = existsSync(pagesDir)
      ? readdirSync(pagesDir).filter((s) =>
          statSync(join(pagesDir, s)).isDirectory(),
        )
      : [];
    config.defaultRoute = dirs.length
      ? await select("Default route", dirs)
      : await ask("Default route name", "home");
    changed = true;
  }

  if (!config.styling) {
    config.styling = (await select("Styling", [
      "CSS",
      "SCSS",
      "Tailwind CSS",
    ])) as Styling;
    changed = true;
  }

  if (!config.port) {
    let port = NaN;
    while (!(port > 0 && port < 65536))
      port = parseInt(await ask("Port", "17000"), 10);
    config.port = port;
    changed = true;
  }

  if (changed) saveConfig();
  printConfig();
}

function printConfig() {
  ura.print("\n\x1b[36mConfiguration:\x1b[0m");
  for (const [k, v] of Object.entries(config)) {
    ura.print(
      `  \x1b[32m${k.padEnd(13)}\x1b[0m \x1b[33m${JSON.stringify(v)}\x1b[0m`,
    );
  }
  ura.print();
}
