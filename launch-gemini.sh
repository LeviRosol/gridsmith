#!/usr/bin/env bash

# Load environment variables from .gemini/.env if it exists
if [ -f .gemini/.env ]; then
    set -a
    source .gemini/.env
    set +a
fi

# Automatically detect host git identity as fallbacks for the sandbox
export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-$(git config user.name)}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-$(git config user.email)}"
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
export GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

# Build the sandbox image, hiding output unless there's a failure
if ! docker build -t "$GEMINI_SANDBOX_IMAGE" -f .gemini/sandbox.Dockerfile . > /tmp/docker_build.log 2>&1; then
    echo "Docker build failed:"
    cat /tmp/docker_build.log
    exit 1
fi

gemini
