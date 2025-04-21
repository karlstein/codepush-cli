package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

// Notify CodePush Server
func notifyServer(version, filePath, fileName, environment, serverURL, checksum, platform, deploymentKey string, mandatory bool) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	if len(serverURL) == 0 {
		serverURL = "http://localhost:8080"
	}

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	jsonPart, err := writer.CreateFormField("metadata")
	if err != nil {
		panic(err)
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
	jsonPart.Write(jsonData)

	filePart, err := writer.CreateFormFile("file", fileName)
	if err != nil {
		panic(err)
	}

	_, err = io.Copy(filePart, file)
	if err != nil {
		panic(err)
	}

	writer.Close()

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/update", serverURL), &buf)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
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
	serverURL := "http://localhost:8080"

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
