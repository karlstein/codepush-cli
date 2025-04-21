include .env
export $(shell sed 's/=.*//' .env)

build:
	@cd cli
	@go mod download
ifeq ($(GITHUB_ACTION),TRUE)
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags '-extldflags "-static"' -o "../bin/codepush-cli-linux-x64"
	@CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -ldflags '-extldflags "-static"' -o "../bin/codepush-cli-darwin-x64"
	@CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags '-extldflags "-static"' -o "../bin/codepush-cli-windows-x64"
else
	@CGO_ENABLED=0 go build -ldflags '-extldflags "-static"' -o "${GOPATH}/bin/codepush-cli"
endif
	