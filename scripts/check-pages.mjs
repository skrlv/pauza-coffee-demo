import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const out = path.join(project, "out");
const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const base = (
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (repo
    ? repo.toLowerCase() === `${owner.toLowerCase()}.github.io`
      ? ""
      : `/${repo}`
    : "/pauza-coffee-demo")
).replace(/\/+$/, "");
function files(directory) {
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return statSync(file).isDirectory() ? files(file) : [file];
  });
}
if (!existsSync(path.join(out, "index.html")))
  throw new Error("Сначала выполните npm run build:pages.");
if (existsSync(path.join(out, "api")))
  throw new Error("Серверный API не должен входить в статическую публикацию.");
let references = 0;
for (const file of files(out)) {
  if (!/\.(html|js|json|txt)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  if (/TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID|api\.telegram\.org/.test(text))
    throw new Error(`В статическом экспорте найден серверный код: ${file}`);
  if (!file.endsWith(".html")) continue;
  for (const match of text.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replaceAll("&amp;", "&");
    if (!href.startsWith("/")) continue;
    const pathname = new URL(href, "https://portfolio.invalid").pathname;
    if (base && pathname !== base && !pathname.startsWith(`${base}/`))
      throw new Error(`Ссылка выходит из папки проекта: ${href}`);
    const relative = decodeURIComponent(pathname.slice(base.length)).replace(
      /^\/+/,
      "",
    );
    const candidate = path.join(out, relative);
    if (!candidate.startsWith(`${out}${path.sep}`) && candidate !== out)
      throw new Error(`Некорректный путь: ${href}`);
    if (
      !existsSync(candidate) &&
      !existsSync(path.join(candidate, "index.html")) &&
      !existsSync(`${candidate}.html`)
    )
      throw new Error(`Отсутствует файл для ссылки: ${href}`);
    references++;
  }
}
console.log(
  `GitHub Pages: проверено ${references} ссылок и ресурсов; серверный API и секреты отсутствуют.`,
);
