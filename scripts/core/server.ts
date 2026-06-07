import http from "node:http";
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  copyFileSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { extname, dirname, join, normalize } from "node:path";
import { spawn } from "node:child_process";
import {
  output,
  source,
  root,
  contentDir,
  toOutKey,
  entryFile,
  outEntry,
} from "./paths.ts";
import { config, saveConfig, isConfigComplete } from "./config.ts";
import type { Config, Styling } from "./config.ts";
import { updateRoutes, listRoutes } from "./routes.ts";
import { createRoute, deleteRoute } from "../commands/route.ts";
import { createComponent, listComponents } from "../commands/comp.ts";
import { handleCopy } from "./pipeline.ts";
import { handleTailwind } from "./styles.ts";
import { ura } from "./logger.ts";

export const SSE_PATH = "/__ura/reload";
const MIME = JSON.parse(
  readFileSync(join(contentDir, "mime.json"), "utf8"),
) as Record<string, string>;

export const served = new Set<string>();

export function seedIndex(dir: string = output) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) seedIndex(full);
    else served.add(toOutKey(full));
  }
}

// The generated entry lives in .ura/ (outside src/); copy it into out/ to be served.
export function syncEntry() {
  mkdirSync(dirname(outEntry), { recursive: true });
  copyFileSync(entryFile, outEntry);
  served.add(toOutKey(outEntry));
}

// Rebuild the dev out/ from src — used to restore dev after a production build runs.
async function rebuildDevOut() {
  if (existsSync(output))
    for (const sub of readdirSync(output))
      rmSync(join(output, sub), { recursive: true, force: true });
  if (config.dirRouting === "enable") updateRoutes();
  await handleCopy(source);
  if (config.dirRouting === "enable") syncEntry();
  await handleTailwind();
  served.clear();
  seedIndex();
}

function resolveFile(url: string): string | null {
  let p = normalize(decodeURIComponent(url.split("?")[0])).replace(/\\/g, "/");
  p = "/" + p.replace(/^(\.\.\/?)+/, "").replace(/^\/+/, "");

  let key: string | null = null;
  if (served.has(p)) key = p;
  else {
    const ext = extname(p);
    if (
      [".jsx", ".tsx", ".ts"].includes(ext) &&
      served.has(p.slice(0, -ext.length) + ".js")
    ) {
      key = p.slice(0, -ext.length) + ".js";
    } else if (!ext && served.has(p + ".js")) key = p + ".js";
  }
  if (!key) key = "/index.html";

  const abs = join(output, key);
  return abs.startsWith(output) ? abs : null;
}

const clients = new Set<http.ServerResponse>();

export function broadcast(payload: Record<string, unknown>) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.write(data);
    } catch {
      clients.delete(client);
    }
  }
}

setInterval(() => {
  for (const client of clients) {
    try {
      client.write(":ping\n\n");
    } catch {
      clients.delete(client);
    }
  }
}, 30_000).unref();

function handleSSE(req: http.IncomingMessage, res: http.ServerResponse) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.write(":\n\n");
  clients.add(res);
  ura.log("client connected");
  req.on("close", () => clients.delete(res));
}

// ---- Dev control API (/__ura/*) — dev only, reuses the CLI logic ----

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function sendJson(res: http.ServerResponse, code: number, obj: unknown) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(obj));
}

const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const STYLINGS = ["CSS", "SCSS", "Tailwind CSS"];

function validateConfig(body: any): Partial<Config> {
  const out: Partial<Config> = {};
  if (body.typescript === "enable" || body.typescript === "disable")
    out.typescript = body.typescript;
  if (body.dirRouting === "enable" || body.dirRouting === "disable")
    out.dirRouting = body.dirRouting;
  if (typeof body.defaultRoute === "string" && body.defaultRoute.trim())
    out.defaultRoute = body.defaultRoute.trim();
  if (STYLINGS.includes(body.styling)) out.styling = body.styling as Styling;
  const port = parseInt(body.port, 10);
  if (port > 0 && port < 65536) out.port = port;
  return out;
}

