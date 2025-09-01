#!/bin/sh
VERSION=$1
echo "version $VERSION"

# sed -i -e 's|VERSION=.*|VERSION=v'$VERSION'|' .env
sed -i -e 's|"version": .*|"version": "'$VERSION'",|' package.json
sed -i -e 's|.version(.*|.version("'$VERSION'");|' src/index.ts
# sed -i -e 's|const currVersion = .*|const currVersion = "v'$VERSION'";|' scripts/install.js

echo "App upgraded to version $VERSION"

npm run build-cli