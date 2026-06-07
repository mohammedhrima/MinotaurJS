import { promises as fs, existsSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { config } from "./config.ts";
import { source, output, root } from "./paths.ts";
import { render } from "./template.ts";
import { ura } from "./logger.ts";

export async function handleSass(srcFile: string) {
  try {
    const sass = await import("sass");
    const result = sass.compile(srcFile);
    const outFile = join(
      dirname(srcFile.replace(source, output)),
      basename(srcFile, ".scss") + ".css",
    );
    await fs.mkdir(dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, result.css);
    ura.log("sass:", relative(source, srcFile));
  } catch (error) {
    ura.error("sass failed (run `npm i sass`):", (error as Error).message);
  }
}

export async function handleTailwind() {
  if (config.styling !== "Tailwind CSS") return;
  try {
    const postcss = (await import("postcss")).default;
    const tailwindcss = (await import("tailwindcss")).default;
    const confPath = join(root, "tailwind.config.js");
    if (!existsSync(confPath))
      writeFileSync(confPath, render("tailwind.config.tpl"));
    const tailwindConfig = (
      await import(confPath + `?t=${statSync(confPath).mtimeMs}`)
    ).default;
    const input =
      "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n";
    const result = await postcss([tailwindcss(tailwindConfig)]).process(input, {
      from: undefined,
    });
    const outFile = join(output, "pages", "tailwind.css");
    await fs.mkdir(dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, result.css, "utf8");
    ura.log("tailwind: rebuilt pages/tailwind.css");
  } catch (error) {
    ura.error(
      "tailwind failed (run `npm i tailwindcss postcss`):",
      (error as Error).message,
    );
  }
}
