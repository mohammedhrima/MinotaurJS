import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { root } from "./paths.ts";
import { ura } from "./logger.ts";

export function startTypecheck(): ChildProcess | null {
  const bin = join(root, "node_modules", ".bin", "tsc");
  if (!existsSync(bin)) return null;

  const child = spawn(
    bin,
    ["--noEmit", "--watch", "--preserveWatchOutput", "--pretty"],
    {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const forward = (buf: Buffer) => {
    const text = buf.toString().trim();
    if (text)
      ura.print(
        "\x1b[35m[tsc]\x1b[0m " +
          text.replace(/\n/g, "\n\x1b[35m[tsc]\x1b[0m "),
      );
  };
  child.stdout?.on("data", forward);
  child.stderr?.on("data", forward);
  return child;
}
