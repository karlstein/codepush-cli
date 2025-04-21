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

set-version:
ifdef VERSION
	@echo set version
	@bash ./scripts/set-version.sh $(VERSION)
else
	@echo VERSION should be mandatory
endif
	