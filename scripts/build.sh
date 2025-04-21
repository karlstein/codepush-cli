cd cli
echo "Download go modules..."
go mod download

echo "Build codepush-cli-linux-x64..."
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags '-extldflags "-static"' -o "../bin/codepush-cli-linux-x64"

echo "Build codepush-cli-darwin-x64..."
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags '-extldflags "-static"' -o "../bin/codepush-cli-darwin-x64"

echo "Build codepush-cli-win-x64..."
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags '-extldflags "-static"' -o "../bin/codepush-cli-win-x64.exe"

echo "Build Complete"