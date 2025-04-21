package main

// S3 Client
// var s3Client *s3.Client

// func initS3(s3Endpoint, s3AccessKey, s3SecretKey, s3Location string) {
// func initS3() {
// 	s3Endpoint := getEnv("S3_ENDPOINT", "http://localhost:9000")
// 	s3AccessKey := getEnv("S3_ACCESS_KEY", "admin")
// 	s3SecretKey := getEnv("S3_SECRET_KEY", "password")
// 	s3Location := getEnv("S3_LOCATION", "us-east-1")

// 	cfg, err := config.LoadDefaultConfig(context.TODO(),
// 		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(s3AccessKey, s3SecretKey, "")),
// 		config.WithRegion(s3Location),
// 	)

// 	if err != nil {
// 		log.Fatalf("❌ Failed to load MinIO config: %v", err)
// 	}

// 	// Manually configure endpoint to MinIO
// 	s3Client = s3.NewFromConfig(cfg, func(o *s3.Options) {
// 		o.BaseEndpoint = aws.String(s3Endpoint)
// 		o.UsePathStyle = true // Required for MinIO
// 	})
// }

// func uploadFile(filePath string, fileName string) error {
// 	file, err := os.Open(filePath)
// 	if err != nil {
// 		return err
// 	}
// 	defer file.Close()

// 	stat, err := file.Stat()
// 	if err != nil {
// 		return err
// 	}

// 	// Create progress bar
// 	bar := progressbar.DefaultBytes(stat.Size(), "Uploading")

// 	// Wrap the file reader with progress bar
// 	progressReader := progressbar.NewReader(file, bar)

// 	_, err = s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
// 		Bucket: aws.String(getEnv("S3_BUCKET", "code-push")),
// 		Key:    aws.String(fileName),
// 		Body:   progressReader.Reader, // Now correctly implements io.Reader
// 	})
// 	if err != nil {
// 		return err
// 	}

// 	fmt.Println("✅ Upload complete!")
// 	return nil
// }
