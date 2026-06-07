import { promises as fs, statSync } from "node:fs";
import { dirname, relative } from "node:path";
import ts from "typescript";
import { source, output } from "./paths.ts";
import { ura } from "./logger.ts";

const compilerOptions: ts.CompilerOptions = {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2020,
  jsx: ts.JsxEmit.React,
  jsxFactory: "Ura.e",
  jsxFragmentFactory: "Ura.fr",
  esModuleInterop: true,
};

const cache = new Map<string, number>();

export async function transpileFile(srcFile: string) {
  const mtime = statSync(srcFile).mtimeMs;
  if (cache.get(srcFile) === mtime) return;

  ura.log("transpile:", relative(source, srcFile));
  const code = await fs.readFile(srcFile, "utf8");
  let out = ts.transpileModule(code, {
    compilerOptions,
    fileName: srcFile,
  }).outputText;

  out = out.replace(/(from\s*["'])(\.[^"']+)\.(tsx?|jsx)(["'])/g, "$1$2.js$4");

  const usesUra = out.includes("Ura.e(") || out.includes("Ura.fr(");
  const hasUra =
    /(^|\n)\s*import\s+Ura[\s,]/.test(out) ||
    /import\s*\{[^}]*\bUra\b[^}]*\}\s*from\s*["']ura["']/.test(out);
  if (usesUra && !hasUra) out = `import Ura from "ura";\n${out}`;

  const outFile = srcFile
    .replace(source, output)
    .replace(/\.(tsx?|jsx?)$/, ".js");
  await fs.mkdir(dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, out, "utf8");
  cache.set(srcFile, mtime);
}
