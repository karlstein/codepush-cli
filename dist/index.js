"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const child_process_1 = require("child_process");
const util_1 = require("util");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
// import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'; // For rollback
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// Helper functions
const generateSecureToken = (length) => {
    return crypto_1.default
        .randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length);
};
// const loadEnv = (envPath?: string) => {
//   if (envPath) {
//     require("dotenv").config({ path: envPath });
//   }
// };
const bundleReactNative = async (platform, outputDir) => {
    const command = `react-native bundle \
    --platform ${platform} \
    --dev false \
    --entry-file index.js \
    --bundle-output ${path_1.default.join(outputDir, `index.${platform}.bundle`)} \
    --assets-dest ${outputDir}`;
    const { stderr } = await execAsync(command);
    if (stderr)
        throw new Error(stderr);
    return path_1.default.join(outputDir, `${platform}.bundle`);
};
const computeSHA256 = async (filePath) => {
    const hash = crypto_1.default.createHash("sha256");
    const stream = fs_1.default.createReadStream(filePath);
    return new Promise((resolve, reject) => {
        stream.on("data", (data) => hash.update(data));
        stream.on("end", () => resolve(hash.digest("hex")));
        stream.on("error", reject);
    });
};
const notifyServer = async (params) => {
    try {
        const response = await axios_1.default.post(params.serverUrl, {
            version: params.version,
            fileName: params.fileName,
            environment: params.environment,
            checksum: params.checksum,
            platform: params.platform,
            deploymentKey: params.deploymentKey,
            mandatory: params.mandatory,
            bundle: fs_1.default.readFileSync(params.bundlePath, "base64"),
        });
        if (response.status !== 200) {
            throw new Error("Server returned non-200 status");
        }
    }
    catch (error) {
        throw new Error(`Server notification failed: ${error instanceof Error ? error.message : error}`);
    }
};
// const rollbackVersion = async (options: RollbackOptions): Promise<void> => {
//   // Implement your S3 rollback logic here
//   const s3Client = new S3Client({
//     region: 'your-region',
//     credentials: {
//       accessKeyId: options.s3AccessKey || '',
//       secretAccessKey: options.s3SecretKey || ''
//     }
//   });
//   // Example S3 delete operation
//   const deleteCommand = new DeleteObjectCommand({
//     Bucket: 'your-bucket-name',
//     Key: 'path/to/version'
//   });
//   await s3Client.send(deleteCommand);
// };
// CLI Setup
const program = new commander_1.Command();
program
    .name("codepush-cli")
    .description("CodePush CLI tool for managing updates");
// Push command
program
    .command("push")
    .description("Push a new update to the CodePush server")
    .requiredOption("-p, --platform <platform>", "Target platform (android/ios)")
    .requiredOption("-v, --version <version>", "Version number (e.g., 1.0.2)")
    .requiredOption("-m, --mandatory", "Is this a mandatory update?", false)
    .requiredOption("-e, --environment <environment>", "Environment name", "Local")
    .requiredOption("-n, --env-path <path>", "Path to environment file")
    .requiredOption("-o, --output-dir <dir>", "Output directory", "./code-push")
    .requiredOption("-s, --server-url <url>", "CodePush Server URL")
    .requiredOption("-d, --deployment-key <key>", "Deployment Key")
    .action(async (options) => {
    try {
        const uniqueKey = generateSecureToken(8);
        // loadEnv(options.envPath);
        console.log("🚀 Bundling React Native app...");
        const bundlePath = await bundleReactNative(options.platform, options.outputDir);
        console.log("✅ Bundle created:", bundlePath);
        const fileName = `updates/${options.environment}-${options.version}-${uniqueKey}.${options.platform}.bundle`;
        const checksum = await computeSHA256(bundlePath);
        console.log(`🔔 Notifying CodePush server at ${options.serverUrl}...`);
        await notifyServer({
            version: options.version,
            bundlePath,
            fileName,
            environment: options.environment,
            serverUrl: options.serverUrl,
            checksum,
            platform: options.platform,
            deploymentKey: options.deploymentKey,
            mandatory: options.mandatory,
        });
        console.log("✅ Update pushed successfully!");
    }
    catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
        process.exit(1);
    }
});
// Rollback command
// program
//   .command('rollback')
//   .description('Rollback to the previous version')
//   .option('-e, --environment <environment>', 'Environment name', 'Local')
//   .option('-n, --env-path <path>', 'Path to environment file')
//   .option('-ep, --s3-endpoint <endpoint>', 'S3 endpoint')
//   .option('-ak, --s3-access-key <key>', 'S3 access key')
//   .option('-sk, --s3-secret-key <key>', 'S3 secret key')
//   .option('-lc, --s3-location <location>', 'S3 location')
//   .action(async (options: RollbackOptions) => {
//     try {
//       loadEnv(options.envPath);
//       await rollbackVersion(options);
//       console.log('✅ Rollback successful!');
//     } catch (error) {
//       console.error(`❌ Rollback failed: ${error instanceof Error ? error.message : error}`);
//       process.exit(1);
//     }
//   });
program.parseAsync(process.argv).catch((err) => {
    console.error("❌ CLI Error:", err);
    process.exit(1);
});
