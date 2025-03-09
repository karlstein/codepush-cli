package main

import (
	"fmt"
	"log"
	"os"

	"github.com/spf13/cobra"
)

func main() {
	LoadEnv()
	InitS3()

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
			outputDir := "./build"

			if platform == "" || version == "" {
				log.Fatal("❌ Platform and version are required")
			}

			fmt.Println("🚀 Bundling React Native app...")
			bundlePath, err := BundleReactNative(platform, outputDir)
			if err != nil {
				log.Fatalf("❌ Failed to bundle: %v", err)
			}
			fmt.Println("✅ Bundle created:", bundlePath)

			fileName := "updates/" + environment + "-" + version + "-" + platform + ".bundle"

			fmt.Println("📤 Uploading bundle to MinIO...")
			err = UploadFile(bundlePath, fileName)
			if err != nil {
				log.Fatalf("❌ Failed to upload: %v", err)
			}

			fmt.Println("🔔 Notifying CodePush server...")
			err = NotifyServer(version, fileName, mandatory, environment)
			if err != nil {
				log.Fatalf("❌ Failed to notify server: %v", err)
			}
		},
	}

	pushCmd.Flags().StringP("platform", "p", "", "Target platform (android/ios)")
	pushCmd.Flags().StringP("version", "v", "", "Version number (e.g., 1.0.2)")
	pushCmd.Flags().BoolP("mandatory", "m", false, "Is this a mandatory update?")
	pushCmd.Flags().StringP("environment", "e", GetEnv("DEFAULT_ENVIRONMENT", "staging"), "")

	// Rollback command
	var rollbackCmd = &cobra.Command{
		Use:   "rollback",
		Short: "Rollback to the previous update",
		Run: func(cmd *cobra.Command, args []string) {
			environment, _ := cmd.Flags().GetString("environment")
			err := RollbackVersion(environment)
			if err != nil {
				log.Fatalf("❌ Rollback failed: %v", err)
			}
		},
	}

	rollbackCmd.Flags().StringP("environment", "e", GetEnv("DEFAULT_ENVIRONMENT", "staging"), "")

	rootCmd.AddCommand(pushCmd, rollbackCmd)

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
