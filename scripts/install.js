const { get } = require("https");
const { createWriteStream, mkdir } = require("fs");
const { join } = require("path");
const { platform: _platform, arch: _arch } = require("os");

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
const outputDir = join(__dirname, "..", "bin");

mkdir(outputDir, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log("Directory created successfully!");
});

const outputPath = join(outputDir, binaryName);

function downloadAsset(assetUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(assetUrl);
    const headers = {
      "User-Agent": "Node.js",
      Accept: "application/octet-stream", // Required for binary downloads
    };

    const followRedirect = (response) => {
      if ([301, 302, 307].includes(response.statusCode)) {
        // GitHub returns a 302 redirect for asset downloads
        const redirectUrl = response.headers.location;
        get(redirectUrl, followRedirect).on("error", reject);
      } else {
        // console.table(response);
        // Stream response to file
        const file = createWriteStream(outputPath);
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      }
    };

    // Initial request to GitHub's asset endpoint
    get(
      {
        hostname: url.hostname,
        path: url.pathname,
        headers,
        timeout: 20000,
      },
      followRedirect
    ).on("error", reject);
  });
}

(async () => {
  try {
    // Download the asset
    console.log(`Downloading ${releaseName}...`);
    await downloadAsset(downloadUrl); // Use the asset's API URL (supports auth)
    console.log("Download complete!");
  } catch (error) {
    console.error("Error:", error);
  }
})();
