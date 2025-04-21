package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// Notify CodePush Server
func notifyServer(version, fileName, environment, serverURL, checksum, platform, deploymentKey string, mandatory bool) error {
	if len(serverURL) == 0 {
		serverURL = getEnv("CODEPUSH_SERVER_URL", "http://localhost:8080")
	}

	update := map[string]any{
		"version":     version,
		"platform":    platform,
		"fileName":    fileName,
		"mandatory":   mandatory,
		"checksum":    checksum,
		"environment": environment,
	}

	data := map[string]any{
		"update":        update,
		"deploymentKey": deploymentKey,
	}

	jsonData, _ := json.Marshal(data)
	resp, err := http.Post(fmt.Sprintf("%s/update", serverURL), "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to notify server, status code: %d", resp.StatusCode)
	}

	fmt.Println("✅ CodePush server notified successfully!")
	return nil
}

// Rollback a Version
func rollbackVersion(environment string) error {
	serverURL := getEnv("CODEPUSH_SERVER_URL", "http://localhost:8080")

	data := map[string]string{"environment": environment}
	jsonData, _ := json.Marshal(data)

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/rollback", serverURL), bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}
	defer req.Body.Close()

	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to rollback, status code: %d", resp.StatusCode)
	}

	fmt.Println("✅ Rollback successful!")
	return nil
}
