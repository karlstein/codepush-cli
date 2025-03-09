package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func BundleReactNative(platform, outputDir string) (string, error) {
	bundlePath := filepath.Join(outputDir, fmt.Sprintf("index.%s.bundle", platform))

	cmd := exec.Command("npx", "react-native", "bundle",
		"--platform", platform,
		"--dev", "false",
		"--entry-file", "index.js",
		"--bundle-output", bundlePath,
		"--assets-dest", outputDir,
	)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		return "", err
	}

	return bundlePath, nil
}
