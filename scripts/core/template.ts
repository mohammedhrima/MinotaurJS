import { readFileSync } from "node:fs";
import { join } from "node:path";
import { templatesDir } from "./paths.ts";

const cache = new Map<string, string>();
type Vars = Record<string, string | number>;

export function render(file: string, vars: Vars = {}): string {
  let tpl = cache.get(file);
  if (tpl === undefined) {
    tpl = readFileSync(join(templatesDir, file), "utf8");
    cache.set(file, tpl);
  }
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : "",
  );
}
