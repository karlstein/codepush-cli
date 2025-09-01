include .env
export $(shell sed 's/=.*//' .env)

build:
ifdef VERSION
	@echo set version
	@bash ./scripts/build.sh $(VERSION)
else
	@echo VERSION should be mandatory
endif

# set-version:
# ifdef VERSION
# 	@echo set version
# 	@bash ./scripts/set-version.sh $(VERSION)
# else
# 	@echo VERSION should be mandatory
# endif
	