import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../out",
);
const base = (
  process.env.NEXT_PUBLIC_BASE_PATH ?? "/pauza-coffee-demo"
).replace(/\/+$/, "");
const port = Number(process.env.PORT ?? 4174);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
if (!existsSync(path.join(root, "index.html")))
  throw new Error("Сначала выполните npm run build:pages.");
const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(req.url, "http://127.0.0.1").pathname,
    );
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }
  if (base && pathname !== base && !pathname.startsWith(`${base}/`)) {
    res.writeHead(404);
    res.end();
    return;
  }
  let file = path.resolve(root, `.${pathname.slice(base.length) || "/"}`);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    res.writeHead(403);
    res.end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith("/")) {
      res.writeHead(308, { Location: `${pathname}/` });
      res.end();
      return;
    }
    file = path.join(file, "index.html");
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404);
    res.end("Страница не найдена");
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(file)] ?? "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  if (req.method === "HEAD") res.end();
  else createReadStream(file).pipe(res);
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Статический просмотр: http://127.0.0.1:${port}${base}/`),
);
