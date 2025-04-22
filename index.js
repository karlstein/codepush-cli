#!/usr/bin/env node
import { spawn } from "child_process";
import { join, dirname } from "path";
import { platform } from "os";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
export { installBinary } from "./scripts/install";

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const binaryName = platform() === "win32" ? "codepush-cli.exe" : "codepush-cli";
const binaryPath = join(__dirname, "./bin/", binaryName);

if (existsSync(binaryPath)) {
  console.log("File exists!");
} else {
  console.log("File does not exist. Downloading...");
  installBinary().catch(() => {
    process.exit(1);
  });
}

const proc = spawn(binaryPath, process.argv.slice(2), { stdio: "inherit" });

proc.on("exit", (code) => process.exit(code));
