include .env
export $(shell sed 's/=.*//' .env)

build:
	@go mod download
	@CGO_ENABLED=0 go build -ldflags '-extldflags "-static"' -o "${GOPATH}/bin/codepush-cli"