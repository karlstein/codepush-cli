include .env
export $(shell sed 's/=.*//' .env)

build:
ifeq ($(GITHUB_ACTION),TRUE)
	@echo run build script
	@bash ./scripts/build.sh
else
	@echo run local build script
	@bash ./scripts/build-local.sh
endif
	