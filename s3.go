package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/schollz/progressbar/v3"
)

// S3 Client
var s3Client *s3.Client

func InitS3() {
	s3Endpoint := GetEnv("S3_ENDPOINT", "")
	s3AccessKey := GetEnv("S3_ACCESS_KEY", "")
	s3SecretKey := GetEnv("S3_SECRET_KEY", "")
	s3Location := GetEnv("S3_LOCATION", "")

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(s3AccessKey, s3SecretKey, "")),
		config.WithRegion(s3Location),
	)

	if err != nil {
		log.Fatalf("❌ Failed to load MinIO config: %v", err)
	}

	// Manually configure endpoint to MinIO
	s3Client = s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(s3Endpoint)
		o.UsePathStyle = true // Required for MinIO
	})
}

func UploadFile(filePath string, fileName string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return err
	}

	// Create progress bar
	bar := progressbar.DefaultBytes(stat.Size(), "Uploading")

	// Wrap the file reader with progress bar
	progressReader := progressbar.NewReader(file, bar)

	_, err = s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(GetEnv("S3_BUCKET", "codepush-updates")),
		Key:    aws.String(fileName),
		Body:   progressReader.Reader, // Now correctly implements io.Reader
	})
	if err != nil {
		return err
	}

	fmt.Println("✅ Upload complete!")
	return nil
}
