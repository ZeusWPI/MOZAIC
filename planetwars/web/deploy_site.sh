#!/bin/bash

set -eo pipefail

user="bottlebats"
branch="development"
directory="$HOME/MOZAIC/planetwars/web/"

abort () {
    echo -e "\e[91m$@"
    exit 1
}

check_user() {
    local actual_user="$(id -un)"
    if [[ "$user" != "$actual_user" ]]; then
        abort "Expected user '$user' but actually is '$actual_user'."
    fi
}

fetch_and_check_git() {
    local actual_branch="$(git rev-parse --abbrev-ref HEAD)"
    if [[ "$branch" != "$actual_branch" ]]; then
        abort "Expected branch '$branch' bot actually was '$actual_branch'."
    fi

    git fetch

    # Check if we can just fast-forward from remote
    if ! git merge-base --is-ancestor HEAD FETCH_HEAD; then
        abort "Local commits were made. Please fix manually (server still running)."
    fi
}

change_directory() {
    if [ ! -d "$directory" ]; then
        abort "Directory '$directory' not found!"
    fi
    cd "$directory"
}

build() {
    npm run build
}

deploy() {
    echo -e "\n=== Performing sanity checks & cd'ing to directory"
    check_user
    change_directory

    echo -e "\n=== Pulling from remote"
    fetch_and_check_git

    echo -e "\n=== Stopping the Rocket server"
    systemctl --user stop bottlebats

    echo -e "\n=== Building"
    build

    echo -e "\n=== Starting the Rocket server"
    systemctl --user start bottlebats

    echo -e "\n=== All clear! Repository is now at:"
    git --no-pager show --quiet

    echo -e "\n\e[1m\e[32m=== Deploy successful!\e[0"
}

deploy
