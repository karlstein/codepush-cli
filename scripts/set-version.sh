#!/bin/sh
VERSION=$1
echo "version $VERSION"

sed -i -e 's|VERSION=.*|VERSION=v'$VERSION'|' .env
sed -i -e 's|"version": .*|"version": "'$VERSION'",|' package.json

echo "App upgraded to version $VERSION"