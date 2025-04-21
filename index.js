#!/usr/bin/env node
const { spawn } = require("child_process");
const { join } = require("path");
const { platform } = require("os");

const binaryName = platform() === "win32" ? "codepush-cli.exe" : "codepush-cli";
const binaryPath = join(__dirname, "./bin/", binaryName);

const proc = spawn(binaryPath, process.argv.slice(2), { stdio: "inherit" });

proc.on("exit", (code) => process.exit(code));
