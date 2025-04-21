package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

func loadEnv(envFile string) {
	envPath, dfltEnv := dir(envFile)

	if dfltEnv {
		err := godotenv.Load()
		if err != nil {
			log.Println("⚠️ Warning: No .env file found, using default values.")
		}
		return
	}

	err := godotenv.Load(envPath)
	if err != nil {
		log.Println("⚠️ Warning: No .env file found, using default values.")
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func dir(envFile string) (path string, dfltEnv bool) {
	currentDir, err := os.Getwd()
	if err != nil {
		panic(err)
	}

	if len(envFile) == 0 {
		return "", true
	}

	// for {
	// 	goModPath := filepath.Join(currentDir, "go.mod")
	// 	if _, err := os.Stat(goModPath); err == nil {
	// 		break
	// 	}

	// 	parent := filepath.Dir(currentDir)
	// 	if parent == currentDir {
	// 		panic(fmt.Errorf("go.mod not found"))
	// 	}
	// 	currentDir = parent
	// }

	return filepath.Join(currentDir, envFile), false
}
