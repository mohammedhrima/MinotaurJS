import readline from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { ura } from "./logger.ts";

const C = {
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

const interactive = () => Boolean(stdin.isTTY && stdout.isTTY);

export async function ask(question: string, initial = ""): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  const hint = initial ? ` ${C.dim}(${initial})${C.reset}` : "";
  const answer = (
    await rl.question(`${C.cyan}?${C.reset} ${C.bold}${question}${C.reset}${hint} ${C.cyan}›${C.reset} `)
  ).trim();
  rl.close();
  return answer || initial;
}

async function selectFallback(message: string, choices: string[]): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  stdout.write(`${C.cyan}?${C.reset} ${C.bold}${message}${C.reset}\n`);
  choices.forEach((c, i) => stdout.write(`  ${i + 1}) ${c}\n`));
  try {
    for (;;) {
      const raw = (await rl.question(`choose [1-${choices.length}]: `)).trim();
      const idx = parseInt(raw, 10) - 1;
      if (idx >= 0 && idx < choices.length) return choices[idx];
      ura.warn("invalid choice");
    }
  } finally {
    rl.close();
  }
}

export async function select(message: string, choices: string[]): Promise<string> {
  if (choices.length === 0) return "";
  if (choices.length === 1) return choices[0];
  if (!interactive()) return selectFallback(message, choices);

  return new Promise<string>((resolve) => {
    let idx = 0;
    readline.emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    stdout.write("\x1b[?25l");
    stdout.write(`${C.cyan}?${C.reset} ${C.bold}${message}${C.reset}\n`);

    const draw = (first: boolean) => {
      if (!first) stdout.write(`\x1b[${choices.length}A`);
      choices.forEach((c, i) => {
        const line =
          i === idx
            ? `${C.cyan}❯ ${c}${C.reset}`
            : `  ${C.dim}${c}${C.reset}`;
        stdout.write(`\x1b[2K${line}\n`);
      });
    };
    draw(true);

    const cleanup = () => {
      stdin.off("keypress", onKey);
      if (stdin.isTTY) stdin.setRawMode(false);
      stdout.write("\x1b[?25h");
      stdin.pause();
    };

    const onKey = (_s: string, key: readline.Key) => {
      if (!key) return;
      if (key.ctrl && key.name === "c") {
        cleanup();
        stdout.write("\n");
        process.exit(130);
      } else if (key.name === "up" || key.name === "k") {
        idx = (idx - 1 + choices.length) % choices.length;
      } else if (key.name === "down" || key.name === "j") {
        idx = (idx + 1) % choices.length;
      } else if (key.sequence && key.sequence >= "1" && key.sequence <= "9") {
        const n = Number(key.sequence) - 1;
        if (n < choices.length) idx = n;
      } else if (key.name === "return" || key.name === "enter") {
        cleanup();
        stdout.write(`\x1b[${choices.length}A\x1b[0J`);
        stdout.write(`${C.dim}└─${C.reset} ${C.cyan}${choices[idx]}${C.reset}\n`);
        resolve(choices[idx]);
        return;
      }
      draw(false);
    };
    stdin.on("keypress", onKey);
  });
}
