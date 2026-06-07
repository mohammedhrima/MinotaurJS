import http from "node:http";
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { extname, join, normalize } from "node:path";
import { output, contentDir, toOutKey } from "./paths.ts";
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

let httpServer: http.Server | null = null;

export function createServer(port: number) {
  const server = http.createServer((req, res) => {
    if (req.url === SSE_PATH) return handleSSE(req, res);
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
