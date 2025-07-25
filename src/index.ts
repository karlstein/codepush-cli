#!/usr/bin/env node

import { Command } from "commander";
import { exec } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
// import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'; // For rollback
import "dotenv/config";

const execAsync = promisify(exec);

interface PushOptions {
  platform: string;
  version: string;
  mandatory: boolean;
  environment: string;
  envPath: string;
  outputDir: string;
  serverUrl: string;
  deploymentKey: string;
}

interface NotifyServerParams {
  version: string;
  bundlePath: string;
  fileName: string;
  environment: string;
  serverUrl?: string;
  checksum: string;
  platform: string;
  deploymentKey: string;
  mandatory: boolean;
}

interface RollbackOptions {
  environment: string;
  envPath: string;
  s3Endpoint?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  s3Location?: string;
}

// Helper functions
const generateSecureToken = (length: number): string => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
};

// const loadEnv = (envPath?: string) => {
//   if (envPath) {
//     require("dotenv").config({ path: envPath });
//   }
// };

const bundleReactNative = async (
  platform: string,
  outputDir: string
): Promise<string> => {
  const command = `react-native bundle \
    --platform ${platform} \
    --dev false \
    --entry-file index.js \
    --bundle-output ${path.join(outputDir, `index.${platform}.bundle`)} \
    --assets-dest ${outputDir}`;

  const { stderr } = await execAsync(command);
  if (stderr) throw new Error(stderr);
  return path.join(outputDir, `index.${platform}.bundle`);
};

const computeSHA256 = async (filePath: string): Promise<string> => {
  const hash = crypto.createHash("sha256");
  const stream = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
};

export async function notifyServer({
  version,
  bundlePath: filePath,
  fileName,
  environment,
  serverUrl: serverURL = "http://localhost:8080",
  checksum,
  platform,
  deploymentKey,
  mandatory,
}: NotifyServerParams): Promise<void> {
  try {
    const fileStream = fs.createReadStream(filePath);
    const form = new FormData();

    const metadata = {
      update: {
        version,
        platform,
        fileName,
        mandatory,
        checksum,
        environment,
      },
      deploymentKey,
    };

    form.append("metadata", JSON.stringify(metadata));
    form.append("file", fileStream, fileName);

    console.log("metadata", metadata);

    const completeServerUrl = `${serverURL}/update`.replace("//", "/");
    const response = await axios.post(completeServerUrl, form, {
      headers: { ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000,
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to notify server, status code: ${response.status}`
      );
    }

    console.log("✅ CodePush server notified successfully!");
  } catch (err) {
    console.error("❌ Error notifying server:", err);
    throw err;
  }
}

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
const program = new Command();

program
  .name("codepush-cli")
  .description("CodePush CLI tool for managing updates");

// Push command
program
  .command("push")
  .description("Push a new update to the CodePush server")
  .requiredOption("-p, --platform <platform>", "Target platform (android/ios)")
  .requiredOption("-v, --version <version>", "Version number (e.g., 1.0.2)")
  .requiredOption("-e, --environment <environment>", "Environment name")
  .requiredOption("-n, --env-path <path>", "Path to environment file")
  .requiredOption("-o, --output-dir <dir>", "Output directory", "./code-push")
  .requiredOption("-s, --server-url <url>", "CodePush Server URL")
  .requiredOption("-d, --deployment-key <key>", "Deployment Key")
  .requiredOption("-m, --mandatory", "Is this a mandatory update?")
  .action(async (options: PushOptions) => {
    console.log("codepush-cli push...");

    try {
      const uniqueKey = generateSecureToken(8);
      // loadEnv(options.envPath);

      console.log("🚀 Bundling React Native app...");
      const bundlePath = await bundleReactNative(
        options.platform,
        options.outputDir
      );
      console.log("✅ Bundle created:", bundlePath);

      const fileName = `updates/${options.environment}-${options.version}-${uniqueKey}.index.${options.platform}.bundle`;
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
    } catch (error) {
      console.error(
        `❌ Error: ${error instanceof Error ? error.message : error}`
      );
      process.exit(1);
    }
  });

// Check version
// program
//   .name("string-util")
//   .description("CLI to some JavaScript string utilities")
//   .version("v0.2.11");

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
