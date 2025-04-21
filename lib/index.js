#!/usr/bin/env node
import { spawn } from "child_process";
import { join } from "path";
import { platform } from "os";

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const binaryName = platform() === "win32" ? "codepush-cli.exe" : "codepush-cli";
const binaryPath = join(__dirname, binaryName);

const proc = spawn(binaryPath, process.argv.slice(2), { stdio: "inherit" });

proc.on("exit", (code) => process.exit(code));
