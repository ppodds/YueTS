#!/bin/sh

# check if this folder is a repository
if [ -d "./.git" ]; then
    husky install
    git config --global auto.crlf true
    git config --global user.email $GIT_USER_EMAIL
    git config --global user.name $GIT_USER_NAME
fi