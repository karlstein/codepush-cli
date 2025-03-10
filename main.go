package main

import (
	"fmt"
	"log"
	"os"

	"github.com/spf13/cobra"
)

func main() {
	initS3()

	var rootCmd = &cobra.Command{Use: "codepush-cli"}

	// Push command
	var pushCmd = &cobra.Command{
		Use:   "push",
		Short: "Push a new update to the CodePush server",
		Run: func(cmd *cobra.Command, args []string) {

			platform, _ := cmd.Flags().GetString("platform")
			version, _ := cmd.Flags().GetString("version")
			mandatory, _ := cmd.Flags().GetBool("mandatory")
			environment, _ := cmd.Flags().GetString("environment")
			envpath, _ := cmd.Flags().GetString("env-path")
			outputDir, _ := cmd.Flags().GetString("output-dir")
			serverURL, _ := cmd.Flags().GetString("server-url")
			// outputDir := "./build"

			loadEnv(envpath)

			if platform == "" || version == "" {
				log.Fatal("❌ Platform and version are required")
			}

			fmt.Println("🚀 Bundling React Native app...")
			bundlePath, err := bundleReactNative(platform, outputDir)
			if err != nil {
				log.Fatalf("❌ Failed to bundle: %v", err)
			}
			fmt.Println("✅ Bundle created:", bundlePath)

			fileName := "updates/" + environment + "-" + version + "-" + platform + ".bundle"
			checksum, err := computeSHA256(bundlePath)
			if err != nil {
				log.Fatalf("❌ Failed to check file integrity: %v", err)
			}

			fmt.Println("📤 Uploading bundle to S3...")
			err = uploadFile(bundlePath, fileName)
			if err != nil {
				log.Fatalf("❌ Failed to upload: %v", err)
			}

			notifyLog := fmt.Sprintf("🔔 Notifying CodePush server at %s...", serverURL)
			fmt.Println(notifyLog)
			err = notifyServer(version, fileName, environment, serverURL, checksum, platform, mandatory)
			if err != nil {
				log.Fatalf("❌ Failed to notify server: %v", err)
			}
		},
	}

	pushCmd.Flags().StringP("platform", "p", "", "Target platform (android/ios)")
	pushCmd.Flags().StringP("version", "v", "", "Version number (e.g., 1.0.2)")
	pushCmd.Flags().BoolP("mandatory", "m", false, "Is this a mandatory update?")
	pushCmd.Flags().StringP("environment", "e", getEnv("DEFAULT_ENVIRONMENT", "staging"), "")
	pushCmd.Flags().StringP("env-path", "n", "", "")
	pushCmd.Flags().StringP("output-dir", "o", "./code-push", "")
	pushCmd.Flags().StringP("server-url", "s", "", "Codepush Server URL")

	// Rollback command
	var rollbackCmd = &cobra.Command{
		Use:   "rollback",
		Short: "Rollback to the previous update",
		Run: func(cmd *cobra.Command, args []string) {
			environment, _ := cmd.Flags().GetString("environment")
			envpath, _ := cmd.Flags().GetString("env-path")

			loadEnv(envpath)

			err := rollbackVersion(environment)
			if err != nil {
				log.Fatalf("❌ Rollback failed: %v", err)
			}
		},
	}

	rollbackCmd.Flags().StringP("environment", "e", getEnv("DEFAULT_ENVIRONMENT", "staging"), "")
	rollbackCmd.Flags().StringP("env-path", "n", "", "")

	rootCmd.AddCommand(pushCmd, rollbackCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
