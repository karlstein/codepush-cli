include .env
export $(shell sed 's/=.*//' .env)

build:
ifeq ($(GITHUB_ACTION),TRUE)
	@go mod download
	@CGO_ENABLED=0 go build -ldflags '-extldflags "-static"' -o "./bin/codepush-cli"
else
	@go mod download
	@CGO_ENABLED=0 go build -ldflags '-extldflags "-static"' -o "${GOPATH}/bin/codepush-cli"
endif
	