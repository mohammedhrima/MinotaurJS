import { watch as fsWatch, type FSWatcher } from "node:fs";
import { join } from "node:path";
import { ura } from "./logger.ts";

const ignoredName = (name: string) =>
  name.startsWith(".") || name.endsWith("~");

export interface Watcher {
  ignoreNext: (abs: string) => void;
  close: () => void;
}

export function createWatcher(
  dir: string,
  onBatch: (paths: string[]) => void,
): Watcher {
  const pending = new Set<string>();
  const skip = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let watcher: FSWatcher | null = null;

  try {
    watcher = fsWatch(dir, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      const name = filename.toString();
      if (ignoredName(name.split(/[/\\]/).pop() ?? "")) return;
      const abs = join(dir, name);
      if (skip.has(abs)) {
        skip.delete(abs);
        return;
      }
      pending.add(abs);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const batch = [...pending];
        pending.clear();
        onBatch(batch);
      }, 80);
    });
  } catch (err) {
    ura.error("watch unsupported here:", (err as Error).message);
  }

  return {
    ignoreNext: (abs: string) => skip.add(abs),
    close: () => watcher?.close(),
  };
}
