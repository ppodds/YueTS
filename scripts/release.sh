#!/bin/bash

version_args=$1

if [ -z "$(command -v jq)" ]; then
    echo "jq is not installed. Please install jq"
    exit 1
fi

if [ -z "$(command -v curl)" ]; then
    echo "curl is not installed. Please install curl"
    exit 1
fi

if [ -z "$(command -v sed)" ]; then
    echo "sed is not installed. Please install sed"
    exit 1
fi

echo "Get latest yt-dlp version"
tag=$(curl https://api.github.com/repos/yt-dlp/yt-dlp/releases 2> /dev/null  | jq .[0].tag_name)
# remove "
tag=${tag//\"/}
echo "Latest yt-dlp version is $tag"

echo "Update Dockerfile"
sed -E -i "s/https:\/\/github\.com\/yt-dlp\/yt-dlp\/releases\/download\/([0-9\.]+)\/yt-dlp/https:\/\/github\.com\/yt-dlp\/yt-dlp\/releases\/download\/$tag\/yt-dlp/" Dockerfile
git add Dockerfile
git commit -m "chore: update yt-dlp to $tag"

echo "Bump package version"
npm version $1

current_version=$(cat package.json | jq -r .version)
extra_tag="v$current_version+yt-dlp$tag"
echo "Add extra tag ($extra_tag)"
git tag $extra_tag

echo "Push changes"
git push --follow-tags

echo "Done"
