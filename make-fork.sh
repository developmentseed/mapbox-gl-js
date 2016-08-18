#!/usr/bin/env bash

# reset wapo branch to master
git checkout master
git branch -D wapo
git checkout -b wapo

# merge PRs
hub merge https://github.com/mapbox/mapbox-gl-js/pull/2982
hub merge https://github.com/mapbox/mapbox-gl-js/pull/2952

hub merge https://github.com/mapbox/mapbox-gl-js/pull/2812
echo "Fixing known merge conflict."
git checkout --theirs bench/benchmarks/buffer.js
git add bench/benchmarks/buffer.js
git commit --file .git/MERGE_MSG

# re-add fork readme and this script
git checkout origin/wapo make-fork.sh
git checkout origin/wapo README.md
git commit -am "Add fork readme and make-fork.sh"
