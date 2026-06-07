import { promises as fs, existsSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { source, output } from "./paths.ts";
import { transpileFile } from "./transpile.ts";
import { handleSass } from "./styles.ts";
import { ura } from "./logger.ts";

const TRANSPILE = new Set([".ts", ".tsx", ".js", ".jsx"]);

export async function handleCopy(pathname: string) {
  try {
    const stat = await fs.stat(pathname);
    if (stat.isDirectory()) {
      const files = await fs.readdir(pathname);
      await Promise.all(files.map((f) => handleCopy(join(pathname, f))));
      return;
    }
    const ext = extname(pathname).toLowerCase();
    if (TRANSPILE.has(ext)) {
      await transpileFile(pathname);
    } else if (ext === ".scss") {
      await handleSass(pathname);
    } else {
      const dest = pathname.replace(source, output);
      await fs.mkdir(dirname(dest), { recursive: true });
      await fs.copyFile(pathname, dest);
      ura.log("copy:", relative(source, pathname));
    }
  } catch (error) {
    ura.error("copy:", pathname, (error as Error).message);
  }
}

export async function handleDelete(srcName: string) {
  const outName = srcName
    .replace(source, output)
    .replace(/\.(ts|tsx|jsx|js)$/i, ".js")
    .replace(/\.(scss|css)$/i, ".css");
  try {
    let stat;
    try {
      stat = await fs.stat(outName);
    } catch {
      return;
    }
    if (stat.isDirectory()) {
      await fs.rm(outName, { recursive: true, force: true });
      ura.log("delete dir:", relative(output, outName));
      return;
    }
    const exts = /\.(ts|tsx|jsx|js)$/i.test(srcName)
      ? [".ts", ".tsx", ".jsx", ".js"]
      : /\.(scss|css)$/i.test(srcName)
        ? [".scss", ".css"]
        : null;
    if (exts) {
      const base = srcName.replace(/\.(ts|tsx|jsx|js|scss|css)$/i, "");
      if (exts.some((e) => existsSync(base + e))) return;
    }
    await fs.unlink(outName);
    ura.log("delete:", relative(output, outName));
  } catch (error) {
    ura.error("delete:", relative(output, outName), (error as Error).message);
  }
}
