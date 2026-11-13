import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const project = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (repository
    ? repository.toLowerCase() === `${owner.toLowerCase()}.github.io`
      ? ""
      : `/${repository}`
    : "/pauza-coffee-demo");
const result = spawnSync(
  process.execPath,
  [path.join(project, "node_modules/next/dist/bin/next"), "build", project],
  {
    cwd: project,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_BASE_PATH: basePath,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
writeFileSync(path.join(project, "out/.nojekyll"), "");
console.log(`Демо собрано для GitHub Pages: ${basePath || "/"}`);
