#!/bin/bash
set -e

IMAGE="jthil23/f1-dashboard"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "Building $IMAGE..."
docker build -t "$IMAGE:latest" -t "$IMAGE:$TIMESTAMP" .

echo "Pushing $IMAGE:latest..."
docker push "$IMAGE:latest"

echo "Pushing $IMAGE:$TIMESTAMP..."
docker push "$IMAGE:$TIMESTAMP"

echo "Done! Pushed:"
echo "  $IMAGE:latest"
echo "  $IMAGE:$TIMESTAMP"
