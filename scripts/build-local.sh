cd cli
echo "Download go modules..."
go mod download

echo "Build codepush-cli..."
CGO_ENABLED=0 go build -ldflags '-extldflags "-static"' -o "$GOPATH/bin/codepush-cli"

echo "Build Complete"