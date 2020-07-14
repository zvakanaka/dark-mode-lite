#!/bin/bash
OUTFILE=$(basename $(pwd))-$(node -e 'process.stdout.write(require("./manifest.json").version)').zip
zip -r $OUTFILE . -x ".*" -x "node_modules"
