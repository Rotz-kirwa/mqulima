import { spawn, execSync } from "node:child_process";
import process from "node:process";

console.log("\x1b[32m%s\x1b[0m", "==================================================");
console.log("\x1b[32m%s\x1b[0m", "   Starting Mqulima Platform (All Services)       ");
console.log("\x1b[32m%s\x1b[0m", "==================================================");

// 1. Ensure ports 8080 and 8081 are free
console.log("\x1b[36m%s\x1b[0m", "[SYSTEM] Clearing any active processes on ports 8080 and 8081...");
try {
  execSync("fuser -k 8080/tcp 8081/tcp 2>/dev/null || true");
} catch (e) {
  // Ignore
}

// 2. Ensure PostgreSQL Docker container is started
console.log("\x1b[36m%s\x1b[0m", "[DB] Starting PostgreSQL Docker container (mqulima-pg)...");
try {
  execSync("docker start mqulima-pg", { stdio: "ignore" });
  console.log("\x1b[32m%s\x1b[0m", "[DB] PostgreSQL container is running on port 5433!");
} catch (error) {
  console.warn("\x1b[33m%s\x1b[0m", "[DB] Warning: Could not start 'mqulima-pg' docker container.");
  console.warn("\x1b[33m%s\x1b[0m", "[DB] Make sure Docker is running and the container exists, or that port 5433 is active.");
}

const children = [];

function spawnProcess(command, args, options, prefix, color) {
  const child = spawn(command, args, options);
  children.push(child);

  child.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line) {
        console.log(`${color}${prefix}\x1b[0m ${line}`);
      }
    });
  });

  child.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line) {
        console.error(`${color}${prefix} [ERROR]\x1b[0m ${line}`);
      }
    });
  });

  child.on("close", (code) => {
    console.log(`${color}${prefix}\x1b[0m process exited with code ${code}`);
    cleanupAndExit();
  });

  return child;
}

// 3. Start Main Site dev server (port 8080)
console.log("\x1b[36m%s\x1b[0m", "[MAIN] Starting Main Platform dev server on port 8080...");
spawnProcess(
  "npx",
  ["vite", "dev", "--port", "8080", "--strictPort", "--open"],
  { cwd: process.cwd() },
  "[MAIN]",
  "\x1b[35m" // Magenta
);

// 4. Start Admin Console dev server (port 8081)
console.log("\x1b[36m%s\x1b[0m", "[ADMIN] Starting Admin Console dev server on port 8081...");
spawnProcess(
  "npx",
  ["vite", "dev", "--port", "8081", "--strictPort", "--open"],
  { cwd: `${process.cwd()}/admin` },
  "[ADMIN]",
  "\x1b[33m" // Yellow
);

let isExiting = false;
function cleanupAndExit() {
  if (isExiting) return;
  isExiting = true;
  console.log("\n\x1b[31m%s\x1b[0m", "Shutting down all services...");
  children.forEach((child) => {
    try {
      child.kill("SIGINT");
    } catch (e) {
      // Ignore
    }
  });
  process.exit();
}

// Handle termination signals
process.on("SIGINT", cleanupAndExit);
process.on("SIGTERM", cleanupAndExit);
process.on("exit", cleanupAndExit);
