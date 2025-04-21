include .env
export $(shell sed 's/=.*//' .env)

build:
ifeq ($(GITHUB_ACTION),TRUE)
	@echo run local build script
	@bash ./scripts/build.sh
else
	@CGO_ENABLED=0 go build -ldflags '-extldflags "-static"' -o "${GOPATH}/bin/codepush-cli"
endif
	