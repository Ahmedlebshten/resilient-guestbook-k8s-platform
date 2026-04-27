#!/bin/bash
set -e

# Load Docker Hub Username from Environment Variable
if [ -z "$DOCKER_USERNAME" ]; then
  echo "Error: DOCKER_USERNAME environment variable is not set."
  echo "Please set it before running the script:"
  echo "export DOCKER_USERNAME='your_dockerhub_username'"
  exit 1
fi

IMAGE_NAME="$DOCKER_USERNAME/hypercloud-ai-chat"
TAG="latest"

echo "Logging into Docker Hub..."
docker login -u "$DOCKER_USERNAME"

echo "Building the Docker image..."
# Run build context from the directory where the script is executed
# Assuming the script is run from the root of the project: ./build_and_push.sh
docker build -t $IMAGE_NAME:$TAG ./ai-chat

echo "Pushing the Docker image to Docker Hub..."
docker push $IMAGE_NAME:$TAG

echo "Successfully built and pushed $IMAGE_NAME:$TAG!"
