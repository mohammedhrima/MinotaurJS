import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { ura } from "./logger.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const scriptsDir = join(here, "..");
export const root = join(scriptsDir, "..");
export const source = join(root, "src");
export const output = join(root, "out");
export const pagesDir = join(source, "pages");
export const templatesDir = join(scriptsDir, "templates");
export const contentDir = join(scriptsDir, "content");
export const uraDir = join(root, ".ura");
export const configPath = join(uraDir, "config.json");
export const entryFile = join(uraDir, "main.js");
export const outEntry = join(output, ".ura", "main.js");

export function ensureDirs() {
  mkdirSync(join(source, "components"), { recursive: true });
  mkdirSync(pagesDir, { recursive: true });
  mkdirSync(join(source, "assets"), { recursive: true });
  mkdirSync(uraDir, { recursive: true });
}

export const toOutKey = (absOut: string): string =>
  "/" + relative(output, absOut).split(sep).join("/");

export const outKeyForSource = (srcAbs: string): string =>
  "/" +
  relative(source, srcAbs)
    .split(sep)
    .join("/")
    .replace(/\.(tsx?|jsx)$/, ".js")
    .replace(/\.scss$/, ".css");

export function createFile(filePath: string, content: string, force = false) {
  mkdirSync(dirname(filePath), { recursive: true });
  if (force || !existsSync(filePath)) {
    writeFileSync(filePath, content);
    ura.log("Created:", relative(root, filePath));
  } else {
    ura.warn("Skipped (exists):", relative(root, filePath));
  }
}
