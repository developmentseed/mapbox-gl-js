#!/usr/bin/env bash

git checkout mapbox/master
BRANCH="wapo-$(date +%Y-%m-%d)"
git checkout -b $BRANCH

# merge PRs
echo Revise addSourceType to be independent of Map instance
hub merge https://github.com/mapbox/mapbox-gl-js/pull/2982

echo Patch WebWorker to enable custom source type in node usage
git cherry-pick a69e8730daaac364f652c682c13a653db2f852c4

# re-add fork readme and this script
git checkout origin/wapo-2016-09-01 make-fork.sh
git checkout origin/wapo-2016-09-01 README.md
git commit -am "Add fork readme and make-fork.sh"