function stateObj() {
  return {
    mode: "dev",
    config,
    configComplete: isConfigComplete(),
    routes: listRoutes(),
    components: listComponents(),
  };
}

// Config lives in .ura/ (outside src/) so the watcher won't react — regenerate here.
function regenerate() {
  if (config.dirRouting === "enable") {
    updateRoutes();
    syncEntry();
  }
  broadcast({ action: "reload" });
}

let building = false;
function runBuild(optimize: boolean) {
  if (building) return;
  building = true;
  const args = optimize
    ? ["run", "build", "--", "--optimize"]
    : ["run", "build"];
  broadcast({ action: "build-log", line: `$ npm ${args.join(" ")}` });
  const child = spawn("npm", args, { cwd: root });
  const pipe = (buf: Buffer) => {
    for (const line of buf.toString().split("\n"))
      if (line.trim()) broadcast({ action: "build-log", line: stripAnsi(line) });
  };
  child.stdout?.on("data", pipe);
  child.stderr?.on("data", pipe);
  child.on("close", async (code) => {
    broadcast({ action: "build-log", line: `exited with code ${code}` });
    await rebuildDevOut(); // the build overwrote out/ with prod; restore dev
    building = false;
    broadcast({ action: "build-done", code });
  });
}

async function handleApi(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: string,
) {
  const method = req.method || "GET";
  try {
    if (url === "/__ura/state" && method === "GET")
      return sendJson(res, 200, stateObj());

    if (url === "/__ura/config" && method === "POST") {
      Object.assign(config, validateConfig(await readBody(req)));
      saveConfig();
      regenerate();
      return sendJson(res, 200, stateObj());
    }

    if (url === "/__ura/route" && method === "POST") {
      const { path } = await readBody(req);
      if (!path) return sendJson(res, 400, { error: "path required" });
      const r = createRoute(String(path));
      return sendJson(res, r.ok ? 200 : 400, { ...r, routes: listRoutes() });
    }

    if (url === "/__ura/route" && method === "DELETE") {
      const { path } = await readBody(req);
      if (!path) return sendJson(res, 400, { error: "path required" });
      const r = deleteRoute(String(path));
      return sendJson(res, r.ok ? 200 : 400, { ...r, routes: listRoutes() });
    }

    if (url === "/__ura/component" && method === "POST") {
      const { name, scope } = await readBody(req);
      if (!name) return sendJson(res, 400, { error: "name required" });
      const r = createComponent(scope ? `${scope}/${name}` : String(name));
      return sendJson(res, r.ok ? 200 : 400, {
        ...r,
        components: listComponents(),
      });
    }

    if (url === "/__ura/build" && method === "POST") {
      const { optimize } = await readBody(req);
      runBuild(Boolean(optimize));
      return sendJson(res, 202, { started: true });
    }

    return sendJson(res, 404, { error: "unknown endpoint" });
  } catch (e) {
    return sendJson(res, 500, { error: (e as Error).message });
  }
}

let httpServer: http.Server | null = null;

export function createServer(port: number) {
  const server = http.createServer((req, res) => {
    if (req.url === SSE_PATH) return handleSSE(req, res);
    const url = (req.url ?? "/").split("?")[0];
    if (url.startsWith("/__ura/")) {
      void handleApi(req, res, url);
      return;
    }
    const file = resolveFile(req.url ?? "/");
    if (!file || !existsSync(file)) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store, must-revalidate",
    });
    const stream = createReadStream(file);
    stream.on("error", () => {
      res.writeHead(500);
      res.end();
    });
    stream.pipe(res);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    server.close();
    if (err.code === "EADDRINUSE") {
      ura.warn(`port ${port} in use, trying ${port + 1}`);
      createServer(port + 1);
    } else ura.error("server:", err.message);
  });

  server.listen(port, () => {
    httpServer = server;
    ura.print(
      `\x1b[1m\x1b[32m\n  UraJS dev server\n  → http://localhost:${port}\n\x1b[0m`,
    );
  });
}

export function closeServer() {
  httpServer?.close();
}
