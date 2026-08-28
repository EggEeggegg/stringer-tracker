import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const isWindows = process.platform === "win32";

function copyIfMissing(destRel: string, srcRel: string) {
  const dest = resolve(root, destRel);
  if (existsSync(dest)) {
    return;
  }
  copyFileSync(resolve(root, srcRel), dest);
  console.log(`created ${destRel}`);
}

function run(command: string, args: string[], cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: isWindows,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

copyIfMissing("backend/.env", "backend/.env.example");
copyIfMissing("frontend/.env.local", "frontend/.env.example");

if (!existsSync(resolve(root, "frontend/node_modules"))) {
  console.log("Installing frontend dependencies...");
  run("bun", ["install"], resolve(root, "frontend"));
}

console.log("Running migrations...");
const migrate = spawnSync("task", ["migrate"], {
  cwd: resolve(root, "backend"),
  stdio: "inherit",
  shell: isWindows,
  env: process.env,
});
if (migrate.status !== 0) {
  console.error(`
Migration failed. Check DATABASE_URL in backend/.env.

Local DATABASE_URL should be:
postgresql://postgres:postgres@localhost:5432/stringer_tracker?sslmode=disable

This repo uses the PostgreSQL 17 install on :5432
(user postgres, password postgres, db stringer_tracker).
`);
  process.exit(migrate.status ?? 1);
}
