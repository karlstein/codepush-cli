import { get } from "https";
import { createWriteStream } from "fs";
import { join, dirname } from "path";
import { platform as _platform, arch as _arch } from "os";
import { chmodSync } from "fs";
import { fileURLToPath } from "url";

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const platform = _platform();
const arch = _arch();

const ghPath = "https://github.com/karlstein/codepush-cli/releases/download";
const currVersion = "v0.2.6";
let binaryName = "codepush-cli";
let releaseName = "";

if (platform === "darwin" && arch === "x64") {
  releaseName = "codepush-cli-darwin-x64";
} else if (platform === "linux" && arch === "x64") {
  releaseName = "codepush-cli-linux-x64";
} else if (platform === "win32" && arch === "x64") {
  binaryName = "codepush-cli.exe";
  releaseName = "codepush-cli-win-x64.exe";
} else {
  console.error(`Unsupported platform: ${platform} ${arch}`);
  process.exit(1);
}

const downloadUrl = `${ghPath}/${currVersion}/${releaseName}`;
const outputDir = join(__dirname, "..", "lib");
const outputPath = join(outputDir, binaryName);

// Download binary
get(downloadUrl, (res) => {
  if (res.statusCode !== 200) {
    console.error(`Failed to download binary: ${res.statusCode}`);
    process.exit(1);
  }

  const file = createWriteStream(outputPath);
  res.pipe(file);

  file.on("finish", () => {
    file.close();
    if (platform !== "win32") {
      chmodSync(outputPath, 0o755);
    }
    console.log(`Downloaded CLI to ${outputPath}`);
  });
}).on("error", (err) => {
  console.error(`Error downloading binary: ${err.message}`);
  process.exit(1);
});
